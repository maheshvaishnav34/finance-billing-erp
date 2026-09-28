import React, { useState, useEffect } from 'react';
import { FileMinus, Plus } from 'lucide-react';
import { api } from '../../services/api';

export default function CreditNotesView({ currentUser }) {
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getCreditNotes();
        if (res.success) setCreditNotes(res.creditNotes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-4 px-6">Credit Note No</th>
              <th className="py-4 px-6">Client / Invoice</th>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">Credit Amount</th>
              <th className="py-4 px-6">Reason</th>
              <th className="py-4 px-6">Issued By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="6" className="py-12 text-center text-slate-400">Loading credit notes...</td></tr>
            ) : creditNotes.length === 0 ? (
              <tr><td colSpan="6" className="py-12 text-center text-slate-400">No credit notes found.</td></tr>
            ) : (
              creditNotes.map(cn => (
                <tr key={cn.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-purple-700">{cn.credit_note_number}</td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{cn.client_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{cn.invoice_number}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{cn.date}</td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">₹{cn.amount?.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-6 text-slate-600 text-xs">{cn.reason}</td>
                  <td className="py-4 px-6 text-slate-500 text-xs">{cn.created_by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
