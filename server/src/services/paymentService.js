import { pool, transaction } from '../config/database.js';
import { getNextDocumentNumber } from './numberSequenceService.js';
import { getDb, saveDatabase } from '../config/db.js';
import { logActivity } from './auditService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Record a payment, allocate to invoices, update invoice balances, and generate a receipt within an atomic MySQL transaction.
 */
export async function recordPayment({
  invoice_id,
  client_id,
  amount,
  payment_date,
  method,
  reference,
  bank_name = '',
  cheque_number = '',
  notes = '',
  received_by = 'Chirag Malviya',
  verification_status = 'Verified',
  allocations = [],
  is_online = false,
  user_name = 'Finance Admin',
  user_role = 'Finance/Admin'
}) {
  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  // Ensure unique transaction reference
  let cleanReference = (reference || '').trim();
  if (!cleanReference) {
    cleanReference = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const receiptNumber = await getNextDocumentNumber('receipt');
  const paymentId = `pay_${uuidv4().substring(0, 8)}`;
  const receiptId = `rec_${uuidv4().substring(0, 8)}`;

  try {
    await transaction(async (conn) => {
      // 1. Check duplicate reference
      const [existing] = await conn.query('SELECT id FROM payments WHERE reference = ?', [cleanReference]);
      if (existing.length > 0) {
        throw new Error(`Duplicate transaction reference: ${cleanReference} already exists.`);
      }

      // 2. Fetch invoice and client
      let clientName = '';
      let invoiceNumber = null;
      let primaryInvoice = null;

      if (invoice_id) {
        const [invRows] = await conn.query(
          `SELECT i.*, c.name as client_name, c.company_name
           FROM invoices i
           LEFT JOIN clients c ON i.client_id = c.id
           WHERE i.id = ? FOR UPDATE`,
          [invoice_id]
        );
        if (invRows.length > 0) {
          primaryInvoice = invRows[0];
          invoiceNumber = primaryInvoice.invoice_number;
          client_id = primaryInvoice.client_id;
          clientName = primaryInvoice.company_name || primaryInvoice.client_name || '';
        }
      } else if (client_id) {
        const [cRows] = await conn.query('SELECT company_name, name FROM clients WHERE id = ?', [client_id]);
        if (cRows.length > 0) clientName = cRows[0].company_name || cRows[0].name;
      }

      // 3. Insert payment record
      await conn.query(
        `INSERT INTO payments (
          id, reference, invoice_id, invoice_number, client_id, client_name,
          payment_date, method, amount, verification_status, bank_name,
          cheque_number, notes, received_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId, cleanReference, invoice_id || null, invoiceNumber || null, client_id, clientName,
          payment_date || new Date().toISOString().split('T')[0], method, paymentAmount,
          verification_status, bank_name, cheque_number, notes, received_by
        ]
      );

      // 4. Update Invoice Balances & Insert Allocations
      let remainingBalance = 0;
      if (primaryInvoice) {
        const newPaid = parseFloat(primaryInvoice.amount_paid) + paymentAmount;
        const newDue = Math.max(0, parseFloat(primaryInvoice.amount_due) - paymentAmount);
        const newStatus = newDue <= 0 ? 'Paid' : 'Partially Paid';
        remainingBalance = newDue;

        await conn.query(
          'UPDATE invoices SET amount_paid = ?, amount_due = ?, status = ? WHERE id = ?',
          [newPaid, newDue, newStatus, primaryInvoice.id]
        );

        // Allocation entry
        await conn.query(
          'INSERT INTO payment_allocations (id, payment_id, invoice_id, allocated_amount) VALUES (?, ?, ?, ?)',
          [`pa_${uuidv4().substring(0, 8)}`, paymentId, primaryInvoice.id, paymentAmount]
        );
      }

      // 5. Generate Receipt
      await conn.query(
        `INSERT INTO receipts (
          id, receipt_number, payment_id, invoice_id, invoice_number, client_id, client_name,
          payment_date, amount_received, payment_method, transaction_id, remaining_balance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          receiptId, receiptNumber, paymentId, invoice_id || 'GENERAL', invoiceNumber || 'Direct Payment',
          client_id, clientName, payment_date || new Date().toISOString().split('T')[0],
          paymentAmount, method, cleanReference, remainingBalance
        ]
      );

      // 6. Log audit entry
      await conn.query(
        `INSERT INTO invoice_activity_logs (
          id, entity_type, entity_id, entity_ref, user, role, action, details, timestamp, raw_timestamp, ip
        ) VALUES (?, 'Payment', ?, ?, ?, ?, 'Payment Recorded', ?, ?, ?, ?)`,
        [
          `log_${uuidv4().substring(0, 8)}`, paymentId, cleanReference,
          user_name, user_role,
          `Payment of ₹${paymentAmount.toLocaleString('en-IN')} received via ${method} for ${clientName}`,
          new Date().toLocaleDateString('en-GB'), new Date().toISOString(), '127.0.0.1'
        ]
      );
    });
  } catch (err) {
    console.warn(`[Payment Notice] MySQL transaction: ${err.message}`);
  }

  // Memory fallback / sync
  const db = getDb();
  let invoice = null;
  if (invoice_id) {
    invoice = db.invoices.find(i => i.id === invoice_id);
    if (invoice) {
      invoice.amount_paid = (parseFloat(invoice.amount_paid) || 0) + paymentAmount;
      invoice.amount_due = Math.max(0, (parseFloat(invoice.amount_due) || 0) - paymentAmount);
      invoice.status = invoice.amount_due <= 0 ? 'Paid' : 'Partially Paid';
    }
  }

  const newPayment = {
    id: paymentId,
    reference: cleanReference,
    invoice_id: invoice_id || null,
    invoice_number: invoice ? invoice.invoice_number : null,
    client_id: client_id || (invoice ? invoice.client_id : null),
    client_name: (invoice && invoice.client_name) || 'Client',
    payment_date: payment_date || new Date().toISOString().split('T')[0],
    method,
    amount: paymentAmount,
    verification_status,
    bank_name,
    cheque_number,
    notes,
    received_by,
    created_at: new Date().toISOString()
  };
  db.payments.unshift(newPayment);

  const newReceipt = {
    id: receiptId,
    receipt_number: receiptNumber,
    payment_id: paymentId,
    invoice_id: invoice_id || null,
    invoice_number: invoice ? invoice.invoice_number : null,
    client_id: newPayment.client_id,
    client_name: newPayment.client_name,
    payment_date: newPayment.payment_date,
    amount_received: paymentAmount,
    payment_method: method,
    transaction_id: cleanReference,
    remaining_balance: invoice ? invoice.amount_due : 0,
    created_at: new Date().toISOString()
  };
  db.receipts.unshift(newReceipt);
  saveDatabase();

  await logActivity({
    entity_type: 'Payment',
    entity_id: paymentId,
    entity_ref: cleanReference,
    user: user_name,
    role: user_role,
    action: 'Payment Recorded',
    details: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded against ${invoice ? invoice.invoice_number : 'Account'}`,
    ip: '127.0.0.1'
  });

  return {
    payment: newPayment,
    receipts: [newReceipt]
  };
}

/**
 * Update verification status of a payment (e.g. Unverified -> Verified / Reconciled)
 */
export async function updateVerificationStatus(paymentId, status, verifiedBy = 'Chirag Malviya', role = 'Finance/Admin') {
  try {
    await pool.query(
      'UPDATE payments SET verification_status = ?, verified_by = ? WHERE id = ?',
      [status, verifiedBy, paymentId]
    );
  } catch (e) {}

  const db = getDb();
  const payment = db.payments.find(p => p.id === paymentId);
  if (!payment) throw new Error('Payment record not found.');

  payment.verification_status = status;
  payment.verified_by = verifiedBy;
  payment.verified_at = new Date().toISOString();
  saveDatabase();

  await logActivity({
    entity_type: 'Payment',
    entity_id: paymentId,
    entity_ref: payment.reference,
    user: verifiedBy,
    role,
    action: 'Payment Verification Updated',
    details: `Payment status marked as ${status} by ${verifiedBy}`,
    ip: '127.0.0.1'
  });

  return payment;
}

export const verifyPayment = updateVerificationStatus;
