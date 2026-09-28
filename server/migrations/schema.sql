-- ============================================================================
-- Redes Creation ERP - Finance, Billing & Payment Collection Module
-- Complete Production MySQL Relational Database Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS redes_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE redes_erp;

-- 1. Roles & Permissions (RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_role_perm (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clients
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  billing_address TEXT NOT NULL,
  gstin VARCHAR(25),
  pan VARCHAR(25),
  state VARCHAR(100),
  state_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  place_of_supply VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'INR',
  default_payment_terms VARCHAR(50) DEFAULT '15 Days',
  default_due_days INT DEFAULT 15,
  credit_limit DECIMAL(15,2) DEFAULT 0.00,
  preferred_payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clients_email (email),
  INDEX idx_clients_company (company_name),
  INDEX idx_clients_gstin (gstin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  role_id INT NOT NULL,
  client_id VARCHAR(64) NULL,
  status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
  phone VARCHAR(50),
  designation VARCHAR(150),
  department VARCHAR(150),
  initials VARCHAR(10),
  reset_otp VARCHAR(10) NULL,
  reset_otp_expires BIGINT NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Financial Master Settings (Single-Row Configuration)
CREATE TABLE IF NOT EXISTS financial_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  brand_short VARCHAR(50),
  tagline VARCHAR(255),
  email VARCHAR(150),
  phone VARCHAR(50),
  website VARCHAR(150),
  gstin VARCHAR(25),
  pan VARCHAR(25),
  state VARCHAR(100),
  state_code VARCHAR(10),
  address TEXT,
  bank_name VARCHAR(150),
  account_name VARCHAR(150),
  account_number VARCHAR(100),
  ifsc VARCHAR(50),
  branch VARCHAR(100),
  upi_id VARCHAR(100),
  require_approval_above DECIMAL(15,2) DEFAULT 100000.00,
  currency_symbol VARCHAR(10) DEFAULT '₹',
  financial_year VARCHAR(50) DEFAULT '2026-27',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Concurrency-Safe Number Sequences
CREATE TABLE IF NOT EXISTS number_sequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_type VARCHAR(50) NOT NULL UNIQUE,
  financial_year VARCHAR(50) NOT NULL DEFAULT '2026-27',
  prefix VARCHAR(100) NOT NULL,
  last_number INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tax Rates Master
CREATE TABLE IF NOT EXISTS tax_rates (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  rate DECIMAL(6,2) NOT NULL,
  type VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Payment Methods Master
CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  instructions TEXT,
  account_number VARCHAR(100) NULL,
  ifsc VARCHAR(50) NULL,
  upi_id VARCHAR(100) NULL,
  gateway_name VARCHAR(100) NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  template_key VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150),
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(64) PRIMARY KEY,
  quotation_number VARCHAR(50) NOT NULL UNIQUE,
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(200),
  project VARCHAR(200),
  date DATE NOT NULL,
  valid_until DATE NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  tax_total DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  status ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Converted') DEFAULT 'Draft',
  converted_invoice_id VARCHAR(64) NULL,
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_quotations_number (quotation_number),
  INDEX idx_quotations_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotation_items (
  id VARCHAR(64) PRIMARY KEY,
  quotation_id VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  hsn_sac VARCHAR(50),
  quantity DECIMAL(12,2) DEFAULT 1.00,
  unit VARCHAR(50) DEFAULT 'Unit',
  rate DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) DEFAULT 0.00,
  taxable_amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(6,2) DEFAULT 18.00,
  tax_amount DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  client_id VARCHAR(64) NOT NULL,
  project VARCHAR(200),
  quotation_id VARCHAR(64) NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_terms VARCHAR(50) DEFAULT '15 Days',
  currency VARCHAR(10) DEFAULT 'INR',
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  discount DECIMAL(15,2) DEFAULT 0.00,
  taxable_amount DECIMAL(15,2) DEFAULT 0.00,
  tax_total DECIMAL(15,2) DEFAULT 0.00,
  cgst_total DECIMAL(15,2) DEFAULT 0.00,
  sgst_total DECIMAL(15,2) DEFAULT 0.00,
  igst_total DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  amount_paid DECIMAL(15,2) DEFAULT 0.00,
  amount_due DECIMAL(15,2) DEFAULT 0.00,
  status ENUM('Draft', 'Sent', 'Viewed', 'Payment Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', 'Payment Failed', 'Refunded') DEFAULT 'Draft',
  cancellation_reason TEXT NULL,
  secure_token VARCHAR(128) NOT NULL UNIQUE,
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_invoices_number (invoice_number),
  INDEX idx_invoices_client (client_id),
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_due_date (due_date),
  INDEX idx_invoices_token (secure_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(64) PRIMARY KEY,
  invoice_id VARCHAR(64) NOT NULL,
  product_service VARCHAR(255) NOT NULL,
  description TEXT,
  hsn_sac VARCHAR(50),
  quantity DECIMAL(12,2) DEFAULT 1.00,
  unit VARCHAR(50) DEFAULT 'Unit',
  rate DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) DEFAULT 0.00,
  taxable_amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(6,2) DEFAULT 18.00,
  tax_amount DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_invoice_items_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Payments & Transactions
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  reference VARCHAR(100) NOT NULL UNIQUE,
  invoice_id VARCHAR(64) NULL,
  invoice_number VARCHAR(50) NULL,
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(200),
  payment_date DATE NOT NULL,
  method VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  verification_status ENUM('Received', 'Unverified', 'Verified', 'Reconciled') DEFAULT 'Received',
  bank_name VARCHAR(100),
  cheque_number VARCHAR(50),
  payment_proof_url VARCHAR(255),
  notes TEXT,
  received_by VARCHAR(100),
  verified_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_payments_reference (reference),
  INDEX idx_payments_client (client_id),
  INDEX idx_payments_invoice (invoice_id),
  INDEX idx_payments_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_allocations (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL,
  invoice_id VARCHAR(64) NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_allocations_payment (payment_id),
  INDEX idx_allocations_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id VARCHAR(64) PRIMARY KEY,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  payment_id VARCHAR(64) NOT NULL,
  invoice_id VARCHAR(64) NOT NULL,
  invoice_number VARCHAR(50),
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(200),
  payment_date DATE NOT NULL,
  amount_received DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100) NOT NULL,
  remaining_balance DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_receipts_number (receipt_number),
  INDEX idx_receipts_invoice (invoice_id),
  INDEX idx_receipts_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
  id VARCHAR(64) PRIMARY KEY,
  credit_note_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_id VARCHAR(64) NOT NULL,
  invoice_number VARCHAR(50),
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(200),
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('Draft', 'Issued', 'Applied') DEFAULT 'Issued',
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_credit_notes_number (credit_note_number),
  INDEX idx_credit_notes_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_note_items (
  id VARCHAR(64) PRIMARY KEY,
  credit_note_id VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 1.00,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credit_note_id) REFERENCES credit_notes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Recurring Invoices
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(200),
  service VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  frequency ENUM('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Custom') DEFAULT 'Monthly',
  next_run DATE NOT NULL,
  status ENUM('Active', 'Paused', 'Cancelled') DEFAULT 'Active',
  auto_send BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_recurring_client (client_id),
  INDEX idx_recurring_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Payment Reminders Configuration
CREATE TABLE IF NOT EXISTS payment_reminders (
  id VARCHAR(64) PRIMARY KEY,
  stage VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  auto_send BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Standalone Payment Links
CREATE TABLE IF NOT EXISTS payment_links (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(200),
  amount DECIMAL(15,2) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  description TEXT,
  expiry_date DATE,
  token VARCHAR(128) NOT NULL UNIQUE,
  status ENUM('Active', 'Paid', 'Expired', 'Cancelled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_payment_links_code (code),
  INDEX idx_payment_links_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Project Manager Milestone Invoice Requests
CREATE TABLE IF NOT EXISTS invoice_requests (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(200),
  project VARCHAR(200),
  milestone_name VARCHAR(200) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  notes TEXT,
  requested_by VARCHAR(100) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Generated') DEFAULT 'Pending',
  generated_invoice_number VARCHAR(50) NULL,
  generated_invoice_id VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Audit Logs & Activity Trail
CREATE TABLE IF NOT EXISTS invoice_activity_logs (
  id VARCHAR(64) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  entity_ref VARCHAR(100),
  user VARCHAR(100) NOT NULL,
  role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  timestamp VARCHAR(50) NOT NULL,
  raw_timestamp VARCHAR(50),
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_user (user),
  INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR(64) PRIMARY KEY,
  invoice_id VARCHAR(64) NULL,
  invoice_number VARCHAR(50) NULL,
  client_id VARCHAR(64) NULL,
  client_name VARCHAR(200) NULL,
  recipient_email VARCHAR(150) NOT NULL,
  stage VARCHAR(50),
  type VARCHAR(50),
  is_escalation BOOLEAN DEFAULT FALSE,
  timestamp VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_logs_invoice (invoice_id),
  INDEX idx_email_logs_email (recipient_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
