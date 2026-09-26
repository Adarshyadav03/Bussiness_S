# PERN Full-Stack ERP Application

A production-quality **ERP Web Application** for a manufacturing and supply company built with PostgreSQL, Express.js, React.js, Node.js, and Prisma ORM.

---

## 1. PROJECT OVERVIEW

This system automates and enforces the end-to-end manufacturing and supply chain workflow:

$$\text{Customer Enquiry} \longrightarrow \text{Quotation} \longrightarrow \text{Sales Order} \longrightarrow \text{Inventory Reservation} \longrightarrow \text{Dispatch}$$

Key priorities enforced:
- **Strict Business Logic & Traceability**
- **PostgreSQL Relational Design with Foreign Keys & Constraints**
- **Concurrency-Safe Stock Reservation using PostgreSQL Row Locks (`FOR UPDATE`)**
- **Role-Based Access Control (RBAC)**
- **Automated Integration Tests for Logic & Concurrency**

---

## 2. BUSINESS WORKFLOW DIAGRAM

```mermaid
flowchart TD
    A[Login] --> B[Customer Enquiry]
    B --> C[Price Quotation - DRAFT]
    C --> D[Quotation SENT to Customer]
    D --> E{Customer Decision}
    E -- Rejected --> F[Quotation REJECTED / Enquiry LOST]
    E -- Accepted --> G[Quotation ACCEPTED]
    G --> H[Convert Quotation to Sales Order]
    H --> I[Sales Order PENDING]
    I --> J[Admin Order Confirmation]
    J --> K{Stock Availability Check}
    K -- Insufficient --> L[Rollback & Return Error]
    K -- Available --> M[Reserve Inventory Stock & Status = CONFIRMED]
    M --> N[Admin Process Dispatch]
    N --> O[Deduct Physical Stock & Clear Reserved Stock]
    O --> P[Sales Order DISPATCHED]
```

---

## 3. TECHNOLOGY STACK

- **Database:** PostgreSQL 18 with Prisma ORM
- **Backend:** Node.js, Express.js, JWT Authentication, bcrypt password hashing, Zod validator
- **Testing:** Jest, Supertest
- **Frontend:** React 18, Vite, Axios, Lucide Icons, Vanilla CSS Design System

---

## 4. USER ROLES & PERMISSIONS

| Feature / Action | SALES_USER | ADMIN |
| :--- | :---: | :---: |
| Authenticate / Login | Yes | Yes |
| Create & View Customers | Yes | Yes |
| Create & View Enquiries | Yes | Yes |
| Create & View Quotations | Yes | Yes |
| Transition Quotations (Draft $\to$ Sent $\to$ Accept/Reject) | Yes | Yes |
| Convert Accepted Quotation to Sales Order | Yes | Yes |
| View Sales Orders & Stock Breakdown | Yes | Yes |
| **Confirm Sales Order & Reserve Stock** | No | **Yes** |
| **Process Dispatch (Vehicle & Driver)** | No | **Yes** |
| **Manage Physical Inventory Adjustments** | No | **Yes** |

Every protected endpoint validates:
$$\text{JWT Token} + \text{User Identity} + \text{User Role}$$

- Returns `401 Unauthorized` for missing/invalid credentials.
- Returns `403 Forbidden` for unauthorized roles.

---

## 5. PROJECT STRUCTURE

```text
erp-system/
│
├── backend/
│   ├── src/
│   │   ├── config/             # Database & JWT configurations
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, Role RBAC, Error handling
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Core business logic & transactions
│   │   ├── validators/         # Zod schemas
│   │   ├── utils/              # Math calculations & helpers
│   │   ├── app.js              # Express app definition
│   │   └── server.js           # Server startup script
│   │
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL relational schema
│   │   └── seed.js             # Seeding script
│   │
│   ├── tests/                  # Automated Jest & Supertest integration tests
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Modal, StatusBadge, etc.)
│   │   ├── pages/              # Screen pages (Enquiries, Quotations, Sales Orders, Inventory)
│   │   ├── services/           # Axios API modules
│   │   ├── context/            # AuthContext
│   │   ├── hooks/              # Custom hooks (useAuth)
│   │   ├── App.jsx             # React router & providers
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Styling & design system
│   │
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 6. PREREQUISITES & SETUP

- **Node.js**: v18+
- **PostgreSQL**: v14+ running on port 5432
- **npm**: v9+

### Environment Variables

#### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/erp_db?schema=public"
JWT_SECRET="erp_jwt_secret_key_2026_super_secure_production_secret"
JWT_EXPIRES_IN="1d"
NODE_ENV="development"
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL="http://localhost:5000/api"
```

