# ERP System Backend

Production-grade Express + PostgreSQL + Prisma ORM REST API for Manufacturing & Supply ERP.

## Features
- JWT Authentication & Bcrypt Password Hashing
- Role-Based Access Control (RBAC): `ADMIN` & `SALES_USER`
- PostgreSQL Transactions & Row-Level Locking (`SELECT ... FOR UPDATE`)
- Full Workflow: Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch
- Automated Integration Tests with Jest & Supertest

## Environment Setup
Copy `.env.example` to `.env` and configure:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/erp_db?schema=public"
JWT_SECRET="erp_jwt_secret_key_2026_super_secure_production_secret"
JWT_EXPIRES_IN="1d"
NODE_ENV="development"
```

## Running the Backend
```bash
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```

## Running Tests
```bash
npm test
```
