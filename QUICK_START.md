# ⚡ QUICK START - Lisensi System Setup (30 Menit)

## 🎯 Tujuan Hari Ini
Aktivasi sistem lisensi agar aplikasi siap jual ke sekolah-sekolah lain.

---

## ✅ Checklist Pre-Setup

Pastikan Anda sudah punya:
- [ ] Akun Netlify (sudah ada dari deployment Anda)
- [ ] Akun Google atau GitHub (untuk sign up gratis di Supabase & Resend)
- [ ] 30 menit waktu untuk setup
- [ ] Access ke Netlify dashboard
- [ ] Terminal/Command Prompt

---

## 🚀 FASE 1: SUPABASE SETUP (15 menit)

### 1️⃣ Buat Project Supabase
```
1. Buka: https://app.supabase.com
2. Klik "New project"
3. Pilih organization atau buat baru
4. Isi:
   - Project name: "Attendance System" (atau nama lain)
   - Database password: [Buat password kuat - simpan di tempat aman!]
   - Region: Singapore atau Asia Tenggat (terdekat)
5. Klik "Create new project"
6. Tunggu 5-10 menit hingga selesai
```

### 2️⃣ Ambil API Keys
```
1. Di sidebar Supabase, pilih: Settings → API
2. Copy dan SIMPAN DI NOTEPAD:
   a) Project URL (format: https://xxxxx.supabase.co)
   b) Anon Public Key (mulai dengan "eyJ...")
   c) Service Role Key (SECRET - jangan share!)
```

### 3️⃣ Setup Database
```
1. Di sidebar, pilih: SQL Editor
2. Klik "New query"
3. Buka file: SETUP_SUPABASE.sql (di folder project)
4. Copy-paste SELURUH isi file ke SQL Editor
5. Klik tombol "RUN" (atau Ctrl+Enter)
6. Tunggu selesai (harus ada 3 tabel baru di Table Editor)
```

### 4️⃣ Verifikasi Database
```
1. Di sidebar, pilih: Table Editor
2. Seharusnya ada 3 tabel:
   ✓ licenses
   ✓ otp_codes
   ✓ activation_logs
3. Klik "licenses" → lihat data test (DEMO-0001-0001-0001)
```

✅ **Supabase Setup SELESAI!**

---

## 🔐 FASE 2: NETLIFY SETUP (10 menit)

### 1️⃣ Generate JWT Secret
Buka terminal, jalankan:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Hasilnya: copy string 64 karakter itu

### 2️⃣ Setup Environment Variables di Netlify
```
1. Buka: https://app.netlify.com
2. Pilih site Anda (attendance system)
3. Buka: Site settings → Build & deploy → Environment
4. Klik: "Edit variables" / "Add variable"
5. Tambahkan 5 variables berikut:

┌─ Variable 1 ─────────────────────────────────┐
│ Name: SUPABASE_URL                           │
│ Value: [paste dari Step 2 Fase 1]            │
│ (format: https://xxxxx.supabase.co)          │
└──────────────────────────────────────────────┘

┌─ Variable 2 ─────────────────────────────────┐
│ Name: SUPABASE_ANON_KEY                      │
│ Value: [paste anon key dari Step 2 Fase 1]   │
│ (mulai dengan eyJ...)                        │
└──────────────────────────────────────────────┘

┌─ Variable 3 ─────────────────────────────────┐
│ Name: SUPABASE_SERVICE_ROLE_KEY              │
│ Value: [paste service role key dari Supabase]│
│ (SECRET - sangat penting!)                   │
└──────────────────────────────────────────────┘

┌─ Variable 4 ─────────────────────────────────┐
│ Name: JWT_SECRET                             │
│ Value: [paste hasil generate dari Step 1]    │
│ (64 character hex string)                    │
└──────────────────────────────────────────────┘

┌─ Variable 5 ─────────────────────────────────┐
│ Name: RESEND_API_KEY                         │
│ Value: [akan di-update nanti dari Resend]    │
│ (Bisa isi placeholder dulu: "test-key")      │
└──────────────────────────────────────────────┘
```

### 3️⃣ Save & Deploy
```
1. Klik "Save" / "Deploy"
2. Kembali ke site overview
3. Tunggu auto-deploy selesai (status "Published")
```

✅ **Netlify Setup SELESAI!**

---

## 📧 FASE 3: RESEND EMAIL SETUP (5 menit - OPTIONAL)

### Untuk Production:
```
1. Buka: https://resend.com
2. Sign up dengan email Anda
3. Di dashboard, buka: API Keys
4. Copy API key (mulai dengan "re_")
5. Kembali ke Netlify → Environment variables
6. Update RESEND_API_KEY dengan nilai ini
7. Deploy ulang
```

### Untuk Testing Sementara:
OTP akan ditampilkan di:
- Email (jika RESEND_API_KEY valid)
- Browser Console (F12 → Console tab) - selalu ada

⚠️ **Untuk production, gunakan Resend!**

---

## 🧪 FASE 4: TESTING (5 menit)

