import React, { useState } from 'react';
import { Lock, Shield, KeyRound, CheckCircle2, User, LogOut, Mail, Building2 } from 'lucide-react';

export default function ClientSecurityView({ currentUser, onLogout }) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('Password updated successfully! Your account credentials have been refreshed.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 600);
  };

  return (
    <div className="max-w-3xl space-y-6">
      
      {/* Account Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Client Profile & Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your personal credentials and portal access level</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            Client Portal Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Account Name</span>
            <div className="flex items-center gap-2 mt-1 text-slate-800 font-bold text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.name}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Registered Email</span>
            <div className="flex items-center gap-2 mt-1 text-slate-800 font-bold text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Security & Password</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Update your password to keep your portal account secure</p>
          </div>
        </div>

        {message && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Enter your current password..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="At least 6 characters..."
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
            disabled={saving}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>

      {/* Logout Card */}
      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Sign Out of Client Portal</h4>
          <p className="text-xs text-slate-500 mt-0.5">End your current session safely on this computer</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
}