---

## 7. INSTALLATION & RUNNING INSTRUCTIONS

### Step 1: Database Initialization
Make sure PostgreSQL is running and database `erp_db` is created:
```bash
psql -U postgres -c "CREATE DATABASE erp_db;"
```

### Step 2: Backend Setup & Seed
```bash
cd backend
npm install
npx prisma db push
node prisma/seed.js
```

### Step 3: Run Backend Development Server
```bash
npm run dev
# Server running at http://localhost:5000
```

### Step 4: Run Automated Tests
```bash
npm test
```

### Step 5: Frontend Setup & Start
In a new terminal tab:
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:3000
```

---

## 8. TEST DEMO CREDENTIALS

| Role | Email | Password |
| :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `admin123` |
| **SALES_USER** | `sales@example.com` | `sales123` |

---

## 9. ENTITY-RELATIONSHIP (ER) DIAGRAM

```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        datetime created_at
    }

    CUSTOMERS {
        int id PK
        string company_name
        string contact_person
        string mobile
        string email
        string city
    }

    PRODUCTS {
        int id PK
        string product_code UK
        string product_name
        string category
        string unit
        float base_price
    }

    INVENTORY {
        int id PK
        int product_id FK, UK
        int physical_quantity
        int reserved_quantity
    }

    ENQUIRIES {
        int id PK
        string enquiry_number UK
        int customer_id FK
        datetime enquiry_date
        datetime required_date
        string status
    }

    ENQUIRY_ITEMS {
        int id PK
        int enquiry_id FK
        int product_id FK
        int quantity
    }

    QUOTATIONS {
        int id PK
        string quotation_number UK
        int enquiry_id FK
        int customer_id FK
        datetime valid_until
        float grand_total
        string status
    }

    QUOTATION_ITEMS {
        int id PK
        int quotation_id FK
        int product_id FK
        int quantity
        float unit_price
        float discount_percent
        float gst_percent
        float line_amount
    }

    SALES_ORDERS {
        int id PK
        string order_number UK
        int customer_id FK
        int quotation_id FK, UK
        float total_amount
        string status
    }

    SALES_ORDER_ITEMS {
        int id PK
        int sales_order_id FK
        int product_id FK
        int quantity
        float unit_price
        float line_amount
    }

    DISPATCHES {
        int id PK
        string dispatch_number UK
        int sales_order_id FK
        string vehicle_number
        string driver_name
        datetime dispatch_date
    }

    DISPATCH_ITEMS {
        int id PK
        int dispatch_id FK
        int product_id FK
        int quantity
    }

    CUSTOMERS ||--o{ ENQUIRIES : places
    ENQUIRIES ||--|{ ENQUIRY_ITEMS : contains
    PRODUCTS ||--o{ ENQUIRY_ITEMS : requested
    PRODUCTS ||--|| INVENTORY : has
    ENQUIRIES ||--o{ QUOTATIONS : generated_from
    CUSTOMERS ||--o{ QUOTATIONS : received_by
    QUOTATIONS ||--|{ QUOTATION_ITEMS : contains
    QUOTATIONS ||--o| SALES_ORDERS : converts_to
    CUSTOMERS ||--o{ SALES_ORDERS : owns
    SALES_ORDERS ||--|{ SALES_ORDER_ITEMS : includes
    SALES_ORDERS ||--o{ DISPATCHES : dispatched_via
    DISPATCHES ||--|{ DISPATCH_ITEMS : fulfills
```

---

## 10. API DOCUMENTATION

### 1. Auth API
- `POST /api/auth/login`
  - Body: `{ "email": "admin@example.com", "password": "admin123" }`
  - Returns: `{ "success": true, "token": "JWT...", "user": { ... } }`

### 2. Customers API
- `GET /api/customers` (Auth required)
- `POST /api/customers` (Auth: SALES_USER or ADMIN)
  - Body: `{ "company_name": "ABC Ltd", "contact_person": "John", "mobile": "+91 999", "email": "john@abc.com", "city": "Mumbai" }`

### 3. Products API
- `GET /api/products` (Auth required)
- `POST /api/products` (Auth: ADMIN)

### 4. Inventory API
- `GET /api/inventory` (Auth required)
- `PATCH /api/inventory/:productId` (Auth: ADMIN)
  - Body: `{ "physical_quantity": 250 }`

### 5. Enquiries API
- `GET /api/enquiries` (Auth required)
- `POST /api/enquiries` (Auth: SALES_USER or ADMIN)
  - Body: `{ "customer_id": 1, "required_date": "2026-10-15T00:00:00Z", "notes": "Urgent", "items": [{ "product_id": 1, "quantity": 50 }] }`

### 6. Quotations API
- `GET /api/quotations` (Auth required)
- `POST /api/quotations` (Auth: SALES_USER or ADMIN)
  - Body: `{ "enquiry_id": 1, "valid_until": "2026-10-20T00:00:00Z", "items": [{ "product_id": 1, "quantity": 50, "unit_price": 1000, "discount_percent": 10, "gst_percent": 18 }] }`
- `PATCH /api/quotations/:id/status` (Auth: SALES_USER or ADMIN)
  - Body: `{ "status": "SENT" }` (or `ACCEPTED` / `REJECTED`)
- `POST /api/quotations/:id/convert` (Auth: SALES_USER or ADMIN)

### 7. Sales Orders API
- `GET /api/sales-orders` (Auth required)
- `POST /api/sales-orders/:id/confirm` (Auth: ADMIN)
  - Performs stock check and reservation via PostgreSQL `FOR UPDATE` transaction.
- `POST /api/sales-orders/:id/dispatch` (Auth: ADMIN)
  - Body: `{ "vehicle_number": "MH-12-AB-1234", "driver_name": "Rajesh Kumar" }`

---

## 11. INVENTORY RESERVATION & CONCURRENCY HANDLING

Stock reservation occurs during **Sales Order Confirmation**:

```sql
SELECT id, product_id, physical_quantity, reserved_quantity 
FROM "inventory" 
WHERE product_id = $1 
FOR UPDATE;
```

1. **Row-Level Lock:** `FOR UPDATE` locks the inventory row for the specific product in PostgreSQL.
2. **Formula:** $\text{Available Quantity} = \text{Physical Quantity} - \text{Reserved Quantity}$
3. **Validation:** If $\text{Available Quantity} < \text{Requested Quantity}$, the backend throws an `INSUFFICIENT_STOCK` exception, causing an immediate transaction **ROLLBACK**.
4. **Stock Reservation:** If valid, $\text{Reserved Quantity} \gets \text{Reserved Quantity} + \text{Requested Quantity}$.
5. **Dispatch:** On dispatch, $\text{Physical Quantity} \gets \text{Physical Quantity} - \text{Dispatched Quantity}$ and $\text{Reserved Quantity} \gets \text{Reserved Quantity} - \text{Dispatched Quantity}$.

---

## 12. STEP-BY-STEP DEMO INSTRUCTIONS

Follow these steps to demonstrate the complete workflow:

1. Open application at `http://localhost:3000`.
2. Login as `sales@example.com` / `sales123` (**SALES_USER**).
3. Navigate to **Enquiries** page.
4. Click **+ Create Enquiry**.
5. Select or create customer `ABC Engineering Pvt. Ltd.`.
6. Add multiple products:
   - Product A: Qty 50
   - Product B: Qty 20
7. Submit to create Enquiry.
8. Click **Create Quotation** on the enquiry.
9. Verify Quotation Calculation (Base Price, Discount 10%, GST 18%, Line Amount & Grand Total).
10. Click **Generate Quotation** (Status: `DRAFT`).
11. Click **Send** (Status: `SENT`).
12. Click **Accept** (Status: `ACCEPTED`).
13. Click **Convert to Sales Order**.
14. System redirects to **Sales Orders** page (Status: `PENDING`).
15. Click **Logout**.
16. Login as `admin@example.com` / `admin123` (**ADMIN**).
17. Open **Sales Orders** and click **View Details**.
18. Inspect the **Inventory Stock Availability Breakdown**.
19. Click **Confirm Order & Reserve Stock**.
20. Observe order status change to `CONFIRMED` and reserved inventory increased in PostgreSQL.
21. Click **Process Dispatch**.
22. Enter vehicle number `MH-12-AB-1234` and driver name `Rajesh Kumar`.
23. Click **Complete Dispatch**.
24. Verify physical stock and reserved stock decreased in PostgreSQL and Order Status updated to `DISPATCHED`.
