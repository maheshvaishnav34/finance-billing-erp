import React from 'react';
import { Shield, Plus, LogOut, ArrowRight, ChevronRight, User } from 'lucide-react';

const BREADCRUMB_MAP = {
  overview: { module: 'FINANCE', crumb: 'DASHBOARD', title: 'Dashboard', sub: 'Financial health, invoice tracking and collections' },
  invoices: { module: 'FINANCE', crumb: 'INVOICES', title: 'Invoices', sub: 'Create, send, track and manage billing records' },
  payments: { module: 'FINANCE', crumb: 'PAYMENTS', title: 'Payments', sub: 'Verified & reconciled transactions across accounts' },
  clients: { module: 'FINANCE', crumb: 'CLIENTS', title: 'Clients & Billing Profiles', sub: 'Company details, GSTIN, credit limits and balances' },
  quotations: { module: 'FINANCE', crumb: 'QUOTATIONS', title: 'Quotations', sub: 'Proposals, cost estimates and 1-click invoice conversion' },
  receipts: { module: 'FINANCE', crumb: 'RECEIPTS', title: 'Payment Receipts', sub: 'Official payment acknowledgement receipts and vouchers' },
  credit_notes: { module: 'FINANCE', crumb: 'CREDIT NOTES', title: 'Credit Notes', sub: 'Refunds, billing corrections and dispute adjustments' },
  reminders: { module: 'FINANCE', crumb: 'REMINDERS', title: 'Payment Reminders', sub: 'Automated D-3 to D+15 reminder rules and escalation queue' },
  recurring: { module: 'FINANCE', crumb: 'RECURRING', title: 'Recurring Billing', sub: 'Subscription cycles, AMC, hosting and scheduled invoicing' },
  payment_links: { module: 'FINANCE', crumb: 'PAYMENT LINKS', title: 'Payment Links', sub: 'Standalone advance payment and project milestone links' },
  reports: { module: 'FINANCE', crumb: 'REPORTS', title: 'Financial Reports', sub: 'Aging schedules, GST compliance, collections & revenue' },
  pm_billing: { module: 'PROJECTS', crumb: 'BILLING', title: 'Project Billing', sub: 'Milestone tracking, invoice requests and client clearances' },
  audit_logs: { module: 'FINANCE', crumb: 'AUDIT LOGS', title: 'Audit Trail', sub: 'Immutable log of financial events, updates and security traces' },
  settings: { module: 'FINANCE', crumb: 'SETTINGS', title: 'Financial Settings', sub: 'Sequences, bank accounts, UPI, tax rules and approval thresholds' },
  profile: { module: 'CLIENT', crumb: 'BILLING PROFILE', title: 'Billing Profile', sub: 'Your company details, GSTIN, and statement history' },
  role_profile: { module: 'USER', crumb: 'PROFILE', title: 'Role Profile', sub: 'Role-specific scope, operational authority & credentials' },
  user_management: { module: 'ADMIN', crumb: 'ROLES & USERS', title: 'Manage Roles & Users', sub: 'Create and remove Client and Project Manager accounts' },
  client_dashboard: { module: 'CLIENT', crumb: 'DASHBOARD', title: 'Client Dashboard', sub: 'Financial health, pending invoices and verified payment receipts' },
  client_security: { module: 'CLIENT', crumb: 'SECURITY', title: 'Profile & Security', sub: 'Account credentials and portal security management' }
};

export default function Header({
  activeTab,
  currentUser,
  onPrimaryAction,
  primaryActionLabel,
  onLogout,
  onNavigateToProfile
}) {
  const info = BREADCRUMB_MAP[activeTab] || { module: 'FINANCE', crumb: 'CONSOLE', title: 'Console', sub: '' };

  return (
    <header className="h-[65px] bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0 select-none">
      {/* Left: Breadcrumb & Title */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 tracking-wider uppercase mb-0.5">
          <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/70 font-mono text-[10px]">
            {info.module}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 stroke-[2.5]" />
          <span className="text-slate-500 font-semibold">{info.crumb}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
            {info.title}
          </h1>
          <span className="hidden sm:inline-block text-slate-300">|</span>
          <p className="hidden sm:block text-xs text-slate-500 font-normal leading-none truncate max-w-md">
            {info.sub}
          </p>
        </div>
      </div>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Primary Action Button (e.g. + Record payment) */}
        {primaryActionLabel && (
          <button
            onClick={onPrimaryAction}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm shadow-amber-400/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{primaryActionLabel}</span>
          </button>
        )}

        {/* Current Authenticated User Badge */}
        <button
          onClick={onNavigateToProfile}
          title="View Role Profile & Settings"
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold transition-colors border border-slate-200/90 shadow-2xs cursor-pointer active:scale-95"
        >
          <div className={`w-7 h-7 rounded-lg border font-extrabold flex items-center justify-center text-xs shadow-2xs ${
            currentUser?.role === 'CEO'
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : currentUser?.role === 'Finance/Admin'
              ? 'bg-blue-100 text-blue-900 border-blue-300'
              : currentUser?.role === 'Project Manager'
              ? 'bg-purple-100 text-purple-900 border-purple-300'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
          }`}>
            {currentUser?.initials || 'NK'}
          </div>
          <div className="text-left hidden sm:block leading-tight">
            <div className="font-bold text-slate-900 text-xs">{currentUser?.name || 'User'}</div>
            <div className="text-[10px] text-amber-700 font-extrabold">
              {currentUser?.role || 'CEO'}
            </div>
          </div>
        </button>

        {/* Direct Sign Out Button */}
        <button
          onClick={onLogout}
          title="Sign out of ERP Console"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
