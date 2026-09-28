import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { getDb, saveDatabase } from '../config/db.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';
import { getNextDocumentNumber, peekNextDocumentNumber } from '../services/numberSequenceService.js';
import { calculateInvoiceTaxes } from '../services/taxService.js';
import { logActivity } from '../services/auditService.js';

export async function getAllInvoices(req, res) {
  try {
    const db = getDb();
    let invoices = [...(db.invoices || [])];

    // Client role isolation
    if (req.user.role === ROLES.CLIENT) {
      invoices = invoices.filter(i => i.client_id === req.user.client_id);
    }

    const { status, client_id, search, limit } = req.query;

    if (status && status !== 'All') {
      invoices = invoices.filter(i => i.status.toLowerCase() === status.toLowerCase());
    }

    if (client_id) {
      invoices = invoices.filter(i => i.client_id === client_id);
    }

    if (search) {
      const q = search.toLowerCase();
      invoices = invoices.filter(i =>
        i.invoice_number.toLowerCase().includes(q) ||
        (i.project && i.project.toLowerCase().includes(q)) ||
        (i.client_name && i.client_name.toLowerCase().includes(q))
      );
    }

    // Sort by created_at desc
    invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (limit) {
      invoices = invoices.slice(0, parseInt(limit, 10));
    }

    return res.json({
      success: true,
      invoices,
      total: invoices.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getNextNumber(req, res) {
  try {
    const nextNumber = await peekNextDocumentNumber('invoice');
    return res.json({ success: true, nextNumber });
  } catch (err) {
    return res.json({ success: true, nextNumber: 'RC/2026-27/INV/0001' });
  }
}

export async function getInvoiceById(req, res) {
  const db = getDb();
  const invoice = db.invoices.find(i => i.id === req.params.id || i.invoice_number === req.params.id);

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  if (req.user.role === ROLES.CLIENT && req.user.client_id !== invoice.client_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice.' });
  }

  const client = db.clients.find(c => c.id === invoice.client_id) || {};
  const items = db.invoice_items.filter(item => item.invoice_id === invoice.id);
  const payments = db.payments.filter(p => p.invoice_id === invoice.id);
  const receipts = db.receipts.filter(r => r.invoice_id === invoice.id);
  const creditNotes = db.credit_notes.filter(cn => cn.original_invoice_id === invoice.id || cn.invoice_id === invoice.id);
  const timeline = db.invoice_activity_logs.filter(l => l.entity_id === invoice.id || l.entity_ref === invoice.invoice_number);

  return res.json({
    success: true,
    invoice: {
      ...invoice,
      client,
      items,
      timeline,
      payments,
      receipts,
      creditNotes,
      company: db.financial_settings
    }
  });
}

export async function createInvoice(req, res) {
  const db = getDb();
  const {
    client_id,
    project,
    quotation_id,
    invoice_date,
    payment_terms,
    due_date,
    currency = 'INR',
    items = [],
    notes = '',
    custom_invoice_number,
    reverse_charge = false
  } = req.body;

  const client = db.clients.find(c => c.id === client_id);
  if (!client) {
    return res.status(400).json({ success: false, message: 'Valid client is required.' });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one line item is required.' });
  }

  // Calculate taxes
  const taxSummary = calculateInvoiceTaxes(items, client.place_of_supply || '');

  // Concurrency-safe document sequence
  let invoice_number = custom_invoice_number;
  if (!invoice_number) {
    invoice_number = await getNextDocumentNumber('invoice');
  }

  const invoiceId = `inv_${uuidv4().substring(0, 8)}`;
  const secure_token = `tok_${uuidv4().replace(/-/g, '')}`;

  let initialStatus = 'Sent';
  const threshold = db.financial_settings?.require_approval_above || 100000;
  if (taxSummary.total >= threshold && req.user.role !== ROLES.CEO) {
    initialStatus = 'Pending Approval';
  }

  const newInvoice = {
    id: invoiceId,
    invoice_number,
    client_id: client.id,
    client_name: client.company_name || client.name,
    project: project || 'General IT Services',
    quotation_id: quotation_id || null,
    invoice_date: invoice_date || new Date().toISOString().split('T')[0],
    due_date: due_date || new Date().toISOString().split('T')[0],
    payment_terms: payment_terms || '15 Days',
    currency,
    reverse_charge: Boolean(reverse_charge === true || reverse_charge === 'Yes' || reverse_charge === 'true'),
    subtotal: taxSummary.subtotal,
    discount: taxSummary.discount,
    taxable_amount: taxSummary.taxable_amount,
    tax_total: taxSummary.tax_total,
    cgst_total: taxSummary.cgstTotal,
    sgst_total: taxSummary.sgstTotal,
    igst_total: taxSummary.igstTotal,
    total: taxSummary.total,
    amount_paid: 0,
    amount_due: taxSummary.total,
    status: initialStatus,
    secure_token,
    notes,
    created_by: req.user.name,
    created_at: new Date().toISOString()
  };

  // Insert into MySQL
  try {
    await pool.query(
      `INSERT INTO invoices (
        id, invoice_number, client_id, project, quotation_id, invoice_date, due_date,
        payment_terms, currency, reverse_charge, subtotal, discount, taxable_amount,
        tax_total, cgst_total, sgst_total, igst_total, total, amount_paid, amount_due,
        status, secure_token, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?, ?, ?, ?)`,
      [
        newInvoice.id, newInvoice.invoice_number, newInvoice.client_id, newInvoice.project,
        newInvoice.quotation_id, newInvoice.invoice_date, newInvoice.due_date,
        newInvoice.payment_terms, newInvoice.currency, newInvoice.reverse_charge ? 1 : 0,
        newInvoice.subtotal, newInvoice.discount, newInvoice.taxable_amount,
        newInvoice.tax_total, newInvoice.cgst_total, newInvoice.sgst_total,
        newInvoice.igst_total, newInvoice.total, newInvoice.amount_due,
        newInvoice.status, newInvoice.secure_token, newInvoice.notes, newInvoice.created_by
      ]
    );

    for (const item of (taxSummary.processedItems || [])) {
      const itemId = `item_${uuidv4().substring(0, 8)}`;
      await pool.query(
        `INSERT INTO invoice_items (
          id, invoice_id, product_service, description, hsn_sac, quantity, unit,
          rate, discount, taxable_amount, tax_rate, tax_amount, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId, invoiceId, item.product_service || item.description, item.description || '',
          item.hsn_sac || '998314', item.quantity || 1, item.unit || 'Nos', item.rate || 0,
          item.discount || 0, item.taxable_amount || 0, item.tax_rate || 18,
          item.tax_amount || 0, item.total || 0
        ]
      );
    }
  } catch (dbErr) {
    console.warn(`[Invoice Sync Notice] MySQL insert: ${dbErr.message}`);
  }

  // Sync with memory store
  db.invoices.unshift(newInvoice);
  (taxSummary.processedItems || []).forEach(item => {
    db.invoice_items.push({
      id: `item_${uuidv4().substring(0, 8)}`,
      invoice_id: invoiceId,
      ...item
    });
  });
  saveDatabase();

  await logActivity({
    entity_type: 'Invoice',
    entity_id: invoiceId,
    entity_ref: invoice_number,
    user: req.user.name,
    role: req.user.role,
    action: 'Invoice Created',
    details: `Created invoice ${invoice_number} for ₹${taxSummary.total.toLocaleString('en-IN')}`,
    ip: req.ip
  });

  return res.status(201).json({
    success: true,
    invoice: newInvoice,
    message: initialStatus === 'Pending Approval' ? 'Invoice created and submitted for CEO approval.' : 'Invoice created successfully!'
  });
}

export async function sendInvoice(req, res) {
  const db = getDb();
  const invoice = db.invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

  const client = db.clients.find(c => c.id === invoice.client_id);
  if (invoice.status === 'Draft' || invoice.status === 'Pending Approval') {
    invoice.status = 'Sent';
    try {
      await pool.query('UPDATE invoices SET status = "Sent" WHERE id = ?', [invoice.id]);
    } catch (e) {}
  }

  saveDatabase();

  await logActivity({
    entity_type: 'Invoice',
    entity_id: invoice.id,
    entity_ref: invoice.invoice_number,
    user: req.user.name,
    role: req.user.role,
    action: 'Invoice Sent',
    details: `Dispatched invoice ${invoice.invoice_number} to ${client?.email || 'client'}`,
    ip: req.ip
  });

  return res.json({
    success: true,
    message: `Invoice ${invoice.invoice_number} dispatched successfully!`,
    invoice
  });
}

export async function cancelInvoice(req, res) {
  const db = getDb();
  const invoice = db.invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

  if (invoice.amount_paid > 0) {
    return res.status(400).json({ success: false, message: 'Cannot cancel an invoice with recorded payments. Issue a Credit Note instead.' });
  }

  invoice.status = 'Cancelled';
  try {
    await pool.query('UPDATE invoices SET status = "Cancelled" WHERE id = ?', [invoice.id]);
  } catch (e) {}
  saveDatabase();

  await logActivity({
    entity_type: 'Invoice',
    entity_id: invoice.id,
    entity_ref: invoice.invoice_number,
    user: req.user.name,
    role: req.user.role,
    action: 'Invoice Cancelled',
    details: `Cancelled invoice ${invoice.invoice_number}`,
    ip: req.ip
  });

  return res.json({ success: true, message: 'Invoice marked as Cancelled.', invoice });
}

export async function updateInvoice(req, res) {
  const db = getDb();
  const invoice = db.invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

  const client = db.clients.find(c => c.id === invoice.client_id) || {};
  const { items, project, due_date, payment_terms, notes } = req.body;

  if (items && items.length > 0) {
    const taxSummary = calculateInvoiceTaxes(items, client.place_of_supply || '');
    invoice.subtotal = taxSummary.subtotal;
    invoice.discount = taxSummary.discount;
    invoice.taxable_amount = taxSummary.taxable_amount;
    invoice.tax_total = taxSummary.tax_total;
    invoice.cgst_total = taxSummary.cgstTotal;
    invoice.sgst_total = taxSummary.sgstTotal;
    invoice.igst_total = taxSummary.igstTotal;
    invoice.total = taxSummary.total;
    invoice.amount_due = Math.max(0, taxSummary.total - (parseFloat(invoice.amount_paid) || 0));

    // replace items
    db.invoice_items = db.invoice_items.filter(item => item.invoice_id !== invoice.id);
    (taxSummary.processedItems || []).forEach(item => {
      db.invoice_items.push({
        id: `item_${uuidv4().substring(0, 8)}`,
        invoice_id: invoice.id,
        ...item
      });
    });
  }

  if (project) invoice.project = project;
  if (due_date) invoice.due_date = due_date;
  if (payment_terms) invoice.payment_terms = payment_terms;
  if (notes !== undefined) invoice.notes = notes;

  try {
    await pool.query(
      `UPDATE invoices SET
        project = ?, due_date = ?, payment_terms = ?, notes = ?,
        subtotal = ?, discount = ?, taxable_amount = ?, tax_total = ?,
        cgst_total = ?, sgst_total = ?, igst_total = ?, total = ?, amount_due = ?
       WHERE id = ?`,
      [
        invoice.project, invoice.due_date, invoice.payment_terms, invoice.notes,
        invoice.subtotal, invoice.discount, invoice.taxable_amount, invoice.tax_total,
        invoice.cgst_total, invoice.sgst_total, invoice.igst_total, invoice.total, invoice.amount_due,
        invoice.id
      ]
    );
  } catch (e) {}

  saveDatabase();

  await logActivity({
    entity_type: 'Invoice',
    entity_id: invoice.id,
    entity_ref: invoice.invoice_number,
    user: req.user.name,
    role: req.user.role,
    action: 'Invoice Updated',
    details: `Updated invoice ${invoice.invoice_number} details & recalculated amounts`,
    ip: req.ip
  });

  return res.json({ success: true, invoice });
}

