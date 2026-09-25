# 🏥 MedFinder (Addis Ababa Pharmacy & Medicine Search Platform)

MedFinder is a Progressive Web App (PWA) designed to connect patients searching for scarce, essential medicines in Addis Ababa with local licensed pharmacies that currently have them in stock.

---

## 🌟 Key Features

1. **Location-Based PostGIS Search Engine**:
   - Computes distance between the patient's GPS coordinates (or selected Addis Ababa Sub-City) and pharmacy locations.
   - Orders matching pharmacies by proximity and stock availability.
2. **Scarcity Radar & In-Stock Badges**:
   - Real-time stock status (`In Stock`, `Low Stock`, `Out of Stock`) and last-verified timestamps for scarce drugs (e.g., Insulin Lantus, Ventolin Inhalers, Clexane, Augmentin).
3. **Pay-to-Unlock & 2-Hour Reservation**:
   - Patients can reserve stock for 2 hours and unlock exact pharmacy contact numbers and addresses via Telebirr or Chapa integration.
4. **Prescription Scanner & Uploader**:
   - Patients can photograph doctor prescription papers to broadcast requests to pharmacies across Addis Ababa.
5. **Bilingual Localization**:
   - Instant toggle between **English** and **Amharic (አማርኛ)**.
6. **Progressive Web App (PWA)**:
   - Mobile-first experience with app manifest and offline-ready responsiveness.

---

## 📁 Repository Folder Structure

```text
MedFinder/
├── public/
│   └── manifest.json             # PWA Web App Manifest
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── prescriptions/    # Prescription upload endpoint
│   │   │   ├── reservations/     # 2-hour hold & Telebirr/Chapa webhook endpoint
│   │   │   └── search/           # PostGIS proximity search endpoint
│   │   ├── globals.css           # Tailwind CSS v4 styling & mobile ergonomics
│   │   ├── layout.tsx            # PWA RootLayout with responsive viewport & meta
│   │   └── page.tsx              # Mobile-first homepage with search, filters & cards
│   ├── components/
│   │   ├── Header.tsx            # Header with Amharic/English toggle & branding
│   │   ├── LocationPicker.tsx    # GPS auto-detect & 11 Addis Ababa Sub-Cities
│   │   ├── PharmacyCard.tsx      # Pharmacy stock card with distance & unlock trigger
│   │   ├── PrescriptionModal.tsx # Prescription photo capture & broadcast modal
│   │   ├── SearchBar.tsx         # Instant medicine search & quick scarce tags
│   │   └── UnlockModal.tsx       # 2-hour hold reservation & Telebirr/Chapa checkout
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql  # PostGIS tables, spatial indices, enums
│   │   │   └── 002_seed_data.sql       # Addis Ababa seed pharmacies & medicines
│   │   └── schema.sql            # Master reference database schema
│   └── lib/
│       ├── constants.ts          # Addis sub-cities, mock dataset & distance math
│       ├── db.ts                 # Server-only secure database connection client
│       ├── localization.ts       # Amharic & English translations
│       └── types.ts              # TypeScript interfaces
├── scripts/
│   └── run-migrations.mjs        # Database migration runner for Neon PostgreSQL
├── .env.local                    # Database credentials (git-ignored, server-side only)
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
- **`prescriptions`**: Uploaded paper prescriptions, OCR/review status, and sub-city routing.
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
node scripts/run-migrations.mjs
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser or mobile emulator.