import express from 'express';
import jwt from 'jsonwebtoken';
import { getDb, saveDatabase } from '../config/db.js';
import { JWT_SECRET, authenticateToken, requireRoles } from '../middleware/auth.js';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MAP } from '../config/constants.js';
import { logActivity } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper to compute initials
function getInitials(name) {
  if (!name) return 'RC';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// 1. Sign In (Login)
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  const db = getDb();

  let user = null;
  if (email) {
    user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  } else if (role) {
    user = db.users.find(u => u.role === role);
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. User with this email does not exist.'
    });
  }

  // Password validation: supports standard password or demo fallback
  if (user.password_hash && password) {
    // If user has specific password, check it (allowing 'password123' or 'redes123' for smooth testing)
    if (user.password_hash !== password && password !== 'password123' && password !== 'redes123') {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Try password123 or use quick test credentials.'
      });
    }
  }

  // Check account active/inactive status
  if (user.status === 'Inactive') {
    return res.status(403).json({
      success: false,
      message: 'Your account is marked as Inactive. Please contact the CEO or Finance Administrator for access restoration.'
    });
  }

  const permissions = ROLE_PERMISSIONS_MAP[user.role] || [];
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, client_id: user.client_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logActivity({
    entity_type: 'Auth',
    entity_id: user.id,
    entity_ref: user.email,
    user: user.name,
    role: user.role,
    action: 'User Sign In',
    details: `${user.name} logged into Redes Creation ERP console with role [${user.role}]`,
    ip: req.ip
  });

  return res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: {
      ...user,
      permissions
    }
  });
});

// 1b. Forgot Password (Email-based OTP generation)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const db = getDb();

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No registered user found with this email address. Please check and try again.'
    });
  }

  // Generate 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.reset_otp = otp;
  user.reset_otp_expires = Date.now() + 15 * 60 * 1000; // 15 mins expiry

  // Record simulated email dispatch in audit & email logs
  if (!db.email_logs) db.email_logs = [];
  db.email_logs.push({
    id: `mail_${uuidv4().slice(0, 8)}`,
    to: user.email,
    subject: 'Password Reset Verification Code - Redes Creation ERP',
    type: 'Password Reset',
    status: 'Delivered',
    timestamp: new Date().toISOString(),
    details: `Password reset verification code: ${otp}. Valid for 15 minutes.`
  });

  logActivity({
    entity_type: 'Auth',
    entity_id: user.id,
    entity_ref: user.email,
    user: user.name,
    role: user.role,
    action: 'Password Reset Requested',
    details: `Generated password reset verification code for ${user.email}`,
    ip: req.ip
  });

  saveDatabase();

  return res.json({
    success: true,
    message: `Verification code has been sent to ${user.email}.`,
    dev_otp: otp
  });
});

// 1c. Reset Password (Verify OTP & update password)
router.post('/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  const db = getDb();

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email address, verification code, and new password are required.'
    });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 4 characters long.'
    });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found.' });
  }

  if (!user.reset_otp || user.reset_otp !== otp.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code. Please check your code or request a new one.'
    });
  }

  if (user.reset_otp_expires && Date.now() > user.reset_otp_expires) {
    return res.status(400).json({
      success: false,
      message: 'Verification code has expired. Please request a new code.'
    });
  }

  // Update password
  user.password_hash = newPassword;
  delete user.reset_otp;
  delete user.reset_otp_expires;

  logActivity({
    entity_type: 'Auth',
    entity_id: user.id,
    entity_ref: user.email,
    user: user.name,
    role: user.role,
    action: 'Password Reset Successful',
    details: `${user.name} (${user.role}) successfully reset password via email OTP verification.`,
    ip: req.ip
  });

  saveDatabase();

  return res.json({
    success: true,
    message: 'Your password has been successfully reset! You can now sign in with your new password.'
  });
});

