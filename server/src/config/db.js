import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MAP } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// In-memory relational store
let db = {
  users: [],
  roles: [],
  permissions: [],
  role_permissions: [],
  clients: [],
  client_billing_profiles: [],
  quotations: [],
  quotation_items: [],
  invoices: [],
  invoice_items: [],
  invoice_taxes: [],
  payments: [],
  payment_transactions: [],
  payment_allocations: [],
  receipts: [],
  credit_notes: [],
  credit_note_items: [],
  payment_links: [],
  recurring_invoices: [],
  recurring_invoice_items: [],
  payment_reminders: [],
  email_logs: [],
  invoice_views: [],
  invoice_activity_logs: [],
  financial_settings: {},
  invoice_number_sequences: {},
  tax_rates: [],
  payment_methods: [],
  email_templates: {}
};

// Ensure data dir exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {}

export const defaultTaxRates = [
  { id: 'tax_1', name: 'CGST (9%) + SGST (9%)', rate: 18, type: 'Intra-State GST', is_default: true, active: true },
  { id: 'tax_2', name: 'IGST (18%)', rate: 18, type: 'Inter-State GST', is_default: true, active: true },
  { id: 'tax_3', name: 'GST 12% (CGST 6% + SGST 6%)', rate: 12, type: 'Standard Services', is_default: false, active: true },
  { id: 'tax_4', name: 'GST 5% (CGST 2.5% + SGST 2.5%)', rate: 5, type: 'Essential Services', is_default: false, active: true },
  { id: 'tax_5', name: 'TDS Section 194J (2% Technical Services)', rate: 2, type: 'Tax Deducted at Source', is_default: false, active: true },
  { id: 'tax_6', name: 'TCS Section 206C(1H) (0.1%)', rate: 0.1, type: 'Tax Collected at Source', is_default: false, active: true }
];

export const defaultPaymentMethods = [
  {
    id: 'pm_1',
    name: 'Bank Transfer (NEFT / RTGS / IMPS)',
    type: 'Bank Transfer',
    enabled: true,
    instructions: 'Direct bank transfer to HDFC Bank A/C 50200088991122, IFSC: HDFC0001234',
    account_number: '50200088991122',
    ifsc: 'HDFC0001234',
    is_default: true
  },
  {
    id: 'pm_2',
    name: 'UPI / Dynamic QR Code',
    type: 'UPI',
    enabled: true,
    instructions: 'Scan UPI QR code or pay to VPA: redescreation@hdfcbank',
    upi_id: 'redescreation@hdfcbank',
    is_default: false
  },
  {
    id: 'pm_3',
    name: 'Razorpay Online Gateway (Cards / NetBanking / Wallets)',
    type: 'Payment Gateway',
    enabled: true,
    instructions: 'Instant online settlement with 256-bit SSL encryption & automatic instant receipt generation',
    gateway_name: 'Razorpay',
    is_default: false
  },
  {
    id: 'pm_4',
    name: 'Cheque / Demand Draft',
    type: 'Cheque',
    enabled: true,
    instructions: 'Account payee cheque in favor of "Redes Creation Private Limited", payable at Indore',
    is_default: false
  },
  {
    id: 'pm_5',
    name: 'Direct Cash Deposit',
    type: 'Cash',
    enabled: false,
    instructions: 'Direct cash deposit at designated branch counter with bank deposit slip reference',
    is_default: false
  }
];

export const defaultEmailTemplates = {
  invoice_sent: {
    name: 'Invoice Dispatch Notice',
    subject: 'Invoice {invoice_number} from Redes Creation',
    body: `Dear {client_name},

Please find attached tax invoice {invoice_number} for {project} totaling {currency} {total}.

Payment Due Date: {due_date}
Payment Terms: {payment_terms}

You can review the invoice details and complete payment online via our secure client portal:
{payment_link}

Thank you for choosing Redes Creation IT & Digital Solutions!

Best regards,
Finance & Accounts Team
Redes Creation Private Limited`
  },
  reminder_upcoming: {
    name: 'Upcoming Due Date Reminder (D-3 & D-1)',
    subject: 'Reminder: Invoice {invoice_number} is due soon',
    body: `Dear {client_name},

This is a courteous reminder that Invoice {invoice_number} with an outstanding balance of {currency} {balance_due} is scheduled for payment on {due_date}.

You can view invoice breakdown and make payment securely here:
{payment_link}

If you have already initiated this transfer, kindly reply with the transaction UTR number so we can update our records.

Warm regards,
Accounts Department
Redes Creation`
  },
  reminder_overdue: {
    name: 'Overdue Escalation Notice (D+3 to D+15)',
    subject: 'URGENT: Overdue Invoice {invoice_number} Notice',
    body: `Dear {client_name},

Our records indicate that Invoice {invoice_number} for {project}, having an outstanding balance of {currency} {balance_due}, was due on {due_date} and remains unsettled.

Please arrange for immediate clearance via our payment gateway or bank transfer:
{payment_link}

For any queries regarding this invoice, please reach out to us at accounts@redescreation.com.

Sincerely,
Credit Control & Billing
Redes Creation`
  },
  payment_receipt: {
    name: 'Payment Receipt Confirmation',
    subject: 'Payment Confirmation: Receipt {receipt_number} for Invoice {invoice_number}',
    body: `Dear {client_name},

We acknowledge with thanks the receipt of your payment of {currency} {amount_paid} against Invoice {invoice_number}.

Receipt Number: {receipt_number}
Transaction Reference: {transaction_id}
Remaining Balance: {currency} {remaining_balance}

Your updated official receipt is available in your client portal.

Thank you for your business!

Warm regards,
Redes Creation Finance Team`
  }
};

