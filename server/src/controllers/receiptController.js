import { pool } from '../config/database.js';
import { getDb } from '../config/db.js';
import { ROLES } from '../config/constants.js';

export async function getAllReceipts(req, res) {
  try {
    const db = getDb();
    let receipts = [...(db.receipts || [])];

    if (req.user.role === ROLES.CLIENT) {
      receipts = receipts.filter(r => r.client_id === req.user.client_id);
    }

    return res.json({ success: true, receipts, total: receipts.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getReceiptById(req, res) {
  try {
    const db = getDb();
    const receipt = (db.receipts || []).find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });

    if (req.user.role === ROLES.CLIENT && receipt.client_id !== req.user.client_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const invoice = (db.invoices || []).find(i => i.id === receipt.invoice_id);
    const client = (db.clients || []).find(c => c.id === receipt.client_id);

    return res.json({
      success: true,
      receipt: {
        ...receipt,
        invoice,
        client,
        company: db.financial_settings
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
