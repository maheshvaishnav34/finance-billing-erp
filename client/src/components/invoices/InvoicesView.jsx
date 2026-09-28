import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Search,
  Plus,
  Filter,
  Send,
  Printer,
  Download,
  Copy,
  Ban,
  Receipt,
  FileMinus,
  Clock,
  CheckCircle,
  ExternalLink,
  X,
  CreditCard,
  AlertTriangle,
  Mail,
  ChevronRight,
  Eye,
  MapPin,
  Phone,
  Globe,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  QrCode,
  Edit3,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';
import { numberToWords } from '../../utils/numberToWords';
import { QRCodeSVG } from 'qrcode.react';

export default function InvoicesView({ currentUser, masterSettings, onOpenPortalLink, actionTrigger }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderCustomMessage, setReminderCustomMessage] = useState('');
  const [reminderSending, setReminderSending] = useState(false);

  // Record Payment Modal State
  const [recordPaymentForm, setRecordPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'Bank Transfer',
    reference: '',
    bank_name: 'HDFC Bank',
    cheque_number: '',
    notes: 'Direct client payment settlement'
  });

  // Send Email Modal state
  const [sendForm, setSendForm] = useState({
    to: '',
    cc: '',
    subject: '',
    include_payment_link: true,
    attach_pdf: true
  });

  // Cancel Reason state
  const [cancelReason, setCancelReason] = useState('');

  // Credit Note Form state
  const [cnAmount, setCnAmount] = useState('');
  const [cnReason, setCnReason] = useState('Billing correction');

  // Create Invoice State
  const [clients, setClients] = useState([]);
  const [nextInvNum, setNextInvNum] = useState('');
  const [newInvoiceData, setNewInvoiceData] = useState({
    client_id: '',
    project: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_terms: '15 Days',
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    currency: 'INR',
    reverse_charge: 'No',
    items: [
      { product_service: 'Website & Web Application Development', description: 'Core design, responsive UI and frontend engineering', hsn_sac: '998314', quantity: 1, unit: 'Milestone', rate: 50000, discount: 0, tax_rate: 18 }
    ],
    notes: 'Please quote invoice number in all communications. Payment via Bank Transfer or UPI.'
  });

  const statusTabs = [
    'All',
    'Draft',
    'Sent',
    'Viewed',
    'Payment Pending',
    'Partially Paid',
    'Paid',
    'Overdue',
    'Cancelled',
    'Payment Failed'
  ];

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoices({ status: statusFilter, search: searchTerm });
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [cliRes, numRes] = await Promise.all([
        api.getClients(),
        api.getNextInvoiceNumber()
      ]);
      if (cliRes.success) setClients(cliRes.clients);
      if (numRes.success) setNextInvNum(numRes.nextInvoiceNumber);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    loadDependencies();
  }, []);

  const handleOpenDetail = async (invId) => {
    try {
      const res = await api.getInvoice(invId);
      if (res.success) {
        setSelectedInvoice(res.invoice);
        setSendForm({
          to: res.invoice.client?.email || '',
          cc: 'accounts@' + (res.invoice.client?.email?.split('@')[1] || 'client.com'),
          subject: `Invoice ${res.invoice.invoice_number} – Redes Creation`,
          include_payment_link: true,
          attach_pdf: true
        });
      }
    } catch (e) {
      toast.error('Failed to load invoice details');
    }
  };

  // Payment Terms Auto Calculation
  const handlePaymentTermsChange = (terms) => {
    let days = 15;
    if (terms === 'Immediate') days = 0;
    else if (terms === '7 Days') days = 7;
    else if (terms === '15 Days') days = 15;
    else if (terms === '30 Days') days = 30;
    else if (terms === '45 Days') days = 45;

    const baseDate = new Date(newInvoiceData.invoice_date || Date.now());
    baseDate.setDate(baseDate.getDate() + days);
    setNewInvoiceData({
      ...newInvoiceData,
      payment_terms: terms,
      due_date: baseDate.toISOString().split('T')[0]
    });
  };

  // Add line item
  const addLineItem = () => {
    setNewInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { product_service: '', description: '', hsn_sac: '998314', quantity: 1, unit: 'Unit', rate: 0, discount: 0, tax_rate: 18 }
      ]
    }));
  };

  const removeLineItem = (idx) => {
    if (newInvoiceData.items.length <= 1) return;
    setNewInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateLineItem = (idx, field, val) => {
    setNewInvoiceData(prev => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, items: updated };
    });
  };

  // Edit Invoice State
  const [editInvoiceData, setEditInvoiceData] = useState({
    client_id: '',
    project: '',
    po_number: '',
    invoice_date: '',
    payment_terms: '15 Days',
    due_date: '',
    reverse_charge: 'No',
    notes: '',
    items: []
  });

  const handleOpenEditModal = () => {
    if (!selectedInvoice) return;
    setEditInvoiceData({
      client_id: selectedInvoice.client_id || selectedInvoice.client?.id || '',
      project: selectedInvoice.project || '',
      po_number: selectedInvoice.po_number || '',
      invoice_date: selectedInvoice.invoice_date || new Date().toISOString().split('T')[0],
      payment_terms: selectedInvoice.payment_terms || '15 Days',
      due_date: selectedInvoice.due_date || new Date().toISOString().split('T')[0],
      reverse_charge: selectedInvoice.reverse_charge ? 'Yes' : 'No',
      notes: selectedInvoice.notes || '',
      items: selectedInvoice.items && selectedInvoice.items.length > 0 ? selectedInvoice.items.map(it => ({
        product_service: it.product_service || '',
        description: it.description || '',
        hsn_sac: it.hsn_sac || '998314',
        quantity: it.quantity || 1,
        unit: it.unit || 'Nos',
        rate: it.rate || 0,
        discount: it.discount || 0,
        tax_rate: it.tax_rate !== undefined ? it.tax_rate : 18
      })) : [
        { product_service: '', description: '', hsn_sac: '998314', quantity: 1, unit: 'Nos', rate: 0, discount: 0, tax_rate: 18 }
      ]
    });
    setShowEditModal(true);
  };

  const handleEditPaymentTermsChange = (terms) => {
    let days = 15;
    if (terms === 'Immediate') days = 0;
    else if (terms === '7 Days') days = 7;
    else if (terms === '15 Days') days = 15;
    else if (terms === '30 Days') days = 30;
    else if (terms === '45 Days') days = 45;

    const baseDate = new Date(editInvoiceData.invoice_date || Date.now());
    baseDate.setDate(baseDate.getDate() + days);
    setEditInvoiceData({
      ...editInvoiceData,
      payment_terms: terms,
      due_date: baseDate.toISOString().split('T')[0]
    });
  };

  const addEditLineItem = () => {
    setEditInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { product_service: '', description: '', hsn_sac: '998314', quantity: 1, unit: 'Nos', rate: 0, discount: 0, tax_rate: 18 }
      ]
    }));
  };

  const removeEditLineItem = (idx) => {
    if (editInvoiceData.items.length <= 1) return;
    setEditInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateEditLineItem = (idx, field, val) => {
    setEditInvoiceData(prev => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, items: updated };
    });
  };

  const calculateEditModalTotals = () => {
    let sub = 0;
    let disc = 0;
    let tax = 0;
    (editInvoiceData.items || []).forEach(it => {
      const q = parseFloat(it.quantity || 1);
      const r = parseFloat(it.rate || 0);
      const d = parseFloat(it.discount || 0);
      const gross = q * r;
      const taxable = Math.max(0, gross - d);
      const t = (taxable * (parseFloat(it.tax_rate) || 18)) / 100;
      sub += gross;
      disc += d;
      tax += t;
    });
    return {
      subtotal: sub,
      discount: disc,
      taxable: sub - disc,
      tax: tax,
      total: (sub - disc) + tax
    };
  };

  const handleEditInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      const res = await api.updateInvoice(selectedInvoice.id, editInvoiceData);
      if (res.success) {
        setShowEditModal(false);
        fetchInvoices();
        handleOpenDetail(selectedInvoice.id);
        toast.success(`Invoice ${selectedInvoice.invoice_number} updated successfully!`);
      } else {
        toast.error(res.message || 'Error updating invoice');
      }
    } catch (e) {
      toast.error('Network error updating invoice');
    }
  };

  // Calculations for create modal preview
  const calculateModalTotals = () => {
    let sub = 0;
    let disc = 0;
    let tax = 0;
    newInvoiceData.items.forEach(it => {
      const q = parseFloat(it.quantity || 1);
      const r = parseFloat(it.rate || 0);
      const d = parseFloat(it.discount || 0);
      const gross = q * r;
      const taxable = Math.max(0, gross - d);
      const t = (taxable * (parseFloat(it.tax_rate) || 18)) / 100;
      sub += gross;
      disc += d;
      tax += t;
    });
    return {
      subtotal: sub,
      discount: disc,
      taxable: sub - disc,
      tax: tax,
      total: (sub - disc) + tax
    };
  };

  const modalTotals = calculateModalTotals();

  // Submit Create Invoice
  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createInvoice(newInvoiceData);
      if (res.success) {
        setShowCreateModal(false);
        fetchInvoices();
        handleOpenDetail(res.invoice.id);
        toast.success(`Invoice ${res.invoice.invoice_number} created successfully!`);
      } else {
        toast.error(res.message || 'Error creating invoice');
      }
    } catch (e) {
      toast.error(e.message || 'Network error');
    }
  };

  // Send Invoice
  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      const res = await api.sendInvoice(selectedInvoice.id, sendForm);
      if (res.success) {
        setShowSendModal(false);
        handleOpenDetail(selectedInvoice.id);
        fetchInvoices();
        toast.success(`Invoice ${selectedInvoice.invoice_number} sent via email successfully!`);
      }
    } catch (e) {
      toast.error('Error sending invoice');
    }
  };

  // Cancel Invoice
  const handleCancelInvoice = async () => {
    if (!selectedInvoice || !cancelReason.trim()) return;
    try {
      const res = await api.cancelInvoice(selectedInvoice.id, cancelReason);
      if (res.success) {
        setShowCancelModal(false);
        setCancelReason('');
        handleOpenDetail(selectedInvoice.id);
        fetchInvoices();
        toast.success(`Invoice ${selectedInvoice.invoice_number} cancelled.`);
      } else {
        toast.error(res.message || 'Failed to cancel invoice');
      }
    } catch (e) {
      toast.error('Error cancelling invoice');
    }
  };

  // Duplicate Invoice
  const handleDuplicateInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      const res = await api.duplicateInvoice(selectedInvoice.id);
      if (res.success) {
        fetchInvoices();
        handleOpenDetail(res.invoice.id);
        toast.success(`Invoice duplicated as ${res.invoice.invoice_number}`);
      }
    } catch (e) {
      toast.error('Error duplicating invoice');
    }
  };

  // Create Credit Note
  const handleCreateCreditNote = async () => {
    if (!selectedInvoice || !cnAmount) return;
    try {
      const res = await api.createCreditNote({
        invoice_id: selectedInvoice.id,
        amount: cnAmount,
        reason: cnReason
      });
      if (res.success) {
        setShowCreditNoteModal(false);
        setCnAmount('');
        handleOpenDetail(selectedInvoice.id);
        fetchInvoices();
        toast.success('Credit note issued successfully!');
      } else {
        toast.error(res.message || 'Failed to issue credit note');
      }
    } catch (e) {
      toast.error('Error creating credit note');
    }
  };

  // CEO Approve Invoice
  const handleApproveInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      const res = await api.approveInvoice(selectedInvoice.id);
      if (res.success) {
        toast.success(res.message || 'Invoice approved successfully!');
        handleOpenDetail(selectedInvoice.id);
        fetchInvoices();
      } else {
        toast.error(res.message || 'Failed to approve invoice');
      }
    } catch (e) {
      toast.error('Error approving invoice');
    }
  };

  // CEO Reject Invoice
  const handleRejectInvoice = async () => {
    if (!selectedInvoice) return;
    const reason = prompt('Please enter reason for rejecting approval (invoice will return to draft):', 'Requires budget revision');
    if (!reason) return;
    try {
      const res = await api.rejectInvoice(selectedInvoice.id, reason);
      if (res.success) {
        toast.warning(res.message || 'Invoice returned to draft.');
        handleOpenDetail(selectedInvoice.id);
        fetchInvoices();
      } else {
        toast.error(res.message || 'Failed to reject invoice');
      }
    } catch (e) {
      toast.error('Error rejecting invoice');
    }
  };

  // Record Payment Handlers (PRD Section 20 & 45)
  const handleOpenRecordPayment = () => {
    if (!selectedInvoice) return;
    setRecordPaymentForm({
      amount: selectedInvoice.amount_due || 0,
      payment_date: new Date().toISOString().split('T')[0],
      method: 'Bank Transfer',
      reference: `TXN-${Date.now().toString().slice(-6)}`,
      bank_name: 'HDFC Bank',
      cheque_number: '',
      notes: `Settlement for invoice ${selectedInvoice.invoice_number}`
    });
    setShowRecordPaymentModal(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const payAmt = parseFloat(recordPaymentForm.amount);
    if (!payAmt || payAmt <= 0) {
      toast.warning('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (payAmt > selectedInvoice.amount_due) {
      toast.warning(`Payment amount (₹${payAmt.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${selectedInvoice.amount_due.toLocaleString('en-IN')}).`);
      return;
    }

    try {
      const res = await api.recordPayment({
        invoice_id: selectedInvoice.id,
        client_id: selectedInvoice.client_id,
        amount: payAmt,
        payment_date: recordPaymentForm.payment_date,
        method: recordPaymentForm.method,
        reference: recordPaymentForm.reference || `TXN-${Date.now().toString().slice(-6)}`,
        bank_name: recordPaymentForm.bank_name,
        cheque_number: recordPaymentForm.cheque_number,
        notes: recordPaymentForm.notes
      });
      if (res.success) {
        setShowRecordPaymentModal(false);
        handleOpenDetail(selectedInvoice.id);
        fetchInvoices();
        toast.success(`Payment of ₹${payAmt.toLocaleString('en-IN')} recorded successfully! Receipt generated.`);
      } else {
        toast.error(res.message || 'Error recording payment');
      }
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  // Manual Reminder Handlers (PRD Section 24, 26, 45)
  const handleOpenReminderModal = () => {
    if (!selectedInvoice) return;
    setReminderCustomMessage(
      `Dear ${selectedInvoice.client?.name || 'Client'},\n\nThis is a friendly reminder that payment of ₹${(selectedInvoice.amount_due || 0).toLocaleString('en-IN')} for invoice ${selectedInvoice.invoice_number} is due on ${selectedInvoice.due_date}.\n\nPlease complete payment at your earliest convenience.`
    );
    setShowReminderModal(true);
  };

  const handleSendReminderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setReminderSending(true);
    try {
      const res = await api.sendManualReminder({
        invoice_id: selectedInvoice.id,
        custom_message: reminderCustomMessage
      });
      if (res.success) {
        setShowReminderModal(false);
        setReminderCustomMessage('');
        handleOpenDetail(selectedInvoice.id);
        toast.success(`Payment reminder dispatched to ${selectedInvoice.client?.email || 'client'} successfully.`);
      } else {
        toast.error(res.message || 'Error sending reminder');
      }
    } catch (err) {
      toast.error('Failed to dispatch reminder');
    } finally {
      setReminderSending(false);
    }
  };

  // Helper status badge styles
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Partially Paid':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Overdue':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending Approval':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold animate-pulse';
      case 'Viewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Cancelled':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Status Tabs & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-4xl">
          {statusTabs.map(tab => {
            const isActive = statusFilter.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1e293b] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Create Invoice Primary Button */}
        {currentUser?.role !== 'Client' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Invoice</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-3xl">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by invoice number, project or client name..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 shadow-sm"
        />
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-4 px-6">Invoice Number</th>
                <th className="py-4 px-6">Client / Project</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Due Date</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Paid / Due</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No invoices matching filter criteria.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-blue-700">
                      <button
                        onClick={() => handleOpenDetail(inv.id)}
                        className="hover:underline text-left"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 leading-snug">
                        {inv.client?.name || 'Client'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {inv.project}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {inv.invoice_date}
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {inv.due_date}
                    </td>

                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      ₹{inv.total?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-xs font-semibold text-emerald-700">
                        Paid: ₹{inv.amount_paid?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs font-semibold text-slate-600">
                        Due: ₹{inv.amount_due?.toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(inv.id)}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                          title="View Detail"
                        >
                          View
                        </button>
                        {inv.amount_due > 0 && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              const token = inv.secure_token || `tok_inv_${inv.id || 'demo'}`;
                              if (onOpenPortalLink) onOpenPortalLink(token);
                              else window.location.hash = `#portal-${token}`;
                            }}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Pay this invoice now"
                          >
                            <span>Pay Now</span>
                            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Drawer / Modal */}
      {selectedInvoice && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-end z-[9999] animate-fadeIn">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold font-mono text-slate-900">{selectedInvoice.invoice_number}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Client: {selectedInvoice.client?.name}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Bar (Required Actions from PRD Section 45!) */}
            <div className="p-4 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs font-bold">
              {/* CEO Approval Workflow for High-Value Invoices */}
              {selectedInvoice.status === 'Pending Approval' && (
                currentUser?.role === 'CEO' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApproveInvoice}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm font-bold"
                    >
                      <CheckCircle className="w-4 h-4 stroke-[3]" />
                      <span>Authorize & Approve Invoice</span>
                    </button>
                    <button
                      onClick={handleRejectInvoice}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold animate-pulse">
                    Awaiting CEO Executive Approval (₹1,00,000+ Threshold)
                  </span>
                )
              )}

              {/* Preview / Print */}
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Preview / Print PDF</span>
              </button>

              {/* Client-specific simplified actions */}
              {currentUser?.role === 'Client' ? (
                <>
                  {selectedInvoice.amount_due > 0 && selectedInvoice.status !== 'Cancelled' && (
                    <button
                      onClick={() => {
                        const token = selectedInvoice.secure_token || `tok_inv_${selectedInvoice.id || 'demo'}`;
                        if (onOpenPortalLink) onOpenPortalLink(token);
                        else window.location.hash = `#portal-${token}`;
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95 ml-auto cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 stroke-[3]" />
                      <span>Pay ₹{selectedInvoice.amount_due?.toLocaleString('en-IN')} Now</span>
                    </button>
                  )}
                </>
              ) : (
                /* Administrative / Finance team actions */
                <>
                  {/* Send Invoice Modal */}
                  {selectedInvoice.status !== 'Cancelled' && selectedInvoice.status !== 'Pending Approval' && (
                    <button
                      onClick={() => setShowSendModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Invoice Email</span>
                    </button>
                  )}

                  {/* Record Payment (PRD Section 45) */}
                  {selectedInvoice.amount_due > 0 && selectedInvoice.status !== 'Cancelled' && selectedInvoice.status !== 'Pending Approval' && (
                    <button
                      onClick={handleOpenRecordPayment}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm font-bold cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  )}

                  {/* Send Reminder (PRD Section 45) */}
                  {selectedInvoice.amount_due > 0 && selectedInvoice.status !== 'Cancelled' && selectedInvoice.status !== 'Draft' && selectedInvoice.status !== 'Pending Approval' && (
                    <button
                      onClick={handleOpenReminderModal}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl shadow-sm font-semibold cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Send Reminder</span>
                    </button>
                  )}

                  {/* Edit Invoice */}
                  {selectedInvoice.status !== 'Cancelled' && (
                    <button
                      onClick={handleOpenEditModal}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 shadow-sm font-semibold cursor-pointer active:scale-95 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Invoice</span>
                    </button>
                  )}

                  {/* Duplicate */}
                  <button
                    onClick={handleDuplicateInvoice}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 shadow-sm font-semibold cursor-pointer active:scale-95 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Duplicate</span>
                  </button>

                  {/* Create Credit Note */}
                  {selectedInvoice.status !== 'Cancelled' && (
                    <button
                      onClick={() => setShowCreditNoteModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 shadow-sm cursor-pointer"
                    >
                      <FileMinus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Credit Note</span>
                    </button>
                  )}

                  {/* Client Pay Page Link */}
                  <button
                    onClick={() => {
                      const token = selectedInvoice.secure_token || `tok_inv_${selectedInvoice.id || 'demo'}`;
                      if (onOpenPortalLink) onOpenPortalLink(token);
                      else window.location.hash = `#portal-${token}`;
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-sm ml-auto cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Client Pay Page</span>
                  </button>

                  {/* Cancel Invoice */}
                  {selectedInvoice.status !== 'Cancelled' && selectedInvoice.status !== 'Paid' && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl shadow-sm"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-500" />
                      <span>Cancel Invoice</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Body Info */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Financial Summary Card */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-xs text-slate-400">Total Invoice Amount</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">₹{selectedInvoice.total?.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Amount Paid</div>
                  <div className="text-lg font-extrabold text-emerald-700 mt-1">₹{selectedInvoice.amount_paid?.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Outstanding Balance</div>
                  <div className="text-lg font-extrabold text-rose-600 mt-1">₹{selectedInvoice.amount_due?.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Cancellation Reason alert if cancelled */}
              {selectedInvoice.status === 'Cancelled' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900">
                  <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Invoice Cancelled</span>
                  </div>
                  <div><strong>Reason:</strong> {selectedInvoice.cancellation_reason || 'Administrative cancellation'}</div>
                </div>
              )}

              {/* Dates & Client Information */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="space-y-2 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">Client Details</h4>
                  <div><strong className="text-slate-800">{selectedInvoice.client?.company_name || selectedInvoice.client?.name}</strong></div>
                  <div className="text-slate-500">{selectedInvoice.client?.billing_address}</div>
                  <div className="text-slate-600">GSTIN: <span className="font-mono font-semibold">{selectedInvoice.client?.gstin || 'N/A'}</span></div>
                  <div className="text-slate-600">Place of Supply: <span className="font-semibold">{selectedInvoice.client?.place_of_supply}</span></div>
                </div>

                <div className="space-y-2 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">Invoice Timeline & Terms</h4>
                  <div>Invoice Date: <span className="font-semibold text-slate-800">{selectedInvoice.invoice_date}</span></div>
                  <div>Due Date: <span className="font-semibold text-slate-800">{selectedInvoice.due_date}</span></div>
                  <div>Payment Terms: <span className="font-semibold text-slate-800">{selectedInvoice.payment_terms}</span></div>
                  <div>Project: <span className="font-semibold text-slate-800">{selectedInvoice.project}</span></div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Service / Product</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Rate</th>
                      <th className="py-2.5 px-3">Tax (18%)</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoice.items || []).map(it => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{it.product_service}</div>
                          <div className="text-[11px] text-slate-400">{it.description}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{it.quantity} {it.unit}</td>
                        <td className="py-2.5 px-3 text-slate-700">₹{it.rate?.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-slate-500">₹{it.tax_amount?.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{it.total?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Activity Timeline (PRD Section 29!) */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Invoice Activity Timeline</span>
                </h4>
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-8 text-xs">
                  {(selectedInvoice.timeline || []).map((tl, i) => (
                    <div key={tl.id || i} className="relative group">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white absolute -left-[27px] top-1"></div>
                      <div className="font-bold text-slate-800">{tl.action}</div>
                      <div className="text-[11px] text-slate-500">{tl.timestamp} · by {tl.user} ({tl.role})</div>
                      <div className="text-slate-600 mt-0.5">{tl.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Create Invoice */}
      {showCreateModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create New Invoice</h3>
                <p className="text-xs text-slate-500">Auto generated number: <strong className="font-mono text-blue-700">{nextInvNum || 'RC/2026-27/INV/0009'}</strong></p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              {/* Client & Project */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={newInvoiceData.client_id}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, client_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Select client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.place_of_supply})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Project / Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvoiceData.project}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, project: e.target.value })}
                    placeholder="e.g. ERP Backend Development"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Dates, Payment Terms & GST Options */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.invoice_date}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, invoice_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newInvoiceData.payment_terms}
                    onChange={(e) => handlePaymentTermsChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Immediate">Due Immediately</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.due_date}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, due_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reverse Charge (RCM)
                  </label>
                  <select
                    value={newInvoiceData.reverse_charge}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, reverse_charge: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="No">No (Normal)</option>
                    <option value="Yes">Yes (RCM Applicable)</option>
                  </select>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Line Items & GST Details</h4>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {newInvoiceData.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Product or Service name"
                          value={item.product_service}
                          onChange={(e) => updateLineItem(idx, 'product_service', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="HSN/SAC (998314)"
                          value={item.hsn_sac || '998314'}
                          onChange={(e) => updateLineItem(idx, 'hsn_sac', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="text"
                          placeholder="Unit"
                          value={item.unit || 'Unit'}
                          onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Rate (₹)"
                          value={item.rate}
                          onChange={(e) => updateLineItem(idx, 'rate', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          placeholder="Disc"
                          value={item.discount}
                          onChange={(e) => updateLineItem(idx, 'discount', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          title="Discount (₹)"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-9">
                        <input
                          type="text"
                          placeholder="Optional service details / milestone description..."
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={item.tax_rate ?? 18}
                          onChange={(e) => updateLineItem(idx, 'tax_rate', parseFloat(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                          <option value={18}>GST 18% (Standard)</option>
                          <option value={12}>GST 12%</option>
                          <option value={5}>GST 5%</option>
                          <option value={28}>GST 28%</option>
                          <option value={0}>GST 0% (Exempt)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{modalTotals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (CGST + SGST or IGST @ 18%):</span>
                  <span className="font-semibold">₹{modalTotals.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-blue-700">₹{modalTotals.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm"
                >
                  Generate Invoice & Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Edit Invoice (Full Manual Control over items, rates, taxes, client info, notes) */}
      {showEditModal && selectedInvoice && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  <span>Edit Invoice & Line Items</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">Invoice Number: <strong className="text-slate-800">{selectedInvoice.invoice_number}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditInvoiceSubmit} className="space-y-4">
              {/* Row 1: Client & Project */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={editInvoiceData.client_id}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, client_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company_name ? `(${c.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Project / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Website Development"
                    value={editInvoiceData.project_name}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, project_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    PO / Client Ref Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO# 98765"
                    value={editInvoiceData.po_number}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, po_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Dates, Terms & RCM */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editInvoiceData.invoice_date}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, invoice_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={editInvoiceData.payment_terms}
                    onChange={(e) => handleEditPaymentTermsChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Immediate">Due Immediately</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editInvoiceData.due_date}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, due_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reverse Charge (RCM)
                  </label>
                  <select
                    value={editInvoiceData.reverse_charge}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, reverse_charge: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="No">No (Normal)</option>
                    <option value="Yes">Yes (RCM Applicable)</option>
                  </select>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Line Items & Services (Editable)</h4>
                  <button
                    type="button"
                    onClick={addEditLineItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {(editInvoiceData.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Service / Product Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Website Development"
                          value={item.product_service}
                          onChange={(e) => updateEditLineItem(idx, 'product_service', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">HSN/SAC</label>
                        <input
                          type="text"
                          placeholder="998314"
                          value={item.hsn_sac || '998314'}
                          onChange={(e) => updateEditLineItem(idx, 'hsn_sac', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => updateEditLineItem(idx, 'quantity', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Unit</label>
                        <input
                          type="text"
                          placeholder="Nos"
                          value={item.unit || 'Nos'}
                          onChange={(e) => updateEditLineItem(idx, 'unit', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Rate (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Rate (₹)"
                          value={item.rate}
                          onChange={(e) => updateEditLineItem(idx, 'rate', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Disc (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={item.discount}
                          onChange={(e) => updateEditLineItem(idx, 'discount', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          title="Discount (₹)"
                        />
                      </div>
                      <div className="col-span-1 text-right pt-4">
                        <button
                          type="button"
                          onClick={() => removeEditLineItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-9">
                        <input
                          type="text"
                          placeholder="Detailed description / scope / milestones..."
                          value={item.description}
                          onChange={(e) => updateEditLineItem(idx, 'description', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={item.tax_rate ?? 18}
                          onChange={(e) => updateEditLineItem(idx, 'tax_rate', parseFloat(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                          <option value={18}>GST 18% (Standard)</option>
                          <option value={12}>GST 12%</option>
                          <option value={5}>GST 5%</option>
                          <option value={28}>GST 28%</option>
                          <option value={0}>GST 0% (Exempt)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Custom Notes / Instructions (Printed on PDF)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Please note bank coordinates and dispatch receipt upon transfer."
                  value={editInvoiceData.notes || ''}
                  onChange={(e) => setEditInvoiceData({ ...editInvoiceData, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Totals Summary */}
              {(() => {
                const totals = calculateEditModalTotals();
                return (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Total Discount:</span>
                        <span className="font-semibold text-rose-600">- ₹{totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Amount:</span>
                      <span className="font-semibold">₹{totals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST Taxes:</span>
                      <span className="font-semibold">₹{totals.tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                      <span>Updated Grand Total:</span>
                      <span className="text-blue-700">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  Save Changes & Update Invoice
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Send Invoice Email (PRD Section 12 & 13!) */}
      {showSendModal && selectedInvoice && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Send Invoice Email</h3>
                <p className="text-xs text-slate-500">{selectedInvoice.invoice_number}</p>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">To: *</label>
                <input
                  type="email"
                  value={sendForm.to}
                  onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">CC:</label>
                <input
                  type="email"
                  value={sendForm.cc}
                  onChange={(e) => setSendForm({ ...sendForm, cc: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject:</label>
                <input
                  type="text"
                  value={sendForm.subject}
                  onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              {/* Attachments & Link */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendForm.attach_pdf}
                    onChange={(e) => setSendForm({ ...sendForm, attach_pdf: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>✓ Invoice PDF ({selectedInvoice.invoice_number.replace(/\//g, '-')}.pdf)</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendForm.include_payment_link}
                    onChange={(e) => setSendForm({ ...sendForm, include_payment_link: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>✓ Include Secure Payment Link</span>
                </label>
              </div>

              {/* Email Body Template Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed max-h-36 overflow-y-auto font-mono">
                Dear {selectedInvoice.client?.name},<br/><br/>
                Greetings from Redes Creation.<br/>
                Please find attached invoice {selectedInvoice.invoice_number} for ₹{selectedInvoice.total?.toLocaleString('en-IN')}.<br/>
                Due Date: {selectedInvoice.due_date}<br/>
                Amount Due: ₹{selectedInvoice.amount_due?.toLocaleString('en-IN')}<br/><br/>
                Pay securely using the link provided.<br/>
                Regards, Accounts Team, Redes Creation
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvoice}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Invoice</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Cancel Invoice (PRD Section 31!) */}
      {showCancelModal && selectedInvoice && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <Ban className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-slate-900">Cancel Invoice</h3>
            </div>
            <p className="text-xs text-slate-500">
              In accordance with financial compliance rules, issued invoices are not deleted. Cancellation will preserve full audit logs.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mandatory Cancellation Reason *
              </label>
              <textarea
                rows="3"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Incorrect client billing details or revised scope requested."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                disabled={!cancelReason.trim()}
                onClick={handleCancelInvoice}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Create Credit Note */}
      {showCreditNoteModal && selectedInvoice && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Create Credit Note</h3>
              <button
                onClick={() => setShowCreditNoteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Against Invoice</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedInvoice.invoice_number} (Outstanding: ₹${selectedInvoice.amount_due})`}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Credit Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cnAmount}
                  onChange={(e) => setCnAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reason *</label>
                <select
                  value={cnReason}
                  onChange={(e) => setCnReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Billing correction">Billing correction</option>
                  <option value="Discount adjustment">Discount adjustment</option>
                  <option value="Cancellation">Cancellation</option>
                  <option value="Refund">Refund</option>
                  <option value="Duplicate invoice">Duplicate invoice</option>
                  <option value="Service adjustment">Service adjustment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCreditNoteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCreditNote}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Issue Credit Note
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Printable A4 Document Preview */}
      {showPrintModal && selectedInvoice && (() => {
        const isIntraState = !selectedInvoice.client?.state || 
          selectedInvoice.client?.state?.toLowerCase().includes('madhya pradesh') || 
          selectedInvoice.client?.state?.toLowerCase().includes('mp');
        const totalTax = Number(selectedInvoice.tax_total || 0);
        const cgst = isIntraState ? totalTax / 2 : 0;
        const sgst = isIntraState ? totalTax / 2 : 0;
        const igst = !isIntraState ? totalTax : 0;
        const taxableAmount = Number(selectedInvoice.taxable_amount || 0);
        const discountAmount = Number(selectedInvoice.discount_total || 0);
        const subtotal = taxableAmount + discountAmount;
        const grandTotal = Number(selectedInvoice.total || 0);

        return ReactDOM.createPortal(
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] overflow-y-auto p-3 sm:p-5 flex justify-center items-start animate-fadeIn">
            <div className="w-full max-w-[820px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-3 sm:my-6 animate-scaleUp">
              
              {/* Top Toolbar */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white font-black flex items-center justify-center text-xs shadow-xs">
                    RC
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">Tax Invoice Preview (A4 Branded)</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Official GST Compliant Invoice · {selectedInvoice.invoice_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-[#0B2545] hover:bg-[#13335e] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                    title="Close preview"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Printable Content Area (Exact A4 Corporate Invoice - Image 2) */}
              <div id="printable-document" className="p-4 sm:p-6 print:p-0 bg-white space-y-2.5 print:space-y-2 text-slate-800 text-[10px] leading-normal font-sans">
                
                {/* 1. Header: Brand Logo & Company Info (Left) vs Invoice Details Card (Right) */}
                <div className="print-page-break-avoid flex flex-row items-start justify-between border-b border-slate-200 pb-2.5 gap-3">
                  
                  {/* Left: Brand Identity */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 100 100" className="w-10 h-10">
                          <path d="M15 15 L52 15 C68 15, 80 25, 80 40 C80 52, 71 61, 58 64 L82 88 L62 88 L42 66 L32 66 L32 88 L15 88 Z" fill="#0B2545" />
                          <path d="M32 30 L50 30 C58 30, 64 34, 64 40 C64 46, 58 50, 50 50 L32 50 Z" fill="#ffffff" />
                          <path d="M48 66 L68 88 L84 88 L60 60 Z" fill="#1E5AA8" opacity="0.9" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-base font-black text-[#0B2545] tracking-tight uppercase leading-none">{masterSettings?.company_name || 'REDES CREATION'}</h1>
                        <p className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">{masterSettings?.tagline || 'IT & DIGITAL SOLUTIONS'}</p>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-600 space-y-0.5 pt-0.5 leading-snug">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#0B2545] shrink-0" />
                        <span>{masterSettings?.address || '403, Aashirwad Complex, Geeta Bhawan Square, Indore, Madhya Pradesh, 452001, India'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#0B2545] shrink-0" />
                        <span>{masterSettings?.phone || '+91 73540 05000'}</span>
                        <span className="text-slate-300">|</span>
                        <Mail className="w-3 h-3 text-[#0B2545] shrink-0" />
                        <span>{masterSettings?.email || 'info@redescreation.com'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-[#0B2545] shrink-0" />
                        <span>{masterSettings?.website || 'www.redescreation.com'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Large INVOICE Title & Metadata Table */}
                  <div className="text-right space-y-1 shrink-0">
                    <div>
                      <div className="text-xl font-black text-[#0B2545] tracking-tight uppercase">INVOICE</div>
                      <div className="text-[8px] font-bold text-slate-500 tracking-[0.18em] uppercase">BUILDING BRANDS DIGITALLY</div>
                    </div>

                    <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2 text-[9px] space-y-0.5 w-56 text-left shadow-2xs">
                      <div className="flex justify-between"><span className="text-slate-500">Invoice No.</span> <span className="font-mono font-bold text-slate-900">: {selectedInvoice.invoice_number}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Invoice Date</span> <span className="font-semibold text-slate-800">: {selectedInvoice.invoice_date}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Due Date</span> <span className="font-semibold text-slate-800">: {selectedInvoice.due_date}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Payment Terms</span> <span className="font-semibold text-slate-800">: {selectedInvoice.payment_terms || '15 Days'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Project</span> <span className="font-semibold text-slate-800 truncate max-w-[110px]">: {selectedInvoice.project_name || selectedInvoice.items?.[0]?.product_service || 'Website Development'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Client Ref.</span> <span className="font-semibold text-slate-800">: {selectedInvoice.po_number || 'PO# 12345'}</span></div>
                    </div>
                  </div>

                </div>

                {/* 2. BILL TO & SHIP TO (Two Rounded Cards Side-by-Side) */}
                <div className="print-page-break-avoid grid grid-cols-2 gap-2 text-[9.5px]">
                  
                  {/* BILL TO */}
                  <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-2 space-y-0.5">
                    <div className="text-[9px] font-bold text-sky-800 uppercase tracking-wider mb-0.5">BILL TO</div>
                    <div className="font-extrabold text-slate-900 text-[11px]">{selectedInvoice.client?.company_name || selectedInvoice.client?.name}</div>
                    <div className="text-slate-700 font-medium">{selectedInvoice.client?.contact_person || selectedInvoice.client?.name || 'Authorized Representative'}</div>
                    <div className="text-slate-600 leading-snug">{selectedInvoice.client?.billing_address || 'Business Park, Vijay Nagar, Indore, MP, 452010'}</div>
                    <div className="text-slate-700 pt-0.5"><strong>GSTIN:</strong> <span className="font-mono font-bold text-slate-900">{selectedInvoice.client?.gstin || '23ABCDE1234F1Z5'}</span></div>
                    <div className="text-slate-700"><strong>Email:</strong> {selectedInvoice.client?.email || 'accounts@client.com'} · <strong>Phone:</strong> {selectedInvoice.client?.phone || '+91 98260 12345'}</div>
                  </div>

                  {/* SHIP TO (If Different) */}
                  <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-2 space-y-0.5">
                    <div className="text-[9px] font-bold text-sky-800 uppercase tracking-wider mb-0.5">SHIP TO / PLACE OF SUPPLY</div>
                    <div className="font-extrabold text-slate-900 text-[11px]">{selectedInvoice.client?.company_name || selectedInvoice.client?.name}</div>
                    <div className="text-slate-600 leading-snug">{selectedInvoice.client?.billing_address || 'Business Park, Vijay Nagar, Indore, MP, 452010'}</div>
                    <div className="text-slate-700 pt-0.5"><strong>State:</strong> {selectedInvoice.client?.state || 'Madhya Pradesh'} ({selectedInvoice.client?.state_code || '23'})</div>
                    <div className="text-slate-700"><strong>Place of Supply:</strong> {selectedInvoice.client?.place_of_supply || selectedInvoice.client?.state || 'Madhya Pradesh'}</div>
                    <div className="text-slate-700"><strong>GSTIN:</strong> <span className="font-mono font-bold text-slate-900">{selectedInvoice.client?.gstin || '23ABCDE1234F1Z5'}</span></div>
                  </div>

                </div>

                {/* 3. Line Items Table with Dark Navy Header */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-[9.5px] border-collapse">
                    <thead className="bg-[#0B2545] text-white font-bold uppercase text-[8.5px] tracking-wider">
                      <tr>
                        <th className="py-1.5 px-2 text-center w-8">#</th>
                        <th className="py-1.5 px-2">Description</th>
                        <th className="py-1.5 px-2 text-center w-20">HSN/SAC</th>
                        <th className="py-1.5 px-2 text-center w-10">Qty</th>
                        <th className="py-1.5 px-2 text-center w-12">Unit</th>
                        <th className="py-1.5 px-2 text-right w-20">Rate (₹)</th>
                        <th className="py-1.5 px-2 text-right w-16">Discount</th>
                        <th className="py-1.5 px-2 text-center w-14">Tax</th>
                        <th className="py-1.5 px-2 text-right w-24">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(selectedInvoice.items || []).map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-1 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-1 px-2">
                            <div className="font-bold text-slate-900 text-[10px]">{it.product_service}</div>
                            {it.description && <div className="text-[8.5px] text-slate-500 leading-tight">{it.description}</div>}
                          </td>
                          <td className="py-1 px-2 text-center font-mono text-[9px] text-slate-600">{it.hsn_sac || '998313'}</td>
                          <td className="py-1 px-2 text-center text-slate-700 font-medium">{it.quantity}</td>
                          <td className="py-1 px-2 text-center text-slate-600">{it.unit || 'Nos'}</td>
                          <td className="py-1 px-2 text-right font-medium tabular-nums text-slate-800">
                            {Number(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-1 px-2 text-right font-medium tabular-nums text-slate-500">
                            {Number(it.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-1 px-2 text-center font-medium text-slate-700">
                            {it.tax_rate || 18}% GST
                          </td>
                          <td className="py-1 px-2 text-right font-bold tabular-nums text-slate-950">
                            {Number(it.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Totals Breakdown & Amount in Words Banner */}
                <div className="print-page-break-avoid space-y-1">
                  <div className="flex justify-end text-[9.5px]">
                    <div className="w-64 space-y-0.5">
                      <div className="flex justify-between items-center py-0.5 text-slate-600">
                        <span>Subtotal</span>
                        <span className="font-semibold tabular-nums text-slate-900">₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center py-0.5 text-slate-600">
                          <span>Total Discount</span>
                          <span className="font-semibold tabular-nums text-rose-600">- ₹ {discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-0.5 text-slate-600 border-t border-slate-100">
                        <span>Taxable Amount</span>
                        <span className="font-semibold tabular-nums text-slate-900">₹ {taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      {isIntraState ? (
                        <>
                          <div className="flex justify-between items-center py-0.5 text-slate-600">
                            <span>CGST @ 9%</span>
                            <span className="font-semibold tabular-nums text-slate-900">₹ {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 text-slate-600">
                            <span>SGST @ 9%</span>
                            <span className="font-semibold tabular-nums text-slate-900">₹ {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center py-0.5 text-slate-600">
                          <span>IGST @ 18%</span>
                          <span className="font-semibold tabular-nums text-slate-900">₹ {igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {/* Total Amount (INR) Solid Navy Banner */}
                      <div className="bg-[#0B2545] text-white py-1 px-2.5 rounded-lg flex items-center justify-between font-bold text-[10.5px] mt-0.5 shadow-xs">
                        <span>Total Amount (INR)</span>
                        <span className="text-xs font-black tabular-nums">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Full-width Amount in Words Banner */}
                  <div className="bg-sky-50/60 border border-sky-100 rounded-lg px-2.5 py-1 text-[9px] text-slate-700 flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">Amount in Words:</span>
                    <span className="font-semibold text-slate-800">{numberToWords(grandTotal)}</span>
                  </div>
                </div>

                {/* 5. Payment Details, Scan & Pay (UPI) + QR, Notes (3 Columns Side-by-Side) */}
                <div className="print-page-break-avoid grid grid-cols-12 gap-2 pt-0.5 text-[9px]">
                  
                  {/* Column 1: Payment Details */}
                  <div className="col-span-5 space-y-0.5">
                    <div className="font-bold text-slate-900 text-[9.5px] mb-0.5">Payment Details</div>
                    <div className="flex justify-between"><span className="text-slate-500">Account Name</span> <span className="font-semibold text-slate-800">: {masterSettings?.account_name || masterSettings?.company_name || 'Redes Creation'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Bank Name</span> <span className="font-semibold text-slate-800">: {masterSettings?.bank_name || 'HDFC Bank'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Account Number</span> <span className="font-mono font-bold text-slate-900">: {masterSettings?.account_number || '50200088991122'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">IFSC Code</span> <span className="font-mono font-bold text-slate-900">: {masterSettings?.ifsc || 'HDFC0001234'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Branch</span> <span className="font-semibold text-slate-800">: {masterSettings?.branch || 'Vijay Nagar, Indore'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">UPI ID</span> <span className="font-mono font-bold text-blue-700">: {masterSettings?.upi_id || 'redescreation@hdfcbank'}</span></div>
                  </div>

                  {/* Column 2: Scan & Pay (UPI) + QR */}
                  <div className="col-span-3 flex flex-col items-center justify-center text-center p-1 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-900 text-[9px] mb-0.5">Scan & Pay (UPI)</div>
                    <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center">
                      <QRCodeSVG
                        value={`upi://pay?pa=${masterSettings?.upi_id || 'redescreation@hdfcbank'}&pn=${encodeURIComponent(masterSettings?.company_name || 'Redes Creation')}&am=${selectedInvoice.amount_due > 0 ? selectedInvoice.amount_due : selectedInvoice.total}&cu=INR&tn=${encodeURIComponent(selectedInvoice.invoice_number)}`}
                        size={48}
                        bgColor="#ffffff"
                        fgColor="#0B2545"
                        level="M"
                      />
                    </div>
                    {/* UPI Brand Badges */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="px-1 py-0.2 rounded bg-sky-100 text-[#0B2545] font-black text-[7px]">Paytm</span>
                      <span className="px-1 py-0.2 rounded bg-purple-100 text-purple-800 font-black text-[7px]">पे</span>
                      <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-black text-[7px]">GPay</span>
                    </div>
                  </div>

                  {/* Column 3: Notes */}
                  <div className="col-span-4 space-y-0.5">
                    <div className="font-bold text-slate-900 text-[9.5px] mb-0.5">Notes</div>
                    {selectedInvoice.notes ? (
                      <div className="text-slate-700 whitespace-pre-wrap leading-snug bg-slate-50/50 p-1 rounded-lg border border-slate-100 text-[8.5px]">
                        {selectedInvoice.notes}
                      </div>
                    ) : (
                      <ul className="space-y-0.5 text-slate-600 list-disc list-inside leading-snug text-[8.5px]">
                        <li>Please make payment on or before due date.</li>
                        <li>Mention invoice number in payment reference.</li>
                        <li>Computer generated, no signature required.</li>
                      </ul>
                    )}
                  </div>

                </div>

                {/* 6. Terms & Conditions, Thank You! & Official Circular Seal (Side-by-Side) */}
                <div className="print-page-break-avoid grid grid-cols-12 gap-2 pt-1.5 border-t border-slate-200 items-end text-[8.5px]">
                  
                  {/* Left: Terms & Conditions */}
                  <div className="col-span-7 space-y-0.5 text-slate-600">
                    <div className="font-bold text-slate-900 text-[9px] uppercase tracking-wider mb-0.5">Terms & Conditions</div>
                    <div>1. Payment should be made within the due date mentioned above.</div>
                    <div>2. Late payments may attract interest as per company policy.</div>
                    <div>3. All services are non-refundable once work has commenced.</div>
                    <div>4. Statutory GST applicable as per government regulations.</div>
                  </div>

                  {/* Right: Thank You! Script & Circular Seal */}
                  <div className="col-span-5 flex items-center justify-end gap-2.5">
                    <div className="text-right">
                      <div className="text-lg font-serif italic font-black text-[#0B2545] leading-none">Thank You!</div>
                      <div className="text-[8.5px] font-semibold text-slate-500 mt-0.5">For Your Business</div>
                    </div>

                    {/* Official Company Seal Badge */}
                    <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-[#0B2545]/60 p-0.5 flex items-center justify-center shrink-0">
                      <div className="w-full h-full rounded-full border border-[#0B2545] flex flex-col items-center justify-center p-0.5 text-center bg-sky-50/20">
                        <span className="text-[5px] font-black tracking-widest text-[#0B2545] uppercase leading-none">REDES CREATION</span>
                        <div className="w-3.5 h-3.5 my-0.2">
                          <svg viewBox="0 0 100 100" className="w-3.5 h-3.5">
                            <path d="M15 15 L52 15 C68 15, 80 25, 80 40 C80 52, 71 61, 58 64 L82 88 L62 88 L42 66 L32 66 L32 88 L15 88 Z" fill="#0B2545" />
                            <path d="M32 30 L50 30 C58 30, 64 34, 64 40 C64 46, 58 50, 50 50 L32 50 Z" fill="#ffffff" />
                          </svg>
                        </div>
                        <span className="text-[4.5px] font-bold tracking-tight text-[#0B2545] uppercase leading-none">IT & DIGITAL</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Modal: Record Payment (PRD Section 20 & 45) */}
      {showRecordPaymentModal && selectedInvoice && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Record Payment</h3>
                <p className="text-xs text-slate-500 font-mono font-semibold">{selectedInvoice.invoice_number}</p>
              </div>
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Balances Pill Banner */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Invoice Total</span>
                <span className="font-extrabold text-slate-900 text-sm">₹{selectedInvoice.total?.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-bold block uppercase">Paid So Far</span>
                <span className="font-extrabold text-emerald-700 text-sm">₹{selectedInvoice.amount_paid?.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 font-bold block uppercase">Balance Due</span>
                <span className="font-extrabold text-rose-700 text-sm">₹{selectedInvoice.amount_due?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Amount to Record (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedInvoice.amount_due}
                    required
                    value={recordPaymentForm.amount}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={recordPaymentForm.payment_date}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, payment_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Payment Method *</label>
                  <select
                    value={recordPaymentForm.method}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, method: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI (Google Pay/PhonePe/BHIM)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Payment Gateway">Payment Gateway</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">UTR / Transaction ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR12345678"
                    value={recordPaymentForm.reference}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, reference: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, ICICI Bank"
                    value={recordPaymentForm.bank_name}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, bank_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                {recordPaymentForm.method === 'Cheque' ? (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Cheque Number</label>
                    <input
                      type="text"
                      placeholder="Cheque No."
                      value={recordPaymentForm.cheque_number}
                      onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, cheque_number: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Received By</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.name || 'Finance User'}
                      className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Payment Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Additional notes for receipt..."
                  value={recordPaymentForm.notes}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Send Reminder (PRD Section 24, 26 & 45) */}
      {showReminderModal && selectedInvoice && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Send Payment Reminder</h3>
                <p className="text-xs text-slate-500">Invoice: <strong className="font-mono text-blue-700">{selectedInvoice.invoice_number}</strong></p>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
                <div className="flex justify-between">
                  <span>Client Recipient:</span>
                  <strong className="text-slate-900">{selectedInvoice.client?.name} ({selectedInvoice.client?.email || 'N/A'})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <strong>{selectedInvoice.due_date}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding Balance:</span>
                  <strong className="text-rose-700">₹{selectedInvoice.amount_due?.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reminder Email Message:</label>
                <textarea
                  rows={6}
                  value={reminderCustomMessage}
                  onChange={(e) => setReminderCustomMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Includes client payment link and invoice reference automatically.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reminderSending}
                  onClick={handleSendReminderSubmit}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
                >
                  {reminderSending ? (
                    <span>Dispatching...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Reminder Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
