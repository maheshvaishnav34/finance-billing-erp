import express from 'express';
import { getDb, saveDatabase } from '../config/db.js';
import { recordPayment } from '../services/paymentService.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET Client portal invoice details by secure token
router.get('/invoice/:token', (req, res) => {
  const db = getDb();
  const token = req.params.token;

  // Find by invoice token or standalone payment link token
  const invoice = db.invoices.find(i => i.secure_token === token);
  if (invoice) {
    const client = db.clients.find(c => c.id === invoice.client_id);
    const items = db.invoice_items.filter(item => item.invoice_id === invoice.id);
    const payments = db.payments.filter(p => p.invoice_id === invoice.id);

    // Record 'Invoice Viewed' in audit if not yet viewed
    if (invoice.status === 'Sent') {
      invoice.status = 'Viewed';
      logActivity({
        entity_type: 'Invoice',
        entity_id: invoice.id,
        entity_ref: invoice.invoice_number,
        user: `${client?.name || 'Client'} (External)`,
        role: 'Client',
        action: 'Invoice Viewed',
        details: `Client viewed invoice via secure payment link. Status moved to Viewed.`,
        ip: req.ip
      });
    }

    return res.json({
      success: true,
      type: 'invoice',
      data: {
        ...invoice,
        client,
        items,
        payments,
        company: db.financial_settings
      }
    });
  }

  // Check standalone payment links
  const payLink = db.payment_links.find(pl => pl.token === token);
  if (payLink) {
    const client = db.clients.find(c => c.id === payLink.client_id);
    return res.json({
      success: true,
      type: 'payment_link',
      data: {
        ...payLink,
        client,
        company: db.financial_settings
      }
    });
  }

  return res.status(404).json({ success: false, message: 'Invalid or expired secure link.' });
});

// POST Client pays online through secure portal
router.post('/pay/:token', async (req, res) => {
  const db = getDb();
  const token = req.params.token;
  const { amount, method = 'Payment Gateway', gateway_tx_id } = req.body;

  // 1. Try finding invoice by secure_token
  const invoice = db.invoices.find(i => i.secure_token === token);

  // 2. Try finding standalone payment link by token
  const payLink = !invoice ? db.payment_links.find(pl => pl.token === token) : null;

  if (!invoice && !payLink) {
    return res.status(404).json({ success: false, message: 'Invalid payment token.' });
  }

  // Handle invoice payment
  if (invoice) {
    const payAmount = parseFloat(amount || invoice.amount_due);
    if (payAmount <= 0 || payAmount > invoice.amount_due) {
      return res.status(400).json({ success: false, message: `Invalid payment amount. Max payable is ₹${invoice.amount_due}` });
    }

    const client = db.clients.find(c => c.id === invoice.client_id);
    const ref = gateway_tx_id || `pay_gw_${uuidv4().substring(0, 10).toUpperCase()}`;

    try {
      const result = await recordPayment({
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        amount: payAmount,
        payment_date: new Date().toISOString().split('T')[0],
        method: method,
        reference: ref,
        bank_name: 'Online Gateway Settlement',
        notes: `Online transaction authorized by ${client?.name || 'Client'}`,
        verification_status: 'Reconciled',
        user_name: client?.name || 'Client Online Checkout',
        user_role: 'Client'
      });

      return res.json({
        success: true,
        message: 'Payment completed successfully!',
        payment: result.payment,
        receipt: result.receipts[0]
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Handle standalone payment link payment
  if (payLink) {
    const payAmount = parseFloat(amount || payLink.amount);
    if (payAmount <= 0 || payAmount > payLink.amount) {
      return res.status(400).json({ success: false, message: `Invalid payment amount. Max payable is ₹${payLink.amount}` });
    }

    const client = db.clients.find(c => c.id === payLink.client_id);
    const ref = gateway_tx_id || `pay_link_${uuidv4().substring(0, 10).toUpperCase()}`;

    try {
      const result = await recordPayment({
        invoice_id: null,
        client_id: payLink.client_id,
        amount: payAmount,
        payment_date: new Date().toISOString().split('T')[0],
        method: method,
        reference: ref,
        bank_name: 'Online Gateway Settlement',
        notes: `Online Payment Link ${payLink.code} (${payLink.purpose})`,
        verification_status: 'Reconciled',
        user_name: client?.name || 'Client Online Checkout',
        user_role: 'Client'
      });

      // Mark payment link status as Paid
      payLink.status = 'Paid';
      saveDatabase();

      await logActivity({
        entity_type: 'Payment Link',
        entity_id: payLink.id,
        entity_ref: payLink.code,
        user: `${client?.name || 'Client'} (Online)`,
        role: 'Client',
        action: 'Payment Link Settled',
        details: `Online payment of ₹${payAmount.toLocaleString('en-IN')} completed via ${method} for ${payLink.code}. Status marked as Paid.`,
        ip: req.ip
      });

      return res.json({
        success: true,
        message: 'Payment completed successfully!',
        payment: result.payment,
        receipt: result.receipts[0]
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
});

export default router;

