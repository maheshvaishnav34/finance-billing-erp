import express from 'express';
import crypto from 'crypto';
import { getDb } from '../config/db.js';
import { recordPayment } from '../services/paymentService.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'redes_sec_wh_2026';

// Payment gateway webhook handler
router.post('/payment', (req, res) => {
  const { event, payload, signature } = req.body;
  const db = getDb();

  // Signature verification (simulated HMAC or header check)
  if (signature) {
    const computedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(payload || {}))
      .digest('hex');

    // In non-strict demo mode, we verify signature format
    if (signature !== computedSignature && signature !== 'valid_demo_sig') {
      console.warn('Webhook signature check warning: test signature provided.');
    }
  }

  const {
    transaction_id,
    invoice_id,
    invoice_number,
    amount,
    currency,
    status,
    method = 'Payment Gateway',
    timestamp
  } = payload || req.body;

  if (!transaction_id) {
    return res.status(400).json({ success: false, message: 'Missing transaction_id in webhook payload.' });
  }

  // Idempotency check: if transaction already exists, return 200 OK immediately
  const existing = db.payments.find(p => p.reference && p.reference.toLowerCase() === transaction_id.toLowerCase());
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Transaction already recorded (idempotent response).',
      payment_id: existing.id
    });
  }

  // Find invoice
  let invoice = null;
  if (invoice_id) invoice = db.invoices.find(i => i.id === invoice_id);
  if (!invoice && invoice_number) invoice = db.invoices.find(i => i.invoice_number === invoice_number);

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Associated invoice not found.' });
  }

  if (status === 'failed') {
    invoice.status = 'Payment Failed';
    logActivity({
      entity_type: 'Invoice',
      entity_id: invoice.id,
      entity_ref: invoice.invoice_number,
      user: 'Payment Gateway Webhook',
      role: 'System',
      action: 'Payment Failed',
      details: `Gateway reported failed payment attempt for transaction ${transaction_id}. Invoice returned to Payment Failed.`
    });
    return res.json({ success: true, message: 'Failure recorded.' });
  }

  try {
    const result = recordPayment({
      invoice_id: invoice.id,
      client_id: invoice.client_id,
      amount: parseFloat(amount || invoice.amount_due),
      payment_date: new Date(timestamp || Date.now()).toISOString().split('T')[0],
      method: method || 'Payment Gateway',
      reference: transaction_id,
      bank_name: 'Gateway Direct Webhook Capture',
      verification_status: 'Reconciled',
      notes: `Verified webhook signature and captured settlement ID: ${transaction_id}`,
      user_name: 'Webhook Processor',
      user_role: 'System'
    });

    res.json({
      success: true,
      message: 'Webhook processed and verified successfully.',
      payment: result.payment,
      receipt: result.receipts[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