export function saveDatabase() {
  if (process.env.VERCEL) return; // Vercel is read-only serverless environment
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save database to disk:', err.message);
  }
}

export function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      // Migrate missing fields if needed
      let needsSave = false;
      if (!db.tax_rates || db.tax_rates.length === 0) {
        db.tax_rates = defaultTaxRates;
        needsSave = true;
      }
      if (!db.payment_methods || db.payment_methods.length === 0) {
        db.payment_methods = defaultPaymentMethods;
        needsSave = true;
      }
      if (!db.email_templates || Object.keys(db.email_templates).length === 0) {
        db.email_templates = defaultEmailTemplates;
        needsSave = true;
      }
      // Purge Employee role completely
      if (db.roles && db.roles.some(r => r.name === 'Employee')) {
        db.roles = db.roles.filter(r => r.name !== 'Employee');
        needsSave = true;
      }
      if (db.users && db.users.some(u => u.role === 'Employee' || u.email === 'rahul@redescreation.com')) {
        db.users = db.users.filter(u => u.role !== 'Employee' && u.email !== 'rahul@redescreation.com');
        needsSave = true;
      }
      if (db.users) {
        db.users.forEach(u => {
          if (!u.phone) {
            u.phone = u.role === 'CEO' ? '+91 98260 11001' : u.role === 'Finance/Admin' ? '+91 98260 22002' : u.role === 'Project Manager' ? '+91 98260 33003' : '+91 98260 44004';
            needsSave = true;
          }
          if (!u.designation) {
            u.designation = u.role === 'CEO' ? 'Chief Executive Officer' : u.role === 'Finance/Admin' ? 'Finance & Admin Lead' : u.role === 'Project Manager' ? 'Senior Project Manager' : 'Authorized Signatory / Director';
            needsSave = true;
          }
          if (!u.department) {
            u.department = u.role === 'Client' ? 'Procurement & Finance' : u.role === 'Project Manager' ? 'Client Delivery & Projects' : 'Finance & Corporate Accounts';
            needsSave = true;
          }
          if (['usr_ceo_1', 'usr_fin_1', 'usr_pm_1', 'usr_client_1'].includes(u.id) && u.status !== 'Active') {
            u.status = 'Active';
            needsSave = true;
          }
        });
      }
      // Ensure corporate financial settings match Image 2
      db.financial_settings = {
        company_name: 'Redes Creation IT & Digital Solutions',
        brand_short: 'RC',
        tagline: 'Building Brands Digitally',
        email: 'info@redescreation.com',
        phone: '+91 73540 05000',
        website: 'www.redescreation.com',
        gstin: '23AABCR8899K1Z0',
        pan: 'AABCR8899K',
        state: 'Madhya Pradesh',
        state_code: '23',
        address: '403, Aashirwad Complex, Geeta Bhawan Square, Indore, Madhya Pradesh, 452001, India',
        bank_name: 'HDFC Bank',
        account_name: 'Redes Creation',
        account_number: '50200012345678',
        ifsc: 'HDFC0001234',
        branch: 'Vijay Nagar, Indore',
        upi_id: 'redescreation@hdfcbank',
        require_approval_above: 100000,
        currency_symbol: '₹',
        financial_year: '2025-26'
      };
      needsSave = true;

      // Ensure ABC Technologies client exists
      if (!db.clients.some(c => c.id === 'cli_abc' || c.name === 'ABC Technologies')) {
        db.clients.unshift({
          id: 'cli_abc',
          name: 'ABC Technologies',
          company_name: 'ABC Technologies Pvt. Ltd.',
          contact_person: 'Mr. Rahul Sharma',
          email: 'rahul@abctech.com',
          phone: '+91 98260 12345',
          billing_address: '123, Business Park, Vijay Nagar, Indore, Madhya Pradesh, 452010, India',
          gstin: '23ABCDE1234F1Z5',
          pan: 'ABCDE1234F',
          state: 'Madhya Pradesh',
          state_code: '23',
          country: 'India',
          place_of_supply: 'Madhya Pradesh',
          currency: 'INR',
          default_payment_terms: '15 Days',
          default_due_days: 15,
          preferred_payment_method: 'Bank Transfer',
          status: 'Active',
          created_at: '2025-04-01T10:00:00.000Z'
        });
        needsSave = true;
      }

      // Ensure invoice RC/2025-26/INV/0001 exists as the primary invoice
      if (!db.invoices.some(i => i.invoice_number === 'RC/2025-26/INV/0001')) {
        db.invoices.unshift({
          id: 'inv_abc_1',
          invoice_number: 'RC/2025-26/INV/0001',
          client_id: 'cli_abc',
          project: 'Website Development',
          po_number: 'PO# 12345 (if any)',
          quotation_id: null,
          invoice_date: '15 Apr 2025',
          due_date: '30 Apr 2025',
          payment_terms: '15 Days',
          currency: 'INR',
          subtotal: 70000,
          discount_total: 5000,
          taxable_amount: 65000,
          tax_total: 11700,
          cgst_rate: 9,
          cgst_amount: 5850,
          sgst_rate: 9,
          sgst_amount: 5850,
          igst_rate: 0,
          igst_amount: 0,
          total: 76700,
          amount_paid: 0,
          amount_due: 76700,
          status: 'Sent',
          secure_token: 'tok_sec_inv_0001_abc',
          notes: 'Custom responsive website design and development with CMS, SEO setup and content structuring.',
          created_by: 'Nitin Kumar',
          created_at: '2025-04-15T10:00:00.000Z'
        });

        // Add matching items
        db.invoice_items.unshift(
          {
            id: 'item_abc_1',
            invoice_id: 'inv_abc_1',
            product_service: 'Website Development',
            description: 'Custom responsive website design and development with CMS',
            hsn_sac: '998313',
            quantity: 1,
            unit: 'Nos',
            rate: 50000,
            discount: 5000,
            taxable_amount: 45000,
            tax_rate: 18,
            tax_amount: 8100,
            total: 45000
          },
          {
            id: 'item_abc_2',
            invoice_id: 'inv_abc_1',
            product_service: 'SEO Setup & Optimization',
            description: 'On-page SEO, meta setup and technical optimization',
            hsn_sac: '998393',
            quantity: 1,
            unit: 'Nos',
            rate: 15000,
            discount: 0,
            taxable_amount: 15000,
            tax_rate: 18,
            tax_amount: 2700,
            total: 15000
          },
          {
            id: 'item_abc_3',
            invoice_id: 'inv_abc_1',
            product_service: 'Content Support',
            description: 'Content structuring and basic content upload (up to 10 pages)',
            hsn_sac: '998313',
            quantity: 1,
            unit: 'Nos',
            rate: 10000,
            discount: 0,
            taxable_amount: 10000,
            tax_rate: 18,
            tax_amount: 1800,
            total: 10000
          }
        );
        needsSave = true;
      }

      // Ensure ABC Technologies receipt exists
      if (!db.receipts) db.receipts = [];
      if (!db.receipts.some(r => r.receipt_number === 'RC/2025-26/REC/0001')) {
        db.receipts.unshift({
          id: 'rec_abc_1',
          receipt_number: 'RC/2025-26/REC/0001',
          payment_id: 'pay_abc_1',
          invoice_id: 'inv_abc_1',
          invoice_number: 'RC/2025-26/INV/0001',
          client_id: 'cli_abc',
          client_name: 'ABC Technologies Pvt. Ltd.',
          payment_date: '2025-04-20',
          amount_received: 76700,
          payment_method: 'UPI / Bank Transfer',
          transaction_id: 'HDFC/20250420/88921',
          remaining_balance: 0,
          created_at: '2025-04-20T11:00:00.000Z'
        });
        needsSave = true;
      }

      // Ensure ABC Technologies quotation exists
      if (!db.quotations) db.quotations = [];
      if (!db.quotations.some(q => q.quotation_number === 'RC/2025-26/QT/0001')) {
        db.quotations.unshift({
          id: 'quot_abc_1',
          quotation_number: 'RC/2025-26/QT/0001',
          client_id: 'cli_abc',
          client_name: 'ABC Technologies Pvt. Ltd.',
          project: 'Website Development & SEO Setup',
          date: '2025-04-05',
          valid_until: '2025-04-20',
          subtotal: 70000,
          discount: 5000,
          taxable_amount: 65000,
          tax: 11700,
          total: 76700,
          status: 'Accepted',
          converted_invoice_id: 'inv_abc_1',
          notes: 'Scope includes custom responsive CMS web architecture, technical SEO optimization, and content structuring.',
          items: [
            {
              product_service: 'Website Development',
              description: 'Custom responsive website design and development with CMS',
              hsn_sac: '998313',
              quantity: 1,
              unit: 'Nos',
              rate: 50000,
              discount: 5000,
              taxable_amount: 45000,
              tax_rate: 18,
              tax_amount: 8100,
              total: 45000
            },
            {
              product_service: 'SEO Setup & Optimization',
              description: 'On-page SEO, meta setup and technical optimization',
              hsn_sac: '998393',
              quantity: 1,
              unit: 'Nos',
              rate: 15000,
              discount: 0,
              taxable_amount: 15000,
              tax_rate: 18,
              tax_amount: 2700,
              total: 15000
            },
            {
              product_service: 'Content Support',
              description: 'Content structuring and basic content upload (up to 10 pages)',
              hsn_sac: '998313',
              quantity: 1,
              unit: 'Nos',
              rate: 10000,
              discount: 0,
              taxable_amount: 10000,
              tax_rate: 18,
              tax_amount: 1800,
              total: 10000
            }
          ],
          created_at: '2025-04-05T09:30:00.000Z'
        });
        needsSave = true;
      }

      // Ensure ABC Technologies payment link exists
      if (!db.payment_links) db.payment_links = [];
      if (!db.payment_links.some(p => p.token === 'tok_sec_inv_0001_abc')) {
        db.payment_links.unshift({
          id: 'link_abc_1',
          token: 'tok_sec_inv_0001_abc',
          client_id: 'cli_abc',
          client_name: 'ABC Technologies Pvt. Ltd.',
          invoice_id: 'inv_abc_1',
          amount: 76700,
          purpose: 'Website Development & SEO Setup',
          description: 'Payment settlement for Invoice RC/2025-26/INV/0001',
          expiry_date: '2025-05-15',
          status: 'Active',
          created_at: '2025-04-15T10:00:00.000Z'
        });
        needsSave = true;
      }

      if (needsSave) {
        saveDatabase();
      }
      return;
    } catch (e) {
      console.warn('Corrupted database file, re-initializing seeds...');
    }
  }
  seedDatabase();
  saveDatabase();
}

