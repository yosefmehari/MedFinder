-- ====================================================================
-- MedFinder (Addis Ababa Pharmacy Search Platform)
-- Master Database Schema Specification (PostgreSQL + PostGIS)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum Types
CREATE TYPE user_role AS ENUM ('patient', 'pharmacy_admin', 'super_admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE prescription_status AS ENUM ('submitted', 'under_review', 'matched', 'completed', 'cancelled');
CREATE TYPE payment_provider AS ENUM ('telebirr', 'chapa', 'free_tier');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE reservation_status AS ENUM ('active', 'dispensed', 'expired', 'cancelled');

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'patient',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacies (with PostGIS Point location)
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    sub_city VARCHAR(100) NOT NULL,
    woreda VARCHAR(50),
    kebele VARCHAR(50),
    street_address TEXT NOT NULL,
    landmark TEXT,
    phone_number VARCHAR(30) NOT NULL,
    alternate_phone VARCHAR(30),
    email VARCHAR(255),
    is_24_hours BOOLEAN DEFAULT FALSE,
    opening_hours JSONB DEFAULT '{"mon_fri": "08:00 - 20:00", "sat": "08:00 - 20:00", "sun": "09:00 - 18:00"}'::jsonb,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    verification_status verification_status DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medicines Catalog
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL,
    strength VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(200),
    therapeutic_category VARCHAR(150),
    is_scarce BOOLEAN DEFAULT FALSE,
    description TEXT,
    requires_prescription BOOLEAN DEFAULT TRUE,
    standard_retail_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacy Inventory
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    stock_status stock_status NOT NULL DEFAULT 'in_stock',
    quantity INTEGER DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pharmacy_medicine UNIQUE (pharmacy_id, medicine_id)
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_name VARCHAR(150),
    patient_phone VARCHAR(30) NOT NULL,
    image_url TEXT NOT NULL,
    notes TEXT,
    preferred_sub_city VARCHAR(100),
    status prescription_status DEFAULT 'submitted',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    extracted_medicines JSONB DEFAULT '[]'::jsonb,
    matched_pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reservations & Contact Unlock (Telebirr / Chapa)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_code VARCHAR(12) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    patient_phone VARCHAR(30) NOT NULL,
    hold_fee_etb NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    payment_provider payment_provider NOT NULL DEFAULT 'telebirr',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    transaction_ref VARCHAR(200) UNIQUE,
    reservation_status reservation_status DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_pharmacies_sub_city ON pharmacies(sub_city);
CREATE INDEX IF NOT EXISTS idx_medicines_search_text ON medicines USING gin (to_tsvector('english', brand_name || ' ' || generic_name));
CREATE INDEX IF NOT EXISTS idx_medicines_brand_trgm ON medicines USING gin (brand_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_trgm ON medicines USING gin (generic_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON pharmacy_inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON pharmacy_inventory(medicine_id);
