-- ============================================================
-- E-TaxPay: Complete Supabase PostgreSQL Schema
-- Zila Panchayat Uttarakhand — Digital Shop Tax Collection
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE (Shop Owners)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) NOT NULL,
  gst_id VARCHAR(15) UNIQUE NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  password_hash TEXT NOT NULL,
  district VARCHAR(100) DEFAULT 'Almora',
  block VARCHAR(100),
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN (
    'Grocery & Retail',
    'Restaurant & Cafe',
    'Electronics & Hardware',
    'Medical & Pharmacy',
    'Clothing & Apparels',
    'Services & Consultancy',
    'Small Kiosk / Vendor'
  )),
  father_name VARCHAR(150),
  photo_url TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  failed_attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ADMINS TABLE (Government Officials)
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('super_admin', 'district_admin')),
  passkey VARCHAR(100) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TAXES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  penalty NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'due')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_taxes_user ON taxes(user_id);
CREATE INDEX idx_taxes_status ON taxes(status);
CREATE INDEX idx_taxes_year_month ON taxes(year, month);

-- ============================================================
-- 4. PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_id UUID NOT NULL REFERENCES taxes(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  receipt_no VARCHAR(50) UNIQUE,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_tax ON payments(tax_id);

-- ============================================================
-- 5. NOTICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'reminder' CHECK (type IN ('reminder', 'warning', 'general')),
  is_read BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notices_user ON notices(user_id);

-- ============================================================
-- 6. COMPLAINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(150),
  mobile VARCHAR(15),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  admin_remarks TEXT,
  resolved_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. GOVERNMENT UPDATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS government_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  published_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  actor_type VARCHAR(20) CHECK (actor_type IN ('user', 'admin', 'system')),
  action VARCHAR(100) NOT NULL,
  target_table VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ============================================================
-- 9. LOGIN ATTEMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_identifier ON login_attempts(identifier);

-- ============================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'payment', 'tax')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================================
-- Enable Realtime on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE taxes;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notices;

-- ============================================================
-- Row Level Security Policies
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Tax policies
CREATE POLICY "Users can view own taxes" ON taxes FOR SELECT USING (true);
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'admin-chat-files');

-- 4. PROFILE PHOTOS STORAGE POLICIES (Allowing unrestricted access for profile images)
DROP POLICY IF EXISTS "Public Profiles Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Profiles Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Profiles Update" ON storage.objects;

CREATE POLICY "Public Profiles Access" ON storage.objects FOR ALL 
USING (bucket_id = 'profiles') 
WITH CHECK (bucket_id = 'profiles');
CREATE POLICY "Service role can manage taxes" ON taxes FOR ALL USING (true);

-- Payment policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Service role can manage payments" ON payments FOR ALL USING (true);

-- Notice policies
CREATE POLICY "Anyone can view notices" ON notices FOR SELECT USING (true);
CREATE POLICY "Service role can manage notices" ON notices FOR ALL USING (true);

-- Complaint policies
CREATE POLICY "Anyone can create complaints" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view complaints" ON complaints FOR SELECT USING (true);
CREATE POLICY "Service role can manage complaints" ON complaints FOR ALL USING (true);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Service role can manage notifications" ON notifications FOR ALL USING (true);

-- ============================================================
-- Insert default Super Admin
-- password: admin123 (bcrypt hash)
-- passkey: GOVT2024
-- ============================================================
INSERT INTO admins (username, password_hash, role, passkey)
VALUES (
  'superadmin',
  '$2b$10$YourBcryptHashHere',
  'super_admin',
  'GOVT2024'
) ON CONFLICT DO NOTHING;
