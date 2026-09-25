-- ====================================================================
-- MedFinder: Migration 002 - Addis Ababa Seed Data
-- ====================================================================

-- 1. Insert Initial System Users
INSERT INTO users (id, email, phone_number, full_name, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@medfinder.et', '+251911223344', 'MedFinder SuperAdmin', 'super_admin'),
('b0000000-0000-0000-0000-000000000002', 'kenema.bole@gmail.com', '+251911456789', 'Kenema Pharmacy Bole Branch', 'pharmacy_admin'),
('b0000000-0000-0000-0000-000000000003', 'lion.mexico@gmail.com', '+251922334455', 'Lion Pharmacy Kirkos', 'pharmacy_admin'),
('b0000000-0000-0000-0000-000000000004', 'redcross.piazza@gmail.com', '+251933445566', 'Red Cross Pharmacy Arada', 'pharmacy_admin');

-- 2. Insert Addis Ababa Pharmacies with real GPS Coordinates
INSERT INTO pharmacies (
    id, owner_id, name, license_number, sub_city, woreda, street_address, landmark,
    phone_number, is_24_hours, latitude, longitude, is_verified, verification_status, rating
) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'Kenema Pharmacy No. 1 - Bole',
    'EFDA-AA-2023-8910',
    'Bole',
    'Woreda 03',
    'Cameroon St, near Medhanialem Church',
    'Opposite Edna Mall / Harmony Hotel',
    '+251911456789',
    TRUE,
    9.0016,
    38.7885,
    TRUE,
    'approved',
    4.9
),
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'Lion Pharmacy & Special Dispensary',
    'EFDA-AA-2022-4412',
    'Kirkos',
    'Woreda 08',
    'Ras Abebe Aregay Ave, Mexico Square',
    'Next to Wabi Shebelle Hotel',
    '+251922334455',
    FALSE,
    9.0108,
    38.7460,
    TRUE,
    'approved',
    4.8
),
(
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000004',
    'Ethiopian Red Cross Pharmacy',
    'EFDA-AA-2021-0021',
    'Arada',
    'Woreda 01',
    'Cunningham St, Piazza',
    'Near Taitu Hotel & Churchill Ave',
    '+251933445566',
    TRUE,
    9.0345,
    38.7518,
    TRUE,
    'approved',
    4.95
),
(
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000002',
    'CarePlus Pharmacy - Megenagna',
    'EFDA-AA-2024-5589',
    'Yeka',
    'Woreda 06',
    'Haile Gebreselassie Ave, Megenagna Roundabout',
    'Near Zefmesh Grand Mall',
    '+251944556677',
    FALSE,
    9.0205,
    38.7963,
    TRUE,
    'approved',
    4.7
),
(
    'c0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000003',
    'Bethel Community Pharmacy',
    'EFDA-AA-2023-1190',
    'Lideta',
    'Woreda 04',
    'Balcha Aba Nefso Hospital area',
    'Across from Lideta High Court',
    '+251955667788',
    TRUE,
    9.0125,
    38.7360,
    TRUE,
    'approved',
    4.6
);

-- 3. Insert Common & Scarce Medicines
INSERT INTO medicines (
    id, brand_name, generic_name, dosage_form, strength,
    manufacturer, therapeutic_category, is_scarce, requires_prescription, standard_retail_price
) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'Lantus SoloStar',
    'Insulin Glargine',
    'Injectable Pen',
    '100 units/ml (3ml)',
    'Sanofi-Aventis',
    'Endocrine / Diabetes',
    TRUE,
    TRUE,
    2850.00
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Clexane',
    'Enoxaparin Sodium',
    'Pre-filled Syringe',
    '40mg / 0.4ml',
    'Sanofi',
    'Cardiovascular / Anticoagulant',
    TRUE,
    TRUE,
    1450.00
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Ventolin Evohaler',
    'Salbutamol',
    'Inhaler',
    '100mcg (200 doses)',
    'GlaxoSmithKline',
    'Respiratory / Asthma',
    TRUE,
    TRUE,
    850.00
),
(
    'd0000000-0000-0000-0000-000000000004',
    'Augmentin',
    'Amoxicillin + Clavulanic Acid',
    'Film-coated Tablet',
    '1g (1000mg)',
    'GSK',
    'Anti-infective / Antibiotic',
    FALSE,
    TRUE,
    620.00
),
(
    'd0000000-0000-0000-0000-000000000005',
    'Glucophage',
    'Metformin Hydrochloride',
    'Tablet',
    '850mg',
    'Merck Serono',
    'Endocrine / Diabetes',
    FALSE,
    TRUE,
    380.00
),
(
    'd0000000-0000-0000-0000-000000000006',
    'Norvasc',
    'Amlodipine Besylate',
    'Tablet',
    '5mg',
    'Pfizer',
    'Cardiovascular / Hypertension',
    FALSE,
    TRUE,
    420.00
);

-- 4. Insert Inventory Items (Stock at Pharmacies)
INSERT INTO pharmacy_inventory (
    pharmacy_id, medicine_id, stock_status, quantity, unit_price, batch_number, expiry_date, notes
) VALUES
-- Kenema Bole has Lantus (scarce) and Ventolin
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'in_stock', 14, 2850.00, 'BN-2024-09A', '2026-11-30', 'Cold-chain stored at 2-8°C. Authentic Sanofi.'),
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'in_stock', 25, 850.00, 'BN-2024-88', '2027-02-28', 'Fresh batch from GSK.'),
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'in_stock', 40, 620.00, 'BN-AUG-991', '2026-08-15', 'Original pack of 14 tablets.'),

-- Lion Pharmacy Kirkos has Clexane (scarce) and Norvasc
('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'in_stock', 6, 1450.00, 'CLX-7740', '2026-05-30', 'Limited scarce units available. Prescription required.'),
('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', 'in_stock', 50, 420.00, 'NOR-332', '2027-10-31', '30 tablets blister pack.'),

-- Red Cross Arada has Lantus (scarce, low stock) & Augmentin
('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'low_stock', 3, 2790.00, 'BN-2024-08B', '2026-10-31', 'Subsidized price via Red Cross.'),
('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 'in_stock', 30, 590.00, 'BN-AUG-992', '2026-09-01', 'Subsidized Red Cross rate.'),

-- CarePlus Megenagna has Ventolin & Glucophage
('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'in_stock', 18, 860.00, 'VEN-019', '2027-01-15', 'Original GlaxoSmithKline.'),
('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', 'in_stock', 80, 380.00, 'GLU-902', '2027-06-30', 'Strip of 10 tablets x 5.');