export function getDb() {
  return db;
}

export function seedDatabase() {
  console.log('Seeding Redes Creation ERP Finance Database...');
  
  // 1. Roles (CEO, Finance/Admin, Project Manager, Client)
  const roles = [
    { id: 1, name: ROLES.CEO, description: 'Chief Executive Officer - Full financial & administrative access' },
    { id: 2, name: ROLES.FINANCE_ADMIN, description: 'Finance / Accounts Admin - Billing, payments, reconciliation & reporting' },
    { id: 3, name: ROLES.PROJECT_MANAGER, description: 'Project Manager - Project billing, request invoices, check status' },
    { id: 4, name: ROLES.CLIENT, description: 'Client User - View own invoices, receipts, and make payments' }
  ];

  // 2. Permissions
  const permissions = Object.entries(PERMISSIONS).map(([key, val], idx) => ({
    id: idx + 1,
    code: val,
    name: key.replace(/_/g, ' ')
  }));

  // 3. Role Permissions
  const role_permissions = [];
  let rpId = 1;
  roles.forEach(role => {
    const permCodes = ROLE_PERMISSIONS_MAP[role.name] || [];
    permCodes.forEach(code => {
      const p = permissions.find(x => x.code === code);
      if (p) {
        role_permissions.push({
          id: rpId++,
          role_id: role.id,
          permission_id: p.id
        });
      }
    });
  });

  // 4. Users (Demo credentials for testing every role instantly)
  const users = [
    {
      id: 'usr_ceo_1',
      name: 'Nitin Kumar',
      email: 'nitin@redescreation.com',
      phone: '+91 98260 11001',
      designation: 'Chief Executive Officer',
      department: 'Executive Management',
      initials: 'NK',
      role: ROLES.CEO,
      role_id: 1,
      status: 'Active',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr_fin_1',
      name: 'Chirag Malviya',
      email: 'chirag@redescreation.com',
      phone: '+91 98260 22002',
      designation: 'Finance & Admin Lead',
      department: 'Finance & Accounts',
      initials: 'CM',
      role: ROLES.FINANCE_ADMIN,
      role_id: 2,
      status: 'Active',
      created_at: '2026-01-05T00:00:00.000Z'
    },
    {
      id: 'usr_pm_1',
      name: 'Priya Sharma',
      email: 'priya@redescreation.com',
      phone: '+91 98260 33003',
      designation: 'Senior Project Manager',
      department: 'Client Delivery & Projects',
      initials: 'PS',
      role: ROLES.PROJECT_MANAGER,
      role_id: 3,
      status: 'Active',
      created_at: '2026-02-10T00:00:00.000Z'
    },
    {
      id: 'usr_client_1',
      name: 'Rajesh Singhania',
      email: 'billing@northstarlabs.in',
      phone: '+91 98260 44004',
      designation: 'Authorized Signatory / Director',
      department: 'Procurement & Finance',
      initials: 'RS',
      role: ROLES.CLIENT,
      role_id: 4,
      client_id: 'cli_1',
      status: 'Active',
      created_at: '2026-04-15T00:00:00.000Z'
    }
  ];

  // 5. Clients & Billing Profiles
  const clients = [
    {
      id: 'cli_1',
      name: 'Northstar Labs Pvt. Ltd.',
      company_name: 'Northstar Labs Private Limited',
      contact_person: 'Rajesh Singhania',
      email: 'billing@northstarlabs.in',
      phone: '+91 98200 45678',
      billing_address: 'Plot 42, Electronics City Phase 1, Bangalore, Karnataka - 560100',
      gstin: '29ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      state: 'Karnataka',
      country: 'India',
      place_of_supply: '29-Karnataka',
      currency: 'INR',
      default_payment_terms: '15 Days',
      default_due_days: 15,
      preferred_payment_method: 'Bank Transfer',
      created_at: '2026-04-10T10:00:00.000Z'
    },
    {
      id: 'cli_2',
      name: 'Pinecone Health',
      company_name: 'Pinecone Healthcare Technologies LLP',
      contact_person: 'Dr. Ananya Roy',
      email: 'finance@pineconehealth.com',
      phone: '+91 97110 99881',
      billing_address: 'Tower B, DLF Cyber City, Gurugram, Haryana - 122002',
      gstin: '06AAACP5678Q1Z3',
      pan: 'AAACP5678Q',
      state: 'Haryana',
      country: 'India',
      place_of_supply: '06-Haryana',
      currency: 'INR',
      default_payment_terms: 'Immediate',
      default_due_days: 0,
      preferred_payment_method: 'Payment Gateway',
      created_at: '2026-05-15T11:30:00.000Z'
    },
    {
      id: 'cli_3',
      name: 'Apex Retail Ventures',
      company_name: 'Apex Omnichannel Retail Solutions Pvt Ltd',
      contact_person: 'Vikram Merchant',
      email: 'accounts@apexretail.co.in',
      phone: '+91 98450 11223',
      billing_address: '102, Bandra Kurla Complex, Mumbai, Maharashtra - 400051',
      gstin: '27AABCA9012R1Z8',
      pan: 'AABCA9012R',
      state: 'Maharashtra',
      country: 'India',
      place_of_supply: '27-Maharashtra',
      currency: 'INR',
      default_payment_terms: '30 Days',
      default_due_days: 30,
      preferred_payment_method: 'UPI',
      created_at: '2026-06-01T09:00:00.000Z'
    }
  ];

  // 6. Settings & Sequences
  const financial_settings = {
    company_name: 'Redes Creation IT & Digital Solutions',
    brand_short: 'RC',
    email: 'accounts@redescreation.com',
    phone: '+91 98765 43210',
    website: 'https://redescreation.com',
    gstin: '23AABCR8899K1Z0',
    pan: 'AABCR8899K',
    state: 'Madhya Pradesh',
    state_code: '23',
    address: 'Suite 405, Sapphire Towers, Ring Road, Indore, MP - 452010',
    bank_name: 'HDFC Bank Ltd',
    account_name: 'Redes Creation Private Limited',
    account_number: '50200088991122',
    ifsc: 'HDFC0001234',
    branch: 'Vijay Nagar, Indore',
    upi_id: 'redescreation@hdfcbank',
    require_approval_above: 100000,
    currency_symbol: '₹',
    financial_year: '2026-27'
  };

  const invoice_number_sequences = {
    invoice: { prefix: 'RC/2026-27/INV/', next: 9 },
    receipt: { prefix: 'RC/2026-27/REC/', next: 4 },
    credit_note: { prefix: 'RC/2026-27/CN/', next: 2 },
    payment_link: { prefix: 'RC/2026-27/PL/', next: 2 }
  };

  // 7. Invoices (Initial sample set with realistic statuses and totals)
  const invoices = [
    {
      id: 'inv_4',
      invoice_number: 'RC/2026-27/INV/0004',
      client_id: 'cli_1',
      project: 'E-Commerce Portal Revamp',
      quotation_id: 'quot_1',
      invoice_date: '2026-07-05',
      due_date: '2026-07-20',
      payment_terms: '15 Days',
      currency: 'INR',
      subtotal: 75000,
      discount: 0,
      tax_total: 13500,
      total: 88500,
      amount_paid: 88500,
      amount_due: 0,
      status: 'Paid',
      secure_token: 'tok_sec_inv_0004_nstar',
      notes: 'Phase 1 Milestone Completion Invoice',
      created_by: 'Chirag Malviya',
      created_at: '2026-07-05T10:00:00.000Z'
    },
    {
      id: 'inv_5',
      invoice_number: 'RC/2026-27/INV/0005',
      client_id: 'cli_2',
      project: 'Tele-Health Consultation Web App',
      quotation_id: null,
      invoice_date: '2026-08-15',
      due_date: '2026-08-22',
      payment_terms: '7 Days',
      currency: 'INR',
      subtotal: 28000,
      discount: 0,
      tax_total: 5040,
      total: 33040,
      amount_paid: 33040,
      amount_due: 0,
      status: 'Paid',
      secure_token: 'tok_sec_inv_0005_pinec',
      notes: 'Cloud Infrastructure & API Setup',
      created_by: 'Chirag Malviya',
      created_at: '2026-08-15T11:00:00.000Z'
    },
    {
      id: 'inv_8',
      invoice_number: 'RC/2026-27/INV/0008',
      client_id: 'cli_1',
      project: 'ERP Custom Inventory Integrations',
      quotation_id: 'quot_2',
      invoice_date: '2026-08-20',
      due_date: '2026-09-04',
      payment_terms: '15 Days',
      currency: 'INR',
      subtotal: 100000,
      discount: 0,
      tax_total: 18000,
      total: 118000,
      amount_paid: 70000,
      amount_due: 48000,
      status: 'Partially Paid',
      secure_token: 'tok_sec_inv_0008_nstar_milestone',
      notes: 'Milestone 2: Payment ₹70,000 received via HDFC bank transfer',
      created_by: 'Chirag Malviya',
      created_at: '2026-08-20T09:30:00.000Z'
    },
    {
      id: 'inv_9',
      invoice_number: 'RC/2026-27/INV/0009',
      client_id: 'cli_3',
      project: 'Apex Omnichannel Point-of-Sale UI',
      quotation_id: null,
      invoice_date: '2026-09-01',
      due_date: '2026-09-15',
      payment_terms: '15 Days',
      currency: 'INR',
      subtotal: 125000,
      discount: 0,
      tax_total: 22500,
      total: 147500,
      amount_paid: 0,
      amount_due: 147500,
      status: 'Overdue',
      secure_token: 'tok_sec_inv_0009_apex_pos',
      notes: 'Initial Retainer for Q3 Sprint',
      created_by: 'Chirag Malviya',
      created_at: '2026-09-01T14:15:00.000Z'
    }
  ];

  // 8. Invoice Line Items
  const invoice_items = [
    {
      id: 'item_1',
      invoice_id: 'inv_8',
      product_service: 'Custom ERP Backend Modules',
      description: 'Inventory, Order Management & Webhook Sync',
      quantity: 1,
      unit: 'Milestone',
      rate: 100000,
      discount: 0,
      taxable_amount: 100000,
      tax_rate: 18,
      tax_amount: 18000,
      total: 118000
    },
    {
      id: 'item_2',
      invoice_id: 'inv_5',
      product_service: 'Tele-Health Consultation Portal',
      description: 'WebRTC video integration and server setup',
      quantity: 1,
      unit: 'Service',
      rate: 28000,
      discount: 0,
      taxable_amount: 28000,
      tax_rate: 18,
      tax_amount: 5040,
      total: 33040
    },
    {
      id: 'item_3',
      invoice_id: 'inv_4',
      product_service: 'E-Commerce React Frontend Development',
      description: 'Phase 1 catalog, cart and checkout flow',
      quantity: 1,
      unit: 'Milestone',
      rate: 75000,
      discount: 0,
      taxable_amount: 75000,
      tax_rate: 18,
      tax_amount: 13500,
      total: 88500
    }
  ];

  // 9. Payments (Directly matching the screenshot items!)
  const payments = [
    {
      id: 'pay_1',
      reference: 'HDFC/0904/7712',
      invoice_id: 'inv_8',
      invoice_number: 'RC/2026-27/INV/0008',
      client_id: 'cli_1',
      client_name: 'Northstar Labs Pvt. Ltd.',
      payment_date: '2026-09-04',
      payment_date_formatted: '04 Sept 2026',
      method: 'Bank Transfer',
      amount: 70000,
      verification_status: 'Verified', // Shows "Mark verified" / Verified
      bank_name: 'HDFC Bank',
      cheque_number: '',
      notes: 'NEFT transfer ref 09047712 received in account',
      received_by: 'Chirag Malviya',
      created_at: '2026-09-04T12:00:00.000Z'
    },
    {
      id: 'pay_2',
      reference: 'razorpay_8F2K9L',
      invoice_id: 'inv_5',
      invoice_number: 'RC/2026-27/INV/0005',
      client_id: 'cli_2',
      client_name: 'Pinecone Health',
      payment_date: '2026-08-22',
      payment_date_formatted: '22 Aug 2026',
      method: 'Payment Gateway',
      amount: 33040,
      verification_status: 'Reconciled', // Shows "Reconciled" badge
      bank_name: 'Razorpay Auto Settlement',
      cheque_number: '',
      notes: 'Online payment via Payment Gateway webhook callback',
      received_by: 'System Webhook',
      created_at: '2026-08-22T16:20:00.000Z'
    },
    {
      id: 'pay_3',
      reference: 'ICICI/0720/4421',
      invoice_id: 'inv_4',
      invoice_number: 'RC/2026-27/INV/0004',
      client_id: 'cli_1',
      client_name: 'Northstar Labs Pvt. Ltd.',
      payment_date: '2026-07-20',
      payment_date_formatted: '20 Jul 2026',
      method: 'Bank Transfer',
      amount: 88500,
      verification_status: 'Reconciled', // Shows "Reconciled" badge
      bank_name: 'ICICI Bank',
      cheque_number: '',
      notes: 'RTGS clearance against full invoice 0004',
      received_by: 'Chirag Malviya',
      created_at: '2026-07-20T11:15:00.000Z'
    }
  ];

  // 10. Receipts
  const receipts = [
    {
      id: 'rec_1',
      receipt_number: 'RC/2026-27/REC/0001',
      payment_id: 'pay_3',
      invoice_id: 'inv_4',
      invoice_number: 'RC/2026-27/INV/0004',
      client_id: 'cli_1',
      client_name: 'Northstar Labs Pvt. Ltd.',
      payment_date: '2026-07-20',
      amount_received: 88500,
      payment_method: 'Bank Transfer',
      transaction_id: 'ICICI/0720/4421',
      remaining_balance: 0,
      created_at: '2026-07-20T11:20:00.000Z'
    },
    {
      id: 'rec_2',
      receipt_number: 'RC/2026-27/REC/0002',
      payment_id: 'pay_2',
      invoice_id: 'inv_5',
      invoice_number: 'RC/2026-27/INV/0005',
      client_id: 'cli_2',
      client_name: 'Pinecone Health',
      payment_date: '2026-08-22',
      amount_received: 33040,
      payment_method: 'Payment Gateway',
      transaction_id: 'razorpay_8F2K9L',
      remaining_balance: 0,
      created_at: '2026-08-22T16:22:00.000Z'
    },
    {
      id: 'rec_3',
      receipt_number: 'RC/2026-27/REC/0003',
      payment_id: 'pay_1',
      invoice_id: 'inv_8',
      invoice_number: 'RC/2026-27/INV/0008',
      client_id: 'cli_1',
      client_name: 'Northstar Labs Pvt. Ltd.',
      payment_date: '2026-09-04',
      amount_received: 70000,
      payment_method: 'Bank Transfer',
      transaction_id: 'HDFC/0904/7712',
      remaining_balance: 48000,
      created_at: '2026-09-04T12:05:00.000Z'
    }
  ];

  // 11. Quotations
  const quotations = [
    {
      id: 'quot_1',
      quotation_number: 'RC/2026-27/QT/0001',
      client_id: 'cli_1',
      client_name: 'Northstar Labs Pvt. Ltd.',
      project: 'E-Commerce Portal Revamp',
      date: '2026-06-25',
      valid_until: '2026-07-15',
      total: 88500,
      status: 'Converted',
      converted_invoice_id: 'inv_4',
      created_at: '2026-06-25T10:00:00.000Z'
    },
    {
      id: 'quot_2',
      quotation_number: 'RC/2026-27/QT/0002',
      client_id: 'cli_1',
      client_name: 'Northstar Labs Pvt. Ltd.',
      project: 'ERP Custom Inventory Integrations',
      date: '2026-08-10',
      valid_until: '2026-08-25',
      total: 118000,
      status: 'Converted',
      converted_invoice_id: 'inv_8',
      created_at: '2026-08-10T11:00:00.000Z'
    },
    {
      id: 'quot_3',
      quotation_number: 'RC/2026-27/QT/0003',
      client_id: 'cli_3',
      client_name: 'Apex Retail Ventures',
      project: 'Mobile POS App (iOS & Android)',
      date: '2026-09-18',
      valid_until: '2026-10-05',
      total: 236000,
      status: 'Accepted', // Ready for "Convert to Invoice"
      converted_invoice_id: null,
      created_at: '2026-09-18T15:30:00.000Z'
    }
  ];

  // 12. Credit Notes
  const credit_notes = [
    {
      id: 'cn_1',
      credit_note_number: 'RC/2026-27/CN/0001',
      invoice_id: 'inv_4',
      invoice_number: 'RC/2026-27/INV/0004',
      client_id: 'cli_1',
      client_name: 'Northstar Labs Pvt. Ltd.',
      date: '2026-07-25',
      amount: 5000,
      reason: 'Billing correction - Early payment discount adjustment',
      status: 'Issued',
      created_by: 'Chirag Malviya',
      created_at: '2026-07-25T14:00:00.000Z'
    }
  ];

  // 13. Payment Reminders Configuration & Logs
  const payment_reminders = [
    {
      id: 'rem_rule_1',
      stage: 'D-3',
      title: '3 Days Before Due Date',
      enabled: true,
      auto_send: true
    },
    {
      id: 'rem_rule_2',
      stage: 'D-1',
      title: '1 Day Before Due Date',
      enabled: true,
      auto_send: true
    },
    {
      id: 'rem_rule_3',
      stage: 'Due Date',
      title: 'On Due Date',
      enabled: true,
      auto_send: true
    },
    {
      id: 'rem_rule_4',
      stage: 'D+3',
      title: '3 Days After Due Date (Overdue)',
      enabled: true,
      auto_send: true
    },
    {
      id: 'rem_rule_5',
      stage: 'D+7',
      title: '7 Days After Due Date (Overdue)',
      enabled: true,
      auto_send: true
    },
    {
      id: 'rem_rule_6',
      stage: 'D+15',
      title: '15 Days After Due Date (Final Reminder & CEO Escalation)',
      enabled: true,
      auto_send: true
    }
  ];

  // 14. Recurring Invoices
  const recurring_invoices = [
    {
      id: 'rec_inv_1',
      client_id: 'cli_2',
      client_name: 'Pinecone Health',
      service: 'Cloud Hosting & Security Maintenance',
      amount: 15000,
      frequency: 'Monthly',
      next_run: '2026-10-01',
      status: 'Active',
      auto_send: true
    },
    {
      id: 'rec_inv_2',
      client_id: 'cli_1',
      client_name: 'Northstar Labs Pvt. Ltd.',
      service: 'Annual Maintenance Contract (AMC)',
      amount: 45000,
      frequency: 'Quarterly',
      next_run: '2026-10-15',
      status: 'Active',
      auto_send: false
    }
  ];

  // 15. Standalone Payment Links
  const payment_links = [
    {
      id: 'pl_1',
      code: 'RC/2026-27/PL/0001',
      client_id: 'cli_3',
      client_name: 'Apex Retail Ventures',
      amount: 50000,
      purpose: 'Website Development Advance',
      description: '50% advance for sprint launch',
      expiry_date: '2026-10-10',
      token: 'tok_link_advance_apex_50k',
      status: 'Active',
      created_at: '2026-09-20T10:00:00.000Z'
    }
  ];

  // 16. Audit Logs
  const invoice_activity_logs = [
    {
      id: 'log_1',
      entity_type: 'Invoice',
      entity_id: 'inv_8',
      entity_ref: 'RC/2026-27/INV/0008',
      user: 'Chirag Malviya',
      role: 'Finance/Admin',
      action: 'Invoice Created',
      details: 'Invoice created for ₹1,18,000 from Quotation QT/0002',
      timestamp: '2026-08-20 09:30 AM',
      ip: '192.168.1.15'
    },
    {
      id: 'log_2',
      entity_type: 'Invoice',
      entity_id: 'inv_8',
      entity_ref: 'RC/2026-27/INV/0008',
      user: 'Chirag Malviya',
      role: 'Finance/Admin',
      action: 'Invoice Sent',
      details: 'Sent email to billing@northstarlabs.in with PDF & payment link',
      timestamp: '2026-08-20 09:32 AM',
      ip: '192.168.1.15'
    },
    {
      id: 'log_3',
      entity_type: 'Invoice',
      entity_id: 'inv_8',
      entity_ref: 'RC/2026-27/INV/0008',
      user: 'Rajesh Singhania (Client)',
      role: 'Client',
      action: 'Invoice Viewed',
      details: 'Client viewed invoice via secure link',
      timestamp: '2026-08-20 11:05 AM',
      ip: '103.45.12.88'
    },
    {
      id: 'log_4',
      entity_type: 'Payment',
      entity_id: 'pay_1',
      entity_ref: 'HDFC/0904/7712',
      user: 'Chirag Malviya',
      role: 'Finance/Admin',
      action: 'Payment ₹70,000 Received',
      details: 'Manual Bank Transfer recorded. Status updated to Partially Paid.',
      timestamp: '2026-09-04 12:00 PM',
      ip: '192.168.1.15'
    },
    {
      id: 'log_5',
      entity_type: 'Receipt',
      entity_id: 'rec_3',
      entity_ref: 'RC/2026-27/REC/0003',
      user: 'System',
      role: 'System',
      action: 'Receipt Generated',
      details: 'Receipt generated for ₹70,000 against INV/0008',
      timestamp: '2026-09-04 12:05 PM',
      ip: '127.0.0.1'
    }
  ];

  db = {
    roles,
    permissions,
    role_permissions,
    users,
    clients,
    financial_settings,
    invoice_number_sequences,
    invoices,
    invoice_items,
    invoice_taxes: [],
    payments,
    payment_transactions: [],
    payment_allocations: [],
    receipts,
    credit_notes,
    credit_note_items: [],
    quotations,
    quotation_items: [],
    payment_reminders,
    recurring_invoices,
    recurring_invoice_items: [],
    payment_links,
    invoice_activity_logs,
    email_logs: [],
    invoice_views: [],
    tax_rates: defaultTaxRates,
    payment_methods: defaultPaymentMethods,
    email_templates: defaultEmailTemplates
  };

  saveDatabase();
}

// Initialize on load
loadDatabase();
