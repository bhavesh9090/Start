-- Run this entire script in your Supabase SQL Editor to correctly fix the error.

-- 1. Drop the old constraint first so we can modify the data without errors
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_business_type_check;

-- 2. Update any existing invalid data (like "small") to a valid category 
-- so that we don't get the 23514 error when applying the new constraint
UPDATE users
SET business_type = 'Grocery & Retail'
WHERE business_type NOT IN (
  'Grocery & Retail',
  'Restaurant & Cafe',
  'Electronics & Hardware',
  'Medical & Pharmacy',
  'Clothing & Apparels',
  'Services & Consultancy',
  'Small Kiosk / Vendor'
);

-- 3. Add the new correct constraint that matches your frontend
ALTER TABLE users ADD CONSTRAINT users_business_type_check CHECK (
  business_type IN (
    'Grocery & Retail',
    'Restaurant & Cafe',
    'Electronics & Hardware',
    'Medical & Pharmacy',
    'Clothing & Apparels',
    'Services & Consultancy',
    'Small Kiosk / Vendor'
  )
);
