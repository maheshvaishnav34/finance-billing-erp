import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/constants.js';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';

const router = express.Router();

// GET all clients with financial summaries
router.get('/', authenticateToken, getAllClients);

// GET single client billing profile & history
router.get('/:id', authenticateToken, getClientById);

// POST Create new client & billing profile
router.post('/', authenticateToken, requirePermission(PERMISSIONS.CLIENT_MANAGE), createClient);

// PUT Update client profile
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.CLIENT_MANAGE), updateClient);

// DELETE Client profile
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.CLIENT_MANAGE), deleteClient);

export default router;
