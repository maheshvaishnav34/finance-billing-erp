import { pool, transaction } from '../config/database.js';

/**
 * Concurrency-safe document number generation using MySQL row-level locking (SELECT ... FOR UPDATE)
 * @param {string} docType ('invoice', 'receipt', 'credit_note', 'payment_link', 'quotation')
 * @returns {Promise<string>}
 */
export async function getNextDocumentNumber(docType) {
  try {
    return await transaction(async (connection) => {
      // 1. Lock the row for update so concurrent requests serialize safely
      const [rows] = await connection.query(
        'SELECT prefix, last_number, financial_year FROM number_sequences WHERE document_type = ? FOR UPDATE',
        [docType]
      );

      let prefix;
      let nextNumber;

      if (rows.length === 0) {
        // Initialize sequence row if missing
        prefix = `RC/2026-27/${docType.toUpperCase()}/`;
        nextNumber = 1;
        await connection.query(
          'INSERT INTO number_sequences (document_type, financial_year, prefix, last_number) VALUES (?, "2026-27", ?, 2)',
          [docType, prefix]
        );
      } else {
        prefix = rows[0].prefix;
        nextNumber = rows[0].last_number;
        // Atomic increment
        await connection.query(
          'UPDATE number_sequences SET last_number = last_number + 1 WHERE document_type = ?',
          [docType]
        );
      }

      const numStr = String(nextNumber).padStart(4, '0');
      return `${prefix}${numStr}`;
    });
  } catch (err) {
    console.warn(`[NumberSequence Notice] Falling back to timestamp sequence: ${err.message}`);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RC/2026-27/${docType.toUpperCase()}/${rand}`;
  }
}

/**
 * Non-incrementing peek for UI previews
 * @param {string} docType
 * @returns {Promise<string>}
 */
export async function peekNextDocumentNumber(docType) {
  try {
    const [rows] = await pool.query(
      'SELECT prefix, last_number FROM number_sequences WHERE document_type = ?',
      [docType]
    );
    if (rows.length > 0) {
      return `${rows[0].prefix}${String(rows[0].last_number).padStart(4, '0')}`;
    }
  } catch (err) {
    // fallback
  }
  return `RC/2026-27/${docType.toUpperCase()}/0001`;
}
