# 💸 Splibilo

### Web-Based Group Expense Tracking & Settlement System

Splibilo is a full-stack web application designed to manage shared group expenses in a structured, transparent, and automated way.

The system enables users to record expenses, split costs (equal or custom), upload receipts with OCR-assisted parsing, track real-time balances, and generate optimized settlement suggestions using a debt simplification algorithm.

Built with a modular client–server architecture using **NestJS** (backend) and **Next.js App Router** (frontend), powered by **PostgreSQL + Prisma ORM**.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication with refresh token rotation
- Role-based access control (Owner, Member, Admin)
- Protected routes and membership enforcement
- Secure logout with token invalidation

---

### 👥 Group & Member Management

- Create and manage expense groups
- Invite members via email or unique invite code
- Configurable permissions (edit/delete expense rules)
- Archive and lock group functionality
- Prevent duplicate membership and invalid invites

---

### 💸 Expense Management

- Add expenses with:
  - Description
  - Amount
  - Category
  - Date
  - Paid-by user
  - Optional receipt upload
- Support for:
  - Equal split
  - Custom split with floating-point-safe validation (epsilon comparison)
- Pagination, filtering, and sorting
- Transaction-safe updates using `prisma.$transaction`

---

### 🧾 OCR-Assisted Receipt Parsing

Hybrid OCR pipeline:

1. **Sharp** → Image preprocessing
2. **Tesseract.js** → Raw text extraction
3. **Google Gemini LLM** → Structured JSON parsing

Extracted fields:

- Items
- Subtotal
- Tax
- Grand total

Structured data is used to pre-fill expense forms automatically.

---

### 📊 Automatic Balance Calculation

Real-time net balance per member:

```
net = totalPaid - totalOwed + settlementsReceived - settlementsSent
```

Balances update automatically after every expense or settlement.

---

### 🔄 Debt Simplification Algorithm

Splibilo minimizes the number of transactions required to settle debts.

Algorithm approach:

- Separate creditors and debtors
- Sort by balance
- Apply greedy two-pointer matching

Time complexity: **O(n log n)**

Generates optimized “who owes whom” settlement suggestions.

---

### 📈 Analytics Dashboard

- Expense trends over time
- Settlement trends
- Category breakdown charts
- Top payers ranking
- Personal financial summary
- Continuous date normalization for visual consistency

---

## 🏗 Architecture Overview

### Frontend

- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- Shadcn UI
- TanStack Query (server state)
- Zustand (client state)
- React Hook Form
- Recharts

### Backend

- NestJS 11 (modular architecture)
- Prisma ORM
- PostgreSQL
- JWT authentication with refresh rotation
- Multer + Sharp (file uploads)
- Tesseract.js + Google Gemini (OCR)
- Nodemailer (email notifications)

---

## 🧠 Engineering Highlights

- Floating-point-safe share validation
- Transactional expense and share updates
- Greedy debt simplification algorithm
- In-memory analytics aggregation
- Hybrid OCR + LLM structured extraction pipeline
- Role-based permission enforcement
- 90%+ backend test coverage (Jest + Supertest E2E)

---

## 🎯 Purpose

Splibilo centralizes collaborative expense management into a structured system, replacing spreadsheets and informal tracking with automated, transparent, and intelligent financial coordination.

It ensures:

- Accuracy
- Fairness
- Transparency
- Reduced settlement friction
