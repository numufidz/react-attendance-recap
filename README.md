# Sistem Rekap Absensi - Multi-Tenant Attendance Management

## 🔐 Sistem Lisensi & Aktivasi
Aplikasi ini dilengkapi dengan sistem lisensi berbasis OTP yang aman untuk kontrol akses multi-tenant dan tracking penggunaan per sekolah.

### ✅ Fitur Keamanan & Multi-Tenant
- **OTP Verification** - Kode OTP 6-digit yang dikirim via email (Resend API)
- **Dynamic School Branding** - Nama sekolah pembeli lisensi tampil di semua dokumen PDF & email
- **JWT Token** - Validasi token setiap startup dengan check ekspirasi
- **License Persistence** - Token persisten di localStorage dengan enkripsi base64
- **Rate Limiting** - Max 5 percobaan aktivasi per license key
- **Audit Trail** - Logging semua activation attempts

### 📱 Alur Aktivasi Lisensi
1. **Buka aplikasi** → Akan muncul layar aktivasi
2. **Masukkan License Key** → Format: XXXX-XXXX-XXXX-XXXX (contoh: `PROD-2025-0001-A1B2`)
3. **Isi data sekolah** → Nama sekolah dan email terdaftar
4. **Request OTP** → Klik "Kirim Kode OTP"
5. **Terima OTP** → Kode 6-digit dikirim ke email dalam 5 menit
6. **Verifikasi OTP** → Input kode OTP dan klik "Aktivasi"
7. **Aplikasi Unlock** → Token disimpan, bisa langsung gunakan aplikasi
8. **Reload aman** → Halaman di-reload tidak kembali ke aktivasi (token valid)

### 📖 Lihat Dokumentasi
- **Setup Awal** (30 menit): [`docs/QUICK_START.md`](docs/QUICK_START.md)
- **Setup Lengkap** (60 menit): [`docs/LICENSING_SETUP.md`](docs/LICENSING_SETUP.md)
- **Database Schema**: [`SETUP_SUPABASE.sql`](SETUP_SUPABASE.sql)
- **Workflow Penjualan**: [`docs/CUSTOMER_LICENSING_WORKFLOW.md`](docs/CUSTOMER_LICENSING_WORKFLOW.md)
- **Environment Variables**: [`.env.local.example`](.env.local.example)

### 🔧 Untuk Admin/Penjualan Lisensi
Lihat dokumentasi lengkap di [`docs/CUSTOMER_LICENSING_WORKFLOW.md`](docs/CUSTOMER_LICENSING_WORKFLOW.md) untuk:
- Cara membuat license key baru
- Insert ke Supabase
- Kirim ke customer
- Workflow penjualan end-to-end

## Deskripsi

Sistem profesional untuk evaluasi absensi karyawan berdasarkan data mesin fingerprint dan jadwal kerja. Menyediakan analisis kedisiplinan, rekap mentah, dan peringkat performa secara akurat dan efisien.

## Fitur Utama

