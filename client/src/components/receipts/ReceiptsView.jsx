import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Receipt as ReceiptIcon, 
  Printer, 
  X, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Twitter,
  Building2,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { numberToWords } from '../../utils/numberToWords';

export default function ReceiptsView({ currentUser, masterSettings }) {
  const [receipts, setReceipts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [resRec, resCli] = await Promise.all([
          api.getReceipts(),
          api.getClients()
        ]);
        if (resRec.success) setReceipts(resRec.receipts);
        if (resCli.success) setClients(resCli.clients);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getClientForReceipt = (receipt) => {
    if (!receipt) return null;
    const found = clients.find(c => c.id === receipt.client_id || c.name === receipt.client_name);
    if (found) return found;
    return {
      name: receipt.client_name || 'Valued Client',
      company_name: receipt.client_name || 'Valued Client',
      billing_address: 'Business Park, Vijay Nagar, Indore, Madhya Pradesh, 452010',
      gstin: '23ABCDE1234F1Z5',
      email: 'accounts@client.com',
      phone: '+91 98260 12345'
    };
  };

  const clientInfo = selectedReceipt ? getClientForReceipt(selectedReceipt) : null;
  const amountRecVal = Number(selectedReceipt?.amount_received || 0);
  const remainingVal = Number(selectedReceipt?.remaining_balance || 0);
  const originalInvoiceTotal = amountRecVal + remainingVal;

  return (
    <div className="space-y-6">
      {/* Top Info Banner */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">
          Official GST-compliant payment vouchers and automated settlement acknowledgements.
        </p>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-4 px-6">Receipt No</th>
              <th className="py-4 px-6">Client / Invoice</th>
              <th className="py-4 px-6">Payment Date</th>
              <th className="py-4 px-6">Method / Tx Ref</th>
              <th className="py-4 px-6">Amount Received</th>
              <th className="py-4 px-6">Remaining Balance</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="py-12 text-center text-slate-400">Loading payment receipts...</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan="7" className="py-12 text-center text-slate-400">No payment receipts found.</td></tr>
            ) : (
              receipts.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#0B2545]">
                    <button onClick={() => setSelectedReceipt(r)} className="hover:underline text-left">
                      {r.receipt_number}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{r.client_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.invoice_number}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-medium">{r.payment_date}</td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800 font-medium">{r.payment_method}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.transaction_id}</div>
                  </td>
                  <td className="py-4 px-6 font-extrabold text-[#0B2545] tabular-nums">
                    ₹{Number(r.amount_received || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-700">
                    {r.remaining_balance === 0 ? (
                      <span className="text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        Fully Settled
                      </span>
                    ) : (
                      <span className="tabular-nums">₹{Number(r.remaining_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedReceipt(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] hover:bg-[#13335e] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Voucher</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Printable Receipt Modal (Corporate A4 Branded Layout - Image 2 Style) */}
      {selectedReceipt && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center items-start animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-4 sm:my-8 animate-scaleUp">
            
            {/* Top Toolbar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white font-black flex items-center justify-center text-xs shadow-2xs">
                  RC
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">Payment Acknowledgement Voucher (A4 Branded)</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Receipt #{selectedReceipt.receipt_number} · Ref: {selectedReceipt.invoice_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  onClick={() => setSelectedReceipt(null)}
                  className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                  title="Close receipt"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Printable Content Area (Exact Corporate Template Matching Image 2) */}
            <div id="printable-document" className="p-4 sm:p-6 print:p-0 bg-white space-y-2.5 print:space-y-2 text-slate-800 text-[10px] leading-normal font-sans">
              
              {/* 1. Header: Brand Logo & Company Info (Left) vs Receipt Details Card (Right) */}
              <div className="print-page-break-avoid flex flex-row items-start justify-between border-b border-slate-200 pb-2.5 gap-3">
                
                {/* Left: Brand Identity */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 100 100" className="w-10 h-10">
                        <path d="M15 15 L52 15 C68 15, 80 25, 80 40 C80 52, 71 61, 58 64 L82 88 L62 88 L42 66 L32 66 L32 88 L15 88 Z" fill="#0B2545" />
                        <path d="M32 30 L50 30 C58 30, 64 34, 64 40 C64 46, 58 50, 50 50 L32 50 Z" fill="#ffffff" />
                        <path d="M48 66 L68 88 L84 88 L60 60 Z" fill="#1E5AA8" opacity="0.9" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-base font-black text-[#0B2545] tracking-tight uppercase leading-none">{masterSettings?.company_name || 'REDES CREATION'}</h1>
                      <p className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">{masterSettings?.tagline || 'IT & DIGITAL SOLUTIONS'}</p>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-600 space-y-0.5 pt-0.5 leading-snug">
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

                {/* Right: Large PAYMENT RECEIPT Title & Metadata Table */}
                <div className="text-right space-y-1 shrink-0">
                  <div>
                    <div className="text-xl font-black text-[#0B2545] tracking-tight uppercase">PAYMENT RECEIPT</div>
                    <div className="text-[8px] font-bold text-slate-500 tracking-[0.18em] uppercase">BUILDING BRANDS DIGITALLY</div>
                  </div>

                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2 text-[9px] space-y-0.5 w-56 text-left shadow-2xs">
                    <div className="flex justify-between"><span className="text-slate-500">Receipt No.</span> <span className="font-mono font-bold text-slate-900">: {selectedReceipt.receipt_number}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Payment Date</span> <span className="font-semibold text-slate-800">: {selectedReceipt.payment_date}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Against Invoice</span> <span className="font-mono font-bold text-[#0B2545]">: {selectedReceipt.invoice_number}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Payment Mode</span> <span className="font-semibold text-slate-800">: {selectedReceipt.payment_method}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Transaction ID / UTR</span> <span className="font-mono font-semibold text-slate-800">: {selectedReceipt.transaction_id || 'N/A'}</span></div>
                  </div>
                </div>

              </div>

              {/* 2. RECEIVED FROM (Client Details Card) */}
              <div className="print-page-break-avoid bg-sky-50/50 border border-sky-100 rounded-xl p-2 text-[9.5px] space-y-0.5">
                <div className="text-[9px] font-bold text-sky-800 uppercase tracking-wider mb-0.5">RECEIVED WITH THANKS FROM</div>
                <div className="font-extrabold text-slate-900 text-[11px]">{clientInfo?.company_name || clientInfo?.name || selectedReceipt.client_name}</div>
                <div className="text-slate-700 font-medium">{clientInfo?.contact_person || 'Authorized Representative'}</div>
                <div className="text-slate-600 leading-snug">{clientInfo?.billing_address || '123, Business Park, Vijay Nagar, Indore, Madhya Pradesh, 452010, India'}</div>
                <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-slate-700 pt-0.5">
                  <div><strong>GSTIN:</strong> <span className="font-mono font-bold text-slate-900">{clientInfo?.gstin || '23ABCDE1234F1Z5'}</span></div>
                  <div><strong>Email:</strong> {clientInfo?.email || 'accounts@client.com'}</div>
                  <div><strong>Phone:</strong> {clientInfo?.phone || '+91 98260 12345'}</div>
                </div>
              </div>

              {/* 3. Settlement Summary Table with Dark Navy Header */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead className="bg-[#0B2545] text-white font-bold uppercase text-[8.5px] tracking-wider">
                    <tr>
                      <th className="py-1.5 px-2 w-10 text-center">#</th>
                      <th className="py-1.5 px-2">Description / Purpose</th>
                      <th className="py-1.5 px-2 text-center">Invoice Ref</th>
                      <th className="py-1.5 px-2 text-right">Invoice Total</th>
                      <th className="py-1.5 px-2 text-right">Amount Received</th>
                      <th className="py-1.5 px-2 text-right">Balance Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-1 px-2 text-center text-slate-400 font-medium">1</td>
                      <td className="py-1 px-2">
                        <div className="font-bold text-slate-900 text-[10px]">Settlement against Tax Invoice</div>
                        <div className="text-[8.5px] text-slate-500 leading-tight">Digital IT & Web Development Services</div>
                      </td>
                      <td className="py-1 px-2 text-center font-mono font-semibold text-slate-700">
                        {selectedReceipt.invoice_number}
                      </td>
                      <td className="py-1 px-2 text-right font-medium tabular-nums text-slate-700">
                        ₹ {originalInvoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-1 px-2 text-right font-black tabular-nums text-emerald-700">
                        ₹ {amountRecVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-1 px-2 text-right font-bold tabular-nums text-slate-900">
                        {remainingVal === 0 ? (
                          <span className="text-emerald-700 font-bold">₹ 0.00 (Nil)</span>
                        ) : (
                          `₹ ${remainingVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Total Amount Received Solid Navy Banner & Amount in Words */}
              <div className="print-page-break-avoid space-y-1">
                <div className="flex justify-end text-[9.5px]">
                  <div className="w-64 space-y-0.5">
                    <div className="bg-[#0B2545] text-white py-1 px-2.5 rounded-lg flex items-center justify-between font-bold text-[10.5px] shadow-xs">
                      <span>Total Amount Received</span>
                      <span className="text-xs font-black tabular-nums">
                        ₹ {amountRecVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full-width Amount in Words Banner */}
                <div className="bg-sky-50/60 border border-sky-100 rounded-lg px-2.5 py-1 text-[9px] text-slate-700 flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">Amount in Words:</span>
                  <span className="font-semibold text-slate-800">{numberToWords(amountRecVal)}</span>
                </div>
              </div>

              {/* 5. Bank Account & Payment Realization Notes (Side-by-Side) */}
              <div className="print-page-break-avoid grid grid-cols-2 gap-2 pt-0.5 text-[9px]">
                {/* Column 1: Bank Credit Info */}
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-[9.5px] mb-0.5">Deposited Into Corporate Account</div>
                  <div className="flex justify-between"><span className="text-slate-500">Account Name</span> <span className="font-semibold text-slate-800">: Redes Creation</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Bank Name</span> <span className="font-semibold text-slate-800">: HDFC Bank</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Account Number</span> <span className="font-mono font-bold text-slate-900">: 50200012345678</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">IFSC Code</span> <span className="font-mono font-bold text-slate-900">: HDFC0001234</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Branch</span> <span className="font-semibold text-slate-800">: Vijay Nagar, Indore</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">UPI ID</span> <span className="font-mono font-bold text-[#0B2545]">: redescreation@hdfcbank</span></div>
                </div>

                {/* Column 2: Terms & Notes */}
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-[9.5px] mb-0.5">Receipt Terms & Acknowledgement</div>
                  <ul className="space-y-0.5 text-slate-600 list-disc list-inside leading-snug text-[8.5px]">
                    <li>This payment receipt is subject to realization of cheque / bank clearance.</li>
                    <li>Receipt vouchers are automatically reconciled against invoice balances.</li>
                    <li>For billing queries, reach out to accounts@redescreation.com.</li>
                    <li>This is a computer-generated voucher and requires no physical stamp.</li>
                  </ul>
                </div>
              </div>

              {/* 6. Signature, Thank You & Company Seal (Side-by-Side) */}
              <div className="print-page-break-avoid grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200 items-end text-[8.5px]">
                <div className="space-y-0.5 text-slate-500">
                  <div>Verified By: <strong>Accounts Division</strong></div>
                  <div>Issued By: <strong>Redes Creation IT & Digital Solutions</strong></div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <div className="text-right">
                    <div className="text-lg font-serif italic font-black text-[#0B2545] leading-none">Thank You!</div>
                    <div className="text-[8.5px] font-semibold text-slate-500 mt-0.5">For Your Business</div>
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
    </div>
  );
}
