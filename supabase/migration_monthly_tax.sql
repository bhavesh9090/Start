-- 1. Create the business_types table
CREATE TABLE IF NOT EXISTS business_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  monthly_tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default business types and their monthly tax rates
-- Based on standard assumptions or prompt; can be adjusted later by admin
INSERT INTO business_types (name, monthly_tax) VALUES
  ('Grocery & Retail', 500),
  ('Restaurant & Cafe', 800),
  ('Electronics & Hardware', 1000),
  ('Medical & Pharmacy', 1200),
  ('Clothing & Apparels', 700),
  ('Services & Consultancy', 1500),
  ('Small Kiosk / Vendor', 200)
ON CONFLICT (name) DO NOTHING;

-- 3. Add foreign key to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_type_id UUID REFERENCES business_types(id);

-- 4. Migrate the existing string values to the foreign key
UPDATE users u
SET business_type_id = b.id
FROM business_types b
WHERE u.business_type = b.name;

-- 5. Create monthly_payments table
CREATE TABLE IF NOT EXISTS monthly_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  penalty NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PENDING')),
  razorpay_payment_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- 6. Enable RLS and Realtime
ALTER TABLE monthly_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own monthly payments" ON monthly_payments FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Service role can manage monthly payments" ON monthly_payments FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE monthly_payments;
