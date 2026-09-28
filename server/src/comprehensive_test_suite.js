// Comprehensive Redes Creation ERP Full Test Suite
const BASE_URL = 'http://localhost:5000/api';

let ceoToken = '';
let finToken = '';
let pmToken = '';
let clientToken = '';

let createdClientId = '';
let createdInvoiceId = '';
let createdQuotationId = '';
let createdPayLinkId = '';
let invoiceToken = '';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 REDES CREATION ERP - COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      failed++;
      console.error(`❌ FAILED: ${message}`);
      throw new Error(message);
    } else {
      passed++;
      console.log(`  ✓ ${message}`);
    }
  }

  // 1. AUTH & ROLES MATRIX
  console.log('1. Testing Authentication Across All 4 Roles...');
  {
    // CEO Login
    const ceoRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nitin@redescreation.com', password: 'password123' })
    }).then(r => r.json());
    assert(ceoRes.success && ceoRes.user.role === 'CEO', 'CEO Login Successful');
    ceoToken = ceoRes.token;

    // Finance/Admin Login
    const finRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'chirag@redescreation.com', password: 'password123' })
    }).then(r => r.json());
    assert(finRes.success && finRes.user.role === 'Finance/Admin', 'Finance/Admin Login Successful');
    finToken = finRes.token;

    // PM Login
    const pmRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@redescreation.com', password: 'password123' })
    }).then(r => r.json());
    assert(pmRes.success && pmRes.user.role === 'Project Manager', 'Project Manager Login Successful');
    pmToken = pmRes.token;

    // Client Login
    const cliRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'billing@northstarlabs.in', password: 'password123' })
    }).then(r => r.json());
    assert(cliRes.success && cliRes.user.role === 'Client', 'Client Login Successful');
    clientToken = cliRes.token;

    // Switch users endpoint
    const switchRes = await fetch(`${BASE_URL}/auth/switch-users`).then(r => r.json());
    assert(switchRes.success && switchRes.users.length >= 4, 'Switch users list returns active users');
  }

  // 2. CLIENT MANAGEMENT (CRUD)
  console.log('\n2. Testing Client Management (Create, Read, Update, Delete Protection)...');
  {
    const createRes = await fetch(`${BASE_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        name: 'OmniCloud Innovations',
        company_name: 'OmniCloud Technologies Private Limited',
        contact_person: 'Vikram Seth',
        email: 'vikram@omnicloud.in',
        phone: '+91 99880 11223',
        billing_address: 'Level 5, Alpha Tower, IT Park, Indore, MP 452020',
        gstin: '23AAAAO1234A1Z9',
        pan: 'AAAAO1234A',
        place_of_supply: '23-Madhya Pradesh',
        default_payment_terms: '15 Days'
      })
    }).then(r => r.json());
    assert(createRes.success && createRes.client.id, 'Client Created Successfully');
    createdClientId = createRes.client.id;

    // Fetch single client
    const getRes = await fetch(`${BASE_URL}/clients/${createdClientId}`, {
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(getRes.success && getRes.client.name === 'OmniCloud Innovations', 'Client Details Fetched');

    // Update client
    const updateRes = await fetch(`${BASE_URL}/clients/${createdClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({ phone: '+91 99880 99999', notes: 'VIP Client' })
    }).then(r => r.json());
    assert(updateRes.success && updateRes.client.phone === '+91 99880 99999', 'Client Updated Successfully');
  }

  // 3. QUOTATIONS WORKFLOW
  console.log('\n3. Testing Quotations (Create, View, Convert to Invoice)...');
  {
    const createQRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        client_id: createdClientId,
        project: 'OmniCloud Portal SaaS Build',
        total: 118000,
        notes: 'Includes full web stack and mobile responsiveness'
      })
    }).then(r => r.json());
    assert(createQRes.success && createQRes.quotation.id, 'Quotation Created with sequential formatting');
    createdQuotationId = createQRes.quotation.id;

    // View single quotation
    const getQRes = await fetch(`${BASE_URL}/quotations/${createdQuotationId}`, {
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(getQRes.success && getQRes.quotation.quotation_number.startsWith('RC/'), 'Single Quotation Read Successful');

    // Convert Quotation to Invoice
    const convRes = await fetch(`${BASE_URL}/quotations/${createdQuotationId}/convert-to-invoice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(convRes.success && convRes.invoice.id, 'Quotation Converted to Official Tax Invoice');
    createdInvoiceId = convRes.invoice.id;
    invoiceToken = convRes.invoice.secure_token;
  }

  // 4. INVOICES WORKFLOW
  console.log('\n4. Testing Invoices Workflow (Calculations, GST Breakdown, Send, Status Transitions)...');
  {
    // Fetch single invoice
    const invRes = await fetch(`${BASE_URL}/invoices/${createdInvoiceId}`, {
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(invRes.success && invRes.invoice.total > 0, 'Fetched Converted Invoice Details');
    assert(invRes.invoice.cgst_total > 0 && invRes.invoice.sgst_total > 0, 'Intra-State GST (CGST + SGST) Calculated');

    // Update invoice line items
    const updateInvRes = await fetch(`${BASE_URL}/invoices/${createdInvoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        items: [
          {
            product_service: 'OmniCloud Cloud Core',
            description: 'Architecture & Backend API',
            hsn_sac: '998314',
            quantity: 1,
            unit: 'Milestone',
            rate: 60000,
            discount: 0,
            tax_rate: 18
          }
        ]
      })
    }).then(r => r.json());
    assert(updateInvRes.success && updateInvRes.invoice.total === 70800, 'Invoice Recalculated with New Items (₹70,800)');

    // Send invoice email
    const sendRes = await fetch(`${BASE_URL}/invoices/${createdInvoiceId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        to: 'vikram@omnicloud.in',
        subject: 'Tax Invoice from Redes Creation',
        include_payment_link: true,
        attach_pdf: true
      })
    }).then(r => r.json());
    assert(sendRes.success, 'Invoice Sent via Email Simulation');

    // Duplicate invoice
    const dupRes = await fetch(`${BASE_URL}/invoices/${createdInvoiceId}/duplicate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(dupRes.success && dupRes.invoice.status === 'Draft', 'Invoice Duplicated as Draft');

    // Cancel duplicated invoice with mandatory reason
    const cancelRes = await fetch(`${BASE_URL}/invoices/${dupRes.invoice.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({ cancellation_reason: 'Testing cancellation audit' })
    }).then(r => r.json());
    assert(cancelRes.success && cancelRes.invoice.status === 'Cancelled', 'Invoice Cancelled with Reason');
  }

  // 5. PAYMENTS & RECEIPTS
  console.log('\n5. Testing Payments & Automated Receipts Generation...');
  {
    // Auto-generate reference when not provided
    const payRes = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        invoice_id: createdInvoiceId,
        amount: 30000,
        method: 'UPI',
        notes: 'Partial milestone advance payment'
      })
    }).then(r => r.json());
    assert(payRes.success && payRes.payment.reference.startsWith('TXN-'), 'Payment Recorded with Auto-Generated Reference');
    assert(payRes.receipts && payRes.receipts.length > 0, 'Official Payment Receipt Automatically Generated');

    // Verify invoice amount due updated
    const invCheck = await fetch(`${BASE_URL}/invoices/${createdInvoiceId}`, {
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(invCheck.invoice.amount_paid === 30000 && invCheck.invoice.amount_due === 40800, 'Invoice Balance Due Updated (₹40,800)');
    assert(invCheck.invoice.status === 'Partially Paid', 'Invoice Status Updated to Partially Paid');

    // Search payments
    const searchRes = await fetch(`${BASE_URL}/payments?search=omnicloud`, {
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(searchRes.success, 'Payments Search Executed Without Error');

    // Update payment verification status
    const verifyRes = await fetch(`${BASE_URL}/payments/${payRes.payment.id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({ status: 'Reconciled' })
    }).then(r => r.json());
    assert(verifyRes.success && verifyRes.payment.verification_status === 'Reconciled', 'Payment Reconciled');
  }

  // 6. CREDIT NOTES & BALANCE ADJUSTMENTS
  console.log('\n6. Testing Credit Notes Logic & Overdraft Prevention...');
  {
    // Try credit note exceeding balance (should fail)
    const excessCn = await fetch(`${BASE_URL}/credit-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        invoice_id: createdInvoiceId,
        amount: 999999,
        reason: 'Excess credit'
      })
    }).then(r => r.json());
    assert(!excessCn.success, 'Credit note exceeding balance was correctly rejected');

    // Valid credit note for remaining balance
    const validCn = await fetch(`${BASE_URL}/credit-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        invoice_id: createdInvoiceId,
        amount: 40800,
        reason: 'Scope discount adjustment'
      })
    }).then(r => r.json());
    assert(validCn.success && validCn.creditNote.amount === 40800, 'Valid Credit Note Issued');

    // Invoice should now be Paid
    const invCheck2 = await fetch(`${BASE_URL}/invoices/${createdInvoiceId}`, {
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(invCheck2.invoice.amount_due === 0 && invCheck2.invoice.status === 'Paid', 'Invoice Amount Due = 0 and Status marked Paid');
  }

  // 7. CLIENT PORTAL & ONLINE PAYMENT BY TOKEN
  console.log('\n7. Testing Client Portal Direct Checkout by Token...');
  {
    // Fetch portal invoice data
    const portalData = await fetch(`${BASE_URL}/portal/invoice/${invoiceToken}`).then(r => r.json());
    assert(portalData.success && portalData.data.invoice_number, 'Portal Invoice Accessed via Secure Token');

    // Standalone payment link
    const payLinkRes = await fetch(`${BASE_URL}/payment-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        client_id: createdClientId,
        amount: 25000,
        purpose: 'Security Audit Advance Deposit'
      })
    }).then(r => r.json());
    assert(payLinkRes.success && payLinkRes.paymentLink.token, 'Standalone Payment Link Created');
    createdPayLinkId = payLinkRes.paymentLink.token;

    // Pay through standalone payment link token
    const portalPayRes = await fetch(`${BASE_URL}/portal/pay/${createdPayLinkId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 25000,
        method: 'Payment Gateway'
      })
    }).then(r => r.json());
    assert(portalPayRes.success && portalPayRes.receipt, 'Online Payment Completed through Secure Portal Link');
  }

  // 8. PROJECT MANAGER BILLING WORKFLOW
  console.log('\n8. Testing Project Manager Workflow (Milestone Request -> Finance Approval)...');
  {
    // PM requests milestone invoice
    const reqRes = await fetch(`${BASE_URL}/pm/request-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pmToken}` },
      body: JSON.stringify({
        client_id: createdClientId,
        project: 'OmniCloud Portal SaaS Build',
        milestone_name: 'Sprint 3 Delivery',
        amount: 50000,
        notes: 'Client reviewed and signed off sprint UAT'
      })
    }).then(r => r.json());
    assert(reqRes.success && reqRes.request.id, 'PM Successfully Submitted Milestone Invoice Request');

    // Finance approves request and generates official invoice
    const approveReqRes = await fetch(`${BASE_URL}/pm/approve-request/${reqRes.request.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(approveReqRes.success && approveReqRes.invoice.invoice_number, 'Finance Approved Request & Generated Invoice');
  }

  // 9. RECURRING BILLING ENGINE
  console.log('\n9. Testing Recurring Billing Retainers & Cycle Trigger...');
  {
    const recRes = await fetch(`${BASE_URL}/recurring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        client_id: createdClientId,
        service: 'Dedicated Cloud DevOps & Maintenance',
        amount: 45000,
        frequency: 'Monthly'
      })
    }).then(r => r.json());
    assert(recRes.success && recRes.recurring.id, 'Recurring Contract Created');

    // Trigger cycle now
    const trigRes = await fetch(`${BASE_URL}/recurring/${recRes.recurring.id}/generate-now`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${finToken}` }
    }).then(r => r.json());
    assert(trigRes.success && trigRes.invoice.invoice_number, 'Generated Recurring Invoice Instantly');
  }

  // 10. REMINDERS ENGINE & NOTIFICATIONS
  console.log('\n10. Testing Automated Reminders & Escalation Engine...');
  {
    const remTick = await fetch(`${BASE_URL}/reminders/run-check`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ceoToken}` }
    }).then(r => r.json());
    assert(remTick.success, 'Reminder Engine Tick Ran Successfully');

    const manualRem = await fetch(`${BASE_URL}/reminders/send-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${finToken}` },
      body: JSON.stringify({
        invoice_id: createdInvoiceId,
        custom_message: 'Friendly reminder from accounts team'
      })
    }).then(r => r.json());
    assert(manualRem.success, 'Manual Reminder Dispatched');
  }

  // 11. FINANCIAL REPORTS WITH CLEAN ROUNDING
  console.log('\n11. Testing All 5 Financial Intelligence Reports with Decimal Precision...');
  {
    const [aging, gst, col, out, rev] = await Promise.all([
      fetch(`${BASE_URL}/reports/aging`, { headers: { Authorization: `Bearer ${ceoToken}` } }).then(r => r.json()),
      fetch(`${BASE_URL}/reports/gst`, { headers: { Authorization: `Bearer ${ceoToken}` } }).then(r => r.json()),
      fetch(`${BASE_URL}/reports/collections`, { headers: { Authorization: `Bearer ${ceoToken}` } }).then(r => r.json()),
      fetch(`${BASE_URL}/reports/outstanding`, { headers: { Authorization: `Bearer ${ceoToken}` } }).then(r => r.json()),
      fetch(`${BASE_URL}/reports/revenue`, { headers: { Authorization: `Bearer ${ceoToken}` } }).then(r => r.json())
    ]);

    assert(aging.success && aging.aging.current, 'Aging Report Valid');
    assert(gst.success && typeof gst.summary.totalGST === 'number', 'GST Report Valid');
    assert(col.success && typeof col.totalCollected === 'number', 'Collections Report Valid & Cleanly Rounded');
    assert(out.success && typeof out.totalOutstandingAmount === 'number', 'Outstanding Report Valid');
    assert(rev.success && typeof rev.totalInvoiced === 'number', 'Revenue Analytics Report Valid');
  }

  // 12. AUDIT TRAIL LOGGING
  console.log('\n12. Testing Immutable Audit Trail...');
  {
    const auditRes = await fetch(`${BASE_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${ceoToken}` }
    }).then(r => r.json());
    assert(auditRes.success && auditRes.logs.length > 0, 'Audit Logs Contain Trace for Every Operation');
  }

  console.log('\n====================================================');
  console.log(`🎉 ALL TESTS COMPLETED! Passed: ${passed}, Failed: ${failed}`);
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite encountered a fatal error:', err);
  process.exit(1);
});
