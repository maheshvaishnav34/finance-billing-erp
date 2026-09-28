import { getDb, saveDatabase } from '../config/db.js';
import { logActivity } from './auditService.js';
import { v4 as uuidv4 } from 'uuid';

export function runReminderCheck() {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updates = {
    markedOverdue: 0,
    remindersGenerated: 0,
    escalations: 0
  };

  db.invoices.forEach(inv => {
    // Only check invoices that have balance due and are not cancelled or draft
    if (inv.amount_due <= 0 || inv.status === 'Cancelled' || inv.status === 'Draft' || inv.status === 'Paid') {
      return;
    }

    const dueDate = new Date(inv.due_date);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Overdue logic
    if (diffDays > 0 && inv.status !== 'Overdue') {
      const oldStatus = inv.status;
      inv.status = 'Overdue';
      updates.markedOverdue++;
      
      logActivity({
        entity_type: 'Invoice',
        entity_id: inv.id,
        entity_ref: inv.invoice_number,
        user: 'Automated Scheduler',
        role: 'System',
        action: 'Invoice Marked Overdue',
        details: `Due date (${inv.due_date}) passed with outstanding balance ₹${inv.amount_due.toLocaleString('en-IN')}. Status transitioned: ${oldStatus} -> Overdue.`
      });
    }

    // Determine current reminder stage
    let stage = null;
    if (diffDays <= -3) stage = 'D-3';
    else if (diffDays <= -1) stage = 'D-1';
    else if (diffDays === 0) stage = 'Due Date';
    else if (diffDays > 0 && diffDays <= 5) stage = 'D+3';
    else if (diffDays > 5 && diffDays < 15) stage = 'D+7';
    else if (diffDays >= 15) stage = 'D+15';

    if (stage) {
      if (!db.email_logs) db.email_logs = [];
      const alreadySent = db.email_logs.some(
        e => e.invoice_id === inv.id && e.stage === stage && e.type === 'reminder'
      );

      if (!alreadySent) {
        const client = db.clients.find(c => c.id === inv.client_id);
        const emailEntry = {
          id: `em_${uuidv4().substring(0, 8)}`,
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          client_id: inv.client_id,
          client_name: client?.name || 'Client',
          recipient_email: client?.email,
          stage,
          type: 'reminder',
          is_escalation: stage === 'D+15',
          timestamp: new Date().toISOString()
        };

        db.email_logs.push(emailEntry);
        updates.remindersGenerated++;

        let actionText = `Automatic Reminder (${stage}) Triggered`;
        let detailsText = `Automated reminder email sent to ${client?.email} for Invoice ${inv.invoice_number}`;

        if (stage === 'D+15') {
          updates.escalations++;
          actionText = `D+15 Final Reminder & CEO Escalation`;
          detailsText = `Invoice is 15+ days overdue. Final notice dispatched and internal escalation alert raised for CEO & Finance Head.`;
        }

        logActivity({
          entity_type: 'Invoice',
          entity_id: inv.id,
          entity_ref: inv.invoice_number,
          user: 'Reminder Scheduler',
          role: 'System',
          action: actionText,
          details: detailsText
        });
      }
    }
  });

  saveDatabase();
  return updates;
}
