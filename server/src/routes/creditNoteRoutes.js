import express from 'express';
import { getDb, saveDatabase } from '../config/db.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';
import { getNextDocumentNumber } from '../services/numberSequenceService.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET all credit notes
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  let creditNotes = [...db.credit_notes];

  if (req.user.role === ROLES.CLIENT) {
    creditNotes = creditNotes.filter(cn => cn.client_id === req.user.client_id);
  }

  res.json({ success: true, creditNotes, total: creditNotes.length });
});

// POST Create Credit Note
router.post('/', authenticateToken, requirePermission(PERMISSIONS.CREDIT_NOTE_CREATE), async (req, res) => {
  const db = getDb();
  const { invoice_id, amount, reason, date } = req.body;

  const invoice = db.invoices.find(i => i.id === invoice_id);
  if (!invoice) return res.status(400).json({ success: false, message: 'Valid invoice is required.' });

  const client = db.clients.find(c => c.id === invoice.client_id);
  const cnNumber = await getNextDocumentNumber('credit_note');
  const cnAmount = parseFloat(amount || 0);

  if (cnAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Credit note amount must be greater than zero.' });
  }

  if (cnAmount > invoice.amount_due) {
    return res.status(400).json({
      success: false,
      message: `Credit note amount (₹${cnAmount}) cannot exceed outstanding invoice balance (₹${invoice.amount_due}).`
    });
  }

  const creditNote = {
    id: `cn_${uuidv4().substring(0, 8)}`,
    credit_note_number: cnNumber,
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    client_id: invoice.client_id,
    client_name: client ? client.name : 'Client',
    date: date || new Date().toISOString().split('T')[0],
    amount: cnAmount,
    reason: reason || 'Billing correction',
    status: 'Issued',
    created_by: req.user.name,
    created_at: new Date().toISOString()
  };

  db.credit_notes.unshift(creditNote);

  // Adjust invoice amount due
  invoice.amount_due = Math.max(0, Math.round((invoice.amount_due - cnAmount) * 100) / 100);
  if (invoice.amount_due === 0 && invoice.status !== 'Cancelled') {
    invoice.status = 'Paid';
  }

  logActivity({
    entity_type: 'Credit Note',
    entity_id: creditNote.id,
    entity_ref: cnNumber,
    user: req.user.name,
    role: req.user.role,
    action: 'Credit Note Issued',
    details: `Credit Note ${cnNumber} for ₹${cnAmount.toLocaleString('en-IN')} issued against Invoice ${invoice.invoice_number}. Reason: "${reason}"`,
    ip: req.ip
  });

  saveDatabase();

  res.status(201).json({ success: true, creditNote });
});

export default router;
