import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/constants.js';
import { getAllPayments, createPayment, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

// GET all payments with tab filtering (All, Online, Manual, Reconciliation)
router.get('/', authenticateToken, getAllPayments);

// POST Record manual or gateway payment
router.post('/', authenticateToken, requirePermission(PERMISSIONS.PAYMENT_RECORD), createPayment);

// PATCH Update verification stage (e.g. Mark verified -> Reconciled)
router.patch('/:id/verify', authenticateToken, requirePermission(PERMISSIONS.PAYMENT_VERIFY), verifyPayment);

export default router;
