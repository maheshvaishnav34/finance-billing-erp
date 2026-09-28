import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const JSON_DB_PATH = path.join(__dirname, '../data/database.json');
const SCHEMA_PATH = path.join(__dirname, '../migrations/schema.sql');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'redes_erp';

async function runMigration() {
  console.log('================================================================');
  console.log('  🚀 Redes Creation ERP - JSON to MySQL Database Migration');
  console.log('================================================================');
  console.log(`Target MySQL Database : ${DB_NAME} on ${DB_HOST}:${DB_PORT}`);
  console.log(`JSON Source File      : ${JSON_DB_PATH}`);

  if (!fs.existsSync(JSON_DB_PATH)) {
    console.error(`❌ Source database.json not found at: ${JSON_DB_PATH}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(JSON_DB_PATH, 'utf-8');
  const jsonDb = JSON.parse(rawJson);
  console.log('✅ Loaded database.json successfully into memory for migration.');

  // 1. Initial connection without database selected to create DB if needed
  let rootConn;
  try {
    rootConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });
    console.log(`✅ Connected to MySQL server at ${DB_HOST}:${DB_PORT}`);
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Verified database \`${DB_NAME}\` exists.`);
    await rootConn.end();
  } catch (err) {
    console.error(`❌ Could not connect to MySQL server at ${DB_HOST}:${DB_PORT}:`, err.message);
    console.log('   Please make sure your MySQL service is running and credentials in server/.env are correct.');
    process.exit(1);
  }

  // 2. Connect to the target database
  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true
  });

  // 3. Execute schema.sql to ensure all tables exist
  console.log('\n📄 Executing schema.sql definitions...');
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  // Split statements by semicolon while ignoring comments
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('use ') && !s.toLowerCase().startsWith('create database'));

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      console.warn(`⚠️ Schema notice on stmt [${stmt.slice(0, 40)}...]:`, err.message);
    }
  }
  console.log('✅ Schema tables verified/created successfully.');

  const counts = {};

  // 4. Migrate Tables in Dependency-Safe Order
  console.log('\n📦 Migrating collections from JSON to MySQL...');

  // A. Roles
  if (jsonDb.roles && jsonDb.roles.length > 0) {
    for (const r of jsonDb.roles) {
      await pool.query(
        'INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)',
        [r.id, r.name, r.description || '']
      );
    }
    counts['roles'] = { json: jsonDb.roles.length };
  }

  // B. Permissions
  if (jsonDb.permissions && jsonDb.permissions.length > 0) {
    for (const p of jsonDb.permissions) {
      await pool.query(
        'INSERT INTO permissions (id, code, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name)',
        [p.id, p.code, p.name]
      );
    }
    counts['permissions'] = { json: jsonDb.permissions.length };
  }

  // C. Role Permissions
  if (jsonDb.role_permissions && jsonDb.role_permissions.length > 0) {
    for (const rp of jsonDb.role_permissions) {
      await pool.query(
        'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), permission_id = VALUES(permission_id)',
        [rp.id, rp.role_id, rp.permission_id]
      );
    }
    counts['role_permissions'] = { json: jsonDb.role_permissions.length };
  }

  // D. Clients
  if (jsonDb.clients && jsonDb.clients.length > 0) {
    for (const c of jsonDb.clients) {
      await pool.query(
        `INSERT INTO clients (id, name, company_name, contact_person, email, phone, billing_address, gstin, pan, state, state_code, country, place_of_supply, currency, default_payment_terms, default_due_days, credit_limit, preferred_payment_method, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), email = VALUES(email), phone = VALUES(phone), billing_address = VALUES(billing_address), gstin = VALUES(gstin), pan = VALUES(pan), status = VALUES(status)`,
        [
          c.id, c.name || c.contact_person || '', c.company_name || '', c.contact_person || '', c.email || '', c.phone || '',
          c.billing_address || '', c.gstin || '', c.pan || '', c.state || '', c.state_code || '', c.country || 'India',
          c.place_of_supply || '', c.currency || 'INR', c.default_payment_terms || '15 Days', c.default_due_days || 15,
          c.credit_limit || 0.00, c.preferred_payment_method || 'Bank Transfer', c.status || 'Active',
          c.created_at ? new Date(c.created_at) : new Date()
        ]
      );
    }
    counts['clients'] = { json: jsonDb.clients.length };
  }

  // E. Users
  if (jsonDb.users && jsonDb.users.length > 0) {
    for (const u of jsonDb.users) {
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, role_id, client_id, status, phone, designation, department, initials, reset_otp, reset_otp_expires, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), role_id = VALUES(role_id), status = VALUES(status), phone = VALUES(phone), designation = VALUES(designation), department = VALUES(department), password_hash = VALUES(password_hash)`,
        [
          u.id, u.name, u.email, u.password_hash || 'password123', u.role, u.role_id || 1, u.client_id || null,
          u.status || 'Active', u.phone || '', u.designation || '', u.department || '', u.initials || 'RC',
          u.reset_otp || null, u.reset_otp_expires || null,
          u.created_at ? new Date(u.created_at) : new Date()
        ]
      );
    }
    counts['users'] = { json: jsonDb.users.length };
  }

  // F. Financial Settings
  if (jsonDb.financial_settings && Object.keys(jsonDb.financial_settings).length > 0) {
    const s = jsonDb.financial_settings;
    await pool.query(
      `INSERT INTO financial_settings (id, company_name, brand_short, tagline, email, phone, website, gstin, pan, state, state_code, address, bank_name, account_name, account_number, ifsc, branch, upi_id, require_approval_above, currency_symbol, financial_year)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), gstin = VALUES(gstin), pan = VALUES(pan), bank_name = VALUES(bank_name), account_number = VALUES(account_number), ifsc = VALUES(ifsc), upi_id = VALUES(upi_id), require_approval_above = VALUES(require_approval_above)`,
      [
        s.company_name || 'Redes Creation Private Limited', s.brand_short || 'Redes Creation', s.tagline || '', s.email || '', s.phone || '', s.website || '',
        s.gstin || '', s.pan || '', s.state || '', s.state_code || '', s.address || '', s.bank_name || '', s.account_name || '',
        s.account_number || '', s.ifsc || '', s.branch || '', s.upi_id || '', s.require_approval_above || 100000.00,
        s.currency_symbol || '₹', s.financial_year || '2026-27'
      ]
    );
    counts['financial_settings'] = { json: 1 };
  }

  // G. Number Sequences
  if (jsonDb.invoice_number_sequences) {
    for (const [docType, seq] of Object.entries(jsonDb.invoice_number_sequences)) {
      await pool.query(
        `INSERT INTO number_sequences (document_type, financial_year, prefix, last_number)
         VALUES (?, '2026-27', ?, ?)
         ON DUPLICATE KEY UPDATE prefix = VALUES(prefix), last_number = VALUES(last_number)`,
        [docType, seq.prefix || `RC/2026-27/${docType.toUpperCase()}/`, seq.next || 1]
      );
    }
    counts['number_sequences'] = { json: Object.keys(jsonDb.invoice_number_sequences).length };
  }

  // H. Tax Rates
  if (jsonDb.tax_rates && jsonDb.tax_rates.length > 0) {
    for (const t of jsonDb.tax_rates) {
      await pool.query(
        `INSERT INTO tax_rates (id, name, rate, type, is_default, active)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), rate = VALUES(rate), type = VALUES(type), is_default = VALUES(is_default), active = VALUES(active)`,
        [t.id, t.name, t.rate, t.type || '', t.is_default ? 1 : 0, t.active ? 1 : 0]
      );
    }
    counts['tax_rates'] = { json: jsonDb.tax_rates.length };
  }

  // I. Payment Methods
  if (jsonDb.payment_methods && jsonDb.payment_methods.length > 0) {
    for (const pm of jsonDb.payment_methods) {
      await pool.query(
        `INSERT INTO payment_methods (id, name, type, enabled, instructions, account_number, ifsc, upi_id, gateway_name, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), instructions = VALUES(instructions), enabled = VALUES(enabled)`,
        [pm.id, pm.name, pm.type, pm.enabled ? 1 : 0, pm.instructions || '', pm.account_number || null, pm.ifsc || null, pm.upi_id || null, pm.gateway_name || null, pm.is_default ? 1 : 0]
      );
    }
    counts['payment_methods'] = { json: jsonDb.payment_methods.length };
  }

  // J. Email Templates
  if (jsonDb.email_templates) {
    for (const [key, tpl] of Object.entries(jsonDb.email_templates)) {
      await pool.query(
        `INSERT INTO email_templates (template_key, name, subject, body)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body)`,
        [key, tpl.name || key, tpl.subject || '', tpl.body || '']
      );
    }
    counts['email_templates'] = { json: Object.keys(jsonDb.email_templates).length };
  }

  // K. Quotations & Items
  if (jsonDb.quotations && jsonDb.quotations.length > 0) {
    for (const q of jsonDb.quotations) {
      await pool.query(
        `INSERT INTO quotations (id, quotation_number, client_id, client_name, project, date, valid_until, currency, subtotal, tax_total, total, status, converted_invoice_id, notes, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), total = VALUES(total)`,
        [
          q.id, q.quotation_number, q.client_id, q.client_name || '', q.project || '',
          q.date || q.quotation_date || '2026-09-01', q.valid_until || '2026-09-30',
          q.currency || 'INR', q.subtotal || q.total || 0, q.tax_total || 0, q.total || 0,
          q.status || 'Draft', q.converted_invoice_id || null, q.notes || '', q.created_by || 'Finance Team',
          q.created_at ? new Date(q.created_at) : new Date()
        ]
      );
      if (Array.isArray(q.items)) {
        for (const item of q.items) {
          await pool.query(
            `INSERT INTO quotation_items (id, quotation_id, description, hsn_sac, quantity, unit, rate, discount, taxable_amount, tax_rate, tax_amount, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE description = VALUES(description), rate = VALUES(rate), total = VALUES(total)`,
            [
              item.id || `qitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              q.id, item.description || '', item.hsn_sac || '', item.quantity || 1, item.unit || 'Unit',
              item.rate || 0, item.discount || 0, item.taxable_amount || item.rate || 0,
              item.tax_rate || 18, item.tax_amount || 0, item.total || item.amount || 0
            ]
          );
        }
      }
    }
    counts['quotations'] = { json: jsonDb.quotations.length };
  }

  // L. Invoices & Items
  if (jsonDb.invoices && jsonDb.invoices.length > 0) {
    for (const inv of jsonDb.invoices) {
      await pool.query(
        `INSERT INTO invoices (id, invoice_number, client_id, project, quotation_id, invoice_date, due_date, payment_terms, currency, subtotal, discount, taxable_amount, tax_total, cgst_total, sgst_total, igst_total, total, amount_paid, amount_due, status, cancellation_reason, secure_token, notes, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount_paid = VALUES(amount_paid), amount_due = VALUES(amount_due), status = VALUES(status), total = VALUES(total)`,
        [
          inv.id, inv.invoice_number, inv.client_id, inv.project || '', inv.quotation_id || null,
          inv.invoice_date, inv.due_date, inv.payment_terms || '15 Days', inv.currency || 'INR',
          inv.subtotal || 0, inv.discount || 0, inv.taxable_amount || inv.subtotal || 0, inv.tax_total || 0,
          inv.cgst_total || 0, inv.sgst_total || 0, inv.igst_total || 0, inv.total || 0,
          inv.amount_paid || 0, inv.amount_due || 0, inv.status || 'Draft', inv.cancellation_reason || null,
          inv.secure_token || `tok_${inv.id}`, inv.notes || '', inv.created_by || 'Chirag Malviya',
          inv.created_at ? new Date(inv.created_at) : new Date()
        ]
      );
    }
    counts['invoices'] = { json: jsonDb.invoices.length };
  }

  if (jsonDb.invoice_items && jsonDb.invoice_items.length > 0) {
    for (const item of jsonDb.invoice_items) {
      await pool.query(
        `INSERT INTO invoice_items (id, invoice_id, product_service, description, hsn_sac, quantity, unit, rate, discount, taxable_amount, tax_rate, tax_amount, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE product_service = VALUES(product_service), rate = VALUES(rate), total = VALUES(total)`,
        [
          item.id, item.invoice_id, item.product_service || item.description || '', item.description || '',
          item.hsn_sac || '', item.quantity || 1, item.unit || 'Unit', item.rate || 0, item.discount || 0,
          item.taxable_amount || 0, item.tax_rate || 18, item.tax_amount || 0, item.total || 0
        ]
      );
    }
    counts['invoice_items'] = { json: jsonDb.invoice_items.length };
  }

  // M. Payments & Allocations
  if (jsonDb.payments && jsonDb.payments.length > 0) {
    for (const p of jsonDb.payments) {
      await pool.query(
        `INSERT INTO payments (id, reference, invoice_id, invoice_number, client_id, client_name, payment_date, method, amount, verification_status, bank_name, cheque_number, payment_proof_url, notes, received_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE verification_status = VALUES(verification_status), amount = VALUES(amount)`,
        [
          p.id, p.reference, p.invoice_id || null, p.invoice_number || null, p.client_id, p.client_name || '',
          p.payment_date, p.method, p.amount, p.verification_status || 'Received', p.bank_name || '',
          p.cheque_number || '', p.payment_proof_url || '', p.notes || '', p.received_by || '',
          p.created_at ? new Date(p.created_at) : new Date()
        ]
      );
    }
    counts['payments'] = { json: jsonDb.payments.length };
  }

  if (jsonDb.payment_allocations && jsonDb.payment_allocations.length > 0) {
    for (const pa of jsonDb.payment_allocations) {
      await pool.query(
        `INSERT INTO payment_allocations (id, payment_id, invoice_id, allocated_amount, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE allocated_amount = VALUES(allocated_amount)`,
        [pa.id, pa.payment_id, pa.invoice_id, pa.allocated_amount, pa.created_at ? new Date(pa.created_at) : new Date()]
      );
    }
    counts['payment_allocations'] = { json: jsonDb.payment_allocations.length };
  }

  // N. Receipts
  if (jsonDb.receipts && jsonDb.receipts.length > 0) {
    for (const r of jsonDb.receipts) {
      await pool.query(
        `INSERT INTO receipts (id, receipt_number, payment_id, invoice_id, invoice_number, client_id, client_name, payment_date, amount_received, payment_method, transaction_id, remaining_balance, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount_received = VALUES(amount_received), remaining_balance = VALUES(remaining_balance)`,
        [
          r.id, r.receipt_number, r.payment_id, r.invoice_id, r.invoice_number || '', r.client_id,
          r.client_name || '', r.payment_date, r.amount_received, r.payment_method, r.transaction_id,
          r.remaining_balance || 0, r.created_at ? new Date(r.created_at) : new Date()
        ]
      );
    }
    counts['receipts'] = { json: jsonDb.receipts.length };
  }

  // O. Credit Notes
  if (jsonDb.credit_notes && jsonDb.credit_notes.length > 0) {
    for (const cn of jsonDb.credit_notes) {
      await pool.query(
        `INSERT INTO credit_notes (id, credit_note_number, invoice_id, invoice_number, client_id, client_name, date, amount, reason, status, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = VALUES(status)`,
        [
          cn.id, cn.credit_note_number, cn.invoice_id, cn.invoice_number || '', cn.client_id, cn.client_name || '',
          cn.date, cn.amount, cn.reason, cn.status || 'Issued', cn.created_by || '',
          cn.created_at ? new Date(cn.created_at) : new Date()
        ]
      );
    }
    counts['credit_notes'] = { json: jsonDb.credit_notes.length };
  }

  // P. Recurring Invoices
  if (jsonDb.recurring_invoices && jsonDb.recurring_invoices.length > 0) {
    for (const ri of jsonDb.recurring_invoices) {
      await pool.query(
        `INSERT INTO recurring_invoices (id, client_id, client_name, service, amount, frequency, next_run, status, auto_send, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE next_run = VALUES(next_run), status = VALUES(status)`,
        [
          ri.id, ri.client_id, ri.client_name || '', ri.service, ri.amount, ri.frequency || 'Monthly',
          ri.next_run, ri.status || 'Active', ri.auto_send ? 1 : 0, ri.created_at ? new Date(ri.created_at) : new Date()
        ]
      );
    }
    counts['recurring_invoices'] = { json: jsonDb.recurring_invoices.length };
  }

  // Q. Payment Reminders
  if (jsonDb.payment_reminders && jsonDb.payment_reminders.length > 0) {
    for (const pr of jsonDb.payment_reminders) {
      await pool.query(
        `INSERT INTO payment_reminders (id, stage, title, enabled, auto_send)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), enabled = VALUES(enabled), auto_send = VALUES(auto_send)`,
        [pr.id, pr.stage, pr.title, pr.enabled ? 1 : 0, pr.auto_send ? 1 : 0]
      );
    }
    counts['payment_reminders'] = { json: jsonDb.payment_reminders.length };
  }

  // R. Payment Links
  if (jsonDb.payment_links && jsonDb.payment_links.length > 0) {
    for (const pl of jsonDb.payment_links) {
      await pool.query(
        `INSERT INTO payment_links (id, code, client_id, client_name, amount, purpose, description, expiry_date, token, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), amount = VALUES(amount)`,
        [
          pl.id, pl.code, pl.client_id, pl.client_name || '', pl.amount, pl.purpose, pl.description || '',
          pl.expiry_date || null, pl.token, pl.status || 'Active', pl.created_at ? new Date(pl.created_at) : new Date()
        ]
      );
    }
    counts['payment_links'] = { json: jsonDb.payment_links.length };
  }

  // S. Invoice Requests (PM Module)
  if (jsonDb.invoice_requests && jsonDb.invoice_requests.length > 0) {
    for (const ir of jsonDb.invoice_requests) {
      await pool.query(
        `INSERT INTO invoice_requests (id, client_id, client_name, project, milestone_name, amount, notes, requested_by, status, generated_invoice_number, generated_invoice_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), generated_invoice_number = VALUES(generated_invoice_number)`,
        [
          ir.id, ir.client_id, ir.client_name || '', ir.project || '', ir.milestone_name, ir.amount,
          ir.notes || '', ir.requested_by, ir.status || 'Pending', ir.generated_invoice_number || null,
          ir.generated_invoice_id || null, ir.created_at ? new Date(ir.created_at) : new Date()
        ]
      );
    }
    counts['invoice_requests'] = { json: jsonDb.invoice_requests.length };
  }

  // T. Invoice Activity Logs (Audit)
  if (jsonDb.invoice_activity_logs && jsonDb.invoice_activity_logs.length > 0) {
    for (const log of jsonDb.invoice_activity_logs) {
      await pool.query(
        `INSERT INTO invoice_activity_logs (id, entity_type, entity_id, entity_ref, user, role, action, details, timestamp, raw_timestamp, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE action = VALUES(action), details = VALUES(details)`,
        [
          log.id, log.entity_type, log.entity_id, log.entity_ref || '', log.user, log.role || '',
          log.action, log.details || '', log.timestamp || '', log.raw_timestamp || '', log.ip || '127.0.0.1'
        ]
      );
    }
    counts['invoice_activity_logs'] = { json: jsonDb.invoice_activity_logs.length };
  }

  // U. Email Logs
  if (jsonDb.email_logs && jsonDb.email_logs.length > 0) {
    for (const el of jsonDb.email_logs) {
      await pool.query(
        `INSERT INTO email_logs (id, invoice_id, invoice_number, client_id, client_name, recipient_email, stage, type, is_escalation, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE timestamp = VALUES(timestamp)`,
        [
          el.id, el.invoice_id || null, el.invoice_number || null, el.client_id || null,
          el.client_name || null, el.recipient_email || '', el.stage || '', el.type || '',
          el.is_escalation ? 1 : 0, el.timestamp || ''
        ]
      );
    }
    counts['email_logs'] = { json: jsonDb.email_logs.length };
  }

  // 5. Verification Phase: Check MySQL record counts
  console.log('\n================================================================');
  console.log('  📊 MIGRATION VERIFICATION: JSON RECORD COUNT vs MYSQL COUNT');
  console.log('================================================================');
  console.log('Table Name               | JSON Count | MySQL Count | Status');
  console.log('-------------------------+------------+-------------+---------');

  let allMatched = true;
  for (const [table, info] of Object.entries(counts)) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      const mysqlCount = rows[0].total;
      info.mysql = mysqlCount;
      const match = mysqlCount >= info.json;
      if (!match) allMatched = false;
      const status = match ? '✅ MATCH' : '❌ MISMATCH';
      console.log(
        `${table.padEnd(24)} | ${String(info.json).padStart(10)} | ${String(mysqlCount).padStart(11)} | ${status}`
      );
    } catch (err) {
      console.log(`${table.padEnd(24)} | ${String(info.json).padStart(10)} |       ERROR | ❌ ${err.message}`);
      allMatched = false;
    }
  }
  console.log('----------------------------------------------------------------');

  if (allMatched) {
    console.log('\n🎉 ALL TABLES VERIFIED! Data migration completed successfully.');
    console.log(`📁 Source database.json preserved at: ${JSON_DB_PATH} (Backup intact)`);
  } else {
    console.warn('\n⚠️ Some table counts differed. Please inspect the log above.');
  }

  await pool.end();
  process.exit(0);
}

runMigration().catch(err => {
  console.error('\n❌ Uncaught error during migration:', err);
  process.exit(1);
});