// 2. Sign Up (Strictly for Clients - Internal staff roles are provisioned internally)
router.post('/register', (req, res) => {
  const db = getDb();
  const {
    name,
    email,
    password,
    company_name,
    phone,
    billing_address,
    gstin,
    pan,
    place_of_supply,
    state
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Contact person / Full name is required.' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }

  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
  }

  // Check existing email
  const existing = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
  }

  // PUBLIC REGISTRATION IS STRICTLY ENFORCED AS CLIENT ROLE
  const assignedRole = ROLES.CLIENT;
  const roleId = 4;

  // Automatically create Client Billing Entity
  const clientId = `cli_${uuidv4().substring(0, 8)}`;
  const cleanCompanyName = company_name?.trim() || `${name.trim()} & Co.`;
  const cleanPhone = phone?.trim() || '';

  const newClientProfile = {
    id: clientId,
    name: cleanCompanyName,
    company_name: cleanCompanyName,
    contact_person: name.trim(),
    email: email.trim().toLowerCase(),
    phone: cleanPhone,
    billing_address: billing_address?.trim() || 'Address provided at portal registration',
    gstin: gstin?.trim().toUpperCase() || '',
    pan: pan?.trim().toUpperCase() || '',
    state: state || 'Madhya Pradesh',
    country: 'India',
    place_of_supply: place_of_supply || '23-Madhya Pradesh',
    currency: 'INR',
    default_payment_terms: '15 Days',
    default_due_days: 15,
    preferred_payment_method: 'Bank Transfer',
    created_at: new Date().toISOString()
  };
  db.clients.push(newClientProfile);

  const userId = `usr_cli_${uuidv4().substring(0, 8)}`;
  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: cleanPhone,
    password_hash: password,
    initials: getInitials(name),
    role: assignedRole,
    role_id: roleId,
    client_id: clientId,
    status: 'Active',
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);

  // Log audit
  logActivity({
    entity_type: 'Auth',
    entity_id: newUser.id,
    entity_ref: newUser.email,
    user: newUser.name,
    role: assignedRole,
    action: 'Client Portal Sign Up',
    details: `Client registered new portal account with billing profile [${cleanCompanyName} - ${clientId}]`,
    ip: req.ip
  });

  saveDatabase();

  const permissions = ROLE_PERMISSIONS_MAP[assignedRole] || [];
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: assignedRole, name: newUser.name, client_id: clientId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    success: true,
    message: `Client account created successfully! Welcome to your Client Portal.`,
    token,
    user: {
      ...newUser,
      clientDetails: newClientProfile,
      permissions
    }
  });
});

// 3. Get Current Authenticated Profile
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  let clientDetails = null;
  if (user.client_id) {
    clientDetails = db.clients.find(c => c.id === user.client_id) || null;
  }

  return res.json({
    success: true,
    user: {
      phone: user.phone || '+91 98260 00000',
      designation: user.designation || (user.role === 'CEO' ? 'Chief Executive Officer' : user.role === 'Finance/Admin' ? 'Finance & Accounts Head' : user.role === 'Project Manager' ? 'Project Lead' : 'Authorized Representative'),
      department: user.department || (user.role === 'Client' ? 'Client Relations' : 'Operations'),
      ...user,
      clientDetails,
      permissions: ROLE_PERMISSIONS_MAP[user.role] || []
    }
  });
});

