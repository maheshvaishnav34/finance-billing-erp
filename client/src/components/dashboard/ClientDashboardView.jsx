import React, { useState, useEffect } from 'react';
import {
  FileText,
  CreditCard,
  Receipt,
  AlertTriangle,
  ArrowRight,
  Printer,
  ExternalLink,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Link2,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { api } from '../../services/api';

export default function ClientDashboardView({ currentUser, onNavigate, onOpenPortalLink, onOpenInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [clientProfile, setClientProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      setLoading(true);
      try {
        const [invRes, payRes, recRes, plRes, cliRes] = await Promise.all([
          api.getInvoices({ status: 'All' }),
          api.getPayments({}),
          api.getReceipts(),
          api.getPaymentLinks(),
          api.getClients()
        ]);

        if (invRes.success) setInvoices(invRes.invoices || []);
        if (payRes.success) setPayments(payRes.payments || []);
        if (recRes.success) setReceipts(recRes.receipts || []);
        if (plRes.success) setPaymentLinks(plRes.paymentLinks || []);

        if (cliRes.success && currentUser?.client_id) {
          const profile = cliRes.clients.find(c => c.id === currentUser.client_id);
          if (profile) setClientProfile(profile);
        }
      } catch (err) {
        console.error('Failed to load client dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClientData();
  }, [currentUser]);

  // Compute Financial Aggregates
  const pendingInvoices = invoices.filter(i => (i.amount_due || 0) > 0 && i.status !== 'Cancelled');
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue' && (i.amount_due || 0) > 0);
  
  const totalOutstanding = pendingInvoices.reduce((sum, i) => sum + (i.amount_due || 0), 0);
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.amount_due || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const activeLinks = paymentLinks.filter(pl => pl.status === 'Active');

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold">Loading Client Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Client Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-[#131b2e] to-[#1e293b] text-white rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold border border-amber-400/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Client Self-Service Portal</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Welcome, {clientProfile?.company_name || clientProfile?.name || currentUser?.name}!
          </h2>
          <p className="text-xs text-slate-400">
            Access your invoices, make direct online payments, download official receipts, and manage your billing profile.
          </p>
        </div>

        {totalOutstanding > 0 && pendingInvoices.length > 0 && (
          <button
            onClick={() => onOpenPortalLink(pendingInvoices[0].secure_token)}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all shrink-0 active:scale-95"
          >
            <span>Pay Latest Outstanding ({pendingInvoices[0].invoice_number})</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* 4 Key Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Balance */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Outstanding Balance</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Across {pendingInvoices.length} pending invoice{pendingInvoices.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Overdue Amount</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            ₹{totalOverdue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {overdueInvoices.length} overdue record{overdueInvoices.length !== 1 ? 's' : ''} requiring settlement
          </div>
        </div>

        {/* Total Paid to Date */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Paid</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {payments.length} verified payment{payments.length !== 1 ? 's' : ''} settled
          </div>
        </div>

        {/* Total Invoices */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Invoices</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {invoices.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Official billing records
          </div>
        </div>
      </div>

      {/* Pending Invoices (Quick Pay Table) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pending Invoices (Pay Now)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pay outstanding invoices securely via UPI, Cards, or NetBanking</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-6">Invoice</th>
                <th className="py-3.5 px-6">Due Date</th>
                <th className="py-3.5 px-6">Invoice Total</th>
                <th className="py-3.5 px-6">Amount Due</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Payment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span className="font-bold text-slate-700 block">All Caught Up!</span>
                    <span>You have no outstanding or overdue invoices at this time.</span>
                  </td>
                </tr>
              ) : (
                pendingInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-900">{inv.invoice_number}</div>
                      <div className="text-xs text-slate-500">{inv.project || 'General Billing'}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-mono">
                      {inv.due_date}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">
                      ₹{inv.total?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-rose-600 text-base">
                      ₹{inv.amount_due?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenInvoice(inv.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            const token = inv.secure_token || `tok_inv_${inv.id || 'demo'}`;
                            if (onOpenPortalLink) onOpenPortalLink(token);
                            else window.location.hash = `#portal-${token}`;
                          }}
                          className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <span>Pay Now</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Advance Payment Links (if any) */}
      {activeLinks.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-600" />
                <span>Advance & Milestone Payment Links</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Direct checkout links authorized for project milestones</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeLinks.map(link => (
              <div key={link.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {link.code}
                  </span>
                  <div className="font-bold text-slate-800 text-sm mt-1">{link.purpose}</div>
                  <div className="text-xs text-slate-500">Expires: {link.expiry_date}</div>
                </div>

                <div className="text-right space-y-1.5">
                  <div className="text-base font-black text-slate-900">₹{link.amount?.toLocaleString('en-IN')}</div>
                  <button
                    onClick={() => {
                      const token = link.token || `tok_link_${link.id || 'demo'}`;
                      if (onOpenPortalLink) onOpenPortalLink(token);
                      else window.location.hash = `#portal-${token}`;
                    }}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 ml-auto cursor-pointer active:scale-95"
                  >
                    <span>Pay Now</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Receipts & Billing Profile Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Official Receipts (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Official Payment Receipts</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Download or print verified settlement vouchers</p>
            </div>
            <button
              onClick={() => onNavigate('receipts')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {receipts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No payment receipts generated yet.
              </div>
            ) : (
              receipts.slice(0, 4).map(rec => (
                <div key={rec.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{rec.receipt_number}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Date: {rec.payment_date} • Ref: {rec.transaction_id}</div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-black text-emerald-700 text-sm">₹{rec.amount_received?.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => onNavigate('receipts')}
                      className="p-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700"
                      title="View Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Billing Profile Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Billing Profile</span>
            </h3>
            <button
              onClick={() => onNavigate('profile')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Edit Details
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</span>
              <span className="font-bold text-slate-800 text-sm">{clientProfile?.company_name || clientProfile?.name || 'Company Name'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">GSTIN</span>
                <span className="font-mono font-bold text-slate-800">{clientProfile?.gstin || 'Not Provided'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">PAN</span>
                <span className="font-mono font-bold text-slate-800">{clientProfile?.pan || 'Not Provided'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-600">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{clientProfile?.contact_person || currentUser?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{clientProfile?.email || currentUser?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{clientProfile?.phone || '+91 98765 43210'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{clientProfile?.billing_address || 'India'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
