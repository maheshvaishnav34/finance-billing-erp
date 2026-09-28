import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  X, 
  Printer, 
  Eye, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Twitter 
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';
import { numberToWords } from '../../utils/numberToWords';
import { QRCodeSVG } from 'qrcode.react';

export default function QuotationsView({ currentUser, masterSettings, onInvoiceCreated, actionTrigger }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (actionTrigger > 0) {
      setShowCreateModal(true);
    }
  }, [actionTrigger]);

  const [formData, setFormData] = useState({
    client_id: '',
    project: '',
    total: '',
    valid_until: '',
    notes: ''
  });

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.getQuotations();
      if (res.success) setQuotations(res.quotations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    api.getClients().then(res => {
      if (res.success) setClients(res.clients);
    });
  }, []);

  const handleConvert = async (quotId) => {
    if (!confirm('Convert this accepted quotation to an official tax invoice?')) return;
    try {
      const res = await api.convertQuotation(quotId);
      if (res.success) {
        toast.success(res.message || 'Quotation converted to tax invoice successfully!');
        fetchQuotations();
        setSelectedQuotation(null);
        if (onInvoiceCreated) {
          setTimeout(() => {
            onInvoiceCreated(res.invoice?.id);
          }, 1200);
        }
      } else {
        toast.error(res.message || 'Failed to convert quotation');
      }
    } catch (e) {
      toast.error('Conversion failed');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createQuotation(formData);
      if (res.success) {
        toast.success('Quotation created successfully!');
        setShowCreateModal(false);
        setFormData({ client_id: '', project: '', total: '', valid_until: '', notes: '' });
        fetchQuotations();
      }
    } catch (e) {
      toast.error('Error creating quotation');
    }
  };

  const getClientForQuot = (quot) => {
    if (!quot) return null;
    const found = clients.find(c => c.id === quot.client_id || c.name === quot.client_name);
    if (found) return found;
    return {
      name: quot.client_name || 'Valued Client',
      company_name: quot.client_name || 'Valued Client',
      billing_address: '123, Business Park, Vijay Nagar, Indore, Madhya Pradesh, 452010, India',
      gstin: '23ABCDE1234F1Z5',
      email: 'rahul@abctech.com',
      phone: '+91 98260 12345',
      contact_person: 'Mr. Rahul Sharma'
    };
  };

  // Helper calculations for selected quotation
  const clientInfo = selectedQuotation ? getClientForQuot(selectedQuotation) : null;
  const quotTotal = Number(selectedQuotation?.total || 0);
  const quotSubtotal = Number(selectedQuotation?.subtotal || Math.round((quotTotal / 1.18) * 100) / 100);
  const quotDiscount = Number(selectedQuotation?.discount || 0);
  const quotTaxable = Math.max(0, quotSubtotal - quotDiscount);
  const quotTax = quotTotal - quotTaxable;
  const quotCgst = Math.round((quotTax / 2) * 100) / 100;
  const quotSgst = quotTax - quotCgst;

  // Standard items fallback if quotation doesn't have custom items array
  const defaultItems = selectedQuotation?.items && selectedQuotation.items.length > 0
    ? selectedQuotation.items
    : [
        {
          product_service: selectedQuotation?.project || 'Digital IT Solutions & Web Development',
          description: selectedQuotation?.notes || 'Custom responsive architecture, CMS deployment, and digital asset integration.',
          hsn_sac: '998313',
          quantity: 1,
          unit: 'Nos',
          rate: quotSubtotal,
          discount: quotDiscount,
          taxable_amount: quotTaxable,
          tax_rate: 18,
          tax_amount: quotTax,
          total: quotTaxable
        }
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">
          Official GST-compliant proposals and quotations. Accepted proposals can be converted to invoices with 1 click.
        </p>
        {currentUser?.role !== 'Client' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Quotation</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-4 px-6">Quotation No</th>
              <th className="py-4 px-6">Client / Project</th>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">Valid Until</th>
              <th className="py-4 px-6">Total Amount</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions / Workflow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="py-12 text-center text-slate-400">Loading quotations...</td></tr>
            ) : quotations.length === 0 ? (
              <tr><td colSpan="7" className="py-12 text-center text-slate-400">No quotations found.</td></tr>
            ) : (
              quotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#0B2545]">
                    <button onClick={() => setSelectedQuotation(q)} className="hover:underline text-left">
                      {q.quotation_number}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{q.client_name}</div>
                    <div className="text-xs text-slate-500">{q.project}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{q.date}</td>
                  <td className="py-4 px-6 text-slate-600">{q.valid_until}</td>
                  <td className="py-4 px-6 font-extrabold text-[#0B2545] tabular-nums">
                    ₹{Number(q.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                      q.status === 'Converted' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      q.status === 'Accepted' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setSelectedQuotation(q)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] hover:bg-[#13335e] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all active:scale-95"
                        title="View / Print Quotation"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>

                      {q.status === 'Accepted' ? (
                        <button
                          onClick={() => handleConvert(q.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-2xs transition-all active:scale-95"
                        >
                          <span>Convert</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : q.status === 'Converted' ? (
                        <span className="text-[11px] text-slate-400 font-semibold px-2 py-1">Invoiced</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Printable Quotation Modal (A4 Branded Layout - Image 2 Style) */}
      {selectedQuotation && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center items-start animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 sm:my-8 animate-scaleUp">
            
            {/* Top Toolbar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white font-black flex items-center justify-center text-xs shadow-2xs">
                  RC
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">Quotation & Proposal Preview (A4 Branded)</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Official Quotation · {selectedQuotation.quotation_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedQuotation.status === 'Accepted' && (
                  <button
                    type="button"
                    onClick={() => handleConvert(selectedQuotation.id)}
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                  >
                    <span>Convert to Invoice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#0B2545] hover:bg-[#13335e] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuotation(null)}
                  className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                  title="Close quotation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Printable Content Area (Exact Corporate Template Matching Image 2) */}
            <div id="printable-document" className="p-4 sm:p-6 print:p-0 bg-white space-y-3 print:space-y-2.5 text-slate-800 text-[10.5px] leading-normal font-sans">
              
              {/* 1. Header: Brand Logo & Company Info (Left) vs Quotation Details Card (Right) */}
              <div className="print-page-break-avoid flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-3 print:pb-2 gap-3">
                
                {/* Left: Brand Identity */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 100 100" className="w-11 h-11">
                        <path d="M15 15 L52 15 C68 15, 80 25, 80 40 C80 52, 71 61, 58 64 L82 88 L62 88 L42 66 L32 66 L32 88 L15 88 Z" fill="#0B2545" />
                        <path d="M32 30 L50 30 C58 30, 64 34, 64 40 C64 46, 58 50, 50 50 L32 50 Z" fill="#ffffff" />
                        <path d="M48 66 L68 88 L84 88 L60 60 Z" fill="#1E5AA8" opacity="0.9" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-[#0B2545] tracking-tight uppercase leading-none">{masterSettings?.company_name || 'REDES CREATION'}</h1>
                      <p className="text-[9.5px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">{masterSettings?.tagline || 'IT & DIGITAL SOLUTIONS'}</p>
                    </div>
                  </div>

                  <div className="text-[9.5px] text-slate-600 space-y-0.5 pt-0.5 leading-snug">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#0B2545] shrink-0" />
                      <span>{masterSettings?.address || '403, Aashirwad Complex, Geeta Bhawan Square, Indore, Madhya Pradesh, 452001, India'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#0B2545] shrink-0" />
                      <span>{masterSettings?.phone || '+91 73540 05000'}</span>
                      <span className="text-slate-300">|</span>
                      <Mail className="w-3 h-3 text-[#0B2545] shrink-0" />
                      <span>{masterSettings?.email || 'info@redescreation.com'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-[#0B2545] shrink-0" />
                      <span>{masterSettings?.website || 'www.redescreation.com'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Large QUOTATION Title & Metadata Table */}
                <div className="text-left sm:text-right space-y-1 shrink-0">
                  <div>
                    <div className="text-2xl font-black text-[#0B2545] tracking-tight uppercase">QUOTATION</div>
                    <div className="text-[8.5px] font-bold text-slate-500 tracking-[0.18em] uppercase">BUILDING BRANDS DIGITALLY</div>
                  </div>

                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2 text-[9.5px] space-y-0.5 w-60 text-left shadow-2xs">
                    <div className="flex justify-between"><span className="text-slate-500">Quotation No.</span> <span className="font-mono font-bold text-slate-900">: {selectedQuotation.quotation_number}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Quotation Date</span> <span className="font-semibold text-slate-800">: {selectedQuotation.date}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Valid Until</span> <span className="font-semibold text-slate-800">: {selectedQuotation.valid_until}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Payment Terms</span> <span className="font-semibold text-slate-800">: 15 Days</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Project</span> <span className="font-semibold text-slate-800 truncate max-w-[120px]">: {selectedQuotation.project}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Status</span> <span className="font-semibold text-slate-800">: {selectedQuotation.status}</span></div>
                  </div>
                </div>

              </div>

              {/* 2. PROPOSAL FOR & BILL TO (Client Cards) */}
              <div className="print-page-break-avoid grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[10px]">
                <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-2.5 space-y-0.5">
                  <div className="text-[9.5px] font-bold text-sky-800 uppercase tracking-wider mb-0.5">PROPOSAL PREPARED FOR</div>
                  <div className="font-extrabold text-slate-900 text-xs">{clientInfo?.company_name || clientInfo?.name || selectedQuotation.client_name}</div>
                  <div className="text-slate-700 font-medium">{clientInfo?.contact_person || 'Authorized Representative'}</div>
                  <div className="text-slate-600 leading-snug">{clientInfo?.billing_address || '123, Business Park, Vijay Nagar, Indore, Madhya Pradesh, 452010, India'}</div>
                  <div className="text-slate-700 pt-0.5"><strong>GSTIN:</strong> <span className="font-mono font-bold text-slate-900">{clientInfo?.gstin || '23ABCDE1234F1Z5'}</span></div>
                  <div className="text-slate-700"><strong>Email:</strong> {clientInfo?.email || 'accounts@client.com'} · <strong>Phone:</strong> {clientInfo?.phone || '+91 98260 12345'}</div>
                </div>

                <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-2.5 space-y-0.5">
                  <div className="text-[9.5px] font-bold text-sky-800 uppercase tracking-wider mb-0.5">PROJECT SCOPE & DELIVERABLES</div>
                  <div className="font-extrabold text-slate-900 text-xs">{selectedQuotation.project}</div>
                  <div className="text-slate-600 leading-snug pt-0.5">
                    {selectedQuotation.notes || 'Full turnkey digital solution tailored for enterprise brand positioning, performance optimization, and scalable web architecture.'}
                  </div>
                  <div className="text-slate-700 pt-1 text-[9.5px]">
                    <strong>Proposal Validity:</strong> 15 Days from quote issuance date.
                  </div>
                </div>
              </div>

              {/* 3. Scope of Work Items Table with Dark Navy Header */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead className="bg-[#0B2545] text-white font-bold uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2">Scope / Deliverable Description</th>
                      <th className="py-2 px-2 text-center w-20">HSN/SAC</th>
                      <th className="py-2 px-2 text-center w-12">Qty</th>
                      <th className="py-2 px-2 text-center w-14">Unit</th>
                      <th className="py-2 px-2 text-right w-24">Rate (₹)</th>
                      <th className="py-2 px-2 text-right w-20">Discount</th>
                      <th className="py-2 px-2 text-center w-16">Tax</th>
                      <th className="py-2 px-2 text-right w-28">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {defaultItems.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-1.5 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <div className="font-bold text-slate-900 text-[11px]">{it.product_service}</div>
                          {it.description && <div className="text-[9.5px] text-slate-500 leading-tight">{it.description}</div>}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-[9.5px] text-slate-600">{it.hsn_sac || '998313'}</td>
                        <td className="py-1.5 px-2 text-center text-slate-700 font-medium">{it.quantity}</td>
                        <td className="py-1.5 px-2 text-center text-slate-600">{it.unit || 'Nos'}</td>
                        <td className="py-1.5 px-2 text-right font-medium tabular-nums text-slate-800">
                          {Number(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2 text-right font-medium tabular-nums text-slate-500">
                          {Number(it.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2 text-center font-medium text-slate-700">
                          {it.tax_rate || 18}% GST
                        </td>
                        <td className="py-1.5 px-2 text-right font-bold tabular-nums text-slate-950">
                          {Number(it.total || (it.rate * it.quantity - (it.discount || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Totals Breakdown & Amount in Words Banner */}
              <div className="print-page-break-avoid space-y-1.5">
                <div className="flex justify-end text-[10px]">
                  <div className="w-72 space-y-0.5">
                    <div className="flex justify-between items-center py-0.5 text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold tabular-nums text-slate-900">₹ {quotSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {quotDiscount > 0 && (
                      <div className="flex justify-between items-center py-0.5 text-slate-600">
                        <span>Total Discount</span>
                        <span className="font-semibold tabular-nums text-rose-600">- ₹ {quotDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-0.5 text-slate-600 border-t border-slate-100">
                      <span>Taxable Amount</span>
                      <span className="font-semibold tabular-nums text-slate-900">₹ {quotTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5 text-slate-600">
                      <span>CGST @ 9%</span>
                      <span className="font-semibold tabular-nums text-slate-900">₹ {quotCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 text-slate-600">
                      <span>SGST @ 9%</span>
                      <span className="font-semibold tabular-nums text-slate-900">₹ {quotSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {/* Total Quotation Amount (INR) Solid Navy Banner */}
                    <div className="bg-[#0B2545] text-white py-1.5 px-2.5 rounded-lg flex items-center justify-between font-bold text-[11px] mt-1 shadow-xs">
                      <span>Estimated Total (INR)</span>
                      <span className="text-sm font-black tabular-nums">₹ {quotTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Full-width Amount in Words Banner */}
                <div className="bg-sky-50/60 border border-sky-100 rounded-lg px-3 py-1 text-[10px] text-slate-700 flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">Amount in Words:</span>
                  <span className="font-semibold text-slate-800">{numberToWords(quotTotal)}</span>
                </div>
              </div>

              {/* 5. Payment Details, Scan & Pay (UPI) + QR, Notes (3 Columns Side-by-Side) */}
              <div className="print-page-break-avoid grid grid-cols-12 gap-2 pt-0.5 text-[9px]">
                
                {/* Column 1: Payment Details */}
                <div className="col-span-5 space-y-0.5">
                  <div className="font-bold text-slate-900 text-[9.5px] mb-0.5">Corporate Banking Coordinates</div>
                  <div className="flex justify-between"><span className="text-slate-500">Account Name</span> <span className="font-semibold text-slate-800">: {masterSettings?.account_name || masterSettings?.company_name || 'Redes Creation'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Bank Name</span> <span className="font-semibold text-slate-800">: {masterSettings?.bank_name || 'HDFC Bank'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Account Number</span> <span className="font-mono font-bold text-slate-900">: {masterSettings?.account_number || '50200012345678'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">IFSC Code</span> <span className="font-mono font-bold text-slate-900">: {masterSettings?.ifsc || 'HDFC0001234'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Branch</span> <span className="font-semibold text-slate-800">: {masterSettings?.branch || 'Vijay Nagar, Indore'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">UPI ID</span> <span className="font-mono font-bold text-blue-700">: {masterSettings?.upi_id || 'redescreation@hdfcbank'}</span></div>
                </div>

                {/* Column 2: Scan & Pay (UPI) + QR */}
                <div className="col-span-3 flex flex-col items-center justify-center text-center p-1 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-900 text-[9px] mb-0.5">Advance Token (UPI)</div>
                  <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center">
                    <QRCodeSVG
                      value={`upi://pay?pa=${masterSettings?.upi_id || 'redescreation@hdfcbank'}&pn=${encodeURIComponent(masterSettings?.company_name || 'Redes Creation')}&am=${selectedQuotation.grand_total}&cu=INR&tn=${encodeURIComponent(selectedQuotation.quotation_number)}`}
                      size={48}
                      bgColor="#ffffff"
                      fgColor="#0B2545"
                      level="M"
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="px-1 py-0.2 rounded bg-sky-100 text-[#0B2545] font-black text-[7px]">Paytm</span>
                    <span className="px-1 py-0.2 rounded bg-purple-100 text-purple-800 font-black text-[7px]">पे</span>
                    <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-black text-[7px]">GPay</span>
                  </div>
                </div>

                {/* Column 3: Proposal Notes */}
                <div className="col-span-4 space-y-0.5">
                  <div className="font-bold text-slate-900 text-[9.5px] mb-0.5">Commercial Notes</div>
                  <ul className="space-y-0.5 text-slate-600 list-disc list-inside leading-snug text-[8.5px]">
                    <li>This quote is valid for 15 days from issue date.</li>
                    <li>50% mobilization advance upon proposal sign-off.</li>
                    <li>Balance 50% upon successful client UAT and go-live.</li>
                    <li>Converts automatically into an official tax invoice.</li>
                  </ul>
                </div>

              </div>

              {/* 6. Terms & Conditions, Thank You! & Official Circular Seal (Side-by-Side) */}
              <div className="print-page-break-avoid grid grid-cols-12 gap-2 pt-1.5 border-t border-slate-200 items-end text-[8.5px]">
                
                {/* Left: Terms & Conditions */}
                <div className="col-span-7 space-y-0.5 text-slate-600">
                  <div className="font-bold text-slate-900 text-[9px] uppercase tracking-wider mb-0.5">Terms & Conditions</div>
                  <div>1. Proposal validity is 15 days. Post validity period, pricing is subject to review.</div>
                  <div>2. Additional scope expansions will be estimated separately.</div>
                  <div>3. Source code and deployment assets transferred upon final invoice settlement.</div>
                  <div>4. All taxes are levied as per prevailing GST statutory regulations.</div>
                </div>

                {/* Right: Thank You! Script & Circular Seal */}
                <div className="col-span-5 flex items-center justify-end gap-2.5">
                  <div className="text-right">
                    <div className="text-lg font-serif italic font-black text-[#0B2545] leading-none">Thank You!</div>
                    <div className="text-[8.5px] font-semibold text-slate-500 mt-0.5">Looking Forward To Working Together</div>
                  </div>

                  {/* Official Company Seal Badge */}
                  <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-[#0B2545]/60 p-0.5 flex items-center justify-center shrink-0">
                    <div className="w-full h-full rounded-full border border-[#0B2545] flex flex-col items-center justify-center p-0.5 text-center bg-sky-50/20">
                      <span className="text-[5px] font-black tracking-widest text-[#0B2545] uppercase leading-none">REDES CREATION</span>
                      <div className="w-3.5 h-3.5 my-0.2">
                        <svg viewBox="0 0 100 100" className="w-3.5 h-3.5">
                          <path d="M15 15 L52 15 C68 15, 80 25, 80 40 C80 52, 71 61, 58 64 L82 88 L62 88 L42 66 L32 66 L32 88 L15 88 Z" fill="#0B2545" />
                          <path d="M32 30 L50 30 C58 30, 64 34, 64 40 C64 46, 58 50, 50 50 L32 50 Z" fill="#ffffff" />
                        </svg>
                      </div>
                      <span className="text-[4.5px] font-bold tracking-tight text-[#0B2545] uppercase leading-none">IT & DIGITAL SOLUTIONS</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Quotation Modal */}
      {showCreateModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Create Quotation</h3>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Client *</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  placeholder="e.g. Website Development & SEO Setup"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Estimated Total (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                    placeholder="76700"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Scope / Commercial Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Details of deliverables, milestones..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl shadow-2xs">Save Quotation</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
