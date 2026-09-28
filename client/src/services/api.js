const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('redes_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },
  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },
  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },
  resetPassword: async (data) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  updateProfile: async (profileData) => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(profileData)
    });
    return res.json();
  },
  getManageableUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/manageable-users`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  createManageableUser: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/manageable-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(userData)
    });
    return res.json();
  },
  deleteManageableUser: async (userId) => {
    const res = await fetch(`${API_BASE}/auth/manageable-users/${userId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  updateManageableUserStatus: async (userId, status) => {
    const res = await fetch(`${API_BASE}/auth/manageable-users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  getSwitchUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/switch-users`);
    return res.json();
  },
  getRolesMatrix: async () => {
    const res = await fetch(`${API_BASE}/auth/roles-matrix`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Dashboard
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Invoices
  getInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/invoices?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  getInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  getNextInvoiceNumber: async () => {
    const res = await fetch(`${API_BASE}/invoices/next-number`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  createInvoice: async (data) => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateInvoice: async (id, data) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  sendInvoice: async (id, data) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  cancelInvoice: async (id, reason) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ cancellation_reason: reason })
    });
    return res.json();
  },
  duplicateInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/duplicate`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  approveInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/approve`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  rejectInvoice: async (id, reason) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ rejection_reason: reason })
    });
    return res.json();
  },

  // Project Manager Billing
  getProjectBilling: async () => {
    const res = await fetch(`${API_BASE}/pm/project-billing`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  requestInvoice: async (data) => {
    const res = await fetch(`${API_BASE}/pm/request-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  approveInvoiceRequest: async (id) => {
    const res = await fetch(`${API_BASE}/pm/approve-request/${id}`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Payments
  getPayments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/payments?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  recordPayment: async (data) => {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  verifyPayment: async (id, status) => {
    const res = await fetch(`${API_BASE}/payments/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Quotations
  getQuotations: async () => {
    const res = await fetch(`${API_BASE}/quotations`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  createQuotation: async (data) => {
    const res = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  convertQuotation: async (id) => {
    const res = await fetch(`${API_BASE}/quotations/${id}/convert-to-invoice`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Receipts
  getReceipts: async () => {
    const res = await fetch(`${API_BASE}/receipts`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  getReceipt: async (id) => {
    const res = await fetch(`${API_BASE}/receipts/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Credit notes
  getCreditNotes: async () => {
    const res = await fetch(`${API_BASE}/credit-notes`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  createCreditNote: async (data) => {
    const res = await fetch(`${API_BASE}/credit-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Reminders
  getReminders: async () => {
    const res = await fetch(`${API_BASE}/reminders`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  runReminderCheck: async () => {
    const res = await fetch(`${API_BASE}/reminders/run-check`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  sendManualReminder: async (data) => {
    const res = await fetch(`${API_BASE}/reminders/send-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Recurring
  getRecurring: async () => {
    const res = await fetch(`${API_BASE}/recurring`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  createRecurring: async (data) => {
    const res = await fetch(`${API_BASE}/recurring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  triggerRecurringNow: async (id) => {
    const res = await fetch(`${API_BASE}/recurring/${id}/generate-now`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Payment Links
  getPaymentLinks: async () => {
    const res = await fetch(`${API_BASE}/payment-links`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  createPaymentLink: async (data) => {
    const res = await fetch(`${API_BASE}/payment-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Clients
  getClients: async () => {
    const res = await fetch(`${API_BASE}/clients`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  createClient: async (data) => {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getClient: async (id) => {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  updateClient: async (id, data) => {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteClient: async (id) => {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Reports
  getAgingReport: async () => {
    const res = await fetch(`${API_BASE}/reports/aging`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  getGstReport: async () => {
    const res = await fetch(`${API_BASE}/reports/gst`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  getCollectionsReport: async () => {
    const res = await fetch(`${API_BASE}/reports/collections`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  getOutstandingReport: async () => {
    const res = await fetch(`${API_BASE}/reports/outstanding`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  getRevenueReport: async () => {
    const res = await fetch(`${API_BASE}/reports/revenue`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Audit
  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  updateSettings: async (data) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Portal (Public token based)
  getPortalInvoice: async (token) => {
    const res = await fetch(`${API_BASE}/portal/invoice/${token}`);
    return res.json();
  },
  payPortalInvoice: async (token, data) => {
    const res = await fetch(`${API_BASE}/portal/pay/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
