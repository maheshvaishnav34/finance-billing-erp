import express from 'express';
import { getDb, saveDatabase } from '../config/db.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/constants.js';
import { getNextDocumentNumber } from '../services/numberSequenceService.js';
import { calculateInvoiceTaxes } from '../services/taxService.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET recurring billing schedules
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  res.json({ success: true, recurring: db.recurring_invoices });
});

// POST Create new recurring schedule
router.post('/', authenticateToken, requirePermission(PERMISSIONS.RECURRING_MANAGE), (req, res) => {
  const db = getDb();
  const { client_id, service, amount, frequency, next_run, auto_send } = req.body;
  const client = db.clients.find(c => c.id === client_id);
  if (!client) return res.status(400).json({ success: false, message: 'Client required' });

  const newRecurring = {
    id: `rec_inv_${uuidv4().substring(0, 8)}`,
    client_id: client.id,
    client_name: client.name,
    service: service || 'Recurring Retainer',
    amount: parseFloat(amount || 0),
    frequency: frequency || 'Monthly',
    next_run: next_run || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'Active',
    auto_send: auto_send !== undefined ? auto_send : true,
    created_at: new Date().toISOString()
  };

  db.recurring_invoices.unshift(newRecurring);
  saveDatabase();

  res.status(201).json({ success: true, recurring: newRecurring });
});

// POST Run recurring schedule to generate new invoice
router.post('/:id/generate-now', authenticateToken, requirePermission(PERMISSIONS.RECURRING_MANAGE), async (req, res) => {
  const db = getDb();
  const schedule = db.recurring_invoices.find(s => s.id === req.params.id);
  if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

  const client = db.clients.find(c => c.id === schedule.client_id);
  const invoiceNumber = await getNextDocumentNumber('invoice');
  const invoiceId = `inv_${uuidv4().substring(0, 8)}`;
  const secure_token = `tok_${uuidv4().replace(/-/g, '')}`;

  const baseRate = Math.round((schedule.amount / 1.18) * 100) / 100;
  const items = [{
    id: `item_${uuidv4().substring(0, 8)}`,
    product_service: schedule.service,
    description: `Automated recurring cycle: ${schedule.frequency}`,
    quantity: 1,
    unit: 'Cycle',
    rate: baseRate,
    discount: 0,
    tax_rate: 18
  }];

  const taxSummary = calculateInvoiceTaxes(items, client?.place_of_supply || '');

  const newInvoice = {
    id: invoiceId,
    invoice_number: invoiceNumber,
    client_id: schedule.client_id,
    project: `Recurring - ${schedule.service}`,
    quotation_id: null,
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
    notes: `Recurring invoice for ${schedule.frequency} subscription`,
    created_by: 'Recurring Billing System',
    created_at: new Date().toISOString()
  };

  db.invoices.unshift(newInvoice);

  taxSummary.processedItems.forEach(it => {
    db.invoice_items.push({ ...it, invoice_id: invoiceId });
  });

  // Advance next run date
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  schedule.next_run = nextDate.toISOString().split('T')[0];

  logActivity({
    entity_type: 'Invoice',
    entity_id: invoiceId,
    entity_ref: invoiceNumber,
    user: 'System Scheduler',
    role: 'System',
    action: 'Recurring Invoice Generated',
    details: `Generated recurring invoice ${invoiceNumber} for ₹${taxSummary.total.toLocaleString('en-IN')}`,
    ip: req.ip
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: `Generated invoice ${invoiceNumber} for recurring schedule`,
    invoice: newInvoice
  });
});

export default router;