// Update Profile (Name, Email, Phone, Company, Password, etc.)
router.put('/profile', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const {
    name,
    email,
    phone,
    designation,
    department,
    currentPassword,
    newPassword,
    company_name,
    billing_address,
    gstin,
    pan
  } = req.body;

  // 1. Validate & update Name
  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name cannot be empty.' });
    }
    user.name = name.trim();
    user.initials = getInitials(user.name);
  }

  // 2. Validate & update Email
  if (email !== undefined) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    const duplicate = db.users.find(u => u.id !== user.id && u.email.toLowerCase() === cleanEmail);
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'This email is already in use by another user.' });
    }
    user.email = cleanEmail;
  }

  // 3. Update Phone & Details
  if (phone !== undefined) {
    user.phone = phone.trim();
  }

  if (designation !== undefined) {
    user.designation = designation.trim();
  }

  if (department !== undefined) {
    user.department = department.trim();
  }

  // 4. Update Password if provided
  if (newPassword) {
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters long.' });
    }
    if (user.password_hash && currentPassword) {
      if (user.password_hash !== currentPassword && currentPassword !== 'password123' && currentPassword !== 'redes123') {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
    }
    user.password_hash = newPassword;
  }

  // 5. Update linked Client details if client account
  let clientDetails = null;
  if (user.client_id) {
    const client = db.clients.find(c => c.id === user.client_id);
    if (client) {
      if (company_name !== undefined) client.company_name = company_name.trim();
      if (billing_address !== undefined) client.billing_address = billing_address.trim();
      if (gstin !== undefined) client.gstin = gstin.trim().toUpperCase();
      if (pan !== undefined) client.pan = pan.trim().toUpperCase();
      if (name !== undefined) client.contact_person = user.name;
      if (phone !== undefined) client.phone = user.phone;
      if (email !== undefined) client.email = user.email;
      clientDetails = client;
    }
  }

  saveDatabase();

  // Audit activity
  logActivity({
    entity_type: 'Auth',
    entity_id: user.id,
    entity_ref: user.email,
    user: user.name,
    role: user.role,
    action: 'Profile Updated',
    details: `${user.name} (${user.role}) updated contact and profile credentials.`,
    ip: req.ip
  });

  // Generate new token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, client_id: user.client_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    success: true,
    message: 'Profile details saved successfully!',
    token,
    user: {
      ...user,
      clientDetails,
      permissions: ROLE_PERMISSIONS_MAP[user.role] || []
    }
  });
});

// ==========================================
// ROLE & USER MANAGEMENT (CEO & ADMIN ONLY)
// ==========================================

// 1. Get all manageable users
router.get('/manageable-users', authenticateToken, (req, res) => {
  if (![ROLES.CEO, ROLES.FINANCE_ADMIN].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only CEO and Finance/Admin have authority to view and manage user roles.'
    });
  }

  const db = getDb();
  const userList = db.users.map(u => {
    let clientDetails = null;
    if (u.client_id) {
      clientDetails = db.clients.find(c => c.id === u.client_id) || null;
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      designation: u.designation || '',
      department: u.department || '',
      role: u.role,
      role_id: u.role_id,
      initials: u.initials,
      client_id: u.client_id,
      status: u.status || 'Active',
      created_at: u.created_at,
      clientDetails
    };
  });

  return res.json({
    success: true,
    users: userList
  });
});

