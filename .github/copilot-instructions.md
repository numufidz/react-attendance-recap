# Instruksi Copilot - Sistem Rekap Absensi React

## Gambaran Proyek
Sistem analisis absensi berbasis React untuk MTs. An-Nur Bululawang yang memproses data mesin fingerprint karyawan dan menghasilkan laporan absensi komprehensif. Aplikasi menangani parsing file Excel, transformasi data kompleks, dan export multi-format (PDF, Excel, JPG).

## Arsitektur

### Pola Single-File Monolith
- **`src/App.js`** (5317 baris): Mengandung seluruh logika aplikasi - component, state management, pemrosesan data, dan generasi PDF/Excel
- **`src/index.js`**: Entry point React
- **`src/style.css`**: Styling berbasis Tailwind
- **`generate_template.js`**: Script Node untuk membuat file template jadwal kerja Excel

Ini adalah proyek demo Stackblitz dengan struktur single-file yang disengaja. Pertahankan pendekatan monolitik saat memperluas.

### Alur Data Utama

1. **Upload File Absensi** (`processAttendanceFile`)
   - Menerima Excel dari [fingerspot.io](https://fingerspot.io/)
   - Ekstrak tanggal periode dari pola nama file: `attendance_report_detail_YYYY-MM-DD_YYYY-MM-DD.xlsx`
   - Parse data karyawan dengan waktu check-in/check-out
   - Data disimpan di state `attendanceData`

2. **Upload File Jadwal** (`processScheduleFile`)
   - Template jadwal kustom dengan dua baris header
   - Kolom: NIK, Nama, Jadwal Sabtu-Jumat (mulai/pulang), Flag Kategori (Pimpinan/Guru/Tendik)
   - Data disimpan di state `scheduleData`
   - Opsional - sistem default ke 07:00-15:00 jika tidak disediakan

3. **Generasi Rekap** (`generateRecapTables`)
   - Menggabungkan data absensi + jadwal
   - Memanggil `calculateRankings()` dan `calculateCategoryEvaluation()`
   - Menghasilkan tiga tabel utama: Data Mesin Mentah, Kedisiplinan Waktu, Evaluasi Kehadiran
   - Hasil disimpan di state `recapData`, `rankingData`, `categoryEvaluation`

4. **Pipeline Export**
   - **PDF**: Menggunakan jsPDF + autoTable untuk tabel terstruktur
   - **Excel**: Menggunakan library XLSX untuk menulis multiple sheets
   - **JPG/PNG**: Menggunakan html2canvas untuk capture elemen React sebagai gambar

### Manajemen State
```javascript
// State data inti
const [attendanceData, setAttendanceData] = useState([]);
const [scheduleData, setScheduleData] = useState([]);
const [recapData, setRecapData] = useState(null);
const [summaryData, setSummaryData] = useState(null);
const [rankingData, setRankingData] = useState(null);
const [categoryEvaluation, setCategoryEvaluation] = useState(null);

// State UI
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [activeRecapTab, setActiveRecapTab] = useState('summary');
const [holidays, setHolidays] = useState([]); // didukung localStorage

// State loading & error
const [isLoadingAttendance/Schedule, setIsLoadingAttendance/Schedule] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
```

## Fungsi-Fungsi Kritis

### Pemrosesan Data
- **`normalizeId(raw)`**: Membersihkan ID karyawan dari format fingerspot (menangani separator "/")
- **`processAttendanceFile(file)`**: Parse Fingerspot Excel → data karyawan dengan waktu check-in/out
- **`processScheduleFile(file)`**: Parse template jadwal kustom → jam kerja per hari untuk setiap karyawan
- **`generateRecapTables()`**: Orkestrator utama - menggabungkan data dan memicu kalkulasi
- **`calculateRankings(recap, dateRange)`**: Menghasilkan daftar top-10 untuk disiplin waktu, ketepatan admin, kesadaran
- **`calculateCategoryEvaluation(recap, dateRange)`**: Mengagregasi metrik berdasarkan kategori (Pimpinan/Guru/Tendik)

### Fungsi Export
- **`handleDownloadSummaryJPG/RankingJPG/CategoryJPG`**: Capture elemen React berbasis ref melalui html2canvas
- **`downloadPDF/downloadExcel`**: Menggunakan jsPDF + XLSX untuk export terstruktur
- **`handleCopy[...]ToClipboard`**: Copy gambar ke clipboard menggunakan Clipboard API

### Fungsi Utilitas
- **`getPredicate(percentage)`**: Petakan persentase ke rating (Unggul/Baik Sekali/Baik/Cukup/Buruk)
- **`formatTime(val)`**: Konversi nilai waktu Excel (desimal/string) ke format HH:MM
- **`validateFile(file)`**: Cek tipe file (.xlsx/.xls) dan ukuran

## Pola Penting & Konvensi

### Deteksi Format File
- File absensi: `attendance_report_detail_2025-11-20_2025-12-05.xlsx` → tanggal auto-ekstrak via regex
- File jadwal: Struktur header 2-baris kustom dengan layout kolom spesifik
- Kedua format menggunakan XLSX.utils.sheet_to_json dengan `{ header: 1 }` untuk parsing array

### Penanganan ID Karyawan
```javascript
const normalizeId = (raw) => {
  const s = String(raw || '').trim();
  return s.includes('/') ? s.split('/')[0] : s;
};
// Fingerspot terkadang mengembalikan "123/456" → ekstrak "123"
```

### Konversi Format Waktu
- Input: Desimal Excel (0.35 = 08:24) atau string ("07:00") atau "-" (tidak ada)
- Output: "HH:MM" atau "-"
- Penting: Math.round() untuk waktu desimal untuk menghindari kehilangan presisi

### Pemetaan Predikat (Sistem Grade)
- **Unggul** (Sangat Baik): 90-100%
- **Baik Sekali** (Baik Sekali): 80-89%
- **Baik** (Baik): 70-79%
- **Cukup** (Cukup): 60-69%
- **Buruk** (Buruk): <60%

### Penanganan Hari Libur Khusus
- State `holidays` disimpan ke localStorage
- Digunakan dalam kalkulasi untuk mengurangi hari kerja yang diharapkan
- Dikelola melalui form UI (tambah/hapus input tanggal)

## Update Terbaru (Commit a7b2bac)

### Perubahan UI
1. **Layout Deskripsi Mobile-Friendly**: Mengubah layout kesimpulan dari 3-kolom grid (label : content) menjadi vertikal yang responsif
   - Mobile: Stack vertikal dengan label penuh lebar
   - Desktop: Tetap rapi dengan indentasi konten
   
2. **Tab Peringkat - Kolom Baru**: 
   - ❌ Hapus kolom ID dari ketiga tabel peringkat
   - ✅ Tambah kolom "Jumlah Hari Kerja" setelah kolom Jabatan
   - Struktur kolom: Peringkat | Nama | Jabatan | **Hari Kerja** | Total [Warna] | Persentase
   - Update di UI React, PDF export, dan Excel export

### Peningkatan UX
- Button layout responsif (mobile: di atas judul, desktop: pojok kanan)
- Button styling dengan color theming per tab (transparent, teal, amber, blue, green, purple)
- Deskripsi lebih mudah dibaca di mobile dengan pemisahan yang jelas per section

## Alur Pengembangan

### Menjalankan Secara Lokal
```bash
npm install                    # Install deps: react, xlsx, jspdf, html2canvas, lucide-react
npm start                      # Dev server di localhost:3000
node generate_template.js      # Membuat public/template_jadwal_kerja.xlsx
```

### Data Testing
- Gunakan format export Fingerspot (struktur kolom kritis)
- Periode testing default: 2025-11-20 sampai 2025-12-05
- Template tersedia di `/public/template_jadwal_kerja.xlsx`

### Debugging Umum
1. **Parsing file gagal**: Periksa nama sheet Excel dan indeks kolom (processAttendanceFile menggunakan indeks baris 0-9)
2. **Tanggal tidak terdeteksi**: Verifikasi nama file mengikuti pola `..._YYYY-MM-DD_YYYY-MM-DD.xlsx`
3. **Tabel rekap kosong**: Pastikan data absensi tumpang tindih dengan range tanggal yang dipilih
4. **Masalah penyelarasan PDF**: Lebar halaman jsPDF 595pt - sesuaikan posisi jika menambah bagian baru

## Dependensi Kunci
- **react** (18.1.0): Framework UI
- **xlsx** (0.18.5): Parsing & generasi Excel
- **jspdf** (3.0.4) + **jspdf-autotable** (5.0.2): Generasi PDF
- **html2canvas** (1.4.1): Capture elemen React → gambar
- **lucide-react** (0.554.0): Library icon
- **papaparse** (5.5.3): Parsing CSV (penggunaan minimal)
- **dompurify** (3.3.0): Sanitasi HTML (untuk teks PDF)

## Modifikasi Umum

### Menambah Format Export Baru
1. Buat fungsi handler (misal `handleDownloadCSV`)
2. Tambahkan ref jika capture elemen React (`React.useRef(null)`)
3. Gunakan library yang ada (XLSX untuk Excel, jsPDF untuk PDF, html2canvas untuk gambar)
4. Tambahkan tombol di bagian UI dengan onClick handler

### Menambah Metrik Kalkulasi
1. Modifikasi `calculateRankings` atau `calculateCategoryEvaluation`
2. Perpanjang state (misal `setSummaryData(prev => ({...prev, newMetric}))`)
3. Tambahkan bagian rendering dalam UI dengan pola ref/download yang sama
4. Update bagian generasi PDF jika menyertakan dalam laporan

### Mengubah Threshold Predikat/Grade
- Modifikasi logika fungsi `getPredicate()`
- Update nilai threshold (saat ini 90, 80, 70, 60)
- Sesuaikan warna UI terkait di bagian render jika diperlukan

## Referensi Eksternal
- Export absensi Fingerspot: [fingerspot.io](https://fingerspot.io/)
- Dokumentasi jsPDF untuk layout PDF: [github.com/parallax/jsPDF](https://github.com/parallax/jsPDF)
- Dokumentasi XLSX untuk operasi Excel: [SheetJS](https://sheetjs.com/)

## Language Rule (IMPORTANT)
Always respond in Indonesian for all explanations, comments, generated code descriptions, and chat responses. Do not use English unless the project file or code requires English keywords. Explanations, comments, and output text must always be in Bahasa Indonesia.