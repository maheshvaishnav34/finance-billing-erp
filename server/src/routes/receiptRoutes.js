import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAllReceipts, getReceiptById } from '../controllers/receiptController.js';

const router = express.Router();

// GET all receipts
router.get('/', authenticateToken, getAllReceipts);

// GET single receipt
router.get('/:id', authenticateToken, getReceiptById);

export default router;
