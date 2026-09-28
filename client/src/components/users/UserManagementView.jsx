import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Ban,
  Mail,
  Phone,
  Building2,
  Lock,
  Search,
  Filter,
  Briefcase,
  X,
  Crown
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';

export default function UserManagementView({ currentUser }) {
  const isAuthorized = currentUser?.role === 'CEO' || currentUser?.role === 'Finance/Admin';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pm', 'client', 'active', 'inactive'
  const [searchTerm, setSearchTerm] = useState('');

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formRole, setFormRole] = useState('Project Manager'); // 'Project Manager' or 'Client'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    designation: '',
    department: '',
    company_name: '',
    billing_address: '',
    gstin: '',
    pan: ''
  });

  // Prompt Modal States (Active / Inactive & Delete)
  const [statusPrompt, setStatusPrompt] = useState({
    open: false,
    user: null,
    targetStatus: 'Inactive',
    loading: false
  });

  const [deletePrompt, setDeletePrompt] = useState({
    open: false,
    user: null,
    loading: false
  });

  const fetchUsers = async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const res = await api.getManageableUsers();
      if (res.success) {
        setUsers(res.users || []);
      } else {
        setError(res.message || 'Failed to load user records.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAuthorized]);

  // Handle Create User Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setCreating(true);

    try {
      const payload = {
        ...formData,
        role: formRole
      };
      const res = await api.createManageableUser(payload);
      if (res.success) {
        toast.success(res.message || `${formRole} created successfully!`);
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: 'password123',
          designation: '',
          department: '',
          company_name: '',
          billing_address: '',
          gstin: '',
          pan: ''
        });
        fetchUsers();
      } else {
        setModalError(res.message || 'Failed to create user account.');
      }
    } catch (err) {
      setModalError(err.message || 'Error creating user account.');
    } finally {
      setCreating(false);
    }
  };

  // Open Status Confirmation Prompt (Active <-> Inactive)
  const handleOpenStatusPrompt = (user) => {
    const nextStatus = user.status === 'Inactive' ? 'Active' : 'Inactive';
    setStatusPrompt({
      open: true,
      user,
      targetStatus: nextStatus,
      loading: false
    });
  };

  // Confirm Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusPrompt.user) return;
    const { user, targetStatus } = statusPrompt;
    setStatusPrompt(prev => ({ ...prev, loading: true }));

    try {
      const res = await api.updateManageableUserStatus(user.id, targetStatus);
      if (res.success) {
        toast.success(`${user.role} "${user.name}" marked as ${targetStatus}!`);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: targetStatus } : u));
        setStatusPrompt({ open: false, user: null, targetStatus: 'Inactive', loading: false });
      } else {
        toast.error(res.message || 'Failed to update user status.');
        setStatusPrompt(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      toast.error(err.message || 'Error updating user status.');
      setStatusPrompt(prev => ({ ...prev, loading: false }));
    }
  };

  // Open Delete Confirmation Prompt
  const handleOpenDeletePrompt = (user) => {
    setDeletePrompt({
      open: true,
      user,
      loading: false
    });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletePrompt.user) return;
    const { user } = deletePrompt;
    setDeletePrompt(prev => ({ ...prev, loading: true }));

    try {
      const res = await api.deleteManageableUser(user.id);
      if (res.success) {
        toast.success(`${user.role} "${user.name}" removed successfully.`);
        setUsers(prev => prev.filter(u => u.id !== user.id));
        setDeletePrompt({ open: false, user: null, loading: false });
      } else {
        toast.error(res.message || 'Failed to remove user.');
        setDeletePrompt(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove user account.');
      setDeletePrompt(prev => ({ ...prev, loading: false }));
    }
  };

  // If unauthorized user (PM or Client) attempts to view
  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Only executive command roles (<strong>CEO</strong> and <strong>Finance/Admin</strong>) have authority to manage team, client, and project accounts.
            </p>
          </div>
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            Current Role: {currentUser?.role || 'Guest'}
          </div>
        </div>
      </div>
    );
  }

  // Filtered list
  const filteredUsers = users.filter(u => {
    if (activeFilter === 'pm' && u.role !== 'Project Manager') return false;
    if (activeFilter === 'client' && u.role !== 'Client') return false;
    if (activeFilter === 'active' && (u.status || 'Active') !== 'Active') return false;
    if (activeFilter === 'inactive' && (u.status || 'Active') !== 'Inactive') return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(s);
      const matchEmail = u.email?.toLowerCase().includes(s);
      const matchCompany = u.clientDetails?.company_name?.toLowerCase().includes(s);
      return matchName || matchEmail || matchCompany;
    }
    return true;
  });

  const pmCount = users.filter(u => u.role === 'Project Manager').length;
  const clientCount = users.filter(u => u.role === 'Client').length;
  const activeCount = users.filter(u => (u.status || 'Active') === 'Active').length;
  const inactiveCount = users.filter(u => (u.status || 'Active') === 'Inactive').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Role & User Management</h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>CEO & Finance/Admin Authority</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage, activate/deactivate, and create <strong>Project Manager</strong> and <strong>Client</strong> role accounts. Only CEO and Finance/Admin have this privilege.
          </p>
        </div>

        <button
          onClick={() => {
            setFormRole('Project Manager');
            setModalError('');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs shadow-md shadow-amber-400/20 transition-all shrink-0 active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Role Account</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Accounts ({users.length})
          </button>

          <button
            onClick={() => setActiveFilter('client')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'client'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Clients</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeFilter === 'client' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {clientCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('pm')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'pm'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Project Managers</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeFilter === 'pm' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
              {pmCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'active'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Active</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeFilter === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('inactive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'inactive'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Inactive</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeFilter === 'inactive' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, company..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Users List Grid / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200">
          Loading role accounts...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200">
          No users found matching current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((u) => {
            const isPM = u.role === 'Project Manager';
            const isClient = u.role === 'Client';
            const isCEO = u.role === 'CEO';
            const isFinance = u.role === 'Finance/Admin';
            const isSelf = u.id === currentUser?.id || u.email === currentUser?.email;
            const isRootCEO = u.id === 'usr_ceo_1' || u.email === 'nitin@redescreation.com';
            const canDelete = !isRootCEO && !isSelf && (currentUser?.role === 'CEO' || isPM || isClient || (currentUser?.role === 'Finance/Admin' && !isCEO));

            return (
              <div
                key={u.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0 ${
                        isCEO
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-100'
                          : isFinance
                          ? 'bg-blue-500 text-white ring-2 ring-blue-100'
                          : isPM
                          ? 'bg-purple-500 text-white ring-2 ring-purple-100'
                          : 'bg-emerald-500 text-white ring-2 ring-emerald-100'
                      }`}>
                        {u.initials || u.name?.slice(0, 2).toUpperCase() || 'RC'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{u.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCEO
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : isFinance
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : isPM
                              ? 'bg-purple-50 text-purple-900 border-purple-200'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {u.designation || (isClient ? u.clientDetails?.company_name : u.department) || u.role}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        (u.status || 'Active') === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                          : 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (u.status || 'Active') === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`} />
                        <span>{u.status || 'Active'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Details block */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                    {isClient && u.clientDetails?.company_name && (
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{u.clientDetails.company_name}</span>
                      </div>
                    )}
                    {isClient && u.clientDetails?.gstin && (
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                        <span className="font-bold">GSTIN:</span>
                        <span>{u.clientDetails.gstin}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    {u.created_at ? `Added: ${new Date(u.created_at).toLocaleDateString()}` : 'System Initialized'}
                  </span>

                  {canDelete ? (
                    <div className="flex items-center gap-2">
                      {/* Active / Inactive Status Action Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenStatusPrompt(u)}
                        className={`px-3 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border cursor-pointer active:scale-95 ${
                          (u.status || 'Active') === 'Active'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                        title={(u.status || 'Active') === 'Active' ? `Mark ${u.name} as Inactive` : `Activate ${u.name}`}
                      >
                        {(u.status || 'Active') === 'Active' ? (
                          <>
                            <Ban className="w-3.5 h-3.5 text-amber-600" />
                            <span>Set Inactive</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Set Active</span>
                          </>
                        )}
                      </button>

                      {/* Remove Button (Triggers custom confirmation prompt) */}
                      <button
                        type="button"
                        onClick={() => handleOpenDeletePrompt(u)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-rose-200 cursor-pointer active:scale-95"
                        title={`Remove ${u.role} account`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : isSelf ? (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Current Session</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>Protected Executive</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW ROLE MODAL */}
      {showCreateModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                  <span>Create Role Account</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authority: Only CEO and Finance/Admin can create Client & Project Manager roles
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error in modal */}
            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Select Role: Project Manager or Client */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Role to Create *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormRole('Project Manager')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      formRole === 'Project Manager'
                        ? 'border-purple-500 bg-purple-50/60 text-purple-950 ring-2 ring-purple-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                      <span>Project Manager</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Milestone billing & quotations</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('Client')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      formRole === 'Client'
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Client Account</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Client Portal & invoices</div>
                  </button>
                </div>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {formRole === 'Client' ? 'Contact Person Name *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={formRole === 'Client' ? 'e.g. Priya Nair' : 'e.g. Amit Sharma'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="password123"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Conditional Client Fields */}
              {formRole === 'Client' ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="e.g. Apex Retail Pvt. Ltd."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        placeholder="23ABCDE1234F1Z5"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Billing Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.billing_address}
                      onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                      placeholder="Registered business address..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                /* Project Manager Fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Project Manager"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Client Delivery & Projects"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : `Create ${formRole} Account`}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM STATUS CHANGE CONFIRMATION PROMPT MODAL */}
      {statusPrompt.open && statusPrompt.user && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp">
            
            {/* Header */}
            <div className={`p-6 border-b flex items-start gap-4 ${
              statusPrompt.targetStatus === 'Inactive'
                ? 'bg-amber-50/70 border-amber-100'
                : 'bg-emerald-50/70 border-emerald-100'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                statusPrompt.targetStatus === 'Inactive'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {statusPrompt.targetStatus === 'Inactive' ? (
                  <Ban className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {statusPrompt.targetStatus === 'Inactive'
                    ? `Deactivate ${statusPrompt.user.role} Account?`
                    : `Activate ${statusPrompt.user.role} Account?`}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {statusPrompt.targetStatus === 'Inactive'
                    ? 'Client / PM will be marked Inactive and restricted from signing in.'
                    : 'Client / PM account will be re-activated with full portal access.'}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Target User Info Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{statusPrompt.user.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    statusPrompt.user.role === 'Client'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {statusPrompt.user.role}
                  </span>
                </div>
                <div className="text-slate-500 font-medium">{statusPrompt.user.email}</div>
                {statusPrompt.user.clientDetails?.company_name && (
                  <div className="text-slate-700 font-semibold flex items-center gap-1.5 pt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{statusPrompt.user.clientDetails.company_name}</span>
                  </div>
                )}
              </div>

              {/* Action vs Inaction Impact Note */}
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                statusPrompt.targetStatus === 'Inactive'
                  ? 'bg-amber-50/50 border-amber-200/80 text-amber-900'
                  : 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
              }`}>
                {statusPrompt.targetStatus === 'Inactive' ? (
                  <div className="space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Inaction Impact:</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      • Account status switches to <strong>Inactive</strong> immediately.<br />
                      • The user cannot log in or generate new payment orders.<br />
                      • Existing invoices, payments, and quotations remain safely preserved.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Action Impact:</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      • Account status switches back to <strong>Active</strong>.<br />
                      • Full login credentials and portal permissions are immediately restored.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={statusPrompt.loading}
                onClick={() => setStatusPrompt({ open: false, user: null, targetStatus: 'Inactive', loading: false })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusPrompt.loading}
                onClick={handleConfirmStatusChange}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 active:scale-95 ${
                  statusPrompt.targetStatus === 'Inactive'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {statusPrompt.loading ? (
                  <span>Updating Status...</span>
                ) : (
                  <span>Confirm Set {statusPrompt.targetStatus}</span>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM DELETE CONFIRMATION PROMPT MODAL */}
      {deletePrompt.open && deletePrompt.user && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp">
            
            {/* Header */}
            <div className="p-6 border-b border-rose-100 bg-rose-50/70 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Permanently Remove Account?
                </h3>
                <p className="text-xs text-rose-700 font-medium">
                  This will permanently delete this {deletePrompt.user.role} record.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{deletePrompt.user.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    {deletePrompt.user.role}
                  </span>
                </div>
                <div className="text-slate-500 font-medium">{deletePrompt.user.email}</div>
                {deletePrompt.user.clientDetails?.company_name && (
                  <div className="text-slate-700 font-semibold flex items-center gap-1.5 pt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{deletePrompt.user.clientDetails.company_name}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200 text-rose-900 text-xs">
                <p className="font-bold mb-1">Warning: Irreversible Action</p>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Removing this login prevents future access. If you only want to temporarily pause access, please use <strong>Mark Inactive</strong> instead.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deletePrompt.loading}
                onClick={() => setDeletePrompt({ open: false, user: null, loading: false })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletePrompt.loading}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {deletePrompt.loading ? (
                  <span>Removing Account...</span>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
