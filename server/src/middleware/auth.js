import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { getDb } from '../config/db.js';
import { ROLES, ROLE_PERMISSIONS_MAP } from '../config/constants.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'redes_finance_secret_key_2026';

// Middleware to verify JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
    }

    try {
      // 1. Primary: Lookup user in MySQL
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [decodedUser.id]);
      let user = rows && rows.length > 0 ? rows[0] : null;

      // 2. Safe fallback if MySQL is initializing or user not yet migrated
      if (!user) {
        const db = getDb();
        user = db.users.find(u => u.id === decodedUser.id);
      }

      if (!user) {
        return res.status(403).json({ success: false, message: 'User account not found.' });
      }

      req.user = {
        ...user,
        permissions: ROLE_PERMISSIONS_MAP[user.role] || []
      };
      next();
    } catch (dbErr) {
      // If pool connection fails, fall back to in-memory store
      try {
        const db = getDb();
        const user = db.users.find(u => u.id === decodedUser.id);
        if (!user) {
          return res.status(403).json({ success: false, message: 'User account not found.' });
        }
        req.user = {
          ...user,
          permissions: ROLE_PERMISSIONS_MAP[user.role] || []
        };
        next();
      } catch (fallbackErr) {
        return res.status(500).json({ success: false, message: 'Internal authentication error.' });
      }
    }
  });
}

// Middleware to enforce specific roles
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (allowedRoles.includes(req.user.role) || req.user.role === ROLES.CEO) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}` 
    });
  };
}

// Middleware to enforce specific permissions
export function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // CEO has bypass on all permissions
    if (req.user.role === ROLES.CEO) {
      return next();
    }

    const userPerms = req.user.permissions || [];
    if (userPerms.includes(permissionCode)) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `Permission denied. Missing required permission: [${permissionCode}]` 
    });
  };
}
