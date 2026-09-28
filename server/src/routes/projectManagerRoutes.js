import express from 'express';
import { getDb, saveDatabase } from '../config/db.js';
import { authenticateToken, requireRoles, requirePermission } from '../middleware/auth.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';
import { getNextDocumentNumber } from '../services/numberSequenceService.js';
import { calculateInvoiceTaxes } from '../services/taxService.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET PM Project Billing Overview
router.get('/project-billing', authenticateToken, (req, res) => {
  const db = getDb();

  // Aggregate project billing data
  const projectsMap = {};

  db.invoices.forEach(inv => {
    const projName = inv.project || 'General Services';
    if (!projectsMap[projName]) {
      const client = db.clients.find(c => c.id === inv.client_id);
      projectsMap[projName] = {
        name: projName,
        client_name: client?.name || 'Client',
        client_id: inv.client_id,
        invoiced: 0,
        received: 0,
        pending: 0,
        overdue: 0,
        invoice_count: 0,
        invoices: []
      };
    }

    if (inv.status !== 'Cancelled') {
      projectsMap[projName].invoiced += inv.total || 0;
      projectsMap[projName].received += inv.amount_paid || 0;
      projectsMap[projName].pending += inv.amount_due || 0;
      if (inv.status === 'Overdue') {
        projectsMap[projName].overdue += inv.amount_due || 0;
      }
    }
    projectsMap[projName].invoice_count++;
    projectsMap[projName].invoices.push({
      id: inv.id,
      number: inv.invoice_number,
      amount: inv.total,
      paid: inv.amount_paid,
      due: inv.amount_due,
      status: inv.status,
      due_date: inv.due_date
    });
  });

  const projects = Object.values(projectsMap);
  const requests = db.invoice_requests || [];

  res.json({
    success: true,
    projects,
    requests
  });
});

// POST PM submits Invoice Request
router.post('/request-invoice', authenticateToken, requirePermission(PERMISSIONS.INVOICE_REQUEST), (req, res) => {
  const db = getDb();
  const { client_id, project, milestone_name, amount, notes } = req.body;

  const client = db.clients.find(c => c.id === client_id);
  if (!client) return res.status(400).json({ success: false, message: 'Valid client is required.' });

  if (!db.invoice_requests) db.invoice_requests = [];

  const reqId = `req_${uuidv4().substring(0, 8)}`;
  const newRequest = {
    id: reqId,
    client_id: client.id,
    client_name: client.name,
    project: project || 'Milestone Delivery',
    milestone_name: milestone_name || 'Sprint Milestone Delivery',
    amount: parseFloat(amount || 0),
    notes: notes || '',
    requested_by: req.user.name,
    status: 'Pending Finance Action',
    created_at: new Date().toISOString()
  };

  db.invoice_requests.unshift(newRequest);

  logActivity({
    entity_type: 'Invoice Request',
    entity_id: reqId,
    entity_ref: milestone_name,
    user: req.user.name,
    role: req.user.role,
    action: 'Invoice Requested by Project Manager',
    details: `PM ${req.user.name} requested tax invoice for ${client.name} (Project: ${project}, Amount: ₹${newRequest.amount.toLocaleString('en-IN')})`,
    ip: req.ip
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Invoice request sent to Finance/Admin successfully!',
    request: newRequest
  });
});

// POST Finance/Admin approves PM invoice request and generates official invoice
router.post('/approve-request/:id', authenticateToken, requirePermission(PERMISSIONS.INVOICE_CREATE), async (req, res) => {
  const db = getDb();
  if (!db.invoice_requests) db.invoice_requests = [];

  const request = db.invoice_requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  const client = db.clients.find(c => c.id === request.client_id);
  const invoiceNumber = await getNextDocumentNumber('invoice');
  const invoiceId = `inv_${uuidv4().substring(0, 8)}`;
  const secure_token = `tok_${uuidv4().replace(/-/g, '')}`;

  const baseRate = Math.round((request.amount / 1.18) * 100) / 100;
  const items = [
    {
      id: `item_${uuidv4().substring(0, 8)}`,
      product_service: request.milestone_name,
      description: `Project: ${request.project}. Approved from PM Request. ${request.notes}`,
      quantity: 1,
      unit: 'Milestone',
      rate: baseRate,
      discount: 0,
      tax_rate: 18
    }
  ];

  const taxSummary = calculateInvoiceTaxes(items, client?.place_of_supply || '');

  const newInvoice = {
    id: invoiceId,
    invoice_number: invoiceNumber,
    client_id: request.client_id,
    project: request.project,
    quotation_id: null,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    payment_terms: '15 Days',
    currency: 'INR',
    subtotal: taxSummary.subtotal,
    discount: 0,
    taxable_amount: taxSummary.taxable_amount,
    tax_total: taxSummary.tax_total,
    cgst_total: taxSummary.cgstTotal,
    sgst_total: taxSummary.sgstTotal,
    igst_total: taxSummary.igstTotal,
    total: taxSummary.total,
    amount_paid: 0,
    amount_due: taxSummary.total,
    status: 'Sent',
    secure_token,
    notes: `Generated from Project Manager milestone request.`,
    created_by: req.user.name,
    created_at: new Date().toISOString()
  };

  db.invoices.unshift(newInvoice);

  taxSummary.processedItems.forEach(it => {
    db.invoice_items.push({ ...it, invoice_id: invoiceId });
  });

  request.status = 'Approved & Invoiced';
  request.generated_invoice_number = invoiceNumber;
  request.generated_invoice_id = invoiceId;

  logActivity({
    entity_type: 'Invoice',
    entity_id: invoiceId,
    entity_ref: invoiceNumber,
    user: req.user.name,
    role: req.user.role,
    action: 'PM Invoice Request Approved',
    details: `Finance Admin approved request from ${request.requested_by} and generated official invoice ${invoiceNumber} for ₹${newInvoice.total.toLocaleString('en-IN')}`,
    ip: req.ip
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: `Generated official invoice ${invoiceNumber} from PM milestone request!`,
    invoice: newInvoice
  });
});

export default router;
