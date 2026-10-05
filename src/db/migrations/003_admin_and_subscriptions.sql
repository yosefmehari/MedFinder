-- ====================================================================
-- MedFinder: Migration 003 - Super Admin Controls & Subscriptions
-- ====================================================================

-- 1. Ensure SuperAdmin user has valid password hash and credentials
UPDATE users 
SET 
    password_hash = '593b5875873b94e09eed0a11d8b28239:d2bf6131d3bf8873e26402997106fc3a140507e7baa40d2bdf564cb0ac686aa1c9efeab97c91db8f7a8523025e97b1d020f89fd0a7bcd5352acefd4cb22645cd',
    role = 'super_admin'
WHERE id = 'a0000000-0000-0000-0000-000000000001' OR phone_number = '+251911223344' OR email = 'admin@medfinder.et';

-- 2. Create Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_etb NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Pharmacy Subscriptions Table (Admin manual assignment & management)
CREATE TABLE IF NOT EXISTS pharmacy_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    plan_name VARCHAR(100) NOT NULL,
    price_paid_etb NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'manual_admin', -- cash, cbe_transfer, telebirr, chapa, complimentary
    payment_reference VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'active',      -- active, expired, cancelled, pending
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    admin_notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharma_sub_pharma ON pharmacy_subscriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharma_sub_status ON pharmacy_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pharma_sub_expires ON pharmacy_subscriptions(expires_at);

-- 4. Create Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Initial Subscription Plans (Idempotent)
INSERT INTO subscription_plans (id, name, code, description, price_etb, duration_days, features, is_active) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'Free Trial / Starter',
    'starter',
    'Basic listing on MedFinder with standard search presence in Addis Ababa.',
    0.00,
    14,
    '["Standard Addis Ababa search listing", "Up to 10 inventory items", "Manual stock updates", "Basic dispensary profile"]'::jsonb,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Pro Dispensary Radar',
    'pro_radar',
    'Full dispensary presence with real-time stock updates and 2-hour hold verification.',
    650.00,
    30,
    '["Unlimited medicine stock inventory", "Real-time PostGIS proximity boost", "Verified EFDA green badge", "2-hour customer hold code validator", "Direct customer phone dialer"]'::jsonb,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Addis Scarce Medicine Priority',
    'scarce_priority',
    'Featured placement on the Addis Ababa Scarcity Radar with instant customer alerts.',
    1500.00,
    30,
    '["Top placement in search results", "Special Scarcity Radar gold highlight", "Customer Prescription Broadcast match alerts", "Unlimited inventory & holds", "Priority 24/7 technical support"]'::jsonb,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000004',
    'Enterprise Pharmacy Chain',
    'enterprise',
    'Multi-branch retail pharmacy chains across multiple Addis Ababa sub-cities.',
    3500.00,
    90,
    '["All Pro & Scarce features", "Multi-branch admin control", "Automated batch inventory uploads", "Dedicated account manager", "Custom Addis promotional banner"]'::jsonb,
    TRUE
)
ON CONFLICT (code) DO NOTHING;

-- 6. Seed Sample Active Subscriptions for Seed Pharmacies
INSERT INTO pharmacy_subscriptions (
    id, pharmacy_id, plan_id, plan_name, price_paid_etb, payment_method, payment_reference, status, starts_at, expires_at, admin_notes
) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001', -- Kenema Bole
    'd0000000-0000-0000-0000-000000000003',
    'Addis Scarce Medicine Priority',
    1500.00,
    'telebirr',
    'TB-2024-998124',
    'active',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '25 days',
    'Annual partner renewed via Telebirr merchant payment'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002', -- Lion Kirkos
    'd0000000-0000-0000-0000-000000000002',
    'Pro Dispensary Radar',
    650.00,
    'cbe_transfer',
    'CBE-TX-551982',
    'active',
    CURRENT_TIMESTAMP - INTERVAL '12 days',
    CURRENT_TIMESTAMP + INTERVAL '18 days',
    'Paid by bank transfer to MedFinder CBE account'
),
(
    'e0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003', -- Red Cross Arada
    'd0000000-0000-0000-0000-000000000003',
    'Addis Scarce Medicine Priority',
    0.00,
    'complimentary',
    'REDCROSS-PARTNERSHIP-2024',
    'active',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '80 days',
    'Complimentary community partnership plan'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Initial Platform Settings
INSERT INTO platform_settings (key, value, description) VALUES
('hold_fee_etb', '20.00'::jsonb, 'Standard unlock & 2-hour hold reservation fee in ETB'),
('announcement', '{"active": false, "message": "Notice: New scarce insulin stock verified across Addis Ababa today."}'::jsonb, 'Global announcement ticker across MedFinder header'),
('allow_new_registrations', 'true'::jsonb, 'Whether new pharmacies can self-register from the portal')
ON CONFLICT (key) DO NOTHING;
