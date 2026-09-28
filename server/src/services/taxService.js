import { getDb } from '../config/db.js';

export function calculateInvoiceTaxes(items = [], clientPlaceOfSupply = '') {
  const db = getDb();
  const companyStateCode = db.financial_settings?.state_code || '23';
  
  // Inter-state check (True if client state is different from company state)
  const isInterState = !clientPlaceOfSupply.startsWith(companyStateCode);

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const processedItems = items.map((item, index) => {
    const qty = parseFloat(item.quantity || 1);
    const rate = parseFloat(item.rate || 0);
    const discount = parseFloat(item.discount || 0);
    const taxRate = parseFloat(item.tax_rate ?? 18);

    const gross = qty * rate;
    const itemDiscount = discount;
    const taxableAmount = Math.max(0, gross - itemDiscount);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const itemTotal = taxableAmount + taxAmount;

    subtotal += gross;
    totalDiscount += itemDiscount;
    totalTax += taxAmount;

    if (isInterState) {
      igstTotal += taxAmount;
    } else {
      cgstTotal += taxAmount / 2;
      sgstTotal += taxAmount / 2;
    }

    return {
      id: item.id || `item_${index + 1}`,
      product_service: item.product_service || 'Service Item',
      hsn_sac: item.hsn_sac || '998314',
      description: item.description || '',
      quantity: qty,
      unit: item.unit || 'Unit',
      rate: rate,
      discount: itemDiscount,
      taxable_amount: Math.round(taxableAmount * 100) / 100,
      tax_rate: taxRate,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total: Math.round(itemTotal * 100) / 100
    };
  });

  const total = (subtotal - totalDiscount) + totalTax;

  return {
    processedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(totalDiscount * 100) / 100,
    taxable_amount: Math.round((subtotal - totalDiscount) * 100) / 100,
    isInterState,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    igstTotal: Math.round(igstTotal * 100) / 100,
    tax_total: Math.round(totalTax * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}
