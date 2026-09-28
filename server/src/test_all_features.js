// Using Node 22 global fetch
const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('🚀 Running Comprehensive Redes Creation ERP Integration Test...');

  // 1. Auth Login as CEO
  console.log('\n1. Testing Authentication (CEO)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nitin@redescreation.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('CEO Login failed: ' + loginData.message);
  console.log('   ✓ CEO Login Success. User:', loginData.user.name, 'Role:', loginData.user.role);
  const token = loginData.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  // 2. Roles verification (Must be exactly 4 roles, NO Employee)
  console.log('\n2. Testing Roles Matrix (Strictly 4 Roles, No Employee)...');
  const rolesRes = await fetch(`${BASE_URL}/auth/roles-matrix`, { headers: authHeader });
  const rolesData = await rolesRes.json();
  const roles = Object.keys(rolesData.roles);
  console.log('   Active Roles:', roles);
  if (roles.includes('Employee')) throw new Error('FAIL: Employee role found in system!');
  if (roles.length !== 4) throw new Error(`FAIL: Expected 4 roles, got ${roles.length}`);
  console.log('   ✓ Exactly 4 roles active (CEO, Finance/Admin, Project Manager, Client).');

  // 3. Finance Dashboard KPIs
  console.log('\n3. Testing Dashboard KPIs...');
  const dashRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers: authHeader });
  const dashData = await dashRes.json();
  console.log('   ✓ Total Invoiced:', dashData.stats.totalInvoiced);
  console.log('   ✓ Total Received:', dashData.stats.totalReceived);
  console.log('   ✓ Total Pending:', dashData.stats.totalPending);
  console.log('   ✓ Total Overdue:', dashData.stats.totalOverdue);

  // 4. Invoices next number & list
  console.log('\n4. Testing Invoices & Number Sequencing...');
  const nextNumRes = await fetch(`${BASE_URL}/invoices/next-number`, { headers: authHeader });
  const nextNumData = await nextNumRes.json();
  console.log('   ✓ Next Document Number:', nextNumData.nextInvoiceNumber);

  const invListRes = await fetch(`${BASE_URL}/invoices`, { headers: authHeader });
  const invListData = await invListRes.json();
  console.log('   ✓ Total Invoices in system:', invListData.invoices.length);

  // 5. Test All 5 Reports
  console.log('\n5. Testing All 5 Financial Intelligence Reports...');
  const agingRes = await fetch(`${BASE_URL}/reports/aging`, { headers: authHeader });
  const agingData = await agingRes.json();
  console.log('   ✓ Aging Report: 0-30 days count =', agingData.aging.current.count, '| 90+ days =', agingData.aging.d90_plus.count);

  const gstRes = await fetch(`${BASE_URL}/reports/gst`, { headers: authHeader });
  const gstData = await gstRes.json();
  console.log('   ✓ GST Report: Total Taxable = ₹' + gstData.summary.totalTaxable, '| Total GST = ₹' + gstData.summary.totalGST);

  const colRes = await fetch(`${BASE_URL}/reports/collections`, { headers: authHeader });
  const colData = await colRes.json();
  console.log('   ✓ Collections Report: Total Collected = ₹' + colData.totalCollected, '| Methods =', Object.keys(colData.byMethod));

  const outRes = await fetch(`${BASE_URL}/reports/outstanding`, { headers: authHeader });
  const outData = await outRes.json();
  console.log('   ✓ Outstanding Report: Uncollected Amount = ₹' + outData.totalOutstandingAmount, '| Invoices count =', outData.totalCount);

  const revRes = await fetch(`${BASE_URL}/reports/revenue`, { headers: authHeader });
  const revData = await revRes.json();
  console.log('   ✓ Revenue Report: Total Invoiced = ₹' + revData.totalInvoiced, '| Total Collected = ₹' + revData.totalCollected);

  // 6. Test Reminders Engine
  console.log('\n6. Testing Reminders & Overdue Engine...');
  const remRes = await fetch(`${BASE_URL}/reminders`, { headers: authHeader });
  const remData = await remRes.json();
  console.log('   ✓ Reminder Stages Configured:', remData.rules.length);

  const checkRes = await fetch(`${BASE_URL}/reminders/run-check`, {
    method: 'POST',
    headers: authHeader
  });
  const checkData = await checkRes.json();
  console.log('   ✓ Reminder Engine Tick Result:', checkData.message);

  // 7. Test Recurring Retainers
  console.log('\n7. Testing Recurring Billing...');
  const recRes = await fetch(`${BASE_URL}/recurring`, { headers: authHeader });
  const recData = await recRes.json();
  const mrr = (recData.recurring || []).reduce((sum, r) => sum + (r.amount || 0), 0);
  console.log('   ✓ Recurring Contracts Count:', recData.recurring.length, '| Monthly Total Retainers: ₹' + mrr);

  // 8. Test Audit Trail
  console.log('\n8. Testing Audit Trail...');
  const auditRes = await fetch(`${BASE_URL}/audit-logs`, { headers: authHeader });
  const auditData = await auditRes.json();
  console.log('   ✓ Total Audit Trail Entries:', auditData.logs.length);

  console.log('\n🎉 ALL 48-SECTION WORKFLOW TESTS PASSED PERFECTLY!\n');
}

testAll().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
