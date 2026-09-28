import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Repeat, Plus, Play, CheckCircle2, Calendar, DollarSign, X } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';

export default function RecurringView({ currentUser, onInvoiceCreated, actionTrigger }) {
  const [recurringList, setRecurringList] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (actionTrigger > 0) {
      setShowAddModal(true);
    }
  }, [actionTrigger]);
  const [generatingId, setGeneratingId] = useState(null);

  const [formData, setFormData] = useState({
    client_id: '',
    service: '',
    amount: '',
    frequency: 'Monthly',
    next_run: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    auto_send: true
  });

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const [recRes, cliRes] = await Promise.all([
        api.getRecurring(),
        api.getClients()
      ]);
      if (recRes.success) setRecurringList(recRes.recurring || []);
      if (cliRes.success) setClients(cliRes.clients || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleGenerateNow = async (id) => {
    setGeneratingId(id);
    try {
      const res = await api.triggerRecurringNow(id);
      if (res.success) {
        toast.success(res.message);
        fetchRecurring();
        if (onInvoiceCreated) {
          setTimeout(() => {
            onInvoiceCreated(res.invoice?.id);
          }, 1400);
        }
      } else {
        toast.error(res.message || 'Failed to generate recurring invoice');
      }
    } catch (e) {
      toast.error('Error triggering recurring invoice');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createRecurring(formData);
      if (res.success) {
        toast.success('Recurring billing contract created successfully!');
        setShowAddModal(false);
        setFormData({
          client_id: '',
          service: '',
          amount: '',
          frequency: 'Monthly',
          next_run: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          auto_send: true
        });
        fetchRecurring();
      } else {
        toast.error(res.message || 'Error saving recurring schedule');
      }
    } catch (e) {
      toast.error('Network error saving recurring profile');
    }
  };

  // Calculate MRR (Monthly Recurring Revenue)
  const calculateMRR = () => {
    return recurringList.reduce((acc, curr) => {
      let monthly = curr.amount || 0;
      if (curr.frequency === 'Quarterly') monthly = curr.amount / 3;
      else if (curr.frequency === 'Annually') monthly = curr.amount / 12;
      else if (curr.frequency === 'Weekly') monthly = curr.amount * 4;
      return acc + monthly;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2.5">
            <Repeat className="w-5 h-5 text-amber-500" />
            <span>Recurring Invoicing & Retainer Billing</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Automated recurring invoices generated periodically for AMC, retainers, and subscription contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser?.role !== 'Client' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Recurring Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Active Recurring Profiles</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{recurringList.length} Contracts</div>
          <p className="text-[11px] text-slate-500">Live active billing cycles</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Estimated MRR (Monthly Run-Rate)</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{Math.round(calculateMRR()).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">Normalized monthly revenue</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Automation Mode</span>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Auto Generate on Cycle Due</span>
          </div>
          <p className="text-[11px] text-slate-500">Cron triggered execution</p>
        </div>
      </div>

      {/* Recurring Contracts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-4 px-6">Client / Account</th>
              <th className="py-4 px-6">Recurring Service</th>
              <th className="py-4 px-6">Frequency</th>
              <th className="py-4 px-6">Cycle Amount</th>
              <th className="py-4 px-6">Next Scheduled Run</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">Loading recurring billing...</td>
              </tr>
            ) : recurringList.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">No recurring billing profiles active.</td>
              </tr>
            ) : (
              recurringList.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{rec.client_name}</td>
                  <td className="py-4 px-6 font-medium text-slate-700">{rec.service}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                      {rec.frequency}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                    ₹{rec.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-mono">
                    {rec.next_run}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {currentUser?.role !== 'Client' && (
                      <button
                        onClick={() => handleGenerateNow(rec.id)}
                        disabled={generatingId === rec.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>{generatingId === rec.id ? 'Generating...' : 'Generate Now'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Recurring Profile Modal */}
      {showAddModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">New Recurring Billing Contract</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Client Profile *</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Recurring Service / Contract Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Server Management & Maintenance"
                  value={formData.service}
                  onChange={e => setFormData({ ...formData, service: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Billing Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Billing Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Next Run Date</label>
                <input
                  type="date"
                  required
                  value={formData.next_run}
                  onChange={e => setFormData({ ...formData, next_run: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoSend"
                  checked={formData.auto_send}
                  onChange={e => setFormData({ ...formData, auto_send: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="autoSend" className="text-slate-700 font-semibold cursor-pointer">
                  Automatically dispatch invoice email and payment link when generated
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  Create Recurring Contract
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
