-- SQL SCRIPT UNTUK SETUP DATABASE SUPABASE
-- Jalankan script ini di Supabase SQL Editor: https://app.supabase.com/project/[project-ref]/sql

-- ==============================================
-- TABEL 1: LICENSES - Menyimpan informasi lisensi
-- ==============================================
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key VARCHAR(50) UNIQUE NOT NULL,
  school_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, expired, revoked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_validated TIMESTAMP WITH TIME ZONE,
  activation_attempts INTEGER DEFAULT 0,
  
  -- Index untuk performa query
  CONSTRAINT license_key_unique UNIQUE(license_key),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'expired', 'revoked'))
);

-- Tambahkan index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);

-- ==============================================
-- TABEL 2: OTP_CODES - Menyimpan kode OTP untuk aktivasi
-- ==============================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key VARCHAR(50) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- Foreign key ke table licenses
  FOREIGN KEY (license_key) REFERENCES licenses(license_key) ON DELETE CASCADE,
  
  -- Index
  CONSTRAINT valid_otp_code CHECK (LENGTH(otp_code) = 6 AND otp_code ~ '^\d+$')
);

-- Tambahkan index
CREATE INDEX IF NOT EXISTS idx_otp_codes_license_key ON otp_codes(license_key);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- ==============================================
-- TABEL 3: ACTIVATION_LOGS - Audit trail untuk tracking aktivasi
-- ==============================================
CREATE TABLE IF NOT EXISTS activation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- otp_sent, otp_verified, license_activated, license_revoked
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL, -- success, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key
  FOREIGN KEY (license_key) REFERENCES licenses(license_key) ON DELETE CASCADE
);

-- Tambahkan index
CREATE INDEX IF NOT EXISTS idx_activation_logs_license_key ON activation_logs(license_key);
CREATE INDEX IF NOT EXISTS idx_activation_logs_action ON activation_logs(action);

-- ==============================================
-- CONTOH DATA - Untuk Testing
-- ==============================================

-- Contoh lisensi (copy license_key untuk testing)
INSERT INTO licenses (license_key, school_name, email, status, expires_at) VALUES
  (
    'DEMO-0001-0001-0001',
    'MTs. An-Nur Bululawang',
    'admin@mtsannur.sch.id',
    'pending',
    NOW() + INTERVAL '30 days'
  ),
  (
    'DEMO-0002-0002-0002',
    'SMA Test School',
    'test@example.com',
    'pending',
    NOW() + INTERVAL '30 days'
  )
ON CONFLICT (license_key) DO NOTHING;

-- ==============================================
-- RLS (ROW LEVEL SECURITY) - OPTIONAL
-- Jika ingin lebih aman, aktifkan RLS
-- ==============================================

-- Uncomment jika ingin aktifkan RLS (lebih advanced)
/*
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk licenses (everyone bisa baca, tapi hanya yang authorized bisa update)
CREATE POLICY "Licenses are viewable by everyone" 
  ON licenses FOR SELECT 
  USING (true);

CREATE POLICY "Only Netlify Functions can update licenses" 
  ON licenses FOR UPDATE 
  USING (auth.role() = 'service_role');

-- Policy untuk otp_codes
CREATE POLICY "OTP codes only readable by role" 
  ON otp_codes FOR SELECT 
  USING (auth.role() = 'service_role');

CREATE POLICY "Only Netlify Functions can manage OTP" 
  ON otp_codes FOR ALL 
  USING (auth.role() = 'service_role');

-- Policy untuk activation_logs
CREATE POLICY "Activation logs readable by admins" 
  ON activation_logs FOR SELECT 
  USING (auth.role() = 'service_role');

CREATE POLICY "Only Netlify Functions can insert logs" 
  ON activation_logs FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');
*/

-- ==============================================
-- NOTES
-- ==============================================
-- 1. Untuk production, ubah status lisensi menjadi 'active' SETELAH verifikasi OTP
-- 2. Token JWT di-generate setiap kali OTP verified, berlaku 30 hari
-- 3. Activation_attempts di-reset ke 0 setelah OTP berhasil diverifikasi
-- 4. Jika OTP gagal 5 kali, user harus menunggu cooldown sebelum bisa request OTP lagi
-- 5. Semua waktu dalam UTC timezone, konversi ke timezone lokal di frontend
