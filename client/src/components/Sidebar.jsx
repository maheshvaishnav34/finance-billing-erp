import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Users,
  FileSpreadsheet,
  Receipt,
  FileMinus,
  BellRing,
  Repeat,
  Link2,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  Briefcase,
  User,
  Lock,
  UserCheck,
  Crown,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, isOpen, onClose }) {
  const isClient = currentUser?.role === 'Client';
  const isPM = currentUser?.role === 'Project Manager';

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  let workspaceNav = [];
  let showBilling = false;
  let showInsights = false;

  if (isClient) {
    workspaceNav = [
      { id: 'client_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'invoices', label: 'My Invoices', icon: FileText },
      { id: 'payments', label: 'My Payments', icon: CreditCard },
      { id: 'receipts', label: 'My Receipts', icon: Receipt },
      { id: 'payment_links', label: 'Payment Links', icon: Link2 },
      { id: 'credit_notes', label: 'Credit Notes', icon: FileMinus },
      { id: 'profile', label: 'Billing Profile', icon: Users }
    ];
  } else if (isPM) {
    workspaceNav = [
      { id: 'pm_billing', label: 'Project Billing', icon: Briefcase },
      { id: 'invoices', label: 'Invoices', icon: FileText },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'clients', label: 'Clients', icon: Users }
    ];
    showBilling = true;
    showInsights = true;
  } else {
    // CEO & Finance/Admin
    workspaceNav = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'invoices', label: 'Invoices', icon: FileText },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'clients', label: 'Clients', icon: Users }
    ];
    showBilling = true;
    showInsights = true;
  }

  const billingNav = isPM
    ? [
      { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
      { id: 'receipts', label: 'Receipts', icon: Receipt }
    ]
    : [
      { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
      { id: 'receipts', label: 'Receipts', icon: Receipt },
      { id: 'credit_notes', label: 'Credit notes', icon: FileMinus },
      { id: 'reminders', label: 'Reminders', icon: BellRing },
      { id: 'recurring', label: 'Recurring', icon: Repeat },
      { id: 'payment_links', label: 'Payment links', icon: Link2 }
    ];

  const insightsNav = isPM
    ? [
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'role_profile', label: 'PM Profile', icon: UserCheck }
    ]
    : [
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'role_profile', label: currentUser?.role === 'CEO' ? 'CEO Profile' : 'Finance Profile', icon: currentUser?.role === 'CEO' ? Crown : UserCheck },
      { id: 'user_management', label: 'Manage Roles & Users', icon: Users },
      { id: 'audit_logs', label: 'Audit logs', icon: History },
      { id: 'settings', label: 'Settings', icon: Settings }
    ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Responsive drawer on mobile / fixed on lg screens) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#131b2e] text-slate-300 flex flex-col justify-between shrink-0 h-screen select-none border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-[65px] px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 flex items-center justify-center font-extrabold text-[#131b2e] text-base shadow-md shadow-amber-400/20 shrink-0">
              RC
            </div>
            <div className="truncate">
              <div className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5 leading-tight">
                <span className="text-blue-400">Redes</span> Creation
              </div>
              <div className="text-[10px] tracking-wider text-slate-400 font-semibold uppercase leading-tight mt-0.5">
                Finance Console
              </div>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {/* Workspace section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isClient ? 'Client Portal' : 'Workspace'}
          </div>
          <div className="space-y-1">
            {workspaceNav.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm shadow-amber-400/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Billing section (Finance / Admin / CEO) */}
        {showBilling && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Billing
            </div>
            <div className="space-y-1">
              {billingNav.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Insights section */}
        {showInsights && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Insights & Security
            </div>
            <div className="space-y-1">
              {insightsNav.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active User Role Profile Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <button
          onClick={() => handleNavClick(isClient ? 'profile' : 'role_profile')}
          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
            activeTab === 'role_profile' || activeTab === 'profile'
              ? 'bg-amber-400/10 border border-amber-400/30 ring-1 ring-amber-400/30'
              : 'hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
              currentUser?.role === 'CEO'
                ? 'bg-amber-400 text-slate-950'
                : currentUser?.role === 'Finance/Admin'
                ? 'bg-blue-500 text-white'
                : currentUser?.role === 'Project Manager'
                ? 'bg-purple-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}>
              {currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'RC'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{currentUser?.name}</div>
              <div className="text-[10px] text-slate-400 font-semibold truncate">{currentUser?.role} Profile</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </button>
      </div>
    </aside>
    </>
  );
}
