import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/constants.js';

const router = express.Router();

// 1. GET Aging Report (0-30, 31-60, 61-90, 90+ days overdue per PRD Section 35)
router.get('/aging', authenticateToken, requirePermission(PERMISSIONS.REPORT_VIEW), (req, res) => {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = {
    current: { label: 'Not Due / Current (0-30 Days)', count: 0, amount: 0, items: [] },
    d31_60: { label: '31–60 Days Overdue', count: 0, amount: 0, items: [] },
    d61_90: { label: '61–90 Days Overdue', count: 0, amount: 0, items: [] },
    d90_plus: { label: '90+ Days Critical Overdue', count: 0, amount: 0, items: [] }
  };

  db.invoices.forEach(inv => {
    if (inv.amount_due <= 0 || inv.status === 'Cancelled' || inv.status === 'Draft') return;

    const dueDate = new Date(inv.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const client = db.clients.find(c => c.id === inv.client_id);

    const row = {
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: client?.name || 'Client',
      due_date: inv.due_date,
      days_overdue: Math.max(0, diffDays),
      amount_due: inv.amount_due,
      total: inv.total
    };

    if (diffDays <= 30) {
      buckets.current.count++;
      buckets.current.amount += inv.amount_due;
      buckets.current.items.push(row);
    } else if (diffDays <= 60) {
      buckets.d31_60.count++;
      buckets.d31_60.amount += inv.amount_due;
      buckets.d31_60.items.push(row);
    } else if (diffDays <= 90) {
      buckets.d61_90.count++;
      buckets.d61_90.amount += inv.amount_due;
      buckets.d61_90.items.push(row);
    } else {
      buckets.d90_plus.count++;
      buckets.d90_plus.amount += inv.amount_due;
      buckets.d90_plus.items.push(row);
    }
  });

  res.json({ success: true, aging: buckets });
});

// 2. GET GST Compliance & Tax Report (PRD Section 8 & 35)
router.get('/gst', authenticateToken, requirePermission(PERMISSIONS.REPORT_VIEW), (req, res) => {
  const db = getDb();
  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalGST = 0;

  const entries = db.invoices
    .filter(i => i.status !== 'Cancelled' && i.status !== 'Draft')
    .map(inv => {
      const taxable = inv.taxable_amount || (inv.subtotal - (inv.discount || 0));
      const cgst = inv.cgst_total || 0;
      const sgst = inv.sgst_total || 0;
      const igst = inv.igst_total || inv.tax_total || 0;
      const gst = inv.tax_total || 0;

      totalTaxable += taxable;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;
      totalGST += gst;

      const client = db.clients.find(c => c.id === inv.client_id);

      return {
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        client_name: client?.name,
        gstin: client?.gstin || 'Unregistered',
        place_of_supply: client?.place_of_supply || 'N/A',
        taxable_amount: Math.round(taxable),
        cgst: Math.round(cgst),
        sgst: Math.round(sgst),
        igst: Math.round(igst),
        total_gst: Math.round(gst),
        invoice_total: inv.total
      };
    });

  res.json({
    success: true,
    summary: {
      totalTaxable: Math.round(totalTaxable),
      totalCGST: Math.round(totalCGST),
      totalSGST: Math.round(totalSGST),
      totalIGST: Math.round(totalIGST),
      totalGST: Math.round(totalGST)
    },
    entries
  });
});

// 3. GET Collections by Payment Instrument (PRD Section 35)
router.get('/collections', authenticateToken, requirePermission(PERMISSIONS.REPORT_VIEW), (req, res) => {
  const db = getDb();
  const byMethod = {};
  let grandTotal = 0;

  db.payments.forEach(p => {
    grandTotal += p.amount;
    byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
  });

  res.json({
    success: true,
    totalCollected: Math.round(grandTotal * 100) / 100,
    byMethod,
    payments: db.payments
  });
});

// 4. GET Outstanding Invoices Report (PRD Section 35)
router.get('/outstanding', authenticateToken, requirePermission(PERMISSIONS.REPORT_VIEW), (req, res) => {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const outstandingInvoices = db.invoices
    .filter(i => i.amount_due > 0 && i.status !== 'Cancelled' && i.status !== 'Draft')
    .map(inv => {
      const client = db.clients.find(c => c.id === inv.client_id);
      const dueDate = new Date(inv.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let overdueCategory = 'Current / Not Due';
      if (diffDays > 90) overdueCategory = '90+ Days Critical';
      else if (diffDays > 60) overdueCategory = '61-90 Days';
      else if (diffDays > 30) overdueCategory = '31-60 Days';
      else if (diffDays > 0) overdueCategory = '1-30 Days Overdue';

      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_id: inv.client_id,
        client_name: client?.name || 'Client',
        contact_person: client?.contact_person || 'N/A',
        email: client?.email || '',
        phone: client?.phone || '',
        project: inv.project,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        total: inv.total,
        amount_paid: inv.amount_paid,
        amount_due: inv.amount_due,
        days_overdue: Math.max(0, diffDays),
        overdue_category: overdueCategory,
        status: inv.status,
        secure_token: inv.secure_token
      };
    })
    .sort((a, b) => b.days_overdue - a.days_overdue);

  const totalOutstandingAmount = Math.round(outstandingInvoices.reduce((s, i) => s + (i.amount_due || 0), 0) * 100) / 100;

  res.json({
    success: true,
    totalOutstandingAmount,
    totalCount: outstandingInvoices.length,
    invoices: outstandingInvoices
  });
});

// 5. GET Revenue Analytics Report (PRD Section 35)
router.get('/revenue', authenticateToken, requirePermission(PERMISSIONS.REPORT_VIEW), (req, res) => {
  const db = getDb();
  const monthlyRevenue = {};
  const clientRevenue = {};

  db.invoices
    .filter(i => i.status !== 'Cancelled' && i.status !== 'Draft')
    .forEach(inv => {
      const m = (inv.invoice_date || '').substring(0, 7) || '2026-09';
      monthlyRevenue[m] = (monthlyRevenue[m] || 0) + (inv.subtotal || inv.total || 0);

      const client = db.clients.find(c => c.id === inv.client_id);
      const cName = client?.name || 'Other';
      clientRevenue[cName] = (clientRevenue[cName] || 0) + (inv.total || 0);
    });

  const totalInvoiced = Math.round(Object.values(clientRevenue).reduce((a, b) => a + b, 0) * 100) / 100;
  const totalCollected = Math.round(db.payments.reduce((s, p) => s + (p.amount || 0), 0) * 100) / 100;

  res.json({
    success: true,
    totalInvoiced,
    totalCollected,
    monthlyRevenue,
    clientRevenue
  });
});

export default router;
