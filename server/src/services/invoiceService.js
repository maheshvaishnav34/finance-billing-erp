import { pool, transaction } from '../config/database.js';
import { getNextDocumentNumber } from './numberSequenceService.js';
import { logActivity } from './auditService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch all invoices with optional status/search filters and client joins
 */
export async function getInvoices({ status, search, client_id, limit = 100, offset = 0 } = {}) {
  let sql = `
    SELECT i.*, c.name as client_name, c.company_name, c.email as client_email, c.gstin as client_gstin
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'All') {
    sql += ' AND i.status = ?';
    params.push(status);
  }

  if (client_id) {
    sql += ' AND i.client_id = ?';
    params.push(client_id);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    sql += ' AND (i.invoice_number LIKE ? OR c.company_name LIKE ? OR c.name LIKE ? OR i.project LIKE ?)';
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const [invoices] = await pool.query(sql, params);

  // Fetch items for these invoices
  if (invoices.length > 0) {
    const invoiceIds = invoices.map(i => i.id);
    const placeholders = invoiceIds.map(() => '?').join(',');
    const [items] = await pool.query(
      `SELECT * FROM invoice_items WHERE invoice_id IN (${placeholders})`,
      invoiceIds
    );

    const itemsMap = {};
    for (const item of items) {
      if (!itemsMap[item.invoice_id]) itemsMap[item.invoice_id] = [];
      itemsMap[item.invoice_id].push(item);
    }

    for (const inv of invoices) {
      inv.items = itemsMap[inv.id] || [];
    }
  }

  return invoices;
}

/**
 * Fetch single invoice by ID with items & client details
 */
export async function getInvoiceById(id) {
  const [rows] = await pool.query(
    `SELECT i.*, c.name as client_name, c.company_name, c.email as client_email, c.phone as client_phone,
            c.billing_address, c.gstin as client_gstin, c.pan as client_pan, c.state as client_state
     FROM invoices i
     LEFT JOIN clients c ON i.client_id = c.id
     WHERE i.id = ? OR i.invoice_number = ? OR i.secure_token = ?`,
    [id, id, id]
  );

  if (rows.length === 0) return null;

  const invoice = rows[0];
  const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoice.id]);
  invoice.items = items;

  // Also fetch payments allocated to this invoice
  const [payments] = await pool.query(
    `SELECT p.*, pa.allocated_amount
     FROM payment_allocations pa
     JOIN payments p ON pa.payment_id = p.id
     WHERE pa.invoice_id = ?`,
    [invoice.id]
  );
  invoice.payments = payments;

  return invoice;
}

/**
 * Create a new invoice within an atomic MySQL transaction
 */
export async function createInvoice({
  client_id,
  project,
  invoice_date,
  due_date,
  payment_terms = '15 Days',
  items = [],
  notes = '',
  created_by = 'Chirag Malviya',
  currency = 'INR',
  quotation_id = null
}, reqUser = null) {
  return await transaction(async (conn) => {
    // 1. Verify client exists
    const [clients] = await conn.query('SELECT id, company_name FROM clients WHERE id = ?', [client_id]);
    if (clients.length === 0) {
      throw new Error(`Client not found with ID: ${client_id}`);
    }

    // 2. Concurrency-safe invoice number generation
    const invoiceNumber = await getNextDocumentNumber('invoice');
    const invoiceId = `inv_${uuidv4().substring(0, 8)}`;
    const secureToken = `tok_${uuidv4().replace(/-/g, '')}`;

    // 3. Compute tax totals
    let subtotal = 0;
    let taxTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    for (const item of items) {
      const qty = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.rate) || 0;
      const discount = parseFloat(item.discount) || 0;
      const taxable = (qty * rate) - discount;
      const taxRate = parseFloat(item.tax_rate) || 18.00;
      const taxAmount = taxable * (taxRate / 100);

      subtotal += taxable;
      taxTotal += taxAmount;

      // Intra-state standard default split (CGST 9% + SGST 9%) vs IGST 18%
      if (item.tax_type === 'IGST' || taxRate === 18 && item.is_interstate) {
        igstTotal += taxAmount;
      } else {
        cgstTotal += taxAmount / 2;
        sgstTotal += taxAmount / 2;
      }
    }

    const grandTotal = subtotal + taxTotal;

    // 4. Insert into invoices table
    await conn.query(
      `INSERT INTO invoices (
        id, invoice_number, client_id, project, quotation_id, invoice_date, due_date, payment_terms,
        currency, subtotal, discount, taxable_amount, tax_total, cgst_total, sgst_total, igst_total,
        total, amount_paid, amount_due, status, secure_token, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'Sent', ?, ?, ?)`,
      [
        invoiceId, invoiceNumber, client_id, project || '', quotation_id,
        invoice_date || new Date().toISOString().split('T')[0],
        due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        payment_terms, currency, subtotal, 0.00, subtotal, taxTotal,
        cgstTotal, sgstTotal, igstTotal, grandTotal, grandTotal,
        secureToken, notes, created_by
      ]
    );

    // 5. Insert invoice items
    for (const item of items) {
      const itemId = `item_${uuidv4().substring(0, 8)}`;
      const qty = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.rate) || 0;
      const discount = parseFloat(item.discount) || 0;
      const taxable = (qty * rate) - discount;
      const taxRate = parseFloat(item.tax_rate) || 18.00;
      const taxAmount = taxable * (taxRate / 100);
      const lineTotal = taxable + taxAmount;

      await conn.query(
        `INSERT INTO invoice_items (
          id, invoice_id, product_service, description, hsn_sac, quantity, unit, rate,
          discount, taxable_amount, tax_rate, tax_amount, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId, invoiceId, item.product_service || item.description || 'Professional Services',
          item.description || '', item.hsn_sac || '998314', qty, item.unit || 'Unit',
          rate, discount, taxable, taxRate, taxAmount, lineTotal
        ]
      );
    }

    // 6. Record audit log
    await conn.query(
      `INSERT INTO invoice_activity_logs (
        id, entity_type, entity_id, entity_ref, user, role, action, details, timestamp, raw_timestamp, ip
      ) VALUES (?, 'Invoice', ?, ?, ?, ?, 'Invoice Created', ?, ?, ?, ?)`,
      [
        `log_${uuidv4().substring(0, 8)}`, invoiceId, invoiceNumber,
        reqUser?.name || created_by, reqUser?.role || 'Finance/Admin',
        `Invoice ${invoiceNumber} created for ${clients[0].company_name} (₹${grandTotal.toLocaleString('en-IN')})`,
        new Date().toLocaleDateString('en-GB'), new Date().toISOString(), '127.0.0.1'
      ]
    );

    return {
      id: invoiceId,
      invoice_number: invoiceNumber,
      client_id,
      total: grandTotal,
      status: 'Sent',
      secure_token: secureToken
    };
  });
}
