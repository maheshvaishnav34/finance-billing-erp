import express from 'express';
import { getDb, saveDatabase } from '../config/db.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/constants.js';
import { getNextDocumentNumber } from '../services/numberSequenceService.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET all payment links
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  let paymentLinks = [...db.payment_links];
  if (req.user.role === 'Client' && req.user.client_id) {
    paymentLinks = paymentLinks.filter(pl => pl.client_id === req.user.client_id);
  }
  res.json({ success: true, paymentLinks });
});

// POST Create standalone payment link (for advance payments)
router.post('/', authenticateToken, requirePermission(PERMISSIONS.PAYMENT_LINK_MANAGE), async (req, res) => {
  const db = getDb();
  const { client_id, amount, purpose, description, expiry_date } = req.body;
  const client = db.clients.find(c => c.id === client_id);
  if (!client) return res.status(400).json({ success: false, message: 'Client required' });

  const code = await getNextDocumentNumber('payment_link');
  const token = `tok_link_${uuidv4().replace(/-/g, '')}`;

  const paymentLink = {
    id: `pl_${uuidv4().substring(0, 8)}`,
    code,
    client_id: client.id,
    client_name: client.name,
    amount: parseFloat(amount || 0),
    purpose: purpose || 'Advance Payment',
    description: description || '',
    expiry_date: expiry_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    token,
    status: 'Active',
    created_at: new Date().toISOString()
  };

  db.payment_links.unshift(paymentLink);

  logActivity({
    entity_type: 'Payment Link',
    entity_id: paymentLink.id,
    entity_ref: code,
    user: req.user.name,
    role: req.user.role,
    action: 'Payment Link Created',
    details: `Standalone payment link ${code} generated for ₹${paymentLink.amount.toLocaleString('en-IN')}: ${purpose}`,
    ip: req.ip
  });

  saveDatabase();

  res.status(201).json({ success: true, paymentLink });
});

export default router;