// 2. Create User / Role (Strictly Project Manager or Client)
router.post('/manageable-users', authenticateToken, (req, res) => {
  if (![ROLES.CEO, ROLES.FINANCE_ADMIN].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only CEO and Finance/Admin have authority to create user roles.'
    });
  }

  const db = getDb();
  const {
    name,
    email,
    phone,
    password = 'password123',
    role,
    designation,
    department,
    company_name,
    billing_address,
    gstin,
    pan,
    place_of_supply,
    state
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }

  if (!email || !email.trim() || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'A valid email is required.' });
  }

  // RESTRICT: Can only create Project Manager or Client!
  if (![ROLES.PROJECT_MANAGER, ROLES.CLIENT].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Restricted: You can only create Client or Project Manager accounts.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'A user with this email address already exists.'
    });
  }

  let clientId = null;
  let newClientProfile = null;

  if (role === ROLES.CLIENT) {
    clientId = `cli_${uuidv4().substring(0, 8)}`;
    const cleanCompany = company_name?.trim() || `${name.trim()} & Co.`;
    newClientProfile = {
      id: clientId,
      name: cleanCompany,
      company_name: cleanCompany,
      contact_person: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '',
      billing_address: billing_address?.trim() || 'Billing address on file',
      gstin: gstin?.trim().toUpperCase() || '',
      pan: pan?.trim().toUpperCase() || '',
      state: state || 'Madhya Pradesh',
      country: 'India',
      place_of_supply: place_of_supply || '23-Madhya Pradesh',
      currency: 'INR',
      default_payment_terms: '15 Days',
      default_due_days: 15,
      preferred_payment_method: 'Bank Transfer',
      created_at: new Date().toISOString()
    };
    db.clients.push(newClientProfile);
  }

  const userId = `usr_${role === ROLES.CLIENT ? 'cli' : 'pm'}_${uuidv4().substring(0, 8)}`;
  const newUser = {
    id: userId,
    name: name.trim(),
    email: cleanEmail,
    phone: phone?.trim() || '',
    password_hash: password,
    designation: designation?.trim() || (role === ROLES.CLIENT ? 'Client Representative' : 'Senior Project Manager'),
    department: department?.trim() || (role === ROLES.CLIENT ? 'Client Procurement' : 'Client Delivery & Projects'),
    initials: getInitials(name),
    role,
    role_id: role === ROLES.CLIENT ? 4 : 3,
    client_id: clientId,
    status: 'Active',
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);

  logActivity({
    entity_type: 'Role Management',
    entity_id: newUser.id,
    entity_ref: newUser.email,
    user: req.user.name,
    role: req.user.role,
    action: `Role Created: ${role}`,
    details: `${req.user.name} (${req.user.role}) created new ${role} account: ${newUser.name} (${newUser.email})`,
    ip: req.ip
  });

  saveDatabase();

  return res.status(201).json({
    success: true,
    message: `${role} account for "${newUser.name}" created successfully!`,
    user: {
      ...newUser,
      clientDetails: newClientProfile
    }
  });
});

// 3. Remove / Delete User (Strictly Project Manager or Client only)
router.delete('/manageable-users/:id', authenticateToken, (req, res) => {
  if (![ROLES.CEO, ROLES.FINANCE_ADMIN].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only CEO and Finance/Admin have authority to remove user roles.'
    });
  }

  const db = getDb();
  const targetIndex = db.users.findIndex(u => u.id === req.params.id);
  if (targetIndex === -1) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  const targetUser = db.users[targetIndex];

  // Root account protection: CEO root account cannot be deleted
  if (targetUser.id === 'usr_ceo_1' || targetUser.email === 'nitin@redescreation.com') {
    return res.status(403).json({
      success: false,
      message: 'Security violation: Primary CEO root account cannot be removed.'
    });
  }

  // Only CEO can remove other CEO accounts if any
  if (targetUser.role === ROLES.CEO && req.user.role !== ROLES.CEO) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only CEO can remove CEO accounts.'
    });
  }

  // Prevent deleting self
  if (targetUser.id === req.user.id || targetUser.email === req.user.email) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own active account.'
    });
  }

  // If Client, also remove associated client profile from db.clients
  if (targetUser.client_id) {
    db.clients = db.clients.filter(c => c.id !== targetUser.client_id);
  }

  // Remove user
  db.users.splice(targetIndex, 1);

  logActivity({
    entity_type: 'Role Management',
    entity_id: targetUser.id,
    entity_ref: targetUser.email,
    user: req.user.name,
    role: req.user.role,
    action: `Role Removed: ${targetUser.role}`,
    details: `${req.user.name} (${req.user.role}) removed ${targetUser.role} account: ${targetUser.name} (${targetUser.email})`,
    ip: req.ip
  });

  saveDatabase();

  return res.json({
    success: true,
    message: `${targetUser.role} account for "${targetUser.name}" was successfully removed.`
  });
});

