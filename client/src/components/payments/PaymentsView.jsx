import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle2, AlertCircle, FileText, ArrowRight, Check, X, 
  ShieldAlert, ShieldCheck, CreditCard, Banknote, Calendar, Copy, 
  ExternalLink, Filter, TrendingUp, Clock, Sparkles, Building2, User
} from 'lucide-react';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import { toast } from '../common/Toast';

export default function PaymentsView({ currentUser, onOpenInvoice, actionTrigger }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('All payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [invoicesList, setInvoicesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (actionTrigger > 0) {
      setShowRecordModal(true);
    }
  }, [actionTrigger]);

  // Form State for Record Payment
  const [formData, setFormData] = useState({
    invoice_id: '',
    client_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'Bank Transfer',
    reference: '',
    bank_name: 'HDFC Bank',
    cheque_number: '',
    notes: '',
    verification_status: 'Verified'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-invoice allocation support
  const [useMultiAllocation, setUseMultiAllocation] = useState(false);
  const [allocationItems, setAllocationItems] = useState([]);

  const subTabs = ['All payments', 'Online payments', 'Manual payments', 'Reconciliation'];

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPayments({ tab: activeSubTab, search: searchTerm });
      if (res.success) {
        setPayments(res.payments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [invRes, cliRes] = await Promise.all([
        api.getInvoices({ status: 'All' }),
        api.getClients()
      ]);
      if (invRes.success) setInvoicesList(invRes.invoices.filter(i => i.amount_due > 0));
      if (cliRes.success) setClientsList(cliRes.clients);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [activeSubTab, searchTerm]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const handleVerify = async (paymentId, currentStatus) => {
    const nextStatus = currentStatus === 'Unverified' || currentStatus === 'Received' 
      ? 'Verified' 
      : 'Reconciled';
    try {
      const res = await api.verifyPayment(paymentId, nextStatus);
      if (res.success) {
        fetchPayments();
        toast.success(`Payment status updated to ${nextStatus}`);
      }
    } catch (e) {
      toast.error('Failed to update verification status');
    }
  };

  const handleInvoiceChange = (invId) => {
    const selectedInv = invoicesList.find(i => i.id === invId);
    if (selectedInv) {
      setFormData(prev => ({
        ...prev,
        invoice_id: invId,
        client_id: selectedInv.client_id,
        amount: selectedInv.amount_due
      }));
    } else {
      setFormData(prev => ({ ...prev, invoice_id: invId }));
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = { ...formData };
      if (useMultiAllocation && allocationItems.length > 0) {
        payload.allocations = allocationItems;
        payload.invoice_id = null;
      }

      const res = await api.recordPayment(payload);
      if (res.success) {
        setShowRecordModal(false);
        setFormData({
          invoice_id: '',
          client_id: '',
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          method: 'Bank Transfer',
          reference: '',
          bank_name: 'HDFC Bank',
          cheque_number: '',
          notes: '',
          verification_status: 'Verified'
        });
        fetchPayments();
        loadReferenceData();
      } else {
        setFormError(res.message || 'Error recording payment');
      }
    } catch (err) {
      setFormError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter payments by method if selected
  const filteredPayments = payments.filter(p => {
    if (methodFilter === 'All') return true;
    return p.method?.toLowerCase() === methodFilter.toLowerCase();
  });

  // Calculate high-level KPI summary
  const totalAmount = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const reconciledList = payments.filter(p => p.verification_status === 'Reconciled');
  const reconciledAmount = reconciledList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const pendingCount = payments.filter(p => p.verification_status !== 'Reconciled').length;
  const onlineCount = payments.filter(p => ['upi', 'payment gateway', 'netbanking'].includes((p.method || '').toLowerCase())).length;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 4 Executive KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Collected</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5 font-medium">
            <span>{payments.length} total transactions</span>
          </div>
        </div>

        {/* Reconciled with Bank */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Reconciled</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            ₹{reconciledAmount.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1.5 font-semibold">
            <span>{reconciledList.length} verified in bank records</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Needs Review</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {pendingCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-1.5 font-semibold">
            <span>Awaiting reconciliation</span>
          </div>
        </div>

        {/* Online / Instant Gateway */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Digital / UPI</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {onlineCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-purple-600 mt-1.5 font-semibold">
            <span>UPI & Instant Transfers</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70 w-fit overflow-x-auto">
          {subTabs.map(tab => {
            const isActive = activeSubTab === tab;
            let count = payments.length;
            if (tab === 'Online payments') {
              count = payments.filter(p => ['upi', 'payment gateway', 'netbanking'].includes((p.method || '').toLowerCase())).length;
            } else if (tab === 'Manual payments') {
              count = payments.filter(p => ['bank transfer', 'cheque', 'cash'].includes((p.method || '').toLowerCase())).length;
            } else if (tab === 'Reconciliation') {
              count = payments.filter(p => p.verification_status === 'Reconciled').length;
            }

            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side filter selector */}
        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="All">All Methods</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="NetBanking">NetBanking</option>
            <option value="UPI">UPI</option>
            <option value="Payment Gateway">Payment Gateway</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by payment reference, UTR, or client name..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 shadow-2xs"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-4 px-6">Reference / UTR</th>
                <th className="py-4 px-6">Client & Invoice</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Method</th>
                <th className="py-4 px-6">Amount Received</th>
                <th className="py-4 px-6 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading financial transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-1">
                      <CreditCard className="w-8 h-8 text-slate-300 mb-1" />
                      <div className="font-bold text-slate-600">No payment records found</div>
                      <div className="text-xs text-slate-400">Try changing your search term or sub-tab filter.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* REFERENCE */}
                    <td className="py-4 px-6 font-semibold">
                      <button
                        onClick={() => setSelectedPaymentDetail(p)}
                        className="text-blue-700 hover:text-blue-900 font-mono font-bold tracking-tight text-left flex items-center gap-1.5 cursor-pointer group-hover:underline"
                        title="Click to view transaction voucher"
                      >
                        <span>{p.reference}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                      </button>
                    </td>

                    {/* CLIENT / INVOICE */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 leading-snug">
                        {p.client_name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">
                          {p.invoice_number || 'Multiple / Advance'}
                        </span>
                      </div>
                    </td>

                    {/* DATE */}
                    <td className="py-4 px-6 text-slate-600 font-medium text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{p.payment_date_formatted || p.payment_date}</span>
                      </div>
                    </td>

                    {/* METHOD */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {p.method}
                      </span>
                    </td>

                    {/* AMOUNT */}
                    <td className="py-4 px-6 font-extrabold text-slate-900 text-base">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>

                    {/* VERIFICATION BADGE / BUTTON */}
                    <td className="py-4 px-6 text-right">
                      {currentUser?.role === 'Client' ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          p.verification_status === 'Reconciled'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : p.verification_status === 'Verified'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {p.verification_status === 'Reconciled' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                          <span>{p.verification_status || 'Received'}</span>
                        </span>
                      ) : p.verification_status === 'Reconciled' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Reconciled</span>
                        </span>
                      ) : p.verification_status === 'Verified' ? (
                        <button
                          onClick={() => handleVerify(p.id, 'Verified')}
                          title="Click to reconcile against bank statement"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-950 hover:bg-emerald-100 hover:text-emerald-900 border border-amber-300 transition-all cursor-pointer shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>Mark reconciled</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(p.id, 'Unverified')}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-amber-100 border border-slate-300 transition-all cursor-pointer shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span>Verify now</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record Payment"
        subtitle="Record manual bank transfer, UPI or gateway settlement"
        maxWidth="max-w-xl"
      >
        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleRecordPayment} className="space-y-4">
          {/* Select target invoice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Target Invoice (With Outstanding Balance)
            </label>
            <select
              value={formData.invoice_id}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Select Invoice to settle...</option>
              {invoicesList.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {(typeof inv.invoice_number === 'string' ? inv.invoice_number : 'INV-DOC')} — {inv.client?.name || inv.client_name || 'Client'} (Due: ₹{Number(inv.amount_due || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {/* Select Client if no invoice selected */}
          {!formData.invoice_id && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Client Name
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Select Client...</option>
                {clientsList.map(cli => (
                  <option key={cli.id} value={cli.id}>{cli.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 70000"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Payment Method & Transaction Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Method *
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="NetBanking">NetBanking</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Payment Gateway">Payment Gateway</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reference / UTR / Tx ID *
              </label>
              <input
                type="text"
                required
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="e.g. HDFC/0904/7712"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Bank Name & Verification */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bank / Depository
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="HDFC Bank"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Verification Stage
              </label>
              <select
                value={formData.verification_status}
                onChange={(e) => setFormData({ ...formData, verification_status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Verified">Verified (Ready for receipt)</option>
                <option value="Reconciled">Reconciled</option>
                <option value="Unverified">Unverified (Pending check)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Payment Notes / Reference Details
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional internal remarks..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRecordModal(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment & Generate Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transaction Details Modal (Ultra-Premium Redesign via Modal Portal) */}
      <Modal
        isOpen={!!selectedPaymentDetail}
        onClose={() => setSelectedPaymentDetail(null)}
        title="Transaction Voucher"
        subtitle={selectedPaymentDetail ? `Ref: ${selectedPaymentDetail.reference}` : ''}
        maxWidth="max-w-lg"
      >
        {selectedPaymentDetail && (
          <div className="space-y-4">
            {/* Hero Amount Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-[#131b2e] rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Settled Amount
                </span>
                <div className="text-3xl font-black tracking-tight text-white">
                  ₹{Number(selectedPaymentDetail.amount)?.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  selectedPaymentDetail.verification_status === 'Reconciled'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : selectedPaymentDetail.verification_status === 'Verified'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>{selectedPaymentDetail.verification_status || 'Received'}</span>
                </span>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  {selectedPaymentDetail.method}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Reference */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">UTR / Reference</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-blue-700 truncate pr-1">
                    {selectedPaymentDetail.reference}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPaymentDetail.reference)}
                    title="Copy Reference"
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Client */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Client Account</span>
                <span className="font-bold text-slate-900 mt-1 truncate">
                  {selectedPaymentDetail.client_name}
                </span>
              </div>

              {/* Invoice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Allocated Invoice</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-semibold text-slate-800 truncate">
                    {selectedPaymentDetail.invoice_number || 'Advance / Milestone'}
                  </span>
                  {selectedPaymentDetail.invoice_id && onOpenInvoice && (
                    <button
                      onClick={() => {
                        onOpenInvoice(selectedPaymentDetail.invoice_id);
                        setSelectedPaymentDetail(null);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Payment Date</span>
                <span className="font-semibold text-slate-800 mt-1">
                  {selectedPaymentDetail.payment_date_formatted || selectedPaymentDetail.payment_date}
                </span>
              </div>
            </div>

            {/* Bank & Notes */}
            {selectedPaymentDetail.bank_name && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                <span className="text-slate-500 font-medium">Bank Depository:</span>
                <span className="font-semibold text-slate-800">{selectedPaymentDetail.bank_name}</span>
              </div>
            )}

            {selectedPaymentDetail.notes && (
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-600">
                <strong className="text-slate-700 block mb-0.5">Notes:</strong>
                <span>{selectedPaymentDetail.notes}</span>
              </div>
            )}

            {/* Action Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => copyToClipboard(
                  `Payment Ref: ${selectedPaymentDetail.reference} | Client: ${selectedPaymentDetail.client_name} | Amount: ₹${selectedPaymentDetail.amount} | Date: ${selectedPaymentDetail.payment_date}`
                )}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRef ? 'Copied' : 'Copy Voucher'}</span>
              </button>
              <button
                onClick={() => setSelectedPaymentDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
