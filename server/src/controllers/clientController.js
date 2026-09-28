import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { getDb, saveDatabase } from '../config/db.js';
import { ROLES } from '../config/constants.js';

export async function getAllClients(req, res) {
  try {
    let clients = [];
    try {
      const [rows] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
      if (rows && rows.length > 0) clients = rows;
    } catch (e) {}

    if (clients.length === 0) {
      const db = getDb();
      clients = [...db.clients];
    }

    if (req.user.role === ROLES.CLIENT) {
      clients = clients.filter(c => c.id === req.user.client_id);
    }

    // Metrics computation
    const db = getDb();
    const clientsWithMetrics = clients.map(client => {
      const clientInvoices = (db.invoices || []).filter(i => i.client_id === client.id && i.status !== 'Cancelled');
      const clientPayments = (db.payments || []).filter(p => p.client_id === client.id);

      const totalInvoiced = clientInvoices.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
      const totalPaid = clientInvoices.reduce((s, i) => s + (parseFloat(i.amount_paid) || 0), 0);
      const totalOutstanding = clientInvoices.reduce((s, i) => s + (parseFloat(i.amount_due) || 0), 0);
      const totalOverdue = clientInvoices
        .filter(i => i.status === 'Overdue')
        .reduce((s, i) => s + (parseFloat(i.amount_due) || 0), 0);

      const sortedInvoices = [...clientInvoices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const sortedPayments = [...clientPayments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return {
        ...client,
        totalInvoiced: Math.round(totalInvoiced),
        totalPaid: Math.round(totalPaid),
        totalOutstanding: Math.round(totalOutstanding),
        totalOverdue: Math.round(totalOverdue),
        lastInvoice: sortedInvoices[0] || null,
        lastPayment: sortedPayments[0] || null,
        invoiceCount: clientInvoices.length
      };
    });

    return res.json({ success: true, clients: clientsWithMetrics, total: clientsWithMetrics.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getClientById(req, res) {
  const { id } = req.params;
  try {
    let client = null;
    try {
      const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
      if (rows && rows.length > 0) client = rows[0];
    } catch (e) {}

    if (!client) {
      const db = getDb();
      client = db.clients.find(c => c.id === id);
    }

    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    if (req.user.role === ROLES.CLIENT && req.user.client_id !== client.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const db = getDb();
    const invoices = (db.invoices || []).filter(i => i.client_id === client.id);
    const payments = (db.payments || []).filter(p => p.client_id === client.id);
    const receipts = (db.receipts || []).filter(r => r.client_id === client.id);
    const creditNotes = (db.credit_notes || []).filter(cn => cn.client_id === client.id);

    return res.json({
      success: true,
      client,
      invoices,
      payments,
      receipts,
      creditNotes
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createClient(req, res) {
  const {
    name,
    company_name,
    contact_person,
    email,
    phone,
    billing_address,
    gstin,
    pan,
    state,
    country,
    place_of_supply,
    currency,
    default_payment_terms,
    default_due_days,
    preferred_payment_method
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const clientId = `cli_${uuidv4().substring(0, 8)}`;
  const newClient = {
    id: clientId,
    name,
    company_name: company_name || name,
    contact_person: contact_person || name,
    email,
    phone: phone || '',
    billing_address: billing_address || '',
    gstin: gstin || '',
    pan: pan || '',
    state: state || 'Madhya Pradesh',
    country: country || 'India',
    place_of_supply: place_of_supply || '23-Madhya Pradesh',
    currency: currency || 'INR',
    default_payment_terms: default_payment_terms || '15 Days',
    default_due_days: parseInt(default_due_days || 15),
    preferred_payment_method: preferred_payment_method || 'Bank Transfer',
    created_at: new Date().toISOString()
  };

  try {
    await pool.query(
      `INSERT INTO clients (id, name, company_name, contact_person, email, phone, billing_address, gstin, pan, state, country, place_of_supply, currency, default_payment_terms, default_due_days, preferred_payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newClient.id, newClient.name, newClient.company_name, newClient.contact_person,
        newClient.email, newClient.phone, newClient.billing_address, newClient.gstin,
        newClient.pan, newClient.state, newClient.country, newClient.place_of_supply,
        newClient.currency, newClient.default_payment_terms, newClient.default_due_days,
        newClient.preferred_payment_method
      ]
    );
  } catch (e) {}

  const db = getDb();
  db.clients.push(newClient);
  saveDatabase();

  return res.status(201).json({ success: true, client: newClient });
}

export async function updateClient(req, res) {
  const { id } = req.params;
  const db = getDb();
  const client = db.clients.find(c => c.id === id);
  if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });

  const fields = req.body;
  Object.assign(client, fields);

  try {
    await pool.query(
      `UPDATE clients SET name = COALESCE(?, name), company_name = COALESCE(?, company_name),
       contact_person = COALESCE(?, contact_person), email = COALESCE(?, email), phone = COALESCE(?, phone),
       billing_address = COALESCE(?, billing_address), gstin = COALESCE(?, gstin), pan = COALESCE(?, pan)
       WHERE id = ?`,
      [fields.name, fields.company_name, fields.contact_person, fields.email, fields.phone, fields.billing_address, fields.gstin, fields.pan, id]
    );
  } catch (e) {}

  saveDatabase();
  return res.json({ success: true, client });
}

export async function deleteClient(req, res) {
  const { id } = req.params;
  const db = getDb();
  const idx = db.clients.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Client not found.' });

  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [id]);
  } catch (e) {}

  db.clients.splice(idx, 1);
  saveDatabase();

  return res.json({ success: true, message: 'Client profile deleted successfully.' });
}