// Update User Status (Active / Inactive)
router.patch('/manageable-users/:id/status', authenticateToken, (req, res) => {
  if (![ROLES.CEO, ROLES.FINANCE_ADMIN].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only CEO and Finance/Admin have authority to update user status.'
    });
  }

  const db = getDb();
  const targetUser = db.users.find(u => u.id === req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  const { status } = req.body;
  if (!status || !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be Active or Inactive.' });
  }

  // Root account protection: CEO root account status cannot be changed
  if (targetUser.id === 'usr_ceo_1' || targetUser.email === 'nitin@redescreation.com') {
    return res.status(403).json({
      success: false,
      message: 'Security violation: Primary CEO root account status cannot be changed.'
    });
  }

  // Prevent modifying self
  if (targetUser.id === req.user.id || targetUser.email === req.user.email) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change the status of your own account.'
    });
  }

  targetUser.status = status;

  // Also update associated client profile if it is a Client
  if (targetUser.client_id) {
    const client = db.clients.find(c => c.id === targetUser.client_id);
    if (client) {
      client.status = status;
    }
  }

  logActivity({
    entity_type: 'Role Management',
    entity_id: targetUser.id,
    entity_ref: targetUser.email,
    user: req.user.name,
    role: req.user.role,
    action: `User Status Updated: ${status}`,
    details: `${req.user.name} (${req.user.role}) marked ${targetUser.role} "${targetUser.name}" as ${status}.`,
    ip: req.ip
  });

  saveDatabase();

  return res.json({
    success: true,
    message: `${targetUser.role} "${targetUser.name}" marked as ${status} successfully.`,
    user: targetUser
  });
});

// 4. Quick Switch Users list for seamless testing
router.get('/switch-users', (req, res) => {
  const db = getDb();
  const summary = db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    initials: u.initials,
    client_id: u.client_id,
    status: u.status
  }));
  res.json({ success: true, users: summary });
});

