# Redes Creation ERP — Finance, Billing & Payment Collection Module

A complete, production-grade Finance, Billing & Payment Collection system built for **Redes Creation ERP** adhering strictly to the end-to-end specifications, PRD Sections 1–48, and matching the design console UI pixel-for-pixel.

---

## 🚀 Live Access & Quick Start

The system runs with a Node.js + Express backend on port `5000` and a React + Vite frontend on port `5173`.

### 1. Start the Backend Server (Port 5000)
```powershell
cd "d:\Finance & Billing\server"
node --watch src/index.js
```
*Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)*

### 2. Start the Frontend Client (Port 5173)
```powershell
cd "d:\Finance & Billing\client"
node "..\node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 5173
```
*Access UI: [http://localhost:5173](http://localhost:5173)*

---

## 🎨 UI & Design Fidelity (Matching Attached Screenshot)

- **Navy Sidebar (`#131b2e` / `#162032`)**:
  - Gold `RC` brand logo with `Redes Creation` and `FINANCE CONSOLE` header.
  - Section **WORKSPACE**: *Overview, Invoices, Payments, Clients*.
  - Section **BILLING**: *Quotations, Receipts, Credit notes, Reminders, Recurring, Payment links*.
  - Section **INSIGHTS & SECURITY**: *Reports, Role Architecture, Audit logs, Settings*.
  - Bottom card: `Demo workspace` with shield icon and live toggle.
- **Top Header Bar**:
  - Breadcrumbs e.g. `FINANCE / PAYMENTS` in teal caps.
  - Active page title & transaction subtitle.
  - Golden primary action button (`+ Record payment`, `+ Create invoice`).
  - Quick **RBAC Role Switcher** dropdown (test CEO, Finance Admin, PM, Employee, Client live!).
  - User avatar initials (`NK`, `CM`, `RS`).
- **Payments Table (1:1 Screenshot Replica)**:
  - Tab pills: `All payments`, `Online payments`, `Manual payments`, `Reconciliation`.
  - Search bar: `Search reference or client...`.
  - Data columns: `REFERENCE` (clickable links e.g. `HDFC/0904/7712`), `CLIENT / INVOICE`, `DATE`, `METHOD`, `AMOUNT`, `VERIFICATION`.
  - Status badges: `Mark verified` (interactive verification button), `Reconciled` (green badge).

---

## 🔐 Role Architecture & Authentication (Sign In & Sign Up)

Security is strictly enforced through **JWT tokens, role middleware, and granular permission guards**:

```
                         SIGN IN / SIGN UP
                                │
                                ▼
                         AUTHENTICATION
                                │
                                ▼
                            JWT TOKEN
                                │
                                ▼
                            ROLE IDENTIFY
    ┌──────────┬──────────────┼──────────────────┐
    ▼          ▼              ▼                  ▼
   CEO    FINANCE/ADMIN  PROJECT MANAGER       CLIENT
    │          │              │                  │
 Full     Operational     Milestone Billing   Client Portal
Command   Billing & Ops   & Invoice Request   Own Records Only
```

### Pre-Seeded Quick Switch Test Credentials:
| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **CEO** | `nitin@redescreation.com` | `password123` | Full Finance + High-Value Approvals |
| **Finance/Admin** | `chirag@redescreation.com` | `password123` | Operational Finance, Billing, Reminders, Settings |
| **Project Manager** | `priya@redescreation.com` | `password123` | Project Billing, Milestone Requests, Payment Status |
| **Client** | `billing@northstarlabs.in` | `password123` | Isolated Client Portal (Own Invoices/Receipts Only) |

---

## 🌟 Addons & Advanced Features Delivered

### 1. ⚙️ Master Settings Console (5 Domains per PRD Section 2)
Located under **Insights & Security → Settings**:
- **Tax & GST Rates**: Manage CGST 9%, SGST 9%, IGST 18%, GST 12%, GST 5%, TDS 2%, TCS 0.1%, with active toggles and custom tax creation.
- **Document Sequences**: Configurable prefix & next increment for Invoices, Receipts, Credit Notes, and Payment Links with dynamic live formatting previews (`RC/2026-27/INV/0009`).
- **Payment Methods**: Configure Bank Transfer (NEFT/RTGS), UPI QR, Razorpay Online Gateway, Cheque, and Cash with instructions.
- **Email Notification Templates**: Rich templates with clickable dynamic placeholders (`{client_name}`, `{invoice_number}`, `{total}`, `{due_date}`, `{payment_link}`) and real-time formatted previews.
- **Bank & Legal Profile**: Company legal name, GSTIN, PAN, Address, Bank details, UPI VPA with dynamic UPI QR Code preview widget, and CEO Approval Threshold (₹1,00,000).

### 2. ⏰ Automated Reminders & Overdue Cron Engine (PRD Section 12)
Located under **Billing → Reminders**:
- **Daemon Cron Status**: Monitors scheduled automated scans (overnight daemon at 00:00 IST).
- **Progressive Overdue Escalation**:
  `D-3 (Upcoming)` $\to$ `D-1` $\to$ `Due Date` $\to$ `D+3 (Overdue)` $\to$ `D+7` $\to$ `D+15 (Final Notice & CEO Escalation Alert)`
- **1-Click Scan Execution**: `Run Automated Overdue & Reminder Scan Now` evaluates all outstanding invoices against maturity dates and automatically transitions them to `Overdue`.
- **Manual Reminders**: Direct trigger on overdue invoices with custom message preview and auto-attached payment link.

### 3. 🔁 Recurring Billing & Retainer Contracts (PRD Section 2 & 15)
Located under **Billing → Recurring**:
- **Contract Manager**: Create recurring retainers/subscriptions by client, service name, frequency (Weekly, Monthly, Quarterly, Annually), and next billing run date.
- **Live MRR Calculator**: Auto-calculates Monthly Recurring Revenue from active contracts.
- **1-Click Generation**: Triggers recurring invoicing instantly or advances on schedule.

### 4. 📄 Quotation to Invoice 1-Click Conversion (PRD Section 9)
Located under **Billing → Quotations**:
- Converts accepted quotations (`QT/0003` - Apex Retail Ventures) to a formal Tax Invoice in one click.
- Automatic line item transfer, GST/tax calculation, next sequence assignment, and audit trail generation.

### 5. 📜 Immutable Audit Logs & Security Explorer (PRD Section 14)
Located under **Insights & Security → Audit logs**:
- Logs every financial action: invoice creation, email dispatch, client viewing, payment recording, verification change, cancellation, and receipt creation.
- Filter by entity type (`All`, `Invoice`, `Payment`, `Receipt`, `Quotation`, `Settings`) and instant text search by actor or reference.

---

## 🔒 Security Architecture Highlights

1. **Backend Privilege Enforcement**:
   - `authenticateToken`: Validates JWT Bearer signature.
   - `requirePermission(...)`: Enforces granular capability.
   - `requireRoles(...)`: Restricts high-level actions.
2. **Client Data Isolation**:
   - Client queries are filtered at the database level (`i.client_id === req.user.client_id`).
   - Clients cannot view, access, or pay another client's invoice.
3. **Public Token Checkout**:
   - Client payment portal URLs use unguessable 128-bit UUID tokens (`/invoice/pay/:token`), preventing sequential enumeration attacks (`/invoice/1`, `/invoice/2`).
4. **Idempotent Webhooks**:
   - Payment gateway callbacks verify cryptographic signatures before recording payments and updating ledger balances.
