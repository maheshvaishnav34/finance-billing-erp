const API_BASE = '/api';

async function safeJson(res) {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return { success: false, message: `Server returned empty response (${res.status})` };
    }
    return JSON.parse(text);
  } catch (err) {
    return { success: false, message: `Failed to parse response: ${err.message}` };
  }
}

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
    return safeJson(res);
  },
  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return safeJson(res);
  },
  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return safeJson(res);
  },
  resetPassword: async (data) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
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
    return safeJson(res);
  },
  getManageableUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/manageable-users`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
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
    return safeJson(res);
  },
  deleteManageableUser: async (userId) => {
    const res = await fetch(`${API_BASE}/auth/manageable-users/${userId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
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
    return safeJson(res);
  },
  getSwitchUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/switch-users`);
    return safeJson(res);
  },
  getRolesMatrix: async () => {
    const res = await fetch(`${API_BASE}/auth/roles-matrix`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Dashboard
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Invoices
  getInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/invoices?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  getInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  getNextInvoiceNumber: async () => {
    const res = await fetch(`${API_BASE}/invoices/next-number`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  createInvoice: async (data) => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  updateInvoice: async (id, data) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  sendInvoice: async (id, data) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  cancelInvoice: async (id, reason) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ cancellation_reason: reason })
    });
    return safeJson(res);
  },
  duplicateInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/duplicate`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  approveInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/approve`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  rejectInvoice: async (id, reason) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ rejection_reason: reason })
    });
    return safeJson(res);
  },

  // Project Manager Billing
  getProjectBilling: async () => {
    const res = await fetch(`${API_BASE}/pm/project-billing`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  requestInvoice: async (data) => {
    const res = await fetch(`${API_BASE}/pm/request-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  approveInvoiceRequest: async (id) => {
    const res = await fetch(`${API_BASE}/pm/approve-request/${id}`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Payments
  getPayments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/payments?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  recordPayment: async (data) => {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  verifyPayment: async (id, status) => {
    const res = await fetch(`${API_BASE}/payments/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status })
    });
    return safeJson(res);
  },

  // Quotations
  getQuotations: async () => {
    const res = await fetch(`${API_BASE}/quotations`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  createQuotation: async (data) => {
    const res = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  convertQuotation: async (id) => {
    const res = await fetch(`${API_BASE}/quotations/${id}/convert-to-invoice`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Receipts
  getReceipts: async () => {
    const res = await fetch(`${API_BASE}/receipts`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  getReceipt: async (id) => {
    const res = await fetch(`${API_BASE}/receipts/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Credit notes
  getCreditNotes: async () => {
    const res = await fetch(`${API_BASE}/credit-notes`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  createCreditNote: async (data) => {
    const res = await fetch(`${API_BASE}/credit-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },

  // Reminders
  getReminders: async () => {
    const res = await fetch(`${API_BASE}/reminders`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  runReminderCheck: async () => {
    const res = await fetch(`${API_BASE}/reminders/run-check`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  sendManualReminder: async (data) => {
    const res = await fetch(`${API_BASE}/reminders/send-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },

  // Recurring
  getRecurring: async () => {
    const res = await fetch(`${API_BASE}/recurring`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  createRecurring: async (data) => {
    const res = await fetch(`${API_BASE}/recurring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  triggerRecurringNow: async (id) => {
    const res = await fetch(`${API_BASE}/recurring/${id}/generate-now`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Payment Links
  getPaymentLinks: async () => {
    const res = await fetch(`${API_BASE}/payment-links`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  createPaymentLink: async (data) => {
    const res = await fetch(`${API_BASE}/payment-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },

  // Clients
  getClients: async () => {
    const res = await fetch(`${API_BASE}/clients`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  createClient: async (data) => {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  getClient: async (id) => {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  updateClient: async (id, data) => {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },
  deleteClient: async (id) => {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Reports
  getAgingReport: async () => {
    const res = await fetch(`${API_BASE}/reports/aging`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  getGstReport: async () => {
    const res = await fetch(`${API_BASE}/reports/gst`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  getCollectionsReport: async () => {
    const res = await fetch(`${API_BASE}/reports/collections`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  getOutstandingReport: async () => {
    const res = await fetch(`${API_BASE}/reports/outstanding`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  getRevenueReport: async () => {
    const res = await fetch(`${API_BASE}/reports/revenue`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Audit
  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: { ...getAuthHeader() }
    });
    return safeJson(res);
  },
  updateSettings: async (data) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },

  // Portal (Public token based)
  getPortalInvoice: async (token) => {
    const res = await fetch(`${API_BASE}/portal/invoice/${token}`);
    return safeJson(res);
  },
  payPortalInvoice: async (token, data) => {
    const res = await fetch(`${API_BASE}/portal/pay/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return safeJson(res);
  }
};