// 5. Complete Role Architecture & Permissions Matrix
router.get('/roles-matrix', authenticateToken, (req, res) => {
  const db = getDb();

  // Role architecture definitions
  const roleDefs = [
    {
      id: 1,
      name: ROLES.CEO,
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      tagline: 'Executive Command & Approvals',
      description: 'Unrestricted full access across all financial modules, CEO escalations, high-value invoice approval overrides, and audit trails.',
      userCount: db.users.filter(u => u.role === ROLES.CEO).length,
      allowedPages: ['Overview', 'Invoices', 'Payments', 'Clients', 'Quotations', 'Receipts', 'Credit Notes', 'Reminders', 'Recurring', 'Payment Links', 'Reports', 'Audit Logs', 'Settings', 'Role Architecture']
    },
    {
      id: 2,
      name: ROLES.FINANCE_ADMIN,
      badge: 'bg-blue-100 text-blue-900 border-blue-300',
      tagline: 'Billing, Reconciliation & Reporting',
      description: 'Operations manager for creating invoices, dispatching emails with PDF & links, recording & reconciling payments, issuing credit notes, and running reports.',
      userCount: db.users.filter(u => u.role === ROLES.FINANCE_ADMIN).length,
      allowedPages: ['Overview', 'Invoices', 'Payments', 'Clients', 'Quotations', 'Receipts', 'Credit Notes', 'Reminders', 'Recurring', 'Payment Links', 'Reports', 'Audit Logs', 'Settings']
    },
    {
      id: 3,
      name: ROLES.PROJECT_MANAGER,
      badge: 'bg-purple-100 text-purple-900 border-purple-300',
      tagline: 'Project Billing & Quotation Tracking',
      description: 'Inspects project milestones, requests invoices, monitors project payment clearances, and drafts quotations for clients.',
      userCount: db.users.filter(u => u.role === ROLES.PROJECT_MANAGER).length,
      allowedPages: ['Invoices (View Only)', 'Quotations', 'Clients (View Only)', 'Project Payment Status']
    },
    {
      id: 4,
      name: ROLES.CLIENT,
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      tagline: 'Client Portal (Isolated Customer Account)',
      description: 'Strict customer isolation. Only accesses their own invoices, payment receipts, statement history, and the secure instant checkout portal.',
      userCount: db.users.filter(u => u.role === ROLES.CLIENT).length,
      allowedPages: ['My Invoices', 'My Payments', 'My Receipts', 'Credit Notes', 'Billing Profile', 'Pay Online Portal']
    }
  ];

  // Group permissions logically
  const permissionGroups = [
    {
      group: 'Invoices & Billing',
      permissions: [
        { code: PERMISSIONS.INVOICE_VIEW, name: 'View Invoices' },
        { code: PERMISSIONS.INVOICE_CREATE, name: 'Create Invoices' },
        { code: PERMISSIONS.INVOICE_EDIT, name: 'Edit Draft Invoices' },
        { code: PERMISSIONS.INVOICE_SEND, name: 'Send Invoices via Email' },
        { code: PERMISSIONS.INVOICE_CANCEL, name: 'Cancel Invoices with Reason' }
      ]
    },
    {
      group: 'Payments & Reconciliation',
      permissions: [
        { code: PERMISSIONS.PAYMENT_VIEW, name: 'View Transactions' },
        { code: PERMISSIONS.PAYMENT_RECORD, name: 'Record Manual / Gateway Payments' },
        { code: PERMISSIONS.PAYMENT_VERIFY, name: 'Verify Bank / UTR Reference' },
        { code: PERMISSIONS.PAYMENT_RECONCILE, name: 'Reconcile Transactions' }
      ]
    },
    {
      group: 'Quotations & Proposals',
      permissions: [
        { code: PERMISSIONS.QUOTATION_VIEW, name: 'View Quotations' },
        { code: PERMISSIONS.QUOTATION_CREATE, name: 'Create Proposals' },
        { code: PERMISSIONS.QUOTATION_CONVERT, name: '1-Click Convert to Tax Invoice' }
      ]
    },
    {
      group: 'Receipts & Credit Notes',
      permissions: [
        { code: PERMISSIONS.RECEIPT_VIEW, name: 'View Payment Receipts' },
        { code: PERMISSIONS.RECEIPT_DOWNLOAD, name: 'Download / Print Vouchers' },
        { code: PERMISSIONS.CREDIT_NOTE_CREATE, name: 'Issue Credit Notes' },
        { code: PERMISSIONS.CREDIT_NOTE_VIEW, name: 'View Credit Notes' }
      ]
    },
    {
      group: 'Reminders & Automation',
      permissions: [
        { code: PERMISSIONS.REMINDER_VIEW, name: 'View Overdue & Reminder Queue' },
        { code: PERMISSIONS.REMINDER_SEND, name: 'Trigger Reminders & Escalations' },
        { code: PERMISSIONS.RECURRING_MANAGE, name: 'Manage Recurring Subscriptions' },
        { code: PERMISSIONS.PAYMENT_LINK_MANAGE, name: 'Create Standalone Payment Links' }
      ]
    },
    {
      group: 'Reports & Governance',
      permissions: [
        { code: PERMISSIONS.REPORT_VIEW, name: 'View Aging, GST & Revenue Reports' },
        { code: PERMISSIONS.REPORT_EXPORT, name: 'Export Reports to CSV / Print' },
        { code: PERMISSIONS.SETTINGS_MANAGE, name: 'Manage Sequences & Bank Details' },
        { code: PERMISSIONS.AUDIT_VIEW, name: 'View Immutable Audit Trail' }
      ]
    }
  ];

  res.json({
    success: true,
    roles: roleDefs,
    rolePermissionsMap: ROLE_PERMISSIONS_MAP,
    permissionGroups,
    allUsers: db.users
  });
});

export default router;
