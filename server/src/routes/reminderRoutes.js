import express from 'express';
import { getDb, saveDatabase } from '../config/db.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/constants.js';
import { runReminderCheck } from '../services/reminderService.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET reminder rules & logs
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  res.json({
    success: true,
    rules: db.payment_reminders,
    emailLogs: (db.email_logs || []).filter(e => e.type === 'reminder')
  });
});

// POST Trigger scheduler tick / check
router.post('/run-check', authenticateToken, (req, res) => {
  const result = runReminderCheck();
  res.json({
    success: true,
    message: `Reminder check completed. Marked overdue: ${result.markedOverdue}, Reminders triggered: ${result.remindersGenerated}, CEO Escalations: ${result.escalations}`,
    result
  });
});

// POST Send manual reminder for a specific invoice
router.post('/send-manual', authenticateToken, requirePermission(PERMISSIONS.REMINDER_SEND), (req, res) => {
  const db = getDb();
  const { invoice_id, custom_message } = req.body;
  const invoice = db.invoices.find(i => i.id === invoice_id);

  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  const client = db.clients.find(c => c.id === invoice.client_id);

  const emailEntry = {
    id: `em_${uuidv4().substring(0, 8)}`,
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    client_id: invoice.client_id,
    client_name: client?.name,
    recipient_email: client?.email,
    stage: 'Manual Reminder',
    type: 'reminder',
    custom_message,
    timestamp: new Date().toISOString()
  };

  if (!db.email_logs) db.email_logs = [];
  db.email_logs.push(emailEntry);

  logActivity({
    entity_type: 'Invoice',
    entity_id: invoice.id,
    entity_ref: invoice.invoice_number,
    user: req.user.name,
    role: req.user.role,
    action: 'Manual Payment Reminder Sent',
    details: `Manual payment reminder dispatched to ${client?.email} for Invoice ${invoice.invoice_number} (Outstanding: ₹${invoice.amount_due.toLocaleString('en-IN')})`,
    ip: req.ip
  });

  saveDatabase();

  res.json({
    success: true,
    message: `Payment reminder email sent to ${client?.email}`,
    email: emailEntry
  });
});

export default router;
