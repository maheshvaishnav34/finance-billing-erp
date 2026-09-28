import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Users,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Receipt,
  FileMinus,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';

export default function ClientsView({ currentUser, actionTrigger }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [modalTab, setModalTab] = useState('overview'); // overview, invoices, payments, receipts, creditNotes
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (actionTrigger > 0) {
      setShowCreateModal(true);
    }
  }, [actionTrigger]);

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    billing_address: '',
    gstin: '',
    pan: '',
    state: 'Madhya Pradesh',
    country: 'India',
    place_of_supply: '23-Madhya Pradesh',
    currency: 'INR',
    default_payment_terms: '15 Days',
    default_due_days: 15,
    preferred_payment_method: 'Bank Transfer'
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.getClients();
      if (res.success) setClients(res.clients || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setModalTab('overview');
    setLoadingHistory(true);
    try {
      const res = await api.getClient(client.id);
      if (res.success) {
        setClientHistory(res);
      }
    } catch (e) {
      console.error('Failed to load client history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createClient(formData);
      if (res.success) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          company_name: '',
          contact_person: '',
          email: '',
          phone: '',
          billing_address: '',
          gstin: '',
          pan: '',
          state: 'Madhya Pradesh',
          country: 'India',
          place_of_supply: '23-Madhya Pradesh',
          currency: 'INR',
          default_payment_terms: '15 Days',
          default_due_days: 15,
          preferred_payment_method: 'Bank Transfer'
        });
        fetchClients();
        toast.success(`Client profile "${formData.name}" created successfully!`);
      } else {
        toast.error(res.message || 'Error saving client');
      }
    } catch (e) {
      toast.error('Error saving client profile');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Client billing profiles, statutory GSTIN records, consolidated balances, and full transaction history.
        </p>
        {currentUser?.role !== 'Client' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client Profile</span>
          </button>
        )}
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400">Loading client profiles...</div>
        ) : (
          clients.map(client => (
            <div
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 hover:border-amber-400 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                    {client.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-semibold">{client.company_name}</div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                  {client.place_of_supply}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{client.phone}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  GSTIN: <strong>{client.gstin || 'Unregistered'}</strong>
                </div>
              </div>

              {/* Financial Snapshot (PRD Section 4!) */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Invoiced</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                    ₹{client.totalInvoiced?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-50/60 rounded-xl">
                  <div className="text-[10px] text-emerald-700 uppercase font-bold">Total Paid</div>
                  <div className="font-extrabold text-emerald-800 text-sm mt-0.5">
                    ₹{client.totalPaid?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50/60 rounded-xl">
                  <div className="text-[10px] text-amber-700 uppercase font-bold">Outstanding</div>
                  <div className="font-extrabold text-amber-800 text-sm mt-0.5">
                    ₹{client.totalOutstanding?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2.5 bg-rose-50/60 rounded-xl">
                  <div className="text-[10px] text-rose-700 uppercase font-bold">Overdue</div>
                  <div className="font-extrabold text-rose-800 text-sm mt-0.5">
                    ₹{client.totalOverdue?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comprehensive Client Detail Modal with History Tabs (PRD Section 4!) */}
      {selectedClient && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xl text-slate-900">{selectedClient.name}</h3>
                  <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                    {selectedClient.place_of_supply}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedClient.company_name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setClientHistory(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex items-center gap-1.5 border-b pb-3 text-xs">
              <button
                onClick={() => setModalTab('overview')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  modalTab === 'overview' ? 'bg-[#131b2e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Profile & Statutory
              </button>
              <button
                onClick={() => setModalTab('invoices')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                  modalTab === 'invoices' ? 'bg-[#131b2e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Invoices ({clientHistory?.invoices?.length || 0})</span>
              </button>
              <button
                onClick={() => setModalTab('payments')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                  modalTab === 'payments' ? 'bg-[#131b2e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payments ({clientHistory?.payments?.length || 0})</span>
              </button>
              <button
                onClick={() => setModalTab('receipts')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                  modalTab === 'receipts' ? 'bg-[#131b2e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Receipts ({clientHistory?.receipts?.length || 0})</span>
              </button>
              <button
                onClick={() => setModalTab('creditNotes')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                  modalTab === 'creditNotes' ? 'bg-[#131b2e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileMinus className="w-3.5 h-3.5" />
                <span>Credit Notes ({clientHistory?.creditNotes?.length || 0})</span>
              </button>
            </div>

            {/* TAB: OVERVIEW & PROFILE */}
            {modalTab === 'overview' && (
              <div className="space-y-4 text-xs">
                {/* Financial KPI Summary */}
                <div className="grid grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Invoiced</span>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      ₹{selectedClient.totalInvoiced?.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase font-bold">Total Paid</span>
                    <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                      ₹{selectedClient.totalPaid?.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-700 uppercase font-bold">Outstanding</span>
                    <div className="text-base font-extrabold text-amber-700 mt-0.5">
                      ₹{selectedClient.totalOutstanding?.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-700 uppercase font-bold">Overdue</span>
                    <div className="text-base font-extrabold text-rose-700 mt-0.5">
                      ₹{selectedClient.totalOverdue?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Details Table */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Contact Information
                    </span>
                    <div>
                      <span className="text-slate-500 block">Contact Person:</span>
                      <strong className="text-slate-800">{selectedClient.contact_person}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Email Address:</span>
                      <strong className="text-slate-800">{selectedClient.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Phone Number:</span>
                      <strong className="text-slate-800">{selectedClient.phone || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tax & Compliance
                    </span>
                    <div>
                      <span className="text-slate-500 block">GSTIN:</span>
                      <strong className="font-mono text-slate-800">{selectedClient.gstin || 'Unregistered'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">PAN Number:</span>
                      <strong className="font-mono text-slate-800">{selectedClient.pan || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Place of Supply:</span>
                      <strong className="text-slate-800">{selectedClient.place_of_supply}</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Commercial Terms
                    </span>
                    <div>
                      <span className="text-slate-500 block">Payment Terms:</span>
                      <strong className="text-slate-800">{selectedClient.default_payment_terms}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Currency:</span>
                      <strong className="text-slate-800">{selectedClient.currency || 'INR'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Preferred Payment Method:</span>
                      <strong className="text-slate-800">{selectedClient.preferred_payment_method}</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Billing Address
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {selectedClient.billing_address || 'No billing address registered.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INVOICES HISTORY */}
            {modalTab === 'invoices' && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-400 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Total (₹)</th>
                      <th className="py-2.5 px-3">Balance (₹)</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(clientHistory?.invoices || []).length === 0 ? (
                      <tr><td colSpan="6" className="py-6 text-center text-slate-400">No invoices recorded for this client.</td></tr>
                    ) : (
                      clientHistory.invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{inv.invoice_number}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inv.invoice_date}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inv.due_date}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">₹{inv.total?.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 font-semibold text-rose-600">₹{inv.amount_due?.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: PAYMENTS HISTORY */}
            {modalTab === 'payments' && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-400 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Reference / UTR</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount (₹)</th>
                      <th className="py-2.5 px-3">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(clientHistory?.payments || []).length === 0 ? (
                      <tr><td colSpan="5" className="py-6 text-center text-slate-400">No payment transactions recorded for this client.</td></tr>
                    ) : (
                      clientHistory.payments.map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{pay.reference}</td>
                          <td className="py-2.5 px-3 text-slate-600">{pay.payment_date}</td>
                          <td className="py-2.5 px-3 text-slate-700">{pay.method}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">₹{pay.amount?.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {pay.verification_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: RECEIPTS HISTORY */}
            {modalTab === 'receipts' && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-400 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount (₹)</th>
                      <th className="py-2.5 px-3">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(clientHistory?.receipts || []).length === 0 ? (
                      <tr><td colSpan="5" className="py-6 text-center text-slate-400">No receipts issued yet.</td></tr>
                    ) : (
                      clientHistory.receipts.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{rec.receipt_number}</td>
                          <td className="py-2.5 px-3 text-slate-600">{rec.payment_date}</td>
                          <td className="py-2.5 px-3 text-slate-700">{rec.payment_method}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">₹{rec.amount_received?.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-slate-500">₹{rec.remaining_balance?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: CREDIT NOTES HISTORY */}
            {modalTab === 'creditNotes' && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-400 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Credit Note No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount (₹)</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(clientHistory?.creditNotes || []).length === 0 ? (
                      <tr><td colSpan="5" className="py-6 text-center text-slate-400">No credit notes issued for this client.</td></tr>
                    ) : (
                      clientHistory.creditNotes.map(cn => (
                        <tr key={cn.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{cn.credit_note_number}</td>
                          <td className="py-2.5 px-3 text-slate-600">{cn.date}</td>
                          <td className="py-2.5 px-3 font-bold text-purple-900">₹{cn.amount?.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-slate-700">{cn.reason}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              {cn.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setClientHistory(null);
                }}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Client Modal */}
      {showCreateModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add Client Billing Profile</h3>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Tech Labs"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Acme Tech Labs Private Limited"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Singhania"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Place of Supply</label>
                  <input
                    type="text"
                    value={formData.place_of_supply}
                    onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })}
                    placeholder="29-Karnataka"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Billing Address</label>
                <textarea
                  rows="2"
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl">Save Client Profile</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
