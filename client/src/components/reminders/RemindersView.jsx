import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  BellRing,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  Mail,
  ShieldAlert,
  Clock,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';

export default function RemindersView({ currentUser }) {
  const [rules, setRules] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Manual Reminder Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedInvoiceForManual, setSelectedInvoiceForManual] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [sendingManual, setSendingManual] = useState(false);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const [remRes, invRes] = await Promise.all([
        api.getReminders(),
        api.getInvoices({ status: 'Overdue' })
      ]);
      if (remRes.success) {
        setRules(remRes.rules || []);
        setEmailLogs(remRes.emailLogs || []);
      }
      if (invRes.success) {
        setInvoices(invRes.invoices || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleRunCheck = async () => {
    setRunningCheck(true);
    try {
      const res = await api.runReminderCheck();
      if (res.success) {
        setCheckResult(res);
        fetchReminders();
        toast.success(`Reminder scan completed. ${res.dispatched || 0} reminders sent.`);
      }
    } catch (e) {
      toast.error('Error running reminder scheduler');
    } finally {
      setRunningCheck(false);
    }
  };

  const handleOpenManual = (inv) => {
    setSelectedInvoiceForManual(inv);
    setCustomMsg(`Dear ${inv.client?.name || 'Client'},\n\nThis is an urgent reminder regarding Invoice ${inv.invoice_number} which was due on ${inv.due_date}. Outstanding balance is ₹${inv.amount_due?.toLocaleString('en-IN')}.\n\nPlease remit payment at earliest.`);
    setShowManualModal(true);
  };

  const handleSendManual = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForManual) return;
    setSendingManual(true);
    try {
      const res = await api.sendManualReminder({
        invoice_id: selectedInvoiceForManual.id,
        custom_message: customMsg
      });
      if (res.success) {
        toast.success(res.message || 'Payment reminder sent successfully!');
        setShowManualModal(false);
        fetchReminders();
      } else {
        toast.error(res.message || 'Failed to send reminder');
      }
    } catch (err) {
      toast.error('Failed to send reminder');
    } finally {
      setSendingManual(false);
    }
  };

  const filteredLogs = emailLogs.filter(log => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (log.invoice_number && log.invoice_number.toLowerCase().includes(q)) ||
      (log.client_name && log.client_name.toLowerCase().includes(q)) ||
      (log.stage && log.stage.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Trigger */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2.5">
            <BellRing className="w-5 h-5 text-amber-500" />
            <span>Automated Payment Reminder & Overdue Engine</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Standard multi-stage reminders before due date, on due date, and escalating post-due overdue notices with CEO alerts.
          </p>
        </div>
        <button
          onClick={handleRunCheck}
          disabled={runningCheck}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 shrink-0"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>{runningCheck ? 'Scanning Invoices...' : 'Run Automated Overdue & Reminder Scan Now'}</span>
        </button>
      </div>

      {checkResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{checkResult.message}</span>
          </div>
          <button onClick={() => setCheckResult(null)} className="text-emerald-700 underline text-[11px] font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics & Automation Schedule Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Daemon Cron Schedule</span>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Daily at 00:00 IST</span>
          </div>
          <p className="text-[11px] text-slate-500">Autonomous overnight scan</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Active Stages</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">6 Stages</div>
          <p className="text-[11px] text-slate-500">D-3, D-1, Due, D+3, D+7, D+15</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-200 bg-rose-50/20 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-rose-600">Current Overdue Invoices</span>
          <div className="text-xl font-extrabold text-rose-800 mt-1">{invoices.length} Invoices</div>
          <p className="text-[11px] text-rose-600 font-semibold">Requiring settlement</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Reminders Sent</span>
          <div className="text-xl font-extrabold text-blue-700 mt-1">{emailLogs.length} Dispatches</div>
          <p className="text-[11px] text-slate-500">Logged audit records</p>
        </div>
      </div>

      {/* Overdue Invoices Quick Actions Card */}
      {invoices.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Overdue Invoices Requiring Follow-Up</span>
            </h4>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {invoices.length} Pending Actions
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {invoices.map(inv => (
              <div key={inv.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{inv.invoice_number}</span>
                    <span className="font-bold text-slate-900">{inv.client?.name}</span>
                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                      Due Date: {inv.due_date}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Project: {inv.project} · Outstanding: <strong className="text-rose-700">₹{inv.amount_due?.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenManual(inv)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Manual Reminder</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configured Reminder Stages (PRD Section 23!) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-xs text-slate-400">
          Automated Multi-Stage Schedule Progression
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map(rule => (
            <div key={rule.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between">
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 bg-[#131b2e] text-amber-400 text-[10px] font-mono font-bold rounded">
                  {rule.stage}
                </span>
                <div className="font-bold text-slate-900 text-xs">{rule.title}</div>
                <div className="text-[11px] text-slate-500">Auto email notification + secure pay link</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dispatched Reminder Logs */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">Dispatched Reminders & Escalations Log</h4>
            <span className="text-xs text-slate-400 font-semibold">({filteredLogs.length} logged)</span>
          </div>

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice, client or stage..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
            <tr>
              <th className="py-3 px-5">Invoice</th>
              <th className="py-3 px-5">Recipient / Client</th>
              <th className="py-3 px-5">Stage</th>
              <th className="py-3 px-5">Escalation Status</th>
              <th className="py-3 px-5 text-right">Dispatched Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-slate-400">
                  No reminder emails logged matching search criteria. Click "Run Automated Overdue Scan" above to evaluate schedules.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5 font-mono font-bold text-blue-700">{log.invoice_number}</td>
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900">{log.client_name}</div>
                    <div className="text-slate-400 text-[11px]">{log.recipient_email}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                      {log.stage}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    {log.is_escalation ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-rose-200">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        <span>CEO Internal Escalation Alert</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Standard Client Notice</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-500 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Reminder Modal */}
      {showManualModal && selectedInvoiceForManual && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Send Payment Reminder</h3>
                <p className="text-xs text-slate-500">
                  Invoice <strong className="font-mono text-blue-700">{selectedInvoiceForManual.invoice_number}</strong> ({selectedInvoiceForManual.client?.name})
                </p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendManual} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Recipient Email</label>
                <input
                  type="email"
                  disabled
                  value={selectedInvoiceForManual.client?.email || ''}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Custom Reminder Message</label>
                <textarea
                  rows="6"
                  required
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                An instant secure payment checkout link will be automatically attached at the end of the email.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingManual}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {sendingManual ? 'Dispatching...' : 'Dispatch Reminder Now'}
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
