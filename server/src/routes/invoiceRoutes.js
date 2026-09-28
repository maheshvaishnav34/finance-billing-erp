import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS, ROLES } from '../config/constants.js';
import {
  getAllInvoices,
  getNextNumber,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  sendInvoice,
  cancelInvoice
} from '../controllers/invoiceController.js';
import { getDb, saveDatabase } from '../config/db.js';
import { getNextDocumentNumber } from '../services/numberSequenceService.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET all invoices (with filtering by status, search, client)
router.get('/', authenticateToken, getAllInvoices);

// GET preview next invoice number
router.get('/next-number', authenticateToken, getNextNumber);

// GET single invoice with complete relational breakdown
router.get('/:id', authenticateToken, getInvoiceById);

// POST Create Invoice
router.post('/', authenticateToken, requirePermission(PERMISSIONS.INVOICE_CREATE), createInvoice);

// PUT Update Invoice
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.INVOICE_CREATE), updateInvoice);


// POST Send/Dispatch invoice
router.post('/:id/send', authenticateToken, requirePermission(PERMISSIONS.INVOICE_SEND), sendInvoice);

// POST Cancel Invoice
router.post('/:id/cancel', authenticateToken, requirePermission(PERMISSIONS.INVOICE_CANCEL), cancelInvoice);

// POST Duplicate Invoice
router.post('/:id/duplicate', authenticateToken, requirePermission(PERMISSIONS.INVOICE_CREATE), async (req, res) => {
  const db = getDb();
  const invoice = db.invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  const oldItems = db.invoice_items.filter(item => item.invoice_id === invoice.id);
  const newNum = await getNextDocumentNumber('invoice');
  const newId = `inv_${uuidv4().substring(0, 8)}`;

  const duplicatedInvoice = {
    ...invoice,
    id: newId,
    invoice_number: newNum,
    invoice_date: new Date().toISOString().split('T')[0],
    amount_paid: 0,
    amount_due: invoice.total,
    status: 'Draft',
    secure_token: `tok_${uuidv4().replace(/-/g, '')}`,
    created_by: req.user.name,
    created_at: new Date().toISOString()
  };

  db.invoices.unshift(duplicatedInvoice);

  oldItems.forEach(item => {
    db.invoice_items.push({
      ...item,
      id: `item_${uuidv4().substring(0, 8)}`,
      invoice_id: newId
    });
  });

  await logActivity({
    entity_type: 'Invoice',
    entity_id: newId,
    entity_ref: newNum,
    user: req.user.name,
    role: req.user.role,
    action: 'Invoice Duplicated',
    details: `Created draft invoice ${newNum} as duplicate of ${invoice.invoice_number}`,
    ip: req.ip
  });

  saveDatabase();
  return res.json({ success: true, invoice: duplicatedInvoice });
});

// POST Approve Invoice (CEO / Executive Authority for high-value invoices)
router.post('/:id/approve', authenticateToken, requirePermission(PERMISSIONS.INVOICE_APPROVE), async (req, res) => {
  const db = getDb();
  const invoice = db.invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  const oldStatus = invoice.status;
  invoice.status = 'Sent';
  invoice.approved_by = req.user.name;
  invoice.approved_at = new Date().toISOString();

  await logActivity({
    entity_type: 'Invoice',
    entity_id: invoice.id,
    entity_ref: invoice.invoice_number,
    user: req.user.name,
    role: req.user.role,
    action: 'Invoice Approved (Executive Authorization)',
    details: `High-value invoice ${invoice.invoice_number} (₹${invoice.total.toLocaleString('en-IN')}) approved by ${req.user.name}. Status: ${oldStatus} -> Sent. Ready for client dispatch.`,
    ip: req.ip
  });

  saveDatabase();
  return res.json({
    success: true,
    message: `Invoice ${invoice.invoice_number} approved successfully.`,
    invoice
  });
});

// POST Reject Invoice
router.post('/:id/reject', authenticateToken, requirePermission(PERMISSIONS.INVOICE_APPROVE), async (req, res) => {
  const db = getDb();
  const invoice = db.invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  const { rejection_reason } = req.body;
  invoice.status = 'Draft';
  invoice.rejection_reason = rejection_reason || 'Revisions required by CEO';

  await logActivity({
    entity_type: 'Invoice',
    entity_id: invoice.id,
    entity_ref: invoice.invoice_number,
    user: req.user.name,
    role: req.user.role,
    action: 'Invoice Approval Rejected',
    details: `Invoice ${invoice.invoice_number} returned to Draft for adjustments. Reason: ${invoice.rejection_reason}`,
    ip: req.ip
  });

  saveDatabase();
  return res.json({ success: true, message: 'Invoice returned to Draft for adjustments.', invoice });
});

export default router;
