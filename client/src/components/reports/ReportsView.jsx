import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Receipt,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Printer,
  ExternalLink,
  CreditCard,
  ArrowUpRight,
  PieChart,
  Clock,
  Filter,
  Search,
  X,
  Building2,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Globe
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';

export default function ReportsView({ currentUser, masterSettings, onOpenPortalLink }) {
  const [activeReport, setActiveReport] = useState('aging');
  const [agingData, setAgingData] = useState(null);
  const [gstData, setGstData] = useState(null);
  const [collectionsData, setCollectionsData] = useState(null);
  const [outstandingData, setOutstandingData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const reportTitles = {
    aging: 'ACCOUNTS RECEIVABLE (AR) AGING SCHEDULE & DEBTORS STATEMENT',
    outstanding: 'OUTSTANDING RECEIVABLES & UNCOLLECTED INVOICES AUDIT',
    gst: 'GST STATUTORY TAX COMPLIANCE & RECONCILIATION STATEMENT',
    collections: 'PAYMENT COLLECTIONS & SETTLEMENT INSTRUMENTS REPORT',
    revenue: 'EXECUTIVE REVENUE, BILLING VOLUME & CLIENT CONTRIBUTION REPORT'
  };

  const company = masterSettings || {
    company_name: 'REDES CREATION',
    tagline: 'IT & DIGITAL SOLUTIONS',
    address: '403, Aashirwad Complex, Geeta Bhawan Square, Indore, MP, 452001',
    gstin: '23AABCR1234F1Z5',
    phone: '+91 98765 43210',
    email: 'billing@redescreation.com',
    website: 'www.redescreation.com'
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const [aging, gst, col, out, rev] = await Promise.all([
        api.getAgingReport(),
        api.getGstReport(),
        api.getCollectionsReport(),
        api.getOutstandingReport(),
        api.getRevenueReport()
      ]);
      if (aging.success) setAgingData(aging.aging);
      if (gst.success) setGstData(gst);
      if (col.success) setCollectionsData(col);
      if (out.success) setOutstandingData(out);
      if (rev.success) setRevenueData(rev);
    } catch (e) {
      console.error('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const exportCSV = (filename, rows) => {
    if (!rows || !rows.length) {
      toast.warning('No data available to export');
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [showPrintModal, setShowPrintModal] = useState(false);

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub-report selector tabs & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveReport('aging')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeReport === 'aging'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>AR Aging Schedule</span>
          </button>
          <button
            onClick={() => setActiveReport('outstanding')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeReport === 'outstanding'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Outstanding Invoices</span>
          </button>
          <button
            onClick={() => setActiveReport('gst')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeReport === 'gst'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GST & Tax Compliance</span>
          </button>
          <button
            onClick={() => setActiveReport('collections')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeReport === 'collections'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Collections by Method</span>
          </button>
          <button
            onClick={() => setActiveReport('revenue')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeReport === 'revenue'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Revenue & Growth</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold shadow-sm transition-all hover:border-slate-400"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          {activeReport === 'gst' && gstData?.entries && (
            <button
              onClick={() => exportCSV('Redes_GST_Report_2026', gstData.entries)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {activeReport === 'outstanding' && outstandingData?.invoices && (
            <button
              onClick={() => exportCSV('Redes_Outstanding_Invoices_Report', outstandingData.invoices)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {activeReport === 'collections' && collectionsData?.payments && (
            <button
              onClick={() => exportCSV('Redes_Collections_Report', collectionsData.payments)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {activeReport === 'revenue' && revenueData?.clientRevenue && (
            <button
              onClick={() =>
                exportCSV(
                  'Redes_Revenue_By_Client',
                  Object.entries(revenueData.clientRevenue).map(([client, revenue]) => ({
                    Client: client,
                    Revenue_INR: revenue
                  }))
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {activeReport === 'aging' && agingData && (
            <button
              onClick={() => {
                const allItems = [
                  ...(agingData.current?.items || []),
                  ...(agingData.d31_60?.items || []),
                  ...(agingData.d61_90?.items || []),
                  ...(agingData.d90_plus?.items || [])
                ];
                exportCSV('Redes_AR_Aging_Schedule', allItems);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse">Loading financial intelligence data...</div>
      ) : activeReport === 'aging' ? (
        /* TAB 1: AR Aging Schedule */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">0–30 Days (Current / Not Due)</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{(agingData?.current?.amount || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-500 mt-1">{agingData?.current?.count || 0} Invoices</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm bg-amber-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">31–60 Days Overdue</span>
              <div className="text-2xl font-extrabold text-amber-800 mt-1">₹{(agingData?.d31_60?.amount || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs text-amber-700/80 mt-1">{agingData?.d31_60?.count || 0} Invoices</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-orange-200 shadow-sm bg-orange-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">61–90 Days Overdue</span>
              <div className="text-2xl font-extrabold text-orange-800 mt-1">₹{(agingData?.d61_90?.amount || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs text-orange-700/80 mt-1">{agingData?.d61_90?.count || 0} Invoices</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-sm bg-rose-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">90+ Days Critical Overdue</span>
              <div className="text-2xl font-extrabold text-rose-800 mt-1">₹{(agingData?.d90_plus?.amount || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs text-rose-700/80 mt-1">{agingData?.d90_plus?.count || 0} Invoices (Requires Escalation)</div>
            </div>
          </div>

          {/* Drilldown Table for Aging */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Aging Schedule Invoices Breakdown</h4>
              <span className="text-xs text-slate-500">Sorted by Overdue Risk</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
                <tr>
                  <th className="py-3 px-5">Invoice No</th>
                  <th className="py-3 px-5">Client Name</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Overdue Days</th>
                  <th className="py-3 px-5">Aging Bracket</th>
                  <th className="py-3 px-5 text-right">Outstanding Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ...(agingData?.d90_plus?.items?.map(i => ({ ...i, bracket: '90+ Days Critical', badge: 'bg-rose-100 text-rose-800 border-rose-200' })) || []),
                  ...(agingData?.d61_90?.items?.map(i => ({ ...i, bracket: '61–90 Days', badge: 'bg-orange-100 text-orange-800 border-orange-200' })) || []),
                  ...(agingData?.d31_60?.items?.map(i => ({ ...i, bracket: '31–60 Days', badge: 'bg-amber-100 text-amber-800 border-amber-200' })) || []),
                  ...(agingData?.current?.items?.map(i => ({ ...i, bracket: 'Current (0–30 Days)', badge: 'bg-slate-100 text-slate-700 border-slate-200' })) || [])
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-blue-700">{item.invoice_number}</td>
                    <td className="py-3 px-5 font-semibold text-slate-900">{item.client_name}</td>
                    <td className="py-3 px-5 text-slate-600">{item.due_date}</td>
                    <td className="py-3 px-5 font-bold text-rose-600">{item.days_overdue > 0 ? `${item.days_overdue} days` : 'Not Due'}</td>
                    <td className="py-3 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.badge}`}>
                        {item.bracket}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-extrabold text-slate-900">₹{(item.amount_due || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeReport === 'outstanding' ? (
        /* TAB 2: Outstanding Invoices Report */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-sm bg-rose-50/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total Uncollected Balance</span>
              <div className="text-2xl font-extrabold text-rose-800 mt-1">
                ₹{(outstandingData?.totalOutstandingAmount || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 mt-1">{outstandingData?.totalCount || 0} Invoices with Pending Dues</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Critical (Over 30 Days Overdue)</span>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">
                {(outstandingData?.invoices || []).filter(i => i.days_overdue > 30).length} Invoices
              </div>
              <div className="text-xs text-slate-500 mt-1">High-priority for escalation</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm bg-blue-50/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Quick Reminder Actions</span>
              <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                Automated reminders trigger on D-3, D-1, Due Date, D+3, D+7, and D+15 (CEO alert).
              </div>
            </div>
          </div>

          {/* Search bar for Outstanding */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by client name, invoice number, or project..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
                <tr>
                  <th className="py-3 px-5">Invoice No</th>
                  <th className="py-3 px-5">Client Details</th>
                  <th className="py-3 px-5">Project</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Days Overdue</th>
                  <th className="py-3 px-5">Total Invoice</th>
                  <th className="py-3 px-5">Paid</th>
                  <th className="py-3 px-5 text-right">Outstanding (₹)</th>
                  <th className="py-3 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(outstandingData?.invoices || [])
                  .filter(inv => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      inv.invoice_number?.toLowerCase().includes(term) ||
                      inv.client_name?.toLowerCase().includes(term) ||
                      inv.project?.toLowerCase().includes(term)
                    );
                  })
                  .map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5 font-mono font-bold text-blue-700">{inv.invoice_number}</td>
                      <td className="py-3 px-5">
                        <div className="font-bold text-slate-900">{inv.client_name}</div>
                        <div className="text-[11px] text-slate-400">{inv.email || inv.phone}</div>
                      </td>
                      <td className="py-3 px-5 text-slate-600">{inv.project || 'General'}</td>
                      <td className="py-3 px-5 text-slate-600">{inv.due_date}</td>
                      <td className="py-3 px-5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.days_overdue > 30
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : inv.days_overdue > 0
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {inv.days_overdue > 0 ? `${inv.days_overdue} days` : 'Current'}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-700">₹{(inv.total || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-5 font-semibold text-emerald-700">₹{(inv.amount_paid || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-5 text-right font-extrabold text-rose-700">₹{(inv.amount_due || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-5 text-center">
                        {inv.secure_token && onOpenPortalLink && (
                          <button
                            onClick={() => onOpenPortalLink(inv.secure_token)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Open Secure Client Pay Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeReport === 'gst' ? (
        /* TAB 3: GST Compliance & Tax Report */
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm text-xs">
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Total Taxable Value</span>
              <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                ₹{(gstData?.summary?.totalTaxable || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Total CGST</span>
              <span className="text-lg font-extrabold text-slate-800 mt-1 block">
                ₹{(gstData?.summary?.totalCGST || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Total SGST</span>
              <span className="text-lg font-extrabold text-slate-800 mt-1 block">
                ₹{(gstData?.summary?.totalSGST || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Total IGST</span>
              <span className="text-lg font-extrabold text-blue-700 mt-1 block">
                ₹{(gstData?.summary?.totalIGST || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="col-span-2 lg:col-span-1 bg-amber-50/50 p-2.5 rounded-2xl border border-amber-200/60">
              <span className="text-amber-800 block font-bold uppercase text-[10px]">Total GST Liability</span>
              <span className="text-lg font-extrabold text-amber-900 mt-1 block">
                ₹{(gstData?.summary?.totalGST || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
                <tr>
                  <th className="py-3 px-5">Invoice No</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Client / GSTIN</th>
                  <th className="py-3 px-5">Place of Supply</th>
                  <th className="py-3 px-5">Taxable (₹)</th>
                  <th className="py-3 px-5">CGST (₹)</th>
                  <th className="py-3 px-5">SGST (₹)</th>
                  <th className="py-3 px-5">IGST (₹)</th>
                  <th className="py-3 px-5">Total GST (₹)</th>
                  <th className="py-3 px-5 text-right">Invoice Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(gstData?.entries || []).map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-5 font-mono font-bold text-blue-700">{e.invoice_number}</td>
                    <td className="py-3 px-5 text-slate-600">{e.invoice_date}</td>
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-900">{e.client_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{e.gstin}</div>
                    </td>
                    <td className="py-3 px-5 text-slate-700">{e.place_of_supply}</td>
                    <td className="py-3 px-5 font-semibold text-slate-800">₹{(e.taxable_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-5 text-slate-600">₹{(e.cgst || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-5 text-slate-600">₹{(e.sgst || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-5 text-blue-700 font-semibold">₹{(e.igst || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-5 font-bold text-slate-900">₹{(e.total_gst || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-5 text-right font-extrabold text-slate-900">₹{(e.invoice_total || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeReport === 'collections' ? (
        /* TAB 4: Collections by Method */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Collections Breakdown by Payment Instrument</h4>
                <p className="text-xs text-slate-500">Total verified collections across all channels</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Grand Total Received</span>
                <span className="text-2xl font-extrabold text-emerald-700 block">
                  ₹{(collectionsData?.totalCollected || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {Object.entries(collectionsData?.byMethod || {}).map(([method, amount]) => (
                <div key={method} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{method}</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">₹{(amount || 0).toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {(((amount || 0) / (collectionsData?.totalCollected || 1)) * 100).toFixed(1)}% of total
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Log Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">All Payment Transactions</h4>
              <span className="text-xs text-slate-500">{(collectionsData?.payments || []).length} Payments Recorded</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
                <tr>
                  <th className="py-3 px-5">Receipt / ID</th>
                  <th className="py-3 px-5">Payment Date</th>
                  <th className="py-3 px-5">Client / Payer</th>
                  <th className="py-3 px-5">Invoice Reference</th>
                  <th className="py-3 px-5">Method</th>
                  <th className="py-3 px-5">Transaction ID / UTR</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(collectionsData?.payments || []).map((pay, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">{pay.receipt_number || pay.id}</td>
                    <td className="py-3 px-5 text-slate-600">{pay.payment_date}</td>
                    <td className="py-3 px-5 font-bold text-slate-800">{pay.client_name || 'Client'}</td>
                    <td className="py-3 px-5 font-mono text-blue-700 font-semibold">{pay.invoice_number || 'Direct'}</td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-semibold text-[10px]">
                        {pay.method}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono text-slate-500 text-[11px]">{pay.transaction_id || pay.reference_id || 'N/A'}</td>
                    <td className="py-3 px-5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          pay.verification_status === 'Verified' || pay.verification_status === 'Reconciled'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {pay.verification_status || 'Verified'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-extrabold text-emerald-700">₹{(pay.amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 5: Revenue & Growth Analytics */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Billed Volume</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                ₹{(revenueData?.totalInvoiced || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 mt-1">Cumulative invoices issued</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm bg-emerald-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Realized Revenue</span>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">
                ₹{(revenueData?.totalCollected || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-700/80 mt-1">Successfully collected funds</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm bg-blue-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Collection Efficiency Rate</span>
              <div className="text-2xl font-extrabold text-blue-800 mt-1">
                {revenueData?.totalInvoiced
                  ? `${Math.round(((revenueData.totalCollected || 0) / revenueData.totalInvoiced) * 100)}%`
                  : '100%'}
              </div>
              <div className="text-xs text-blue-700/80 mt-1">Realization vs Total Invoiced</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Monthly Billing Volume (FY 2026-27)</span>
              </h4>
              <div className="space-y-3">
                {Object.entries(revenueData?.monthlyRevenue || {}).map(([month, amount]) => {
                  const maxAmt = Math.max(...Object.values(revenueData?.monthlyRevenue || { a: 1 }));
                  const pct = Math.max(10, Math.round(((amount || 0) / (maxAmt || 1)) * 100));
                  return (
                    <div key={month} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{month}</span>
                        <span>₹{(amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Client Contribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span>Client Revenue Contribution</span>
              </h4>
              <div className="space-y-3">
                {Object.entries(revenueData?.clientRevenue || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([client, revenue], idx) => {
                    const pct = Math.round(((revenue || 0) / (revenueData?.totalInvoiced || 1)) * 100);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{client}</div>
                          <div className="text-[10px] text-slate-400">{pct}% of overall portfolio</div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-slate-900">₹{(revenue || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Corporate Print Preview via Portal */}
      {showPrintModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] overflow-y-auto p-3 sm:p-5 flex justify-center items-start animate-fadeIn">
          <div className="w-full max-w-[850px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-3 sm:my-6 animate-scaleUp">
            
            {/* Top Toolbar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white font-black flex items-center justify-center text-xs shadow-xs">
                  RC
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">Financial Audit Statement Preview (A4 Branded)</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Compliance & Statutory Report · {reportTitles[activeReport] || 'Financial Intelligence'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#0B2545] hover:bg-[#13335e] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div id="printable-document" className="p-4 sm:p-6 print:p-0 bg-white space-y-2.5 print:space-y-2 text-slate-800 text-[10px] leading-normal font-sans">
              {renderPrintableContent()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  function renderPrintableContent() {
    return (
      <div className="space-y-3.5 w-full text-slate-800 text-[10.5px] leading-normal font-sans">
        {/* Header with Redes logo & audit metadata */}
        <div className="print-page-break-avoid flex flex-row items-start justify-between border-b-2 border-[#0B2545] pb-3 gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                <path d="M15 15 L52 15 C68 15, 80 25, 80 40 C80 52, 71 61, 58 64 L82 88 L62 88 L42 66 L32 66 L32 88 L15 88 Z" fill="#0B2545" />
                <path d="M32 30 L50 30 C58 30, 64 34, 64 40 C64 46, 58 50, 50 50 L32 50 Z" fill="#ffffff" />
                <path d="M48 66 L68 88 L84 88 L60 60 Z" fill="#1E5AA8" opacity="0.9" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-black text-[#0B2545] tracking-tight uppercase leading-none">
                {company.company_name || 'REDES CREATION'}
              </h1>
              <p className="text-[9.5px] font-bold text-slate-600 tracking-[0.16em] uppercase mt-0.5">
                {company.tagline || 'IT & DIGITAL SOLUTIONS'}
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5 max-w-md leading-tight">
                {company.address || '403, Aashirwad Complex, Geeta Bhawan Square, Indore, Madhya Pradesh, 452001, India'}
              </p>
              <div className="text-[9px] text-slate-600 mt-0.5">
                GSTIN: <strong className="font-mono text-slate-900 font-bold">{company.gstin || '23AABCR8899K1Z0'}</strong> · Phone: {company.phone || '+91 73540 05000'}
              </div>
            </div>
          </div>

          <div className="text-right space-y-0.5 shrink-0">
            <span className="text-[11px] font-black text-[#0B2545] uppercase tracking-wider block">FINANCIAL INTELLIGENCE AUDIT</span>
            <div className="text-[9.5px] text-slate-600">Generated: <strong className="text-slate-900">{new Date().toLocaleString('en-IN')}</strong></div>
            <div className="text-[9.5px] text-slate-600">Auditor: <strong className="text-slate-900">{currentUser?.name || 'Chirag Malviya'} ({currentUser?.role || 'Finance/Admin'})</strong></div>
            <div className="text-[9.5px] text-slate-600">Financial Year: <strong className="text-slate-900">FY 2026–27</strong></div>
          </div>
        </div>

        {/* Report Title Banner */}
        <div className="print-page-break-avoid bg-[#0B2545] text-white py-2 px-3.5 rounded-xl flex items-center justify-between shadow-xs">
          <span className="font-black text-[11px] uppercase tracking-wide">
            {reportTitles[activeReport] || 'FINANCIAL REPORT STATEMENT'}
          </span>
          <span className="text-[8.5px] font-black text-amber-300 bg-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
            OFFICIAL ERP AUDIT
          </span>
        </div>

        {/* Executive Summary & Tables */}
        {activeReport === 'aging' && (
          <div className="space-y-3">
            {/* KPI Summary 4-Column Cards */}
            <div className="print-page-break-avoid grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-200">
                <span className="text-sky-800 uppercase font-black block text-[9px] tracking-wider">0–30 DAYS (CURRENT)</span>
                <span className="text-base font-black text-slate-900 block mt-1 tabular-nums whitespace-nowrap">₹{(agingData?.current?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-slate-500 text-[9.5px] mt-0.5 block">{agingData?.current?.count || 0} Invoices</span>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                <span className="text-amber-800 uppercase font-black block text-[9px] tracking-wider">31–60 DAYS OVERDUE</span>
                <span className="text-base font-black text-amber-900 block mt-1 tabular-nums whitespace-nowrap">₹{(agingData?.d31_60?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-amber-700 text-[9.5px] mt-0.5 block">{agingData?.d31_60?.count || 0} Invoices</span>
              </div>
              <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-200">
                <span className="text-orange-800 uppercase font-black block text-[9px] tracking-wider">61–90 DAYS OVERDUE</span>
                <span className="text-base font-black text-orange-900 block mt-1 tabular-nums whitespace-nowrap">₹{(agingData?.d61_90?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-orange-700 text-[9.5px] mt-0.5 block">{agingData?.d61_90?.count || 0} Invoices</span>
              </div>
              <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-200">
                <span className="text-rose-800 uppercase font-black block text-[9px] tracking-wider">90+ DAYS CRITICAL</span>
                <span className="text-base font-black text-rose-900 block mt-1 tabular-nums whitespace-nowrap">₹{(agingData?.d90_plus?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-rose-700 text-[9.5px] mt-0.5 block">{agingData?.d90_plus?.count || 0} Invoices</span>
              </div>
            </div>

            {/* Table with proper column widths, no wrap, clean typography */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[10px] border-collapse table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[28%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead className="bg-[#0B2545] text-white font-bold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">INVOICE NO</th>
                    <th className="py-2.5 px-3">CLIENT NAME</th>
                    <th className="py-2.5 px-3">DUE DATE</th>
                    <th className="py-2.5 px-3">OVERDUE</th>
                    <th className="py-2.5 px-3">AGING BRACKET</th>
                    <th className="py-2.5 px-3 text-right">OUTSTANDING (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[
                    ...(agingData?.d90_plus?.items || []),
                    ...(agingData?.d61_90?.items || []),
                    ...(agingData?.d31_60?.items || []),
                    ...(agingData?.current?.items || [])
                  ].map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-2 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">{item.invoice_number}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 truncate" title={item.client_name}>{item.client_name}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono whitespace-nowrap">{item.due_date}</td>
                      <td className="py-2 px-3 font-bold whitespace-nowrap text-rose-700">
                        {item.days_overdue > 0 ? `${item.days_overdue} days` : 'Not Due'}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {item.bracket || (item.days_overdue > 0 ? `${item.days_overdue}d Overdue` : 'Current (0–30d)')}
                      </td>
                      <td className="py-2 px-3 text-right font-black tabular-nums text-slate-900 whitespace-nowrap">
                        ₹{(item.amount_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'outstanding' && (
          <div className="space-y-4">
            <div className="print-page-break-avoid grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-200">
                <span className="text-rose-800 uppercase font-black block text-[9px] tracking-wider">TOTAL OUTSTANDING DUES</span>
                <span className="text-base font-black text-rose-900 block mt-1 tabular-nums whitespace-nowrap">₹{(outstandingData?.totalOutstandingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-200">
                <span className="text-sky-800 uppercase font-black block text-[9px] tracking-wider">TOTAL PENDING INVOICES</span>
                <span className="text-base font-black text-slate-900 block mt-1 tabular-nums">{outstandingData?.totalCount || 0} Invoices</span>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                <span className="text-amber-800 uppercase font-black block text-[9px] tracking-wider">CRITICAL OVERDUE (30D+)</span>
                <span className="text-base font-black text-amber-900 block mt-1 tabular-nums">{(outstandingData?.invoices || []).filter(i => i.days_overdue > 30).length} Invoices</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[10px] border-collapse table-fixed">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[26%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="bg-[#0B2545] text-white font-bold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">INVOICE NO</th>
                    <th className="py-2.5 px-3">CLIENT DETAILS</th>
                    <th className="py-2.5 px-3">DUE DATE</th>
                    <th className="py-2.5 px-3">OVERDUE</th>
                    <th className="py-2.5 px-3 text-right">TOTAL (₹)</th>
                    <th className="py-2.5 px-3 text-right">PAID (₹)</th>
                    <th className="py-2.5 px-3 text-right">OUTSTANDING (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(outstandingData?.invoices || []).map((inv, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-2 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">{inv.invoice_number}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 truncate">{inv.client_name}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono whitespace-nowrap">{inv.due_date}</td>
                      <td className="py-2 px-3 font-bold text-rose-700 whitespace-nowrap">{inv.days_overdue > 0 ? `${inv.days_overdue} days` : 'Current'}</td>
                      <td className="py-2 px-3 text-right font-medium tabular-nums whitespace-nowrap">₹{(inv.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-medium text-emerald-700 tabular-nums whitespace-nowrap">₹{(inv.amount_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-black text-rose-800 tabular-nums whitespace-nowrap">₹{(inv.amount_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'gst' && (
          <div className="space-y-4">
            <div className="print-page-break-avoid grid grid-cols-5 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase font-black block text-[8.5px] tracking-wider">TAXABLE TURNOVER</span>
                <span className="text-xs font-black text-slate-900 block mt-0.5 tabular-nums whitespace-nowrap">₹{(gstData?.summary?.totalTaxable || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase font-black block text-[8.5px] tracking-wider">TOTAL CGST</span>
                <span className="text-xs font-black text-slate-800 block mt-0.5 tabular-nums whitespace-nowrap">₹{(gstData?.summary?.totalCGST || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase font-black block text-[8.5px] tracking-wider">TOTAL SGST</span>
                <span className="text-xs font-black text-slate-800 block mt-0.5 tabular-nums whitespace-nowrap">₹{(gstData?.summary?.totalSGST || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase font-black block text-[8.5px] tracking-wider">TOTAL IGST</span>
                <span className="text-xs font-black text-blue-800 block mt-0.5 tabular-nums whitespace-nowrap">₹{(gstData?.summary?.totalIGST || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200">
                <span className="text-amber-800 uppercase font-black block text-[8.5px] tracking-wider">TOTAL GST LIABILITY</span>
                <span className="text-xs font-black text-amber-900 block mt-0.5 tabular-nums whitespace-nowrap">₹{(gstData?.summary?.totalGST || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[9.5px] border-collapse table-fixed">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[10%]" />
                  <col className="w-[20%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead className="bg-[#0B2545] text-white font-bold uppercase text-[8.5px] tracking-wider">
                  <tr>
                    <th className="py-2 px-2.5">INVOICE</th>
                    <th className="py-2 px-2.5">DATE</th>
                    <th className="py-2 px-2.5">CLIENT / GSTIN</th>
                    <th className="py-2 px-2.5">PLACE OF SUPPLY</th>
                    <th className="py-2 px-2.5 text-right">TAXABLE (₹)</th>
                    <th className="py-2 px-2 text-right">CGST</th>
                    <th className="py-2 px-2 text-right">SGST</th>
                    <th className="py-2 px-2 text-right">IGST</th>
                    <th className="py-2 px-2.5 text-right">TOTAL (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(gstData?.entries || []).map((e, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-1.5 px-2.5 font-mono font-bold text-blue-900 whitespace-nowrap">{e.invoice_number}</td>
                      <td className="py-1.5 px-2.5 text-slate-600 font-mono whitespace-nowrap">{e.invoice_date}</td>
                      <td className="py-1.5 px-2.5">
                        <div className="font-bold text-slate-900 truncate">{e.client_name}</div>
                        <div className="text-[8.5px] font-mono text-slate-500 whitespace-nowrap">{e.gstin || 'Unregistered'}</div>
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-700 truncate">{e.place_of_supply}</td>
                      <td className="py-1.5 px-2.5 text-right font-medium tabular-nums whitespace-nowrap">₹{(e.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-slate-600 whitespace-nowrap">₹{(e.cgst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-slate-600 whitespace-nowrap">₹{(e.sgst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-blue-800 font-semibold whitespace-nowrap">₹{(e.igst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-2.5 text-right font-black tabular-nums text-slate-900 whitespace-nowrap">₹{(e.invoice_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'collections' && (
          <div className="space-y-4">
            <div className="print-page-break-avoid p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between text-[11px]">
              <div>
                <span className="font-bold uppercase text-emerald-800 text-[9.5px] tracking-wider block">GRAND TOTAL COLLECTIONS RECEIVED</span>
                <span className="text-xl font-black text-emerald-950 block mt-1 tabular-nums whitespace-nowrap">₹{(collectionsData?.totalCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                <div>Recorded Transactions: <strong className="text-slate-900">{(collectionsData?.payments || []).length}</strong></div>
                <div>Status: <strong className="text-emerald-800">100% Reconciled</strong></div>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[10px] border-collapse table-fixed">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[12%]" />
                  <col className="w-[24%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead className="bg-[#0B2545] text-white font-bold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">RECEIPT / ID</th>
                    <th className="py-2.5 px-3">DATE</th>
                    <th className="py-2.5 px-3">CLIENT / PAYER</th>
                    <th className="py-2.5 px-3">INVOICE</th>
                    <th className="py-2.5 px-3">METHOD</th>
                    <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(collectionsData?.payments || []).map((pay, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{pay.receipt_number || pay.id}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono whitespace-nowrap">{pay.payment_date}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 truncate">{pay.client_name || 'Client'}</td>
                      <td className="py-2 px-3 font-mono text-blue-900 font-semibold whitespace-nowrap">{pay.invoice_number || 'Direct'}</td>
                      <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">{pay.method}</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-800 tabular-nums whitespace-nowrap">₹{(pay.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'revenue' && (
          <div className="space-y-4">
            <div className="print-page-break-avoid grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase font-black block text-[9px] tracking-wider">TOTAL BILLED VOLUME</span>
                <span className="text-base font-black text-slate-900 block mt-1 tabular-nums whitespace-nowrap">₹{(revenueData?.totalInvoiced || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 uppercase font-black block text-[9px] tracking-wider">REALIZED REVENUE</span>
                <span className="text-base font-black text-emerald-900 block mt-1 tabular-nums whitespace-nowrap">₹{(revenueData?.totalCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-blue-700 uppercase font-black block text-[9px] tracking-wider">COLLECTION EFFICIENCY</span>
                <span className="text-base font-black text-blue-900 block mt-1 tabular-nums whitespace-nowrap">
                  {revenueData?.totalInvoiced ? `${Math.round(((revenueData.totalCollected || 0) / revenueData.totalInvoiced) * 100)}%` : '100%'}
                </span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[10px] border-collapse table-fixed">
                <colgroup>
                  <col className="w-[50%]" />
                  <col className="w-[20%]" />
                  <col className="w-[30%]" />
                </colgroup>
                <thead className="bg-[#0B2545] text-white font-bold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">CLIENT NAME</th>
                    <th className="py-2.5 px-3 text-center">REVENUE SHARE (%)</th>
                    <th className="py-2.5 px-3 text-right">TOTAL REVENUE BILLED (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(revenueData?.clientRevenue || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([client, revenue], idx) => {
                      const pct = Math.round(((revenue || 0) / (revenueData?.totalInvoiced || 1)) * 100);
                      return (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="py-2 px-3 font-bold text-slate-900 truncate">{client}</td>
                          <td className="py-2 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">{pct}%</td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">₹{(revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Corporate Sign-off & Audit Seal Footer */}
        <div className="print-page-break-avoid pt-6 mt-6 border-t-2 border-slate-300 flex flex-row items-end justify-between text-[9px] text-slate-500">
          <div className="space-y-1">
            <div className="font-bold text-slate-800 uppercase tracking-wider">SYSTEM CERTIFICATION & COMPLIANCE</div>
            <div>Computer generated financial audit report generated by Redes Creation ERP.</div>
            <div>Statutory accounting and tax records reconciled for GST compliance.</div>
          </div>
          <div className="text-right space-y-1 shrink-0">
            <div className="h-8 border-b border-dashed border-slate-400 w-48 ml-auto" />
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[9.5px]">AUTHORIZED SIGNATORY</div>
            <div className="text-[8.5px] text-slate-500">Finance & Corporate Accounts</div>
          </div>
        </div>
      </div>
    );
  }
}

