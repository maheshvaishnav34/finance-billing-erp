import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Check, X, Users, Lock, ChevronRight, UserCheck, Key, Info } from 'lucide-react';
import { api } from '../../services/api';

export default function RoleArchitectureView({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('CEO');

  useEffect(() => {
    async function loadMatrix() {
      try {
        const res = await api.getRolesMatrix();
        if (res.success) {
          setData(res);
        }
      } catch (e) {
        console.error('Failed to load roles matrix', e);
      } finally {
        setLoading(false);
      }
    }
    loadMatrix();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-slate-400">Loading Role Architecture & Permissions Matrix...</div>;
  }

  const { roles = [], rolePermissionsMap = {}, permissionGroups = [], allUsers = [] } = data || {};

  const currentRoleDef = roles.find(r => r.name === selectedRole) || roles[0];
  const roleUsers = allUsers.filter(u => u.role === selectedRole);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Overview Banner */}
      <div className="bg-gradient-to-br from-[#131b2e] to-[#1e293b] p-6 rounded-3xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Enterprise Security Model</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Role-Based Access Control (RBAC) Architecture</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Every user action is authenticated via JWT and validated through the backend RBAC middleware.
            Distinct roles maintain clear separation of responsibilities and data confidentiality.
          </p>
        </div>
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-xs text-center shrink-0">
          <div className="text-[11px] text-slate-400">Total System Roles</div>
          <div className="text-2xl font-black text-amber-400 mt-0.5">{roles.length} Roles</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{allUsers.length} Active Users</div>
        </div>
      </div>

      {/* Visual Architectural Hierarchy Diagram */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-xs text-slate-400">
          Role Hierarchy & Data Separation Architecture
        </h3>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 overflow-x-auto">
          {/* Top Level: Auth */}
          <div className="flex flex-col items-center">
            <div className="px-5 py-2 rounded-xl bg-[#131b2e] text-amber-400 font-bold text-xs shadow-md border border-slate-700 flex items-center gap-2">
              <Key className="w-3.5 h-3.5" />
              <span>JWT Authentication & Identity Verification</span>
            </div>
            <div className="w-0.5 h-6 bg-slate-300" />
            <div className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-800 font-mono text-[11px] font-bold">
              Role Detection & Middleware Permission Guard
            </div>
            <div className="w-0.5 h-6 bg-slate-300" />

            {/* Branching into Roles */}
            <div className="w-full max-w-4xl border-t-2 border-slate-300 pt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              {roles.map(r => (
                <div
                  key={r.name}
                  onClick={() => setSelectedRole(r.name)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center space-y-1.5 ${
                    selectedRole === r.name
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-black text-slate-900">{r.name}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{r.tagline}</div>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${r.badge}`}>
                    {r.userCount} Users
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Role Detailed Profile & Active Users */}
      {currentRoleDef && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <h3 className="font-extrabold text-slate-900 text-base">{currentRoleDef.name}</h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentRoleDef.badge}`}>
                {currentRoleDef.tagline}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {roleUsers.length} user{roleUsers.length === 1 ? '' : 's'} assigned
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {currentRoleDef.description}
          </p>

          {/* Allowed Modules Tags */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Authorized Modules & Workspaces
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentRoleDef.allowedPages.map(page => (
                <span
                  key={page}
                  className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
                    page.includes('No Finance')
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  {page}
                </span>
              ))}
            </div>
          </div>

          {/* Active Users in this Role */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Users Currently Operating with this Role
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {roleUsers.map(user => (
                <div key={user.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 flex items-center justify-center text-xs shadow-sm">
                    {user.initials || 'RC'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Complete Permission Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Role-Permission Matrix (Granular Permissions)</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">Backend Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Permission Resource</th>
                {roles.map(r => (
                  <th key={r.name} className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${r.badge}`}>
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionGroups.map(grp => (
                <React.Fragment key={grp.group}>
                  {/* Category Header */}
                  <tr className="bg-slate-100/60 font-bold text-slate-700 text-[11px]">
                    <td colSpan={6} className="py-2 px-6 tracking-wide uppercase text-slate-500">
                      {grp.group}
                    </td>
                  </tr>

                  {/* Individual Permissions */}
                  {grp.permissions.map(perm => (
                    <tr key={perm.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-6 text-slate-800 font-medium">
                        <div>{perm.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{perm.code}</div>
                      </td>

                      {roles.map(r => {
                        const hasPerm = r.name === 'CEO' || (rolePermissionsMap[r.name] || []).includes(perm.code);
                        return (
                          <td key={r.name} className="py-2.5 px-4 text-center">
                            {hasPerm ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mx-auto">
                                <X className="w-3 h-3 stroke-[2]" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
