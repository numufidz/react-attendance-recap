# 🚀 SETUP LICENSING SYSTEM - PANDUAN LENGKAP

## 📋 Daftar Isi
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Netlify Environment Variables](#netlify-environment-variables)
4. [Resend Email Service](#resend-email-service)
5. [Testing Aktivasi](#testing-aktivasi)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites
- Akun Netlify (sudah ada di deployment Anda)
- Akun Supabase (gratis: https://supabase.com)
- Akun Resend untuk email (gratis: https://resend.com)

---

## Supabase Setup

### Step 1: Buat Project Baru
1. Login ke https://app.supabase.com
2. Klik "New project"
3. Pilih region terdekat (contoh: Singapore untuk Asia)
4. Set password database yang kuat
5. Tunggu project selesai dibuat (~5 menit)

### Step 2: Dapatkan API Keys
1. Di sidebar, pilih **Settings → API**
2. Copy dan simpan:
   - **Project URL** → REACT_APP_SUPABASE_URL
   - **Anon Public Key** → REACT_APP_SUPABASE_ANON_KEY
   - **Service Role Key** → JWT_SECRET (untuk Netlify Functions)

### Step 3: Setup Database Tables
1. Di sidebar, pilih **SQL Editor**
2. Klik "New query"
3. Copy-paste seluruh isi file `SETUP_SUPABASE.sql`
4. Klik "RUN"
5. Tunggu sampai selesai

### Step 4: Verifikasi Tables
1. Di sidebar, pilih **Table Editor**
2. Pastikan 3 tabel sudah ada:
   - `licenses` (untuk menyimpan lisensi)
   - `otp_codes` (untuk menyimpan kode OTP)
   - `activation_logs` (untuk audit trail)

---

## Netlify Environment Variables

### Step 1: Dapatkan Service Role Key
⚠️ **PENTING**: Service Role Key bukan untuk digunakan di frontend!
1. Di Supabase, Settings → API
2. Copy "Service Role Key" (SECRET - jangan share!)

### Step 2: Setup di Netlify
1. Login ke https://app.netlify.com
2. Pilih site Anda
3. Buka **Site settings → Build & deploy → Environment**
4. Klik **Edit variables**
5. Tambahkan 5 environment variable:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-anon-key (bisa lihat di .env.local)
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
RESEND_API_KEY = your-resend-api-key
JWT_SECRET = generate-32-char-random-string
```

### Step 3: Generate JWT_SECRET
Buka terminal, jalankan:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy output 64 karakter itu ke JWT_SECRET

---

## Resend Email Service

### Step 1: Setup Email Service (OPTIONAL - untuk development)
Untuk testing tanpa Resend:
- Buka browser console saat OTP dikirim
- Console akan log OTP code
- Gunakan OTP tersebut untuk testing

### Step 2: Setup Resend (RECOMMENDED - untuk production)
1. Login ke https://resend.com
2. Dapatkan API Key dari dashboard
3. Verify domain (setup DNS records)
4. Set RESEND_API_KEY di Netlify

---

## Testing Aktivasi

### Step 1: Persiapan
1. Pastikan semua environment variables sudah di-set
2. Deploy aplikasi ke Netlify: `git push`
3. Tunggu build selesai

### Step 2: Testing Flow
```
1. Buka aplikasi → akan muncul ActivationScreen
2. Masukkan license key: DEMO-0001-0001-0001
3. Masukkan email dan nama sekolah
4. Klik "Kirim OTP"
   - Jika menggunakan Resend: Cek email untuk OTP
   - Jika testing: Cek browser console untuk OTP code
5. Masukkan 6-digit OTP
6. Klik "Verifikasi OTP"
7. Tunggu token di-generate
8. Aplikasi akan unlock dan menampilkan main interface
```

### Step 3: Verifikasi Token Tersimpan
1. Buka Developer Tools (F12)
2. Buka tab "Application" → "Local Storage"
3. Cari key "matsanuba_license_token"
4. Token harus berupa base64-encoded JSON

### Step 4: Test Logout
1. Klik tombol "🚪 Logout" di header
2. Token akan dihapus dari localStorage
3. Halaman akan kembali ke ActivationScreen

---

## Troubleshooting

### Error: "Invalid Supabase URL"
- Pastikan REACT_APP_SUPABASE_URL sudah di-set di .env.local
- Format: https://your-project.supabase.co (tanpa trailing slash)

### Error: "OTP expired"
- OTP hanya berlaku 10 menit
- Request OTP baru jika sudah lebih dari 10 menit

### Error: "License not found"
- Pastikan license_key sudah dibuat di database Supabase
- Double-check format license key (case-sensitive)

### Error: "Activation attempts exceeded"
- Sudah coba 5 kali gagal
- Tunggu beberapa jam sebelum coba lagi (cooldown)

### Email OTP tidak masuk
- Cek folder spam/junk
- Pastikan Resend API key sudah di-set di Netlify
- Cek aktivitas email di dashboard Resend

### Token tidak tersimpan di localStorage
- Buka browser console, cek apakah ada error
- Pastikan localStorage tidak disabled di browser
- Cek apakah window.localStorage tersedia (lihat DevTools → Console)

### Aplikasi masih menunjukkan ActivationScreen setelah OTP verified
- Refresh halaman (Ctrl+R)
- Buka DevTools → Application → Clear Local Storage → Refresh
- Pastikan onActivationSuccess callback di-trigger

---

## Local Development

### Setup Development Environment
```bash
# 1. Copy file contoh environment
cp .env.local.example .env.local

# 2. Edit .env.local dengan values Anda
# REACT_APP_SUPABASE_URL=your-supabase-url
# REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# 3. Install dependencies
npm install

# 4. Start development server
npm start
```

### Testing OTP Tanpa Resend
1. Saat request OTP, server akan log ke console Netlify
2. Buka browser console (F12)
3. Cari pesan: "OTP Code Sent: XXXXXX"
4. Gunakan kode tersebut untuk testing

---

## Production Checklist

- [ ] Supabase project dibuat
- [ ] Database tables sudah di-setup
- [ ] Semua environment variables di-set di Netlify
- [ ] Resend API key di-set dan domain verified
- [ ] JWT_SECRET di-generate dan di-set
- [ ] Testing activation flow berhasil
- [ ] Testing logout berhasil
- [ ] Testing token validation berhasil (refresh halaman)
- [ ] Email OTP diterima dengan benar
- [ ] Dokumentasi ditunjukkan ke client

---

## Production Licensing

### Membuat License Baru untuk Client
```sql
-- Jalankan di Supabase SQL Editor

INSERT INTO licenses (
  license_key, 
  school_name, 
  email, 
  status, 
  expires_at
) VALUES (
  'SCHOOL-2025-0001',
  'SMA Maju Jaya',
  'admin@smamajujaya.sch.id',
  'pending',
  NOW() + INTERVAL '365 days'  -- License berlaku 1 tahun
);

-- Lihat license_key yang dibuat
SELECT license_key FROM licenses WHERE school_name = 'SMA Maju Jaya';
```

### Sharing License Key dengan Client
1. Berikan license_key melalui email/channel aman
2. Instruksikan client untuk:
   - Buka aplikasi
   - Masukkan license_key
   - Masukkan nama sekolah dan email
   - Submit form untuk mendapat OTP
   - Check email untuk OTP code
3. Support tim siaga untuk troubleshooting

---

## Support & Documentation
- Supabase Docs: https://supabase.com/docs
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Resend Docs: https://resend.com/docs
- JWT: https://jwt.io/

---

## Versioning
- Version: 1.0
- Last Updated: 2025-01-15
- Creator: Matsanuba Management Technology
