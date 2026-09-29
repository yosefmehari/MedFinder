# 🏥 MedFinder (Addis Ababa Pharmacy & Medicine Search Platform)

MedFinder is a Progressive Web App (PWA) designed to connect patients searching for scarce, essential medicines in Addis Ababa with local licensed pharmacies that currently have them in stock.

---

## 🌟 Key Features

1. **Location-Based PostGIS Proximity Search Engine**:
   - Computes distance between the patient's GPS coordinates (or selected Addis Ababa Sub-City) and pharmacy locations using real `ST_Distance` on `GEOGRAPHY(Point, 4326)`.
   - Orders matching pharmacies by proximity, driving time estimates, and stock availability.
2. **Scarcity Radar & In-Stock Badges**:
   - Real-time stock status (`In Stock`, `Low Stock`, `Out of Stock`) and last-verified timestamps for scarce drugs (e.g., Insulin Lantus, Ventolin Inhalers, Clexane, Augmentin).
3. **Pay-to-Unlock & 2-Hour Reservation**:
   - Patients can reserve scarce medicines for 2 hours and unlock exact pharmacy contact numbers and addresses via **Telebirr**, **Chapa**, or Instant Demo tier.
   - Generates unique reservation codes (e.g. `MED-4912`) persisted in database and client `localStorage`.
4. **"My Holds" Active Reservations Drawer**:
   - Patients can track their active 2-hour holds with countdown timers, pharmacy phone dialers, and one-tap Google Maps directions.
5. **Prescription Scanner & Broadcast Uploader**:
   - Patients can photograph doctor prescription papers to broadcast requests to licensed pharmacies across Addis Ababa.
6. **Pharmacist & Dispensary Portal (`/pharmacy`)**:
   - Full inventory management interface for Addis Ababa pharmacies.
   - Quick one-click stock status toggles (`in_stock`, `low_stock`, `out_of_stock`).
   - Retail price adjustment in ETB and addition of new drugs from the catalog.
   - Reservation Code verification counter to validate and mark held stock as dispensed.
   - Incoming prescription broadcast review feed.
7. **Bilingual Localization**:
   - Instant toggle between **English** and **Amharic (አማርኛ)**.
8. **Progressive Web App (PWA)**:
   - Mobile-first experience with app manifest, standalone display mode, and PWA icons.

---

## 📁 Repository Folder Structure

```text
MedFinder/
├── public/
│   ├── favicon.ico               # PWA Favicon
│   ├── icon-192x192.png          # PWA 192x192 Icon
│   ├── icon-512x512.png          # PWA 512x512 Icon
│   └── manifest.json             # PWA Web App Manifest
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── inventory/        # Pharmacy inventory management API (GET, PATCH, POST)
│   │   │   ├── prescriptions/    # Prescription upload & broadcast API (POST, GET, PATCH)
│   │   │   ├── reservations/     # 2-hour hold & code verification API (POST, GET, PATCH)
│   │   │   └── search/           # PostGIS proximity search endpoint
│   │   ├── pharmacy/
│   │   │   └── page.tsx          # Pharmacist stock manager & code verification portal
│   │   ├── globals.css           # Tailwind CSS v4 styling & mobile ergonomics
│   │   ├── layout.tsx            # PWA RootLayout with responsive viewport & meta
│   │   └── page.tsx              # Mobile-first homepage with debounced search & cards
│   ├── components/
│   │   ├── Header.tsx            # Header with Amharic/English toggle & dispensary link
│   │   ├── LocationPicker.tsx    # GPS auto-detect & 11 Addis Ababa Sub-Cities
│   │   ├── PharmacyCard.tsx      # Pharmacy stock card with distance, maps & unlock
│   │   ├── PrescriptionModal.tsx # Prescription photo capture & broadcast modal
│   │   ├── ReservationsDrawer.tsx# "My Holds" active reservations drawer
│   │   ├── SearchBar.tsx         # Instant medicine search & quick scarce tags
│   │   └── UnlockModal.tsx       # 2-hour hold reservation & Telebirr/Chapa checkout
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql  # PostGIS tables, spatial indices, enums (idempotent)
│   │   │   └── 002_seed_data.sql       # Addis Ababa seed pharmacies & medicines (idempotent)
│   │   └── schema.sql            # Master reference database schema
│   └── lib/
│       ├── constants.ts          # Addis sub-cities, mock dataset & distance math
│       ├── db.ts                 # Server-only secure database connection client
│       ├── localization.ts       # Amharic & English translations
│       └── types.ts              # TypeScript interfaces
├── scripts/
│   ├── generate-icons.mjs        # PWA PNG icon generator
│   └── run-migrations.mjs        # Database migration runner for Neon PostgreSQL
├── .env.local                    # Database credentials (server-side only)
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database Architecture (PostgreSQL + PostGIS)

Migrations are located in `src/db/migrations/`:
- **`users`**: Patient and pharmacy administrator credentials and roles (`patient`, `pharmacy_admin`, `super_admin`).
- **`pharmacies`**: Physical dispensary registry with `GEOGRAPHY(Point, 4326)` for geospatial PostGIS queries, license numbers, sub-city, and contact numbers.
- **`medicines`**: Registry of drugs categorized by generic name, brand name, strength, dosage form, and `is_scarce` indicator.
- **`pharmacy_inventory`**: Stock levels (`in_stock`, `low_stock`, `out_of_stock`), unit prices in ETB, and last-verified timestamps.
- **`prescriptions`**: Uploaded paper prescriptions, status, and sub-city routing.
- **`reservations`**: 2-hour stock holds, payment references (`telebirr`, `chapa`), and contact unlocks.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local` (kept strictly server-side):
```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
```

### 3. Run Migrations & Seed Data
```bash
npm run migrate
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the patient app or [http://localhost:3000/pharmacy](http://localhost:3000/pharmacy) for the pharmacist dispensary portal.