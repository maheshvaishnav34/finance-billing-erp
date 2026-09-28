import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  Lock,
  Briefcase,
  FileText,
  CreditCard,
  Crown,
  FileSpreadsheet,
  Receipt,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Save,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function RoleProfileView({ currentUser, onNavigate, onUserUpdated }) {
  const role = currentUser?.role || 'Finance/Admin';

  // Profile fields state (Name, Phone, Email, Title, Client Entity details)
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    designation: currentUser?.designation || '',
    department: currentUser?.department || '',
    company_name: currentUser?.clientDetails?.company_name || currentUser?.company_name || '',
    billing_address: currentUser?.clientDetails?.billing_address || currentUser?.billing_address || '',
    gstin: currentUser?.clientDetails?.gstin || currentUser?.gstin || '',
    pan: currentUser?.clientDetails?.pan || currentUser?.pan || ''
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password fields state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');
  const [passSaving, setPassSaving] = useState(false);

  // Sync form when currentUser updates or role switches
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || (role === 'CEO' ? '+91 98260 11001' : role === 'Finance/Admin' ? '+91 98260 22002' : role === 'Project Manager' ? '+91 98260 33003' : '+91 98260 44004'),
        designation: currentUser.designation || (role === 'CEO' ? 'Chief Executive Officer' : role === 'Finance/Admin' ? 'Head of Financial Operations' : role === 'Project Manager' ? 'Project Delivery Lead' : 'Authorized Signatory / Director'),
        department: currentUser.department || (role === 'Client' ? 'Client Relations & Procurement' : role === 'Project Manager' ? 'Client Delivery & Projects' : 'Finance & Corporate Accounts'),
        company_name: currentUser.clientDetails?.company_name || currentUser.company_name || (role === 'Client' ? 'Northstar Labs Pvt. Ltd.' : 'Redes Creation Private Limited'),
        billing_address: currentUser.clientDetails?.billing_address || currentUser.billing_address || (role === 'Client' ? 'Plot 42, Electronics City Phase 1, Bangalore, Karnataka - 560100' : 'Plot 104, Malviya Nagar, Bhopal, Madhya Pradesh - 462003'),
        gstin: currentUser.clientDetails?.gstin || currentUser.gstin || (role === 'Client' ? '29ABCDE1234F1Z5' : '23ABCDE1234F1Z5'),
        pan: currentUser.clientDetails?.pan || currentUser.pan || (role === 'Client' ? 'ABCDE1234F' : 'ABCDE5678G')
      });
      setProfileSuccess('');
      setProfileError('');
      setPassSuccess('');
      setPassError('');
    }
  }, [currentUser]);

  // Handle Profile Details (Name, Phone, Email, etc.) submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileForm.name.trim()) {
      setProfileError('Full Name is required.');
      return;
    }
    if (!profileForm.email.trim() || !profileForm.email.includes('@')) {
      setProfileError('Please provide a valid official email address.');
      return;
    }
    if (!profileForm.phone.trim()) {
      setProfileError('Phone / Contact number is required.');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await api.updateProfile(profileForm);
      if (res.success) {
        setProfileSuccess(res.message || 'Profile details updated successfully!');
        if (res.token) {
          localStorage.setItem('redes_auth_token', res.token);
        }
        if (onUserUpdated && res.user) {
          onUserUpdated(res.user);
        }
      } else {
        setProfileError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError(err.message || 'An error occurred while saving profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassError('New password and confirm password do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      setPassError('Password must be at least 4 characters long.');
      return;
    }

    setPassSaving(true);
    try {
      const res = await api.updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.success) {
        setPassSuccess('Security credentials updated successfully.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPassError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setPassError(err.message || 'An error occurred while changing password.');
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* 1. TOP PROFILE HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black shadow-md shrink-0 ${
            role === 'CEO'
              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 ring-4 ring-amber-100'
              : role === 'Finance/Admin'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-4 ring-blue-100'
              : role === 'Project Manager'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white ring-4 ring-purple-100'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white ring-4 ring-emerald-100'
          }`}>
            {currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'RC'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentUser?.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                role === 'CEO'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : role === 'Finance/Admin'
                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                  : role === 'Project Manager'
                  ? 'bg-purple-50 text-purple-900 border-purple-300'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300'
              }`}>
                {role}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {profileForm.designation || (
                role === 'CEO' ? 'Chief Executive Officer · Managing Director & Strategic Authority'
                : role === 'Finance/Admin' ? 'Head of Financial Operations, Billing & Bank Reconciliations'
                : role === 'Project Manager' ? 'Project Delivery Lead, Milestone Billing & Quotation Estimations'
                : 'Authorized Client Portal Account · Northstar Labs Pvt. Ltd.'
              )}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser?.email}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{profileForm.phone}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-emerald-700">RBAC Verified</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-left md:text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Scope</span>
            <span className="text-xs font-bold text-slate-800">
              {role === 'CEO' && 'All Systems & Executive Approvals'}
              {role === 'Finance/Admin' && 'Full Invoicing, Bank & GST Ledger'}
              {role === 'Project Manager' && 'Project Billing, Milestones & Proposals'}
              {role === 'Client' && 'Client Portal (Own Documents Only)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. EDIT PROFILE & CONTACT DETAILS (Name, Phone, Email, Designation) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500" />
              <span>Personal & Contact Information</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Update your display name, contact phone number, email address, and designation</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Direct Update
          </span>
        </div>

        {profileSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter full name..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Official Phone Number */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone / Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 98260 XXXXX"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Official Email */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="name@redescreation.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Designation / Job Title */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation / Job Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                  placeholder="e.g. Chief Executive Officer, Finance Manager"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department / Team
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  placeholder="e.g. Corporate Accounts, Project Management"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Role Badge (Read Only for security) */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Role & Privileges
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  disabled
                  value={`${role} (System Configured)`}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Client-specific Billing Entity Fields */}
          {role === 'Client' && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Client Legal Entity & Tax Information</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Company Registered Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={profileForm.gstin}
                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={profileForm.pan}
                    onChange={(e) => setProfileForm({ ...profileForm, pan: e.target.value })}
                    placeholder="ABCDE1234F"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Billing Address
                </label>
                <textarea
                  rows={2}
                  value={profileForm.billing_address}
                  onChange={(e) => setProfileForm({ ...profileForm, billing_address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
            <span className="text-[11px] text-slate-400">Updates will sync across header, sidebar and transactions.</span>
          </div>
        </form>
      </div>

      {/* 3. ROLE-SPECIFIC OPERATIONAL PRIVILEGES */}
      {/* ROLE SPECIFIC VIEW 1: CEO PROFILE (Nitin Kumar) */}
      {role === 'CEO' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent rounded-3xl border border-amber-200 space-y-1">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Approval Authority</span>
              <div className="text-xl font-black text-amber-950">₹1,00,000+ Invoices</div>
              <p className="text-[11px] text-amber-800/80">Executive sign-off required for high-value billing</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Executive Oversight</span>
              <div className="text-xl font-black text-slate-900">P&L and Audit Logs</div>
              <p className="text-[11px] text-slate-500">Unrestricted view of all financial transactions</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Financial Performance</span>
              <div className="text-xl font-black text-emerald-700">₹14,50,000 Billed</div>
              <p className="text-[11px] text-slate-500">100% compliance across active clients</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>CEO Governance & Permissions Matrix</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Executive Invoice Approval</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">High-value invoices above threshold are routed to CEO queue for authorization before sending to clients.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Financial Reports & P&L Statements</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Real-time revenue, aging analysis, collections efficiency, and GST liability reports.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Immutable Audit Trail Oversight</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Every financial event, payment modification, and status change is logged with timestamp & user stamp.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Enterprise Settings & Role Architecture</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Master sequences, tax policies, approval thresholds, and user access definitions.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE SPECIFIC VIEW 2: FINANCE / ADMIN PROFILE (Chirag Malviya) */}
      {role === 'Finance/Admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-blue-50/70 rounded-3xl border border-blue-200 space-y-1">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">Operational Role</span>
              <div className="text-xl font-black text-blue-950">Billing & Accounting</div>
              <p className="text-[11px] text-blue-800/80">Invoice generation, manual verification & reconciliation</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Primary Bank</span>
              <div className="text-xl font-black text-slate-900">HDFC Bank Primary</div>
              <p className="text-[11px] text-slate-500">A/C #50200012345678 (Settlement Authorized)</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tax Compliance</span>
              <div className="text-xl font-black text-slate-900">GSTIN 23ABCDE1234F1Z5</div>
              <p className="text-[11px] text-slate-500">Madhya Pradesh State Tax Code 23</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Finance & Accounts Scope of Work</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Complete Invoice Creation & Dispatch</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Creating tax invoices, setting payment terms, emailing PDF invoices with direct payment links.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Payment Recording & Reconciliation</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Recording bank transfers, cheques, UPI settlements and verifying them before marking reconciled.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Automated Reminders & Escalations</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Configuring D-3, Due Date, D+3, D+7, and D+15 payment reminder rules and escalation queue.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Official Receipt & Credit Note Issuance</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Issuing stamped payment acknowledgement receipts and managing dispute credit notes.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE SPECIFIC VIEW 3: PROJECT MANAGER PROFILE (Priya Sharma) */}
      {role === 'Project Manager' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-purple-50/70 rounded-3xl border border-purple-200 space-y-1">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">Operational Focus</span>
              <div className="text-xl font-black text-purple-950">Milestone Billing</div>
              <p className="text-[11px] text-purple-800/80">Requesting client milestone invoices on project delivery</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estimations</span>
              <div className="text-xl font-black text-slate-900">Cost Quotations</div>
              <p className="text-[11px] text-slate-500">Drafting proposals & 1-click invoice conversions</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Portfolio Status</span>
              <div className="text-xl font-black text-emerald-700">3 Active Projects</div>
              <p className="text-[11px] text-slate-500">Clearances and client payment tracking</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span>Project Delivery & Billing Clearances</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Requesting Milestone Invoices</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Submitting billing milestone clearance requests to the finance desk with project deliverables attached.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Client Quotation Management</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Creating project proposals and estimates with terms of validity, convertable to tax invoices upon acceptance.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Monitoring Project Payment Clearances</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Checking if client advance deposits or milestone settlements are received before initiating work.</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Restricted Finance Isolation</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Cannot modify tax rules, bank sequences, or direct journal reconciliation.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE SPECIFIC VIEW 4: CLIENT PROFILE (Rajesh Singhania) */}
      {role === 'Client' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-emerald-50/70 rounded-3xl border border-emerald-200 space-y-1">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Registered Entity</span>
              <div className="text-xl font-black text-emerald-950">{profileForm.company_name}</div>
              <p className="text-[11px] text-emerald-800/80">Corporate Client Portal Active</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">GSTIN on Record</span>
              <div className="text-xl font-black text-slate-900 font-mono">{profileForm.gstin}</div>
              <p className="text-[11px] text-slate-500">Tax Compliant Billing</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">PAN Number</span>
              <div className="text-xl font-black text-slate-900 font-mono">{profileForm.pan}</div>
              <p className="text-[11px] text-slate-500">Corporate PAN verified</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 text-xs">
            <h3 className="text-base font-bold text-slate-900">Registered Billing Address</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed font-medium">
              {profileForm.billing_address}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECURITY & CREDENTIALS CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>Security & Password Management</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage your credentials and login protection</p>
          </div>
        </div>

        {passSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{passSuccess}</span>
          </div>
        )}

        {passError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{passError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Current password..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="New password..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Re-type new password..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {passSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
}