### Test 1: Buka Aplikasi
```
1. Buka aplikasi dari URL Netlify
2. Seharusnya muncul: ActivationScreen
3. Jika error, buka Console (F12) dan cek error message
```

### Test 2: Request OTP
```
1. Di form, isi:
   - License Key: DEMO-0001-0001-0001
   - School Name: Test School
   - Email: your-email@example.com
2. Klik "Kirim OTP"
3. Tunggu 2-3 detik
```

### Test 3: Terima OTP
```
✓ Jika RESEND_API_KEY valid: Cek email inbox
✓ Jika belum setup: Cek browser Console
  - Buka F12 → Console tab
  - Cari: "OTP Code Sent: 123456"
```

### Test 4: Verify OTP
```
1. Copy 6-digit OTP code
2. Paste di form "Masukkan OTP"
3. Klik "Verifikasi OTP"
4. Tunggu 2-3 detik
```

### Test 5: Aplikasi Unlock
```
✓ Seharusnya muncul: Main interface aplikasi
✓ Di header, ada info lisensi + "Logout" button
✓ Selamat! Licensing system BERFUNGSI!
```

### Test 6: Refresh Halaman
```
1. Tekan F5 (refresh)
2. Aplikasi harus langsung muncul (tanpa perlu aktivasi lagi)
3. Token di-validate otomatis dari Supabase
```

### Test 7: Logout
```
1. Klik tombol "🚪 Logout" di header
2. Akan kembali ke ActivationScreen
3. Token dihapus dari localStorage
```

✅ **Testing SELESAI & BERFUNGSI!**

---

## 📊 Status Checklist

| Item | Status | Notes |
|------|--------|-------|
| Supabase Project | ✅ DONE | Database siap |
| Supabase API Keys | ✅ DONE | Tersimpan aman |
| Netlify Env Vars | ✅ DONE | 5 variables set |
| Database Tables | ✅ DONE | 3 tabel + test data |
| Aplikasi Deploy | ✅ DONE | Published |
| ActivationScreen | ✅ DONE | Muncul di startup |
| OTP Request | ✅ DONE | Email/Console |
| OTP Verify | ✅ DONE | Token generated |
| Main App Unlock | ✅ DONE | Berfungsi normal |
| Token Persist | ✅ DONE | Refresh masih auth |
| Logout | ✅ DONE | Token dihapus |

---

## 🎁 Hasil Akhir

Anda sekarang punya:
- ✅ Sistem lisensi berbasis OTP
- ✅ Database untuk manage lisensi per sekolah
- ✅ Netlify functions untuk backend
- ✅ Email OTP delivery
- ✅ JWT token untuk auth
- ✅ Audit trail logging
- ✅ Production-ready application

---

## 💼 NEXT: Jual ke Sekolah Lain

Sekarang Anda bisa menjual ke sekolah-sekolah lain:

```sql
-- Untuk setiap sekolah baru, tambahkan license di Supabase:

INSERT INTO licenses (
  license_key, 
  school_name, 
  email, 
  status, 
  expires_at
) VALUES (
  'SEKOLAH-2025-0001',
  'SMA Maju Jaya',
  'admin@smamajujaya.sch.id',
  'pending',
  NOW() + INTERVAL '365 days'
);

-- Share license_key ini ke client via email
```

Instruksikan client untuk:
1. Buka aplikasi
2. Masukkan license key Anda
3. Isi nama sekolah dan email
4. Klik "Kirim OTP"
5. Cek email untuk OTP
6. Masukkan OTP untuk unlock

---

## ❓ FAQ Cepat

**Q: OTP tidak masuk email?**
A: 
1. Cek folder spam/junk
2. Cek console (F12) untuk OTP code
3. Verifikasi domain di Resend jika perlu production

**Q: License key tidak valid?**
A:
1. Pastikan sudah run SQL di Supabase
2. Copy-paste license key dengan benar (case-sensitive)
3. Cek di Table Editor → licenses

**Q: Aplikasi masih frozen?**
A:
1. Cek console (F12) untuk error
2. Verifikasi semua 5 environment variables di Netlify
3. Coba: Ctrl+Shift+R (hard refresh)

**Q: Token tidak tersimpan?**
A:
1. Cek localStorage (F12 → Application → Local Storage)
2. Key seharusnya: "matsanuba_license_token"
3. Pastikan localStorage tidak disabled di browser

---

## 📞 Support

Jika stuck:
1. Baca: `LICENSING_SETUP.md` (detailed guide)
2. Cek: `IMPLEMENTATION_CHECKLIST.md` (step-by-step)
3. Konsultasi: File `SETUP_SUPABASE.sql` untuk database schema

---

**Waktu Total:** ~30 menit
**Kesulitan:** ⭐⭐ (mudah)
**Hasil:** Production-ready licensing system

🎉 **Selamat! Sistem lisensi Anda siap jual!**

---

**Created by:** Matsanuba Management Technology
**Last Updated:** 2025-01-15
**Version:** 1.0
