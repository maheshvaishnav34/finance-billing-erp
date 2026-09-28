import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Settings,
  Save,
  CheckCircle2,
  Percent,
  Hash,
  CreditCard,
  Mail,
  Building,
  Plus,
  Trash2,
  QrCode,
  ShieldCheck,
  Eye,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';
import { QRCodeSVG } from 'qrcode.react';

export default function SettingsView({ currentUser, onSettingsUpdated }) {
  const [activeTab, setActiveTab] = useState('tax');
  const [settings, setSettings] = useState(null);
  const [sequences, setSequences] = useState(null);
  const [taxRates, setTaxRates] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState({});
  const [activeTemplateKey, setActiveTemplateKey] = useState('invoice_sent');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // New tax rate inline modal/form
  const [showAddTax, setShowAddTax] = useState(false);
  const [newTax, setNewTax] = useState({
    name: '',
    rate: '',
    type: 'Intra-State GST',
    is_default: false,
    active: true
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.success) {
        setSettings(res.settings || {});
        setSequences(res.sequences || {});
        setTaxRates(res.tax_rates || []);
        setPaymentMethods(res.payment_methods || []);
        setEmailTemplates(res.email_templates || {});
        if (onSettingsUpdated && res.settings) {
          onSettingsUpdated(res.settings);
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSettings({
        settings,
        sequences,
        tax_rates: taxRates,
        payment_methods: paymentMethods,
        email_templates: emailTemplates
      });
      if (res.success) {
        setSaved(true);
        if (onSettingsUpdated && res.settings) {
          onSettingsUpdated(res.settings);
        }
        toast.success('Financial system settings saved successfully!');
        setTimeout(() => setSaved(false), 3500);
      } else {
        toast.error(res.message || 'Error updating settings');
      }
    } catch (err) {
      toast.error('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Add tax rate handler
  const handleAddTaxRate = (e) => {
    e.preventDefault();
    if (!newTax.name || !newTax.rate) return;
    const item = {
      id: `tax_${Date.now()}`,
      name: newTax.name,
      rate: parseFloat(newTax.rate),
      type: newTax.type,
      is_default: newTax.is_default,
      active: true
    };
    setTaxRates([...taxRates, item]);
    setShowAddTax(false);
    setNewTax({ name: '', rate: '', type: 'Intra-State GST', is_default: false, active: true });
  };

  const toggleTaxStatus = (id) => {
    setTaxRates(taxRates.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const removeTaxRate = (id) => {
    if (!confirm('Remove this tax configuration rule?')) return;
    setTaxRates(taxRates.filter(t => t.id !== id));
  };

  const togglePaymentMethod = (id) => {
    setPaymentMethods(paymentMethods.map(pm => pm.id === id ? { ...pm, enabled: !pm.enabled } : pm));
  };

  const updatePaymentMethod = (id, field, value) => {
    setPaymentMethods(paymentMethods.map(pm => pm.id === id ? { ...pm, [field]: value } : pm));
  };

  const updateTemplateField = (tplKey, field, val) => {
    setEmailTemplates({
      ...emailTemplates,
      [tplKey]: {
        ...emailTemplates[tplKey],
        [field]: val
      }
    });
  };

  const insertPlaceholder = (tplKey, tag) => {
    const cur = emailTemplates[tplKey]?.body || '';
    updateTemplateField(tplKey, 'body', cur + ` {${tag}} `);
  };

  if (loading || !settings) {
    return (
      <div className="py-16 text-center text-slate-400 font-medium">
        Loading enterprise financial configurations...
      </div>
    );
  }

  const tabs = [
    { id: 'tax', label: 'Tax & GST Rates', icon: Percent },
    { id: 'sequences', label: 'Document Sequences', icon: Hash },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'templates', label: 'Email Templates', icon: Mail },
    { id: 'company', label: 'Bank & Legal Profile', icon: Building }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header & Save Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>Finance & Billing Master Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Global statutory tax rules, auto-numbering sequences, payment channels, customizable email templates and bank details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings Saved!</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 fill-slate-950" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* 5-Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#131b2e] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TAX & GST RATES */}
      {activeTab === 'tax' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Goods & Services Tax (GST) & Withholding Rules</h3>
                <p className="text-xs text-slate-500">Configure CGST, SGST, IGST and TDS percentages applied during invoice creation.</p>
              </div>
              <button
                onClick={() => setShowAddTax(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tax Rule</span>
              </button>
            </div>

            {/* Tax Rates Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tax Label</th>
                    <th className="py-3 px-4">Rate (%)</th>
                    <th className="py-3 px-4">Category / Applicability</th>
                    <th className="py-3 px-4">Default</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxRates.map(tax => (
                    <tr key={tax.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{tax.name}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{tax.rate}%</td>
                      <td className="py-3.5 px-4 text-slate-600">{tax.type}</td>
                      <td className="py-3.5 px-4">
                        {tax.is_default ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold text-[10px]">
                            Default
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleTaxStatus(tax.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            tax.active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {tax.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeTaxRate(tax.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete tax rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Tax Modal */}
          {showAddTax && ReactDOM.createPortal(
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
                <h3 className="font-bold text-base text-slate-900">Add New Tax Rule</h3>
                <form onSubmit={handleAddTaxRate} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Tax Label *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GST 28% (Luxury / Special)"
                      value={newTax.name}
                      onChange={e => setNewTax({ ...newTax, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Percentage Rate (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="18"
                        value={newTax.rate}
                        onChange={e => setNewTax({ ...newTax, rate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Type</label>
                      <select
                        value={newTax.type}
                        onChange={e => setNewTax({ ...newTax, type: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Intra-State GST">Intra-State GST</option>
                        <option value="Inter-State GST">Inter-State GST</option>
                        <option value="Tax Deducted at Source">TDS Withholding</option>
                        <option value="Tax Collected at Source">TCS</option>
                        <option value="Export / Zero-Rated">Zero Rated / Export</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isDef"
                      checked={newTax.is_default}
                      onChange={e => setNewTax({ ...newTax, is_default: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <label htmlFor="isDef" className="text-slate-700 font-semibold cursor-pointer">
                      Set as default tax rule for matching invoices
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowAddTax(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl"
                    >
                      Add Tax
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* TAB 2: DOCUMENT SEQUENCES */}
      {activeTab === 'sequences' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Configurable Document Number Sequences</h3>
              <p className="text-xs text-slate-500">
                Custom prefixes and auto-incrementing serial numbers per financial year (e.g. FY 2026-27).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Invoice Number */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Tax Invoice Numbering</span>
                  <span className="font-mono text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    Preview: {sequences?.invoice?.prefix || 'RC/2026-27/INV/'}
                    {String(sequences?.invoice?.next || 9).padStart(4, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Prefix</label>
                    <input
                      type="text"
                      value={sequences?.invoice?.prefix || ''}
                      onChange={e => setSequences({ ...sequences, invoice: { ...sequences.invoice, prefix: e.target.value } })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Next Serial Number</label>
                    <input
                      type="number"
                      value={sequences?.invoice?.next || 1}
                      onChange={e => setSequences({ ...sequences, invoice: { ...sequences.invoice, next: parseInt(e.target.value) || 1 } })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Receipt Number */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Payment Receipt Numbering</span>
                  <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Preview: {sequences?.receipt?.prefix || 'RC/2026-27/REC/'}
                    {String(sequences?.receipt?.next || 4).padStart(4, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Prefix</label>
                    <input
                      type="text"
                      value={sequences?.receipt?.prefix || ''}
                      onChange={e => setSequences({ ...sequences, receipt: { ...sequences.receipt, prefix: e.target.value } })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Next Serial Number</label>
                    <input
                      type="number"
                      value={sequences?.receipt?.next || 1}
                      onChange={e => setSequences({ ...sequences, receipt: { ...sequences.receipt, next: parseInt(e.target.value) || 1 } })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Credit Note Number */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Credit Note Numbering</span>
                  <span className="font-mono text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                    Preview: {sequences?.credit_note?.prefix || 'RC/2026-27/CN/'}
                    {String(sequences?.credit_note?.next || 2).padStart(4, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Prefix</label>
                    <input
                      type="text"
                      value={sequences?.credit_note?.prefix || ''}
                      onChange={e => setSequences({ ...sequences, credit_note: { ...sequences.credit_note, prefix: e.target.value } })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Next Serial Number</label>
                    <input
                      type="number"
                      value={sequences?.credit_note?.next || 1}
                      onChange={e => setSequences({ ...sequences, credit_note: { ...sequences.credit_note, next: parseInt(e.target.value) || 1 } })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Link Sequence */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Payment Link Identifier</span>
                  <span className="font-mono text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                    Preview: {sequences?.payment_link?.prefix || 'RC/2026-27/PL/'}
                    {String(sequences?.payment_link?.next || 2).padStart(4, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Prefix</label>
                    <input
                      type="text"
                      value={sequences?.payment_link?.prefix || ''}
                      onChange={e => setSequences({ ...sequences, payment_link: { ...sequences.payment_link, prefix: e.target.value } })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Next Serial Number</label>
                    <input
                      type="number"
                      value={sequences?.payment_link?.next || 1}
                      onChange={e => setSequences({ ...sequences, payment_link: { ...sequences.payment_link, next: parseInt(e.target.value) || 1 } })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT METHODS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Supported Payment Channels & Gateways</h3>
              <p className="text-xs text-slate-500">
                Enable or disable payment options visible to clients on invoices and checkout portal.
              </p>
            </div>

            <div className="space-y-3">
              {paymentMethods.map(pm => (
                <div
                  key={pm.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{pm.name}</span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                        {pm.type}
                      </span>
                      {pm.is_default && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pm.instructions || ''}
                      onChange={e => updatePaymentMethod(pm.id, 'instructions', e.target.value)}
                      placeholder="Client payment instructions..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod(pm.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors ${
                        pm.enabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                    >
                      {pm.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EMAIL TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Automated Email Notification Templates</h3>
              <p className="text-xs text-slate-500">
                Customize outgoing emails sent when invoices are issued, reminders triggered, or receipts generated.
              </p>
            </div>

            {/* Template Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b pb-3">
              {Object.entries(emailTemplates).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTemplateKey(key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTemplateKey === key
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tpl.name || key}
                </button>
              ))}
            </div>

            {emailTemplates[activeTemplateKey] && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={emailTemplates[activeTemplateKey].subject || ''}
                    onChange={e => updateTemplateField(activeTemplateKey, 'subject', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 uppercase">Email Body Template</label>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>Insert Dynamic Tag:</span>
                      {['client_name', 'invoice_number', 'total', 'due_date', 'payment_link'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertPlaceholder(activeTemplateKey, tag)}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-mono text-[10px] rounded border border-blue-200"
                        >
                          +{'{' + tag + '}'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows="8"
                    value={emailTemplates[activeTemplateKey].body || ''}
                    onChange={e => updateTemplateField(activeTemplateKey, 'body', e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs leading-relaxed"
                  />
                </div>

                {/* Live Preview Box */}
                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Live Sample Render Preview</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-800 text-xs whitespace-pre-line font-sans">
                    {(emailTemplates[activeTemplateKey].body || '')
                      .replace(/{client_name}/g, 'Northstar Labs Pvt. Ltd.')
                      .replace(/{invoice_number}/g, 'RC/2026-27/INV/0008')
                      .replace(/{project}/g, 'ERP Custom Integrations')
                      .replace(/{currency}/g, '₹')
                      .replace(/{total}/g, '1,18,000')
                      .replace(/{balance_due}/g, '48,000')
                      .replace(/{amount_paid}/g, '70,000')
                      .replace(/{receipt_number}/g, 'RC/2026-27/REC/0003')
                      .replace(/{transaction_id}/g, 'HDFC/0904/7712')
                      .replace(/{remaining_balance}/g, '48,000')
                      .replace(/{due_date}/g, '04 Sept 2026')
                      .replace(/{payment_terms}/g, '15 Days')
                      .replace(/{payment_link}/g, 'https://erp.redescreation.com/pay/tok_sec_inv_0008')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: BANK & LEGAL PROFILE */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Company Legal Identity & Bank Settlement Accounts</h3>
              <p className="text-xs text-slate-500">
                Printed on formal invoices, receipts, and used for payment gateway settlement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={settings.company_name || ''}
                  onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Brand Short Code</label>
                <input
                  type="text"
                  value={settings.brand_short || 'RC'}
                  onChange={e => setSettings({ ...settings, brand_short: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={settings.gstin || ''}
                  onChange={e => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">PAN Number</label>
                <input
                  type="text"
                  value={settings.pan || ''}
                  onChange={e => setSettings({ ...settings, pan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Registered State</label>
                <input
                  type="text"
                  value={settings.state || ''}
                  onChange={e => setSettings({ ...settings, state: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Billing Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">Official Address</label>
                <input
                  type="text"
                  value={settings.address || ''}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Bank Details */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Settlement Bank Name</label>
                <input
                  type="text"
                  value={settings.bank_name || ''}
                  onChange={e => setSettings({ ...settings, bank_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={settings.account_name || ''}
                  onChange={e => setSettings({ ...settings, account_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={settings.account_number || ''}
                  onChange={e => setSettings({ ...settings, account_number: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={settings.ifsc || ''}
                  onChange={e => setSettings({ ...settings, ifsc: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">UPI VPA for Instant QR Payments</label>
                <input
                  type="text"
                  value={settings.upi_id || ''}
                  onChange={e => setSettings({ ...settings, upi_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  CEO High-Value Invoice Approval Threshold (₹)
                </label>
                <input
                  type="number"
                  value={settings.require_approval_above || 100000}
                  onChange={e => setSettings({ ...settings, require_approval_above: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-700"
                />
              </div>
            </div>

            {/* UPI Live QR Preview Widget */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-sm shrink-0">
                <QRCodeSVG
                  value={`upi://pay?pa=${settings.upi_id || 'redescreation@hdfcbank'}&pn=Redes%20Creation&cu=INR`}
                  size={68}
                  bgColor="#ffffff"
                  fgColor="#0B2545"
                  level="M"
                />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-500" />
                  <span>Dynamic UPI QR Code Generation</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">Live & Scannable</span>
                </div>
                <div className="text-slate-500 mt-1 leading-relaxed">
                  Clients can scan this QR code directly using PhonePe, Google Pay, or Paytm.
                  Target VPA: <span className="font-mono font-bold text-slate-900 bg-slate-200/70 px-1.5 py-0.5 rounded">{settings.upi_id || 'redescreation@hdfcbank'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
