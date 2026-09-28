import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  X,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Building2,
  Check,
  Send
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';

export default function ProjectBillingView({ currentUser, onInvoiceGenerated, actionTrigger }) {
  const [data, setData] = useState({ projects: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (actionTrigger > 0) {
      setShowRequestModal(true);
    }
  }, [actionTrigger]);

  const [formData, setFormData] = useState({
    client_id: '',
    project: '',
    milestone_name: '',
    amount: '',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getProjectBilling();
      if (res.success) {
        setData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    api.getClients().then(res => {
      if (res.success) setClients(res.clients);
    });
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.requestInvoice(formData);
      if (res.success) {
        setShowRequestModal(false);
        setFormData({ client_id: '', project: '', milestone_name: '', amount: '', notes: '' });
        fetchData();
        toast.success('Milestone invoice request submitted to Finance team successfully!');
      } else {
        toast.error(res.message || 'Failed to request invoice');
      }
    } catch (err) {
      toast.error('Error requesting invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const res = await api.approveInvoiceRequest(requestId);
      if (res.success) {
        toast.success(res.message || 'Invoice generated from milestone request successfully!');
        fetchData();
        if (onInvoiceGenerated) {
          setTimeout(() => {
            onInvoiceGenerated(res.invoice?.id);
          }, 1200);
        }
      } else {
        toast.error(res.message || 'Failed to approve request');
      }
    } catch (err) {
      toast.error('Error approving request');
    }
  };

  // Aggregated KPIs
  const totalInvoiced = data.projects.reduce((sum, p) => sum + (parseFloat(p.invoiced) || 0), 0);
  const totalReceived = data.projects.reduce((sum, p) => sum + (parseFloat(p.received) || 0), 0);
  const totalPending = data.projects.reduce((sum, p) => sum + (parseFloat(p.pending) || 0), 0);

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Banner & Action */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              Project Workspace
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Milestone Tracking</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Project Billing & Milestone Clearances</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Monitor deliverables, track client realization ratios, and initiate verified billing requests directly to the Finance department.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs shadow-sm hover:shadow transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Request Milestone Invoice</span>
        </button>
      </div>

      {/* High-level Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Projects</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.projects.length}</div>
          <div className="text-xs text-slate-500 mt-1">Live client contracts</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Billed Volume</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{Math.round(totalInvoiced).toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-500 mt-1">Cumulative invoices</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Realized / Collected</span>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">₹{Math.round(totalReceived).toLocaleString('en-IN')}</div>
          <div className="text-xs text-emerald-700/80 mt-1">
            {totalInvoiced > 0 ? Math.round((totalReceived / totalInvoiced) * 100) : 0}% Realization Rate
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm bg-amber-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Pending Clearance</span>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">₹{Math.round(totalPending).toLocaleString('en-IN')}</div>
          <div className="text-xs text-amber-800/80 mt-1">Awaiting client payment</div>
        </div>
      </div>

      {/* Projects Overview Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-xs text-slate-400">
            Active Project Billing Status ({data.projects.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Real-time payment realization tracking</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-slate-400 text-sm animate-pulse">Loading project billing data...</div>
          ) : data.projects.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-400 text-sm">No project billing data recorded.</div>
          ) : (
            data.projects.map((proj, idx) => {
              const inv = Math.round(proj.invoiced || 0);
              const rec = Math.round(proj.received || 0);
              const pend = Math.round(proj.pending || 0);
              const pct = inv > 0 ? Math.min(100, Math.round((rec / inv) * 100)) : 0;
              const isFullyPaid = pend <= 0 && inv > 0;

              return (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base leading-snug">{proj.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{proj.client_name}</span>
                        </div>
                      </div>
                      <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-200 shrink-0">
                        {proj.invoice_count} {proj.invoice_count === 1 ? 'Invoice' : 'Invoices'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2 space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>Payment Realized</span>
                        <span className={isFullyPaid ? 'text-emerald-700 font-bold' : 'text-slate-800'}>
                          {pct}% {isFullyPaid && '✓ Cleared'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFullyPaid ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-400' : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs text-center">
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Invoiced</div>
                      <div className="font-extrabold text-slate-900 text-xs mt-1">₹{inv.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-2.5 bg-emerald-50/70 rounded-2xl border border-emerald-100/80">
                      <div className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Received</div>
                      <div className="font-extrabold text-emerald-800 text-xs mt-1">₹{rec.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-2.5 bg-amber-50/70 rounded-2xl border border-amber-100/80">
                      <div className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Pending</div>
                      <div className="font-extrabold text-amber-800 text-xs mt-1">₹{pend.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Invoice Requests Queue */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Milestone Invoice Requests Queue</h3>
              <p className="text-[11px] text-slate-400">Requests submitted by PM awaiting Finance clearance</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
            {data.requests?.length || 0} Request{(data.requests?.length || 0) === 1 ? '' : 's'}
          </span>
        </div>

        {(data.requests || []).length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="font-bold text-slate-800 text-sm">No Pending Milestone Requests</h4>
              <p className="text-xs text-slate-500 mt-1">
                All client milestone invoices are up to date. When a new project milestone is reached, submit a request for the Accounts team to invoice.
              </p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Submit Milestone Request</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
              <tr>
                <th className="py-3 px-5">Milestone / Service</th>
                <th className="py-3 px-5">Client & Project</th>
                <th className="py-3 px-5">Requested Amount</th>
                <th className="py-3 px-5">Requested By</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.requests || []).map(req => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900">{req.milestone_name}</div>
                    {req.notes && <div className="text-[11px] text-slate-400 mt-0.5">{req.notes}</div>}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-slate-800">{req.client_name}</div>
                    <div className="text-slate-400 text-[11px]">{req.project}</div>
                  </td>
                  <td className="py-3.5 px-5 font-extrabold text-slate-900 text-sm">
                    ₹{Math.round(req.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">{req.requested_by}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        req.status.includes('Approved')
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {req.status.includes('Approved') ? (
                      <span className="font-mono text-blue-700 font-bold text-xs">
                        {req.generated_invoice_number}
                      </span>
                    ) : currentUser?.role === 'Finance/Admin' || currentUser?.role === 'CEO' ? (
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all"
                      >
                        Approve & Generate
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium">Awaiting Finance</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Request Milestone Invoice Modal */}
      {showRequestModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Request Milestone Invoice</h3>
                <p className="text-xs text-slate-500">Finance team will validate and dispatch invoice to client.</p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Client *</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.project}
                  onChange={e => setFormData({ ...formData, project: e.target.value })}
                  placeholder="e.g. Tele-Health Video Platform Phase 2"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Milestone / Scope Name *</label>
                <input
                  type="text"
                  required
                  value={formData.milestone_name}
                  onChange={e => setFormData({ ...formData, milestone_name: e.target.value })}
                  placeholder="e.g. Milestone 2: API Gateway Integration Completed"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Amount to Invoice (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 75000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Notes / Milestone Reference</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Client verified deliverables on staging environment on 25 Sep."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request to Finance'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
