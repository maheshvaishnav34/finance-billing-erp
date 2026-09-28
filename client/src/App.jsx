import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/dashboard/DashboardView';
import PaymentsView from './components/payments/PaymentsView';
import InvoicesView from './components/invoices/InvoicesView';
import QuotationsView from './components/quotations/QuotationsView';
import ReceiptsView from './components/receipts/ReceiptsView';
import CreditNotesView from './components/creditNotes/CreditNotesView';
import RemindersView from './components/reminders/RemindersView';
import RecurringView from './components/recurring/RecurringView';
import PaymentLinksView from './components/paymentLinks/PaymentLinksView';
import ClientsView from './components/clients/ClientsView';
import ReportsView from './components/reports/ReportsView';
import ProjectBillingView from './components/projectManager/ProjectBillingView';
import AuditLogsView from './components/audit/AuditLogsView';
import SettingsView from './components/settings/SettingsView';
import ClientPaymentPage from './components/portal/ClientPaymentPage';
import AuthPage from './components/auth/AuthPage';
import ClientDashboardView from './components/dashboard/ClientDashboardView';
import ClientSecurityView from './components/profile/ClientSecurityView';
import RoleProfileView from './components/profile/RoleProfileView';
import UserManagementView from './components/users/UserManagementView';
import ToastContainer, { toast } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('payments'); // Default Payments tab matching screenshot
  const [portalToken, setPortalToken] = useState(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#portal-')) {
        return hash.replace('#portal-', '') || 'demo-checkout-token';
      }
    } catch (e) {}
    return null;
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [primaryActionTrigger, setPrimaryActionTrigger] = useState(0);
  const [masterSettings, setMasterSettings] = useState(null);

  const fetchMasterSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.success && res.settings) {
        setMasterSettings(res.settings);
      }
    } catch (e) {
      console.error('Failed to load master settings in App:', e);
    }
  };

  // Load active user from existing token, or allow user to see Sign In page
  useEffect(() => {
    fetchMasterSettings();
    async function initAuth() {
      try {
        const switchRes = await api.getSwitchUsers();
        if (switchRes.success) {
          setAvailableUsers(switchRes.users);
        }

        const token = localStorage.getItem('redes_auth_token');
        if (token) {
          const meRes = await api.getMe();
          if (meRes.success) {
            setCurrentUser(meRes.user);
          } else {
            localStorage.removeItem('redes_auth_token');
          }
        } else {
          // Auto login default CEO on initial load for instant evaluation
          const loginRes = await api.login({ email: 'nitin@redescreation.com', password: 'password123' });
          if (loginRes.success) {
            localStorage.setItem('redes_auth_token', loginRes.token);
            setCurrentUser(loginRes.user);
          }
        }
      } catch (err) {
        console.error('Failed to init auth:', err);
      } finally {
        setLoadingUser(false);
      }
    }
    initAuth();
  }, []);

  const handleSwitchUser = async (userToSwitch) => {
    try {
      const res = await api.login({ email: userToSwitch.email, password: 'password123' });
      if (res.success) {
        localStorage.setItem('redes_auth_token', res.token);
        setCurrentUser(res.user);
        // Refresh switch users
        api.getSwitchUsers().then(sr => {
          if (sr.success) setAvailableUsers(sr.users);
        });

        // Set appropriate initial tab based on role
        if (res.user.role === 'Client') {
          setActiveTab('client_dashboard');
        } else if (res.user.role === 'Project Manager') {
          setActiveTab('pm_billing');
        } else {
          setActiveTab('payments');
        }
        toast.info(`Switched role to ${res.user.name} (${res.user.role})`);
      }
    } catch (e) {
      toast.error('Error switching user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('redes_auth_token');
    setCurrentUser(null);
  };

  // Check URL hash for direct portal link e.g. #portal-tok_xyz
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#portal-')) {
        const token = hash.replace('#portal-', '');
        setPortalToken(token || 'demo-checkout-token');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Client Portal direct public view
  if (portalToken) {
    return (
      <ClientPaymentPage
        token={portalToken}
        masterSettings={masterSettings}
        onBack={() => {
          setPortalToken(null);
          window.location.hash = '';
        }}
      />
    );
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#131b2e] flex items-center justify-center text-amber-400 font-bold">
        Loading Redes Creation Finance ERP...
      </div>
    );
  }

  // If user is logged out, show dedicated Sign In & Sign Up Auth page!
  if (!currentUser) {
    return (
      <AuthPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          api.getSwitchUsers().then(sr => {
            if (sr.success) setAvailableUsers(sr.users);
          });
          if (user.role === 'Client') setActiveTab('client_dashboard');
          else if (user.role === 'Project Manager') setActiveTab('pm_billing');
          else setActiveTab('payments');
        }}
      />
    );
  }


  // Determine Primary Action label for top right button
  let primaryActionLabel = null;
  if (activeTab === 'payments') {
    primaryActionLabel = 'Record payment';
  } else if (activeTab === 'invoices') {
    primaryActionLabel = 'Create invoice';
  } else if (activeTab === 'quotations') {
    primaryActionLabel = 'New quotation';
  } else if (activeTab === 'clients') {
    primaryActionLabel = 'Add client';
  } else if (activeTab === 'recurring') {
    primaryActionLabel = 'New retainer';
  } else if (activeTab === 'payment_links') {
    primaryActionLabel = 'Create payment link';
  } else if (activeTab === 'pm_billing') {
    primaryActionLabel = 'Request milestone';
  }

  const handlePrimaryAction = () => {
    setPrimaryActionTrigger(prev => prev + 1);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
      {/* Left Sidebar (Desktop static / Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          availableUsers={availableUsers}
          onLogout={handleLogout}
          onNavigateToProfile={() => setActiveTab(currentUser?.role === 'Client' ? 'profile' : 'role_profile')}
          primaryActionLabel={currentUser?.role !== 'Client' ? primaryActionLabel : null}
          onPrimaryAction={handlePrimaryAction}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        {/* Dynamic View Body (Responsive padding) */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-8 relative z-20">
          {activeTab === 'overview' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenRecordPayment={() => setActiveTab('payments')}
              onOpenCreateInvoice={() => setActiveTab('invoices')}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              currentUser={currentUser}
              onOpenInvoice={(invId) => setActiveTab('invoices')}
              actionTrigger={primaryActionTrigger}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              currentUser={currentUser}
              masterSettings={masterSettings}
              onOpenPortalLink={(tok) => setPortalToken(tok || 'demo-checkout-token')}
              actionTrigger={primaryActionTrigger}
            />
          )}

          {activeTab === 'pm_billing' && (
            <ProjectBillingView
              currentUser={currentUser}
              onInvoiceGenerated={() => setActiveTab('invoices')}
              actionTrigger={primaryActionTrigger}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationsView
              currentUser={currentUser}
              masterSettings={masterSettings}
              onInvoiceCreated={() => setActiveTab('invoices')}
              actionTrigger={primaryActionTrigger}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptsView currentUser={currentUser} masterSettings={masterSettings} />
          )}

          {activeTab === 'credit_notes' && (
            <CreditNotesView currentUser={currentUser} masterSettings={masterSettings} />
          )}

          {activeTab === 'reminders' && (
            <RemindersView currentUser={currentUser} />
          )}

          {activeTab === 'recurring' && (
            <RecurringView
              currentUser={currentUser}
              onInvoiceCreated={() => setActiveTab('invoices')}
              actionTrigger={primaryActionTrigger}
            />
          )}

          {activeTab === 'payment_links' && (
            <PaymentLinksView
              currentUser={currentUser}
              masterSettings={masterSettings}
              onOpenPortalLink={(tok) => setPortalToken(tok || 'demo-checkout-token')}
              actionTrigger={primaryActionTrigger}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView currentUser={currentUser} actionTrigger={primaryActionTrigger} />
          )}

          {activeTab === 'reports' && (
            <ReportsView currentUser={currentUser} masterSettings={masterSettings} />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogsView currentUser={currentUser} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onSettingsUpdated={(newSettings) => {
                setMasterSettings(newSettings);
              }}
            />
          )}

          {activeTab === 'user_management' && (
            <UserManagementView currentUser={currentUser} />
          )}

          {(activeTab === 'role_profile' || activeTab === 'profile') && (
            <RoleProfileView
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
              onUserUpdated={(updatedUser) => {
                setCurrentUser(updatedUser);
                setAvailableUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
              }}
            />
          )}

          {activeTab === 'client_dashboard' && (
            <ClientDashboardView
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenPortalLink={(tok) => setPortalToken(tok || 'demo-checkout-token')}
              onOpenInvoice={(invId) => setActiveTab('invoices')}
            />
          )}

          {activeTab === 'client_security' && (
            <ClientSecurityView
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Global Animated Toast Notifications with Timer Progress */}
      <ToastContainer />
    </div>
  );
}
