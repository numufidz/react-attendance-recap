# AGENT

File ini berisi catatan dan instruksi khusus untuk Agen AI yang bekerja pada proyek ini.

# Sistem Rekap Absensi - MTs. An-Nur Bululawang

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
- **Profil Absensi**: Kesimpulan keseluruhan dengan predikat (Unggul, Baik Sekali, Baik, Cukup, Buruk)
- **Evaluasi Kategori**: Analisis per kategori karyawan (Pimpinan, Guru, Tendik)
- **Peringkat Karyawan**: 
  - Top 10 Disiplin Waktu
  - Top 10 Tertib Administrasi
  - Top 10 Rendah Kesadaran Absensi

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
   - Pilih format yang diinginkan (PDF, Excel, JPG)
   - Gunakan tombol Copy untuk copy ke clipboard

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

Proyek ini dikembangkan untuk MTs. An-Nur Bululawang.

## Support

Untuk bantuan atau pertanyaan, hubungi tim Matsanuba Management Technology.

---

**Powered by Matsanuba Management Technology**

