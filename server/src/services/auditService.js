import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Log an audit activity record into MySQL invoice_activity_logs
 */
export async function logActivity({
  entity_type,
  entity_id,
  entity_ref = '',
  user = 'System',
  role = 'System',
  action,
  details = '',
  ip = '127.0.0.1'
}) {
  const now = new Date();
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  const formattedTime = now.toLocaleDateString('en-GB', options);
  const id = `log_${uuidv4().substring(0, 8)}`;

  try {
    await pool.query(
      `INSERT INTO invoice_activity_logs (id, entity_type, entity_id, entity_ref, user, role, action, details, timestamp, raw_timestamp, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, entity_type, entity_id, entity_ref, user, role, action, details, formattedTime, now.toISOString(), ip]
    );
  } catch (err) {
    console.warn(`[Audit Log Notice] Failed to save log to MySQL: ${err.message}`);
  }

  return {
    id,
    entity_type,
    entity_id,
    entity_ref,
    user,
    role,
    action,
    details,
    timestamp: formattedTime,
    raw_timestamp: now.toISOString(),
    ip
  };
}
