import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', authenticateToken, requireRoles(ROLES.CEO, ROLES.FINANCE_ADMIN), (req, res) => {
  const db = getDb();
  res.json({
    success: true,
    logs: db.invoice_activity_logs,
    total: db.invoice_activity_logs.length
  });
});

export default router;
