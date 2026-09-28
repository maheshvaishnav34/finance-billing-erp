import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  Send,
  FileText,
  BarChart3,
  Receipt,
  FileMinus,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function DashboardView({ onNavigate, onOpenRecordPayment, onOpenCreateInvoice }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading financial dashboard overview...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Action Buttons (PRD Section 3!) */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenCreateInvoice}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>

        <button
          onClick={onOpenRecordPayment}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Payment</span>
        </button>

        <button
          onClick={() => onNavigate('reminders')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all shadow-sm"
        >
          <Send className="w-4 h-4 text-blue-600" />
          <span>Send Reminder</span>
        </button>

        <button
          onClick={() => onNavigate('invoices')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all shadow-sm"
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>View Outstanding</span>
        </button>

        <button
          onClick={() => onNavigate('credit_notes')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all shadow-sm"
        >
          <FileMinus className="w-4 h-4 text-purple-600" />
          <span>Create Credit Note</span>
        </button>

        <button
          onClick={() => onNavigate('reports')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all shadow-sm"
        >
          <BarChart3 className="w-4 h-4 text-teal-600" />
          <span>View Reports</span>
        </button>
      </div>

      {/* Primary KPI Metrics (PRD Section 3 format!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Invoiced */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Invoiced</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{stats?.totalInvoiced?.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <span>Active Billing Cycle 2026-27</span>
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Received</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            ₹{stats?.totalReceived?.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
            <span>Verified in Bank Accounts</span>
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Pending Balance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 tracking-tight">
            ₹{stats?.totalPending?.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mt-2">
            <span>{stats?.counts?.partiallyPaid || 0} Partially Paid Invoices</span>
          </div>
        </div>

        {/* Total Overdue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Overdue</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
            ₹{stats?.totalOverdue?.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-2">
            <span>{stats?.counts?.overdue || 0} Invoices Exceeded Due Date</span>
          </div>
        </div>
      </div>

      {/* Secondary Highlights: This Month Collections & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#131b2e] to-[#1e293b] text-white space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400">Monthly Run-Rate</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">This Month's Collection</div>
            <div className="text-3xl font-extrabold text-white mt-1">₹{stats?.thisMonthCollection?.toLocaleString('en-IN')}</div>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span>New Invoicing This Month:</span>
            <span className="font-bold text-amber-400">₹{stats?.thisMonthInvoicing?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Upcoming Collections */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Upcoming Expected Collections</span>
            </h3>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>All Invoices</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.upcomingPayments?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No upcoming payments pending due dates.
              </div>
            ) : (
              stats?.upcomingPayments?.map(up => (
                <div key={up.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{up.client_name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{up.invoice_number} · Due on {up.due_date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900">₹{up.amount_due?.toLocaleString('en-IN')}</div>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">Pending</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline Feed */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Recent Financial Activity & Audit Trail</span>
          </h3>
          <button
            onClick={() => onNavigate('audit_logs')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View Complete Audit Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {(stats?.recentActivities || []).map((act, i) => (
            <div key={act.id || i} className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span>{act.action}</span>
                  {act.entity_ref && (
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {act.entity_ref}
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px]">{act.details}</div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-[11px] font-semibold text-slate-700">{act.timestamp}</div>
                <div className="text-[10px] text-slate-400">{act.user}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
