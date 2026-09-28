import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/stats', authenticateToken, (req, res) => {
  const db = getDb();
  let invoices = db.invoices;
  let payments = db.payments;

  // If Client, filter only client data
  if (req.user.role === ROLES.CLIENT) {
    invoices = invoices.filter(i => i.client_id === req.user.client_id);
    payments = payments.filter(p => p.client_id === req.user.client_id);
  }

  // Active (non-cancelled) invoices
  const activeInvoices = invoices.filter(i => i.status !== 'Cancelled');

  const totalInvoiced = activeInvoices.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
  const totalReceived = activeInvoices.reduce((sum, i) => sum + (parseFloat(i.amount_paid) || 0), 0);
  const totalPending = activeInvoices
    .filter(i => ['Payment Pending', 'Sent', 'Viewed', 'Partially Paid'].includes(i.status))
    .reduce((sum, i) => sum + (parseFloat(i.amount_due) || 0), 0);
  const totalOverdue = activeInvoices
    .filter(i => i.status === 'Overdue')
    .reduce((sum, i) => sum + (parseFloat(i.amount_due) || 0), 0);
  
  const partiallyPaidCount = activeInvoices.filter(i => i.status === 'Partially Paid').length;
  const overdueCount = activeInvoices.filter(i => i.status === 'Overdue').length;
  const paidCount = activeInvoices.filter(i => i.status === 'Paid').length;
  const pendingCount = activeInvoices.filter(i => ['Payment Pending', 'Sent', 'Viewed'].includes(i.status)).length;
  const failedCount = invoices.filter(i => i.status === 'Payment Failed').length;

  // Monthly metrics
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const thisMonthInvoicing = activeInvoices
    .filter(i => i.invoice_date && i.invoice_date.startsWith(currentMonthStr))
    .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

  const thisMonthCollection = payments
    .filter(p => p.payment_date && p.payment_date.startsWith(currentMonthStr))
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Upcoming payments in next 7-15 days
  const upcomingInvoices = activeInvoices
    .filter(i => i.amount_due > 0 && i.status !== 'Overdue' && i.status !== 'Paid')
    .slice(0, 5)
    .map(i => {
      const client = db.clients.find(c => c.id === i.client_id);
      return {
        id: i.id,
        invoice_number: i.invoice_number,
        client_name: client ? client.name : 'Client',
        amount_due: i.amount_due,
        due_date: i.due_date
      };
    });

  // Recent activity logs
  let recentActivities = db.invoice_activity_logs;
  if (req.user.role === ROLES.CLIENT) {
    const clientInvoiceIds = new Set(invoices.map(i => i.id));
    recentActivities = recentActivities.filter(a => clientInvoiceIds.has(a.entity_id));
  }

  res.json({
    success: true,
    stats: {
      totalInvoiced: Math.round(totalInvoiced),
      totalReceived: Math.round(totalReceived),
      totalPending: Math.round(totalPending),
      totalOverdue: Math.round(totalOverdue),
      thisMonthInvoicing: Math.round(thisMonthInvoicing),
      thisMonthCollection: Math.round(thisMonthCollection),
      counts: {
        total: activeInvoices.length,
        partiallyPaid: partiallyPaidCount,
        overdue: overdueCount,
        paid: paidCount,
        pending: pendingCount,
        failed: failedCount
      },
      upcomingPayments: upcomingInvoices,
      recentActivities: recentActivities.slice(0, 8)
    }
  });
});

export default router;
