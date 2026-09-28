import express from 'express';
import { getDb, saveDatabase } from '../config/db.js';
import { authenticateToken, requireRoles, requirePermission } from '../middleware/auth.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';
import { getNextDocumentNumber } from '../services/numberSequenceService.js';
import { calculateInvoiceTaxes } from '../services/taxService.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET all quotations
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  let quotations = [...db.quotations];

  if (req.user.role === ROLES.CLIENT) {
    quotations = quotations.filter(q => q.client_id === req.user.client_id);
  }

  res.json({ success: true, quotations, total: quotations.length });
});

// GET single quotation
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const quot = db.quotations.find(q => q.id === req.params.id);
  if (!quot) return res.status(404).json({ success: false, message: 'Quotation not found' });

  if (req.user.role === ROLES.CLIENT && quot.client_id !== req.user.client_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const client = db.clients.find(c => c.id === quot.client_id);
  res.json({ success: true, quotation: { ...quot, client } });
});

// POST Create Quotation
router.post('/', authenticateToken, requirePermission(PERMISSIONS.QUOTATION_CREATE), (req, res) => {
  const db = getDb();
  const { client_id, project, valid_until, total, notes, items } = req.body;
  const client = db.clients.find(c => c.id === client_id);
  if (!client) return res.status(400).json({ success: false, message: 'Client required' });

  const num = `RC/2026-27/QT/${String(db.quotations.length + 1).padStart(4, '0')}`;
  const newQ = {
    id: `quot_${uuidv4().substring(0, 8)}`,
    quotation_number: num,
    client_id: client.id,
    client_name: client.name,
    project: project || 'Custom Service Quotation',
    date: new Date().toISOString().split('T')[0],
    valid_until: valid_until || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    total: parseFloat(total || 0),
    items: items || [],
    status: 'Draft',
    converted_invoice_id: null,
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  db.quotations.unshift(newQ);
  saveDatabase();
  res.status(201).json({ success: true, quotation: newQ });
});

// DELETE draft quotation
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.QUOTATION_CREATE), (req, res) => {
  const db = getDb();
  const qIndex = db.quotations.findIndex(q => q.id === req.params.id);
  if (qIndex === -1) return res.status(404).json({ success: false, message: 'Quotation not found' });

  const q = db.quotations[qIndex];
  if (q.converted_invoice_id) {
    return res.status(400).json({ success: false, message: 'Cannot delete quotation that was already converted to an invoice.' });
  }

  db.quotations.splice(qIndex, 1);
  saveDatabase();
  res.json({ success: true, message: `Quotation ${q.quotation_number} deleted.` });
});

// POST Convert Quotation to Invoice
router.post('/:id/convert-to-invoice', authenticateToken, requirePermission(PERMISSIONS.QUOTATION_CONVERT), async (req, res) => {
  const db = getDb();
  const quot = db.quotations.find(q => q.id === req.params.id);
  if (!quot) return res.status(404).json({ success: false, message: 'Quotation not found' });

  if (quot.converted_invoice_id) {
    const existing = db.invoices.find(i => i.id === quot.converted_invoice_id);
    return res.status(400).json({ 
      success: false, 
      message: `Quotation already converted to invoice: ${existing?.invoice_number || 'Unknown'}` 
    });
  }

  const client = db.clients.find(c => c.id === quot.client_id);
  const invoiceNumber = await getNextDocumentNumber('invoice');
  const invoiceId = `inv_${uuidv4().substring(0, 8)}`;
  const secure_token = `tok_${uuidv4().replace(/-/g, '')}`;

  // Default line item from quotation
  const baseRate = Math.round((quot.total / 1.18) * 100) / 100;
  const items = [
    {
      id: `item_${uuidv4().substring(0, 8)}`,
      product_service: quot.project,
      description: `Converted from Quotation ${quot.quotation_number}`,
      quantity: 1,
      unit: 'Service',
      rate: baseRate,
      discount: 0,
      tax_rate: 18
    }
  ];

  const taxSummary = calculateInvoiceTaxes(items, client?.place_of_supply || '');

  const newInvoice = {
    id: invoiceId,
    invoice_number: invoiceNumber,
    client_id: quot.client_id,
    project: quot.project,
    quotation_id: quot.id,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    payment_terms: '15 Days',
    currency: 'INR',
    subtotal: taxSummary.subtotal,
    discount: 0,
    taxable_amount: taxSummary.taxable_amount,
    tax_total: taxSummary.tax_total,
    cgst_total: taxSummary.cgstTotal,
    sgst_total: taxSummary.sgstTotal,
    igst_total: taxSummary.igstTotal,
    total: taxSummary.total,
    amount_paid: 0,
    amount_due: taxSummary.total,
    status: 'Sent',
    secure_token,
    notes: `Generated automatically from Quotation ${quot.quotation_number}`,
    created_by: req.user.name,
    created_at: new Date().toISOString()
  };

  db.invoices.unshift(newInvoice);

  taxSummary.processedItems.forEach(it => {
    db.invoice_items.push({
      ...it,
      invoice_id: invoiceId
    });
  });

  quot.status = 'Converted';
  quot.converted_invoice_id = invoiceId;

  logActivity({
    entity_type: 'Invoice',
    entity_id: invoiceId,
    entity_ref: invoiceNumber,
    user: req.user.name,
    role: req.user.role,
    action: 'Converted from Quotation',
    details: `Quotation ${quot.quotation_number} converted into Invoice ${invoiceNumber} for ₹${newInvoice.total.toLocaleString('en-IN')}`,
    ip: req.ip
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: `Quotation ${quot.quotation_number} successfully converted to ${invoiceNumber}`,
    invoice: newInvoice
  });
});

export default router;
