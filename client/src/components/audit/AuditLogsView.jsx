import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, Search, Shield, User, Laptop } from 'lucide-react';
import { api } from '../../services/api';

export default function AuditLogsView({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      if (res.success) setLogs(res.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const entityTypes = ['All', 'Invoice', 'Payment', 'Receipt', 'Quotation', 'Settings'];

  const filteredLogs = logs.filter(log => {
    const matchesEntity = entityFilter === 'All' || (log.entity_type && log.entity_type.toLowerCase() === entityFilter.toLowerCase());
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || (
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.user && log.user.toLowerCase().includes(q)) ||
      (log.entity_ref && log.entity_ref.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
    return matchesEntity && matchesSearch;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'CEO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Finance/Admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Project Manager':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Client':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Immutable Financial Audit Trail & Activity Log</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Every invoice generation, modification, payment recording, cancellation and receipt event is tracked with actor, role, and IP address.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{logs.length} Total Audit Events Recorded</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Entity Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {entityTypes.map(tab => (
            <button
              key={tab}
              onClick={() => setEntityFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                entityFilter === tab
                  ? 'bg-[#131b2e] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by action, user or document ref..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-sm"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
            <tr>
              <th className="py-3 px-5">Timestamp</th>
              <th className="py-3 px-5">User & Role</th>
              <th className="py-3 px-5">Entity Ref</th>
              <th className="py-3 px-5">Action</th>
              <th className="py-3 px-5">Event Description</th>
              <th className="py-3 px-5 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">Loading audit history...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  No audit logs matching selected filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{log.user}</div>
                    <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold border mt-0.5 ${getRoleBadge(log.role)}`}>
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span className="font-mono bg-slate-100 text-blue-700 font-bold px-2.5 py-1 rounded text-[11px] border border-slate-200">
                      {log.entity_ref || log.entity_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-800 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 max-w-md leading-relaxed">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-400 whitespace-nowrap">
                    {log.ip || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
