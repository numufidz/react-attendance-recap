# 📋 WORKFLOW PENJUALAN LISENSI - Panduan Lengkap

Dokumentasi lengkap untuk proses penjualan lisensi ke customer/sekolah baru.

---

## 📌 Daftar Isi
1. [Overview Workflow](#overview-workflow)
2. [Admin: Membuat License Key Baru](#admin-membuat-license-key-baru)
3. [Admin: Insert ke Supabase](#admin-insert-ke-supabase)
4. [Admin: Perpanjang Lisensi Existing](#admin-perpanjang-lisensi-existing)
5. [Customer: Aktivasi Aplikasi](#customer-aktivasi-aplikasi)
6. [Verifikasi & Troubleshooting](#verifikasi--troubleshooting)

---

## Overview Workflow

### Actors & Responsibilities

```
CUSTOMER (Sekolah)
├─ Hubungi & Negosiasi
├─ Melakukan Pembayaran
├─ Menerima License Key via Email
├─ Buka Aplikasi & Aktivasi
└─ Gunakan Aplikasi

ADMIN (Anda)
├─ Generate License Key
├─ Insert ke Supabase
├─ Kirim Email ke Customer
├─ Monitor Aktivasi
└─ Support & Maintenance
```

### Timeline Penjualan
```
Day 0:  Customer contact & negosiasi
Day 0:  Generate license key
Day 0:  Insert ke Supabase
Day 0:  Send email dengan instruksi
Day 1:  Customer aktivasi via aplikasi
Day 1+: Support & maintenance
```

---

## Admin: Membuat License Key Baru

### Langkah 1: Siapkan Data Customer

Kumpulkan informasi berikut:

```
Nama Sekolah:  [nama lengkap sekolah]
Email:         [email resmi sekolah]
Durasi:        [jumlah hari/bulan]
Tanggal Mulai: [hari ini atau kapan disetujui]
Harga:         [jumlah rupiah - untuk internal tracking]
```

Contoh:
```
Nama Sekolah:  SMA Nusa Tenggara Barat
Email:         admin@smatnb.sch.id
Durasi:        365 hari (1 tahun)
Tanggal Mulai: 2025-12-12
Harga:         Rp 2.000.000
```

### Langkah 2: Generate License Key

**Format yang direkomendasikan:**
```
PROD-{YEAR}-{SEQUENCE}-{UNIQUE_CODE}
```

**Contoh berbagai format:**
- `PROD-2025-0001-A1B2` - Sekolah pertama tahun 2025
- `PROD-2025-0002-C3D4` - Sekolah kedua tahun 2025
- `SCHOOL-SMATNB-001` - Format alternatif (school_code-sequence)
- `UNNUR-2025-001` - Format custom An-Nur

**Tools untuk generate:**
- Online UUID: https://www.uuidgenerator.net/
- Atau generate manual dengan format di atas

### Langkah 3: Tentukan Tanggal Expired

Berdasarkan durasi, hitung tanggal kadaluarsa:

```
Mulai:    2025-12-12
Durasi:   365 hari (1 tahun)
Expired:  2026-12-12

Atau:     Mulai: 2025-12-12
          Durasi: 90 hari (3 bulan)
          Expired: 2026-03-12
```

**Tips:**
- Expired bisa juga tanggal tenggat pembayaran periode berikutnya
- Lebih baik generous (sampai akhir bulan) daripada cut-off di tengah

---

## Admin: Insert ke Supabase

### Langkah 1: Buka Supabase SQL Editor

1. Login ke https://app.supabase.com
2. Pilih project Anda
3. Di sidebar, klik **SQL Editor**
4. Klik **New query** (atau +) untuk membuat query baru

### Langkah 2: Siapkan SQL Query

Copy template berikut dan sesuaikan dengan data customer:

```sql
-- ======================================
-- CUSTOMER BARU: [NAMA_SEKOLAH]
-- ======================================

INSERT INTO licenses (
  license_key,
  school_name,
  email,
  status,
  expires_at
) VALUES (
  'PROD-2025-0001-A1B2',
  'SMA Nusa Tenggara Barat',
  'admin@smatnb.sch.id',
  'pending',
  '2026-12-12'::timestamp with time zone
);

-- Verify insert berhasil
SELECT * FROM licenses WHERE license_key = 'PROD-2025-0001-A1B2';
```

### Langkah 3: Jalankan Query

1. Paste query di SQL Editor
2. Klik tombol **▶ RUN** (berwarna biru)
3. Atau tekan **Ctrl + Enter**
4. Tunggu hasil: `Query returned successfully with 1 row inserted`

### Langkah 4: Verifikasi

Lihat hasil SELECT:
```
license_key              | school_name              | email             | status  | expires_at
PROD-2025-0001-A1B2    | SMA Nusa Tenggara Barat | admin@smatnb... | pending | 2026-12-12
```

**Checklist:**
- [ ] license_key benar
- [ ] school_name sesuai
- [ ] email correct
- [ ] status = 'pending'
- [ ] expires_at sudah benar

### Batch Insert (Multiple Customers)

Jika ingin insert beberapa sekaligus:

```sql
INSERT INTO licenses (license_key, school_name, email, status, expires_at)
VALUES
  ('PROD-2025-0001-A1B2', 'SMA Nusa Tenggara', 'admin@smatnb.sch.id', 'pending', '2026-12-12'::timestamp),
  ('PROD-2025-0002-C3D4', 'SMK Bina Nusa', 'admin@smbbn.sch.id', 'pending', '2026-06-12'::timestamp),
  ('PROD-2025-0003-E5F6', 'MTs Nurul Ilmi', 'admin@mtsnur.sch.id', 'pending', '2026-03-12'::timestamp);

SELECT * FROM licenses WHERE license_key IN ('PROD-2025-0001-A1B2', 'PROD-2025-0002-C3D4', 'PROD-2025-0003-E5F6');
```

---

## Admin: Kirim Email ke Customer

### Email Template

Gunakan template berikut dan personalisasi untuk customer:

```
═══════════════════════════════════════════════════════════════

📧 AKTIVASI LISENSI - SISTEM REKAP ABSENSI
   Diterbitkan oleh: MTs. An-Nur Bululawang

Assalamu'alaikum Wr. Wb.

Terima kasih telah mempercayai Sistem Rekap Absensi kami!

Berikut adalah data aktivasi lisensi untuk sekolah Anda:

┌─────────────────────────────────────────────────────────────┐
│ 🔐 DATA AKTIVASI LISENSI                                    │
├─────────────────────────────────────────────────────────────┤
│ Kode Lisensi        : PROD-2025-0001-A1B2                   │
│ Nama Sekolah        : SMA Nusa Tenggara Barat              │
│ Email Terdaftar     : admin@smatnb.sch.id                  │
│ Berlaku Hingga      : 12 Desember 2026                      │
│ Durasi Lisensi      : 1 Tahun (365 hari)                   │
└─────────────────────────────────────────────────────────────┘

🚀 CARA AKTIVASI (5 LANGKAH MUDAH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LANGKAH 1: Buka Aplikasi
   Kunjungi: https://attendance-recap.netlify.app

LANGKAH 2: Masukkan Data Aktivasi
   - Kode Lisensi  : PROD-2025-0001-A1B2
   - Nama Sekolah  : SMA Nusa Tenggara Barat
   - Email Sekolah : admin@smatnb.sch.id

LANGKAH 3: Kirim Kode OTP
   Klik tombol "Kirim Kode OTP"
   → Sistem akan mengirim kode 6-digit ke email terdaftar

LANGKAH 4: Masukkan Kode OTP
   - Cek email Anda
   - Copy kode 6-digit
   - Paste ke form aplikasi

LANGKAH 5: Aktivasi Selesai!
   Klik tombol "Aktivasi"
   → Aplikasi akan langsung bisa digunakan

⏰ CATATAN PENTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Kode OTP berlaku 10 MENIT saja
- Jika kode expired, klik "Kirim Ulang" untuk OTP baru
- Jangan bagikan kode lisensi ke pihak lain
- Lisensi hanya berlaku untuk sekolah terdaftar

💻 FITUR APLIKASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Upload data absensi dari mesin fingerprint
✅ Generate laporan analisis kedisiplinan
✅ Export ke PDF, Excel, dan gambar (JPG)
✅ Analisis kategori (Pimpinan, Guru, Tendik)
✅ Peringkat 10 besar karyawan
✅ Support multi-file dan custom jadwal kerja

❓ PERTANYAAN UMUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: Apa yang harus dilakukan jika lupa kode lisensi?
A: Hubungi tim support kami

Q: Berapa lama proses aktivasi?
A: Instan - hanya 2-3 menit setelah verifikasi OTP

Q: Apakah bisa digunakan di beberapa device?
A: Ya, gunakan email dan kode yang sama di device berbeda

Q: Bagaimana jika kode OTP tidak diterima?
A: Cek folder spam email, atau hubungi support

Q: Bagaimana jika lisensi mau habis?
A: Hubungi kami untuk perpanjangan sebelum tanggal expire

📞 HUBUNGI SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email  : support@mtsannur.sch.id
WhatsApp : [nomor WhatsApp]
Website : https://mtsannur.sch.id

Sukses aktivasi! 🎉

Salam,
Tim Sistem Rekap Absensi
MTs. An-Nur Bululawang

═══════════════════════════════════════════════════════════════
```

### Cara Kirim Email
- Copy template di atas
- Buka email client (Gmail, Outlook, dll)
- Buat email baru ke `admin@smatnb.sch.id`
- Paste template dan personalisasi
- **Subject:** Aktivasi Lisensi - Sistem Rekap Absensi
- Send!

---

## Admin: Perpanjang Lisensi Existing

### Skenario: Lisensi akan / sudah expired

**Pilihan 1: Update tanggal di Supabase (Recommended)**

Buka SQL Editor dan run:

```sql
-- Perpanjang lisensi yang sudah ada untuk 1 tahun lagi
UPDATE licenses 
SET expires_at = expires_at + INTERVAL '1 year'
WHERE license_key = 'PROD-2025-0001-A1B2';

-- Atau set ke tanggal spesifik
UPDATE licenses 
SET expires_at = '2027-12-12'::timestamp with time zone
WHERE license_key = 'PROD-2025-0001-A1B2';

-- Verify
SELECT license_key, school_name, expires_at FROM licenses 
WHERE license_key = 'PROD-2025-0001-A1B2';
```

**Pilihan 2: Kirim notifikasi ke customer**

Email template untuk notifikasi perpanjangan:

```
Assalamu'alaikum,

Lisensi Anda untuk Sistem Rekap Absensi akan segera expire:

Kode Lisensi: PROD-2025-0001-A1B2
Sekolah: SMA Nusa Tenggara Barat
Tanggal Expired: 12 Desember 2026

Hubungi kami untuk perpanjangan sebelum tanggal tersebut agar tidak ada gangguan layanan.

Harga perpanjangan sama dengan awal: Rp 2.000.000

Terima kasih,
Tim Rekap Absensi
```

---

## Customer: Aktivasi Aplikasi

### Alur dari Perspektif Customer

**Dengan Email:**
1. Terima email dari admin dengan data aktivasi
2. Buka link: https://attendance-recap.netlify.app
3. Input kode lisensi, nama sekolah, email
4. Klik "Kirim Kode OTP"
5. Cek email → copy kode 6-digit
6. Paste kode OTP ke aplikasi
7. Klik "Aktivasi"
8. ✅ Aplikasi unlock - bisa langsung gunakan!
9. Refresh halaman → tetap authenticated (token persisten)

**Durasi:** 3-5 menit (tergantung kecepatan cek email)

### Troubleshooting untuk Customer

| Problem | Solusi |
|---------|--------|
| **Email OTP tidak diterima** | Cek folder spam; tunggu 2 menit; klik "Kirim Ulang" |
| **Kode OTP sudah expired** | Klik "Kirim Ulang" untuk mendapat kode baru |
| **Salah input kode OTP** | Cek lagi email; retry dengan kode yang benar |
| **Lisensi tidak ditemukan** | Verifikasi kode lisensi di email (case-sensitive) |
| **Setelah aktivasi, reload kembali ke login** | Gunakan versi terbaru aplikasi (bug sudah fixed) |

---

## Verifikasi & Troubleshooting

### Checklist Setelah Insert ke Supabase

```
┌─────────────────────────────────────────────────────┐
│ CHECKLIST: Verifikasi License Insert                │
├─────────────────────────────────────────────────────┤
│ [ ] License key tidak duplicate (UNIQUE constraint) │
│ [ ] School name sesuai permintaan customer         │
│ [ ] Email benar dan valid format                    │
│ [ ] Status = 'pending' (akan jadi 'active' saat OTP verified) │
│ [ ] Tanggal expired sudah benar & reasonable        │
│ [ ] Email sudah dikirim ke customer                │
│ [ ] Customer aware kapan deadline aktivasi         │
│ [ ] Dokumentasi tercatat (spreadsheet/CRM)        │
└─────────────────────────────────────────────────────┘
```

### Tracking Penjualan (Spreadsheet)

Buat spreadsheet untuk track semua penjualan:

| Tanggal | License Key | Sekolah | Email | Status | Expires | Notes |
|---------|-------------|---------|-------|--------|---------|-------|
| 2025-12-12 | PROD-2025-0001-A1B2 | SMA NTB | admin@smatnb.sch.id | pending → active | 2026-12-12 | OK |
| 2025-12-13 | PROD-2025-0002-C3D4 | SMK BN | admin@smbbn.sch.id | pending | 2026-06-12 | Waiting activation |

### Query untuk Monitoring (Admin)

Buka SQL Editor dan run query berikut untuk monitoring:

**Lisensi yang akan expire dalam 30 hari:**
```sql
SELECT license_key, school_name, email, expires_at,
       EXTRACT(DAY FROM (expires_at - NOW())) as hari_remaining
FROM licenses
WHERE expires_at > NOW() 
  AND expires_at < NOW() + INTERVAL '30 days'
ORDER BY expires_at ASC;
```

**Lisensi yang sudah expired:**
```sql
SELECT license_key, school_name, email, expires_at
FROM licenses
WHERE expires_at < NOW()
ORDER BY expires_at DESC;
```

**Total aktivasi per bulan:**
```sql
SELECT 
  DATE_TRUNC('month', activated_at) as bulan,
  COUNT(*) as jumlah_aktivasi
FROM licenses
WHERE activated_at IS NOT NULL
GROUP BY DATE_TRUNC('month', activated_at)
ORDER BY bulan DESC;
```

---

## Summary Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ PENJUALAN LISENSI - FLOW CHART                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CUSTOMER CONTACT & NEGOSIASI                              │
│         ↓                                                    │
│  PEMBAYARAN DITERIMA                                       │
│         ↓                                                    │
│  ADMIN: GENERATE LICENSE KEY                               │
│         ↓                                                    │
│  ADMIN: INSERT KE SUPABASE                                │
│         ↓                                                    │
│  ADMIN: KIRIM EMAIL KE CUSTOMER                           │
│  (License Key + Instruksi Aktivasi)                       │
│         ↓                                                    │
│  CUSTOMER: BUKA APLIKASI                                  │
│         ↓                                                    │
│  CUSTOMER: INPUT LICENSE KEY + DATA                       │
│         ↓                                                    │
│  CUSTOMER: REQUEST OTP                                    │
│         ↓                                                    │
│  SISTEM: KIRIM OTP VIA EMAIL                              │
│         ↓                                                    │
│  CUSTOMER: INPUT OTP                                      │
│         ↓                                                    │
│  SISTEM: VERIFY OTP                                       │
│         ↓                                                    │
│  LICENSE STATUS: pending → active                         │
│         ↓                                                    │
│  ✅ CUSTOMER BISA GUNAKAN APLIKASI                         │
│         ↓                                                    │
│  ADMIN: TRACK & MONITOR LISENSI                           │
│  (Cek expiry, support, perpanjangan)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tips & Best Practices

1. **Backup License Keys** - Catat semua license key yang sudah diissue di spreadsheet
2. **Jangan Hardcode** - Jangan simpan license key di source code
3. **Komunikasi Jelas** - Kirim email yang detail agar customer tahu langkah aktivasi
4. **Monitor Expiry** - Set reminder untuk notify customer sebelum expired
5. **Support Responsif** - Siap membantu jika customer kesulitan aktivasi
6. **Audit Trail** - Track semua aktivasi untuk keperluan kontrol & audit
7. **Security** - Jangan share service role key atau JWT secret

---

**Sukses melakukan penjualan lisensi! 🚀**

Jika ada pertanyaan atau issue, lihat dokumentasi lain atau hubungi tim development.
