-- ====================================================================
-- MedFinder (Addis Ababa Pharmacy Search Platform)
-- Database Migration 001: Initial PostGIS Schema
-- ====================================================================

-- 1. Enable required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Enumerated Types
CREATE TYPE user_role AS ENUM ('patient', 'pharmacy_admin', 'super_admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE prescription_status AS ENUM ('submitted', 'under_review', 'matched', 'completed', 'cancelled');
CREATE TYPE payment_provider AS ENUM ('telebirr', 'chapa', 'free_tier');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE reservation_status AS ENUM ('active', 'dispensed', 'expired', 'cancelled');

-- 3. Users Table (Patients, Pharmacy Operators, Super Admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(30) UNIQUE NOT NULL, -- Ethiopian standard +251...
    full_name VARCHAR(150),
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'patient',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Pharmacies Table
-- Stores retail pharmacy profiles, official license, and exact GPS coordinates in Addis Ababa
CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    sub_city VARCHAR(100) NOT NULL, -- Bole, Kirkos, Arada, Yeka, Lideta, Addis Ketema, Nifas Silk-Lafto, Kolfe Keranio, Gullele, Akaky Kaliti, Lemi Kura
    woreda VARCHAR(50),
    kebele VARCHAR(50),
    street_address TEXT NOT NULL,
    landmark TEXT,
    phone_number VARCHAR(30) NOT NULL,
    alternate_phone VARCHAR(30),
    email VARCHAR(255),
    is_24_hours BOOLEAN DEFAULT FALSE,
    opening_hours JSONB DEFAULT '{"mon_fri": "08:00 - 20:00", "sat": "08:00 - 20:00", "sun": "09:00 - 18:00"}'::jsonb,
    
    -- Geospatial Columns (WGS 84 coordinate system)
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

-- 5. Medicines Catalog
-- Comprehensive registry of medicines, categorized by therapeutic class and scarcity tag
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL, -- Tablet, Capsule, Syrup, Injectable, Ointment, Inhaler
    strength VARCHAR(100) NOT NULL,    -- 500mg, 10mg/ml, 250mcg, etc.
    manufacturer VARCHAR(200),
    therapeutic_category VARCHAR(150),  -- Cardiovascular, Antibiotic, Oncology, Endocrine/Diabetes, Respiratory, Neuro
    is_scarce BOOLEAN DEFAULT FALSE,   -- Platform highlights scarce/hard-to-find medicines
    description TEXT,
    requires_prescription BOOLEAN DEFAULT TRUE,
    standard_retail_price NUMERIC(10, 2), -- Estimated ETB price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Pharmacy Inventory
-- Real-time stock levels of medicines across Addis Ababa pharmacies
CREATE TABLE pharmacy_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    stock_status stock_status NOT NULL DEFAULT 'in_stock',
    quantity INTEGER DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL, -- Retail price in ETB
    batch_number VARCHAR(100),
    expiry_date DATE,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pharmacy_medicine UNIQUE (pharmacy_id, medicine_id)
);

-- 7. Prescriptions Table
-- Patient uploaded prescription images for scanning & pharmacy discovery
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous/guest search
    patient_name VARCHAR(150),
    patient_phone VARCHAR(30) NOT NULL,
    image_url TEXT NOT NULL,
    notes TEXT,
    preferred_sub_city VARCHAR(100),
    status prescription_status DEFAULT 'submitted',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    extracted_medicines JSONB DEFAULT '[]'::jsonb, -- AI/Pharmacist identified drugs from photo
    matched_pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Reservations & Pay-to-Unlock Transactions
-- Handles 2-hour stock reservations and pay-to-unlock pharmacy contacts (Telebirr / Chapa)
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_code VARCHAR(12) UNIQUE NOT NULL, -- e.g. MED-8492
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    patient_phone VARCHAR(30) NOT NULL,
    hold_fee_etb NUMERIC(10, 2) NOT NULL DEFAULT 20.00, -- Small unlock / reservation fee in ETB
    payment_provider payment_provider NOT NULL DEFAULT 'telebirr',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    transaction_ref VARCHAR(200) UNIQUE,
    reservation_status reservation_status DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 2 hours from reservation time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Performance Indexes & Geospatial Indexes
-- ====================================================================

-- PostGIS Spatial Index for lightning-fast radius searches around Addis Ababa
CREATE INDEX idx_pharmacies_location ON pharmacies USING GIST(location);
CREATE INDEX idx_pharmacies_sub_city ON pharmacies(sub_city);
CREATE INDEX idx_pharmacies_is_verified ON pharmacies(is_verified);

-- Full-text / Trigram Index for fuzzy matching brand & generic medicine names
CREATE INDEX idx_medicines_search_text ON medicines USING gin (
    to_tsvector('english', brand_name || ' ' || generic_name || ' ' || COALESCE(therapeutic_category, ''))
);
CREATE INDEX idx_medicines_brand_trgm ON medicines USING gin (brand_name gin_trgm_ops);
CREATE INDEX idx_medicines_generic_trgm ON medicines USING gin (generic_name gin_trgm_ops);
CREATE INDEX idx_medicines_is_scarce ON medicines(is_scarce);

-- Inventory indexes
CREATE INDEX idx_inventory_pharmacy ON pharmacy_inventory(pharmacy_id);
CREATE INDEX idx_inventory_medicine ON pharmacy_inventory(medicine_id);
CREATE INDEX idx_inventory_stock_status ON pharmacy_inventory(stock_status);

-- Reservations index
CREATE INDEX idx_reservations_status_expires ON reservations(reservation_status, expires_at);

-- ====================================================================
-- Stored Helper Function: PostGIS Proximity Pharmacy Search
-- ====================================================================
CREATE OR REPLACE FUNCTION search_nearby_pharmacies(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    search_query TEXT DEFAULT NULL,
    target_sub_city TEXT DEFAULT NULL,
    max_distance_meters DOUBLE PRECISION DEFAULT 25000 -- 25km radius covers all of Addis Ababa
)
RETURNS TABLE (
    pharmacy_id UUID,
    pharmacy_name VARCHAR(200),
    sub_city VARCHAR(100),
    woreda VARCHAR(50),
    street_address TEXT,
    phone_number VARCHAR(30),
    is_24_hours BOOLEAN,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    medicine_id UUID,
    brand_name VARCHAR(200),
    generic_name VARCHAR(200),
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    is_scarce BOOLEAN,
    stock_status stock_status,
    unit_price NUMERIC(10, 2),
    last_verified_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        p.id AS pharmacy_id,
        p.name AS pharmacy_name,
        p.sub_city,
        p.woreda,
        p.street_address,
        p.phone_number,
        p.is_24_hours,
        p.latitude,
        p.longitude,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) AS distance_meters,
        m.id AS medicine_id,
        m.brand_name,
        m.generic_name,
        m.dosage_form,
        m.strength,
        m.is_scarce,
        pi.stock_status,
        pi.unit_price,
        pi.last_verified_at
    FROM pharmacies p
    JOIN pharmacy_inventory pi ON p.id = pi.pharmacy_id
    JOIN medicines m ON pi.medicine_id = m.id
    WHERE 
        p.is_verified = TRUE
        AND pi.stock_status IN ('in_stock', 'low_stock')
        AND (
            target_sub_city IS NULL 
            OR p.sub_city ILIKE '%' || target_sub_city || '%'
        )
        AND (
            search_query IS NULL
            OR m.brand_name ILIKE '%' || search_query || '%'
            OR m.generic_name ILIKE '%' || search_query || '%'
        )
        AND ST_DWithin(
            p.location, 
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, 
            max_distance_meters
        )
    ORDER BY distance_meters ASC;
$$;
