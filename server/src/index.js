import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkDatabaseConnection, closePool } from './config/database.js';
import './config/db.js'; // initialize memory layer fallback/seeds

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import creditNoteRoutes from './routes/creditNoteRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import paymentLinkRoutes from './routes/paymentLinkRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import portalRoutes from './routes/portalRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import projectManagerRoutes from './routes/projectManagerRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl) or matching frontend URL
    if (!origin || origin === FRONTEND_URL || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/credit-notes', creditNoteRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/payment-links', paymentLinkRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/pm', projectManagerRoutes);

// Health check endpoint with MySQL database status
app.get('/api/health', async (req, res) => {
  const isDbConnected = await checkDatabaseConnection();
  return res.json({
    success: true,
    server: 'ok',
    database: isDbConnected ? 'connected' : 'disconnected'
  });
});

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Redes Finance & Billing ERP Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Frontend Origin: ${FRONTEND_URL}`);
  });

  // Graceful shutdown handling (SIGTERM & SIGINT)
  async function handleShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('   Express HTTP server stopped accepting connections.');
      await closePool();
      console.log('   Graceful shutdown complete.');
      process.exit(0);
    });

    // Force close if graceful shutdown takes longer than 10s
    setTimeout(() => {
      console.error('   Shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default app;
  