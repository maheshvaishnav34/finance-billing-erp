import express from 'express';
import { getDb, saveDatabase, defaultTaxRates, defaultPaymentMethods, defaultEmailTemplates } from '../config/db.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  res.json({
    success: true,
    settings: db.financial_settings || {},
    sequences: db.invoice_number_sequences || {},
    tax_rates: db.tax_rates || defaultTaxRates,
    payment_methods: db.payment_methods || defaultPaymentMethods,
    email_templates: db.email_templates || defaultEmailTemplates
  });
});

router.put('/', authenticateToken, requireRoles(ROLES.CEO, ROLES.FINANCE_ADMIN), (req, res) => {
  const db = getDb();
  const { settings, sequences, tax_rates, payment_methods, email_templates } = req.body;

  if (settings) {
    db.financial_settings = { ...db.financial_settings, ...settings };
  }
  if (sequences) {
    db.invoice_number_sequences = { ...db.invoice_number_sequences, ...sequences };
  }
  if (tax_rates) {
    db.tax_rates = tax_rates;
  }
  if (payment_methods) {
    db.payment_methods = payment_methods;
  }
  if (email_templates) {
    db.email_templates = { ...db.email_templates, ...email_templates };
  }

  logActivity({
    entity_type: 'Settings',
    entity_id: 'settings_global',
    entity_ref: 'Financial Configuration',
    user: req.user.name,
    role: req.user.role,
    action: 'Settings Updated',
    details: `Updated financial settings and configuration parameters by ${req.user.name} (${req.user.role})`,
    ip: req.ip
  });

  saveDatabase();

  res.json({
    success: true,
    message: 'Configuration settings updated successfully',
    settings: db.financial_settings,
    sequences: db.invoice_number_sequences,
    tax_rates: db.tax_rates,
    payment_methods: db.payment_methods,
    email_templates: db.email_templates
  });
});

export default router;
