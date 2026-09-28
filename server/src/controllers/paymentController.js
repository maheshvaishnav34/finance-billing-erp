import { pool } from '../config/database.js';
import { getDb } from '../config/db.js';
import { ROLES } from '../config/constants.js';
import { recordPayment as recordPaymentService, updateVerificationStatus as updateVerificationService } from '../services/paymentService.js';

export async function getAllPayments(req, res) {
  try {
    const db = getDb();
    let payments = [...(db.payments || [])];

    if (req.user.role === ROLES.CLIENT) {
      payments = payments.filter(p => p.client_id === req.user.client_id);
    }

    const { tab, search } = req.query;

    if (tab === 'Online payments') {
      payments = payments.filter(p => p.method === 'Payment Gateway' || p.method === 'UPI');
    } else if (tab === 'Manual payments') {
      payments = payments.filter(p => ['Bank Transfer', 'Cash', 'Cheque', 'Other'].includes(p.method));
    } else if (tab === 'Reconciliation') {
      payments = payments.filter(p => p.verification_status !== 'Reconciled');
    }

    if (search) {
      const q = search.toLowerCase();
      payments = payments.filter(p => 
        (p.reference && String(p.reference).toLowerCase().includes(q)) ||
        (p.client_name && String(p.client_name).toLowerCase().includes(q)) ||
        (p.invoice_number && String(p.invoice_number).toLowerCase().includes(q))
      );
    }

    return res.json({
      success: true,
      payments,
      total: payments.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createPayment(req, res) {
  try {
    const {
      invoice_id,
      client_id,
      amount,
      payment_date,
      method,
      reference,
      bank_name,
      cheque_number,
      notes,
      allocations,
      verification_status
    } = req.body;

    const result = await recordPaymentService({
      invoice_id,
      client_id,
      amount,
      payment_date,
      method,
      reference,
      bank_name,
      cheque_number,
      notes,
      allocations,
      verification_status: verification_status || 'Verified',
      user_name: req.user.name,
      user_role: req.user.role
    });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment: result.payment,
      receipts: result.receipts
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { status } = req.body;
    const updated = await updateVerificationService(
      req.params.id,
      status || 'Reconciled',
      req.user.name,
      req.user.role
    );
    return res.json({ success: true, payment: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