### 1. **Upload Data Absensi**
- Upload file excel yang diunduh dari [fingerspot.io](https://fingerspot.io/) atau mesin absensi Fingerspot
- Deteksi otomatis periode dari nama file
- Validasi format file (.xlsx, .xls)

### 2. **Upload Jadwal Kerja**
- Upload file jadwal kerja karyawan
- Template format tersedia untuk diunduh
- Mendukung kategori: Pimpinan, Guru, dan Tendik

### 3. **Analisis Komprehensif**
- **Profil Absensi**: Kesimpulan keseluruhan dengan analisis vertikal responsif (Analisis Kehadiran, Kesadaran Absensi, Kedisiplinan Waktu, Rekomendasi)
- **Evaluasi Kategori**: Analisis per kategori karyawan (Pimpinan, Guru, Tendik)
- **Peringkat Karyawan**: Top 10 dengan kolom Hari Kerja untuk konteks lebih detail
  - Top 10 Disiplin Waktu (Datang Sebelum Jadwal)
  - Top 10 Tertib Administrasi (Scan Masuk & Pulang Lengkap)
  - Top 10 Rendah Kesadaran Absensi (Alfa/Tidak Scan)

### 4. **Tabel Rekap Detail**
- **Rekap Mesin**: Data mentah dari mesin absensi
- **Kedisiplinan Waktu**: Analisis ketepatan waktu masuk
- **Evaluasi Kehadiran**: Status kehadiran berdasarkan jadwal

### 5. **Export Data**
- Download PDF laporan lengkap
- Download Excel (3 tabel sekaligus)
- Copy-paste tabel ke Excel
- Download/Copy gambar kesimpulan (JPG/PNG)

## Cara Penggunaan

1. **Upload Laporan Absensi**
   - Klik area "Laporan Absensi"
   - Pilih file excel dari Fingerspot
   - Format nama file: `attendance_report_detail_YYYY-MM-DD_YYYY-MM-DD.xlsx`

2. **Upload Jadwal Kerja** (opsional)
   - Klik area "Jadwal Kerja"
   - Download template jika belum punya
   - Upload file jadwal yang sudah diisi

3. **Pilih Periode**
   - Tanggal awal dan akhir akan terdeteksi otomatis dari nama file
   - Atau atur manual sesuai kebutuhan

4. **Generate Rekap**
   - Klik "Tabel Rekap" untuk membuat analisis
   - Lihat hasil di berbagai tab yang tersedia

5. **Download/Export**
   - Klik tombol di pojok kanan atas setiap tab
   - Format tersedia: PDF, Excel, JPG
   - Responsive: Tombol otomatis atur posisi untuk mobile & desktop

## Format Template Jadwal Kerja

Template jadwal kerja tersedia di folder `public/template_jadwal_kerja.xlsx` atau dapat diunduh langsung dari aplikasi.

### Struktur Template:
- **Kolom A**: NIK/ID Karyawan
- **Kolom C**: Nama Depan
- **Kolom D-Q**: Jadwal per hari (Sabtu-Jumat)
  - Format waktu: HH:MM (contoh: 07:00)
  - OFF: Hari libur
  - L: Libur
- **Kolom R**: Kategori Pimpinan (isi "Pimpinan" jika ya)
- **Kolom S**: Kategori Guru (isi "Guru" jika ya)
- **Kolom T**: Kategori Tendik (isi "Tendik" jika ya)

## Teknologi yang Digunakan

- **React**: Framework UI
- **XLSX**: Parsing dan export Excel
- **jsPDF**: Generate PDF
- **html2canvas**: Capture screenshot
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling

## Instalasi

```bash
# Clone repository
git clone https://github.com/numufidz/react-attendance-recap.git

# Masuk ke direktori
cd react-attendance-recap

# Install dependencies
npm install

# Generate template jadwal kerja
node generate_template.js

# Jalankan aplikasi
npm start
```

## Build untuk Production

```bash
npm run build
```

## Deploy ke Netlify

1. Build aplikasi: `npm run build`
2. Upload folder `build` ke Netlify
3. Atau gunakan Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

## Predikat Kehadiran

| Persentase | Predikat | Warna |
|------------|----------|-------|
| ≥ 96% | UNGGUL | Hijau |
| 91-95% | BAIK SEKALI / ISTIMEWA | Biru |
| 86-90% | BAIK | Cyan |
| 81-85% | CUKUP | Kuning |
| 76-80% | BURUK | Orange |
| < 76% | BURUK SEKALI | Merah |

## Kategori Evaluasi Karyawan

### Evaluasi Kehadiran
- **Istimewa**: ≥ 91%
- **Baik**: 81-90%
- **Cukup**: 71-80%
- **Kurang**: < 71%

### Evaluasi Kedisiplinan
- **Istimewa**: ≥ 91%
- **Baik**: 81-90%
- **Cukup**: 71-80%
- **Kurang**: < 71%

## Kode Warna Tabel

- 🟢 **Hijau**: Hadir tepat waktu
- 🟡 **Kuning**: Hadir terlambat
- 🔵 **Biru**: Tertib administrasi (scan masuk & pulang)
- 🔴 **Merah**: Alfa/tidak hadir
- ⚪ **Putih**: Libur

## Kontributor

- **Developer**: Matsanuba Management Technology
- **Version**: 1.0 Netlify
- **Copyright**: © 2025

## Lisensi

Proyek ini adalah sistem attendance recap berbasis multi-tenant yang dapat digunakan untuk sekolah dan institusi pendidikan lainnya setelah mengaktifkan lisensi.

## Support

Untuk bantuan atau pertanyaan, hubungi administrator/pemilik lisensi Anda atau tim Matsanuba Management Technology.

---

**Powered by Matsanuba Management Technology**