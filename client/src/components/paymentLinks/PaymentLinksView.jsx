import React, { useState, useEffect } from 'react';
import { Link2, Plus, Copy, ExternalLink, Check, X, QrCode } from 'lucide-react';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import { toast } from '../common/Toast';
import { QRCodeSVG } from 'qrcode.react';

export default function PaymentLinksView({ currentUser, masterSettings, onOpenPortalLink, actionTrigger }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrModalLink, setQrModalLink] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    purpose: '',
    description: '',
    expiry_date: ''
  });

  useEffect(() => {
    if (actionTrigger > 0) {
      setShowCreateModal(true);
    }
  }, [actionTrigger]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await api.getPaymentLinks();
      if (res.success) setLinks(res.paymentLinks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
    api.getClients().then(res => {
      if (res.success) setClients(res.clients);
    });
  }, []);

  const handleCopy = (token, id) => {
    const url = `${window.location.origin}/#portal-${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Payment link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createPaymentLink(formData);
      if (res.success) {
        setShowCreateModal(false);
        setFormData({ client_id: '', amount: '', purpose: '', description: '', expiry_date: '' });
        fetchLinks();
        toast.success('Payment link generated successfully!');
      }
    } catch (e) {
      toast.error('Error creating payment link');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header bar with simple action */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Standalone payment links for project advance deposits and milestone collections.
        </p>
        {currentUser?.role !== 'Client' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Link</span>
          </button>
        )}
      </div>

      {/* Clean, Simple Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3 px-5">Link Code</th>
                <th className="py-3 px-5">Client / Purpose</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Expiry</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400 text-xs">
                    Loading payment links...
                  </td>
                </tr>
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400 text-xs">
                    No payment links found. Click "Create Link" to generate one.
                  </td>
                </tr>
              ) : (
                links.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-blue-700 text-xs">
                      {l.code}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 leading-snug">{l.client_name}</div>
                      <div className="text-xs text-slate-400">{l.purpose}</div>
                    </td>
                    <td className="py-3.5 px-5 font-extrabold text-slate-900">
                      ₹{l.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">
                      {l.expiry_date || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        l.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {currentUser?.role === 'Client' && l.status === 'Active' ? (
                          <button
                            onClick={() => onOpenPortalLink && onOpenPortalLink(l.token || `tok_${l.id || 'demo'}`)}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>Pay Now</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setQrModalLink(l)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors cursor-pointer"
                              title="Show UPI QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopy(l.token || `tok_${l.id || 'demo'}`, l.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedId === l.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === l.id ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              onClick={() => onOpenPortalLink && onOpenPortalLink(l.token || `tok_${l.id || 'demo'}`)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl transition-colors cursor-pointer"
                              title="Open Payment Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal for Payment Link */}
      {qrModalLink && (
        <Modal
          isOpen={!!qrModalLink}
          onClose={() => setQrModalLink(null)}
          title={`Instant UPI QR · ${qrModalLink.code}`}
          maxWidth="max-w-sm"
        >
          <div className="space-y-4 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <QRCodeSVG
                  value={`upi://pay?pa=${masterSettings?.upi_id || 'redescreation@hdfcbank'}&pn=${encodeURIComponent(masterSettings?.company_name || 'Redes Creation')}&am=${qrModalLink.amount}&cu=INR&tn=${encodeURIComponent(qrModalLink.code + ' ' + (qrModalLink.purpose || 'Payment'))}`}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0B2545"
                  level="M"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xl font-black text-slate-900">₹{qrModalLink.amount?.toLocaleString('en-IN')}</div>
                <div className="text-xs font-semibold text-slate-600">{qrModalLink.client_name} · {qrModalLink.purpose}</div>
                <div className="text-[11px] text-slate-500 font-mono bg-slate-200/70 px-2 py-0.5 rounded-md inline-block">
                  {masterSettings?.upi_id || 'redescreation@hdfcbank'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-snug">
              Clients can scan this QR code with any UPI app (GPay, PhonePe, Paytm, BHIM) to pay instantly.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopy(qrModalLink.token || `tok_${qrModalLink.id || 'demo'}`, qrModalLink.id)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === qrModalLink.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Link</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const tokenToOpen = qrModalLink.token || `tok_${qrModalLink.id || 'demo'}`;
                  setQrModalLink(null);
                  if (onOpenPortalLink) {
                    onOpenPortalLink(tokenToOpen);
                  }
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Checkout</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Simple Create Payment Link Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Payment Link"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Target Client *</label>
            <select
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 50000"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Purpose / Title *</label>
            <input
              type="text"
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g. Website Development Advance"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Expiry Date (Optional)</label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowCreateModal(false)} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Generate Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
