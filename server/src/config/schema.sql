-- Redes Creation ERP - Finance, Billing & Payment Collection Module
-- Complete MySQL Schema Definition

CREATE DATABASE IF NOT EXISTS redes_erp_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE redes_erp_finance;

-- 1. Roles & Permissions (Database-driven RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_role_perm (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  client_id VARCHAR(64) NULL,
  status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 2. Clients & Billing Profiles
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  billing_address TEXT NOT NULL,
  gstin VARCHAR(20),
  pan VARCHAR(20),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  place_of_supply VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'INR',
  default_payment_terms VARCHAR(50) DEFAULT '15 Days',
  default_due_days INT DEFAULT 15,
  preferred_payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(64) PRIMARY KEY,
  quotation_number VARCHAR(50) NOT NULL UNIQUE,
  client_id VARCHAR(64) NOT NULL,
  project_name VARCHAR(200),
  quotation_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  tax_total DECIMAL(12,2) DEFAULT 0.00,
  total DECIMAL(12,2) DEFAULT 0.00,
  status ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Converted') DEFAULT 'Draft',
  notes TEXT,
  converted_invoice_id VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- 4. Invoices
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
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  discount DECIMAL(12,2) DEFAULT 0.00,
  tax_total DECIMAL(12,2) DEFAULT 0.00,
  total DECIMAL(12,2) DEFAULT 0.00,
  amount_paid DECIMAL(12,2) DEFAULT 0.00,
  amount_due DECIMAL(12,2) DEFAULT 0.00,
  status ENUM('Draft', 'Sent', 'Viewed', 'Payment Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', 'Payment Failed', 'Refunded') DEFAULT 'Draft',
  cancellation_reason TEXT NULL,
  secure_token VARCHAR(128) NOT NULL UNIQUE,
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(64) PRIMARY KEY,
  invoice_id VARCHAR(64) NOT NULL,
  product_service VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) DEFAULT 1.00,
  unit VARCHAR(50) DEFAULT 'Unit',
  rate DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0.00,
  taxable_amount DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  tax_amount DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 5. Payments, Transactions & Allocations
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  reference VARCHAR(100) NOT NULL UNIQUE,
  invoice_id VARCHAR(64) NULL,
  client_id VARCHAR(64) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  verification_status ENUM('Received', 'Unverified', 'Verified', 'Reconciled') DEFAULT 'Received',
  bank_name VARCHAR(100),
  cheque_number VARCHAR(50),
  payment_proof_url VARCHAR(255),
  notes TEXT,
  received_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL,
  invoice_id VARCHAR(64) NOT NULL,
  allocated_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 6. Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id VARCHAR(64) PRIMARY KEY,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  payment_id VARCHAR(64) NOT NULL,
  invoice_id VARCHAR(64) NOT NULL,
  client_id VARCHAR(64) NOT NULL,
  payment_date DATE NOT NULL,
  amount_received DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100) NOT NULL,
  remaining_balance DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- 7. Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
  id VARCHAR(64) PRIMARY KEY,
  credit_note_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_id VARCHAR(64) NOT NULL,
  client_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('Draft', 'Issued', 'Applied') DEFAULT 'Issued',
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- 8. Payment Links & Recurring Billing
CREATE TABLE IF NOT EXISTS payment_links (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  client_id VARCHAR(64) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  description TEXT,
  expiry_date DATE,
  token VARCHAR(128) NOT NULL UNIQUE,
  status ENUM('Active', 'Paid', 'Expired', 'Cancelled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS recurring_invoices (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL,
  service VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency ENUM('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Custom') DEFAULT 'Monthly',
  next_run DATE NOT NULL,
  status ENUM('Active', 'Paused', 'Cancelled') DEFAULT 'Active',
  auto_send BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- 9. Audit Logs & Activity Timeline
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
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
