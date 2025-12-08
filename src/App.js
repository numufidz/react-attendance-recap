import React, { useState } from 'react';
import { Upload, Download, FileText, Loader, Trash2, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas'; // Install dulu: npm install html2canvas

const normalizeId = (raw) => {
  const s = String(raw || '').trim();
  const x = s.includes('/') ? s.split('/')[0] : s;
  return x;
};

const AttendanceRecapSystem = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [recapData, setRecapData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [categoryEvaluation, setCategoryEvaluation] = useState(null);
  const [startDate, setStartDate] = useState('2025-11-20');
  const [endDate, setEndDate] = useState('2025-12-05');
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeRecapTab, setActiveRecapTab] = useState('summary');
  // State untuk Hari Libur Khusus
  const [holidays, setHolidays] = useState(() => {
    const saved = localStorage.getItem('holidays');
    return saved ? JSON.parse(saved) : [];
  });
  const [newHoliday, setNewHoliday] = useState('');

  const panduanRef = React.useRef(null);

  // Ref untuk capture kesimpulan sebagai gambar
  const summaryRef = React.useRef(null);

  // Ref untuk capture peringkat sebagai gambar
  const rankingRef = React.useRef(null);

  // Ref untuk capture kategori sebagai gambar
  const categoryRef = React.useRef(null);

  // Download sebagai JPG
  const handleDownloadSummaryJPG = async () => {
    if (summaryRef.current) {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `kesimpulan-absensi-${summaryData.periode}.jpg`;
      link.click();
    }
  };

  // Copy gambar ke clipboard
  const handleCopySummary = async () => {
    if (summaryRef.current) {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          alert('Gambar kesimpulan berhasil disalin ke clipboard!');
        }
      });
    }
  };

  const handleDownloadPanduan = async () => {
    if (panduanRef.current) {
      const canvas = await html2canvas(panduanRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const image = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = 'panduan-rekap.jpg';
      link.click();
    }
  };

  // Handler untuk Peringkat
  const handleCopyRanking = async () => {
    if (rankingRef.current) {
      const canvas = await html2canvas(rankingRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          alert('Gambar peringkat berhasil disalin ke clipboard!');
        }
      });
    }
  };

  const handleDownloadRankingJPG = async () => {
    if (rankingRef.current) {
      const canvas = await html2canvas(rankingRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `peringkat-karyawan-${summaryData?.periode || 'rekap'}.jpg`;
      link.click();
    }
  };

  // Handler Kategori Evaluation
  const handleCopyCategory = async () => {
    if (categoryRef.current) {
      const canvas = await html2canvas(categoryRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          alert('Gambar evaluasi kategori berhasil disalin ke clipboard!');
        }
      });
    }
  };

  const handleDownloadCategoryJPG = async () => {
    if (categoryRef.current) {
      const canvas = await html2canvas(categoryRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `evaluasi-kategori-${summaryData?.periode || 'rekap'}.jpg`;
      link.click();
    }
  };

  const downloadCategoryAsPdf = () => {
    if (!categoryEvaluation || !summaryData) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 80;

    // Header
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('EVALUASI BERDASARKAN KATEGORI', 40, 25);
    doc.setFontSize(14);
    doc.text('MTs. AN-NUR BULULAWANG', 40, 40);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Periode: ${summaryData.periode}`, 40, 55);

    doc.setTextColor(0, 0, 0);

    // 1. KEHADIRAN
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('1. KEHADIRAN', 40, yPos);
    yPos += 15;

    const catWidth = (pageWidth - 100) / 3;
    const catX = [40, 40 + catWidth + 10, 40 + 2 * (catWidth + 10)];
    const categories = ['Pimpinan', 'Guru', 'Tendik'];

    categories.forEach((cat, idx) => {
      const data = categoryEvaluation[cat];

      // Kotak berwarna berbeda
      if (cat === 'Pimpinan') {
        doc.setFillColor(200, 230, 255); // Soft Blue
      } else if (cat === 'Guru') {
        doc.setFillColor(200, 255, 200); // Soft Green
      } else {
        doc.setFillColor(255, 255, 200); // Soft Yellow
      }
      doc.roundedRect(catX[idx], yPos, catWidth, 75, 5, 5, 'F');

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(cat, catX[idx] + 10, yPos + 15);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Jumlah: ${data.count} orang`, catX[idx] + 10, yPos + 28);

      // Persentase besar
      doc.setFontSize(26);
      doc.setFont(undefined, 'bold');
      const persenText = `${data.persenKehadiran}%`;
      const persenWidth = doc.getTextWidth(persenText);
      doc.text(persenText, catX[idx] + 10, yPos + 52);

      const predikat = getPredicate(data.persenKehadiran);

      // Badge Predikat
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      const predikatWidth = doc.getTextWidth(predikat);
      const badgeWidth = predikatWidth + 12;
      const badgeHeight = 16;
      const badgeX = catX[idx] + 10 + persenWidth + 8;
      const badgeY = yPos + 52 - 12;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'FD');

      doc.setTextColor(0, 0, 0);
      doc.text(predikat, badgeX + 6, badgeY + 11);

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`${data.totalHadir} dari ${data.totalHariKerja} hari`, catX[idx] + 10, yPos + 65);
    });

    yPos += 90;

    // 2. KEDISIPLINAN WAKTU
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('2. KEDISIPLINAN WAKTU', 40, yPos);
    yPos += 15;

    categories.forEach((cat, idx) => {
      const data = categoryEvaluation[cat];

      if (cat === 'Pimpinan') {
        doc.setFillColor(200, 230, 255);
      } else if (cat === 'Guru') {
        doc.setFillColor(200, 255, 200);
      } else {
        doc.setFillColor(255, 255, 200);
      }
      doc.roundedRect(catX[idx], yPos, catWidth, 75, 5, 5, 'F');

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(cat, catX[idx] + 10, yPos + 15);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Tepat Waktu', catX[idx] + 10, yPos + 28);

      doc.setFontSize(26);
      doc.setFont(undefined, 'bold');
      const persenText = `${data.persenTepat}%`;
      const persenWidth = doc.getTextWidth(persenText);
      doc.text(persenText, catX[idx] + 10, yPos + 52);

      const predikat = getPredicate(data.persenTepat);

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      const predikatWidth = doc.getTextWidth(predikat);
      const badgeWidth = predikatWidth + 12;
      const badgeHeight = 16;
      const badgeX = catX[idx] + 10 + persenWidth + 8;
      const badgeY = yPos + 52 - 12;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'FD');

      doc.setTextColor(0, 0, 0);
      doc.text(predikat, badgeX + 6, badgeY + 11);

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`${data.totalTepat} dari ${data.totalHadir} hari hadir`, catX[idx] + 10, yPos + 65);
    });

    yPos += 90;

    // REKOMENDASI Logic
    const generateRecommendation = (category, kehadiranPct, disiplinPct) => {
      const categoryName = category;
      let kehadiranRec = '';
      let disiplinRec = '';

      if (kehadiranPct >= 91) kehadiranRec = `Pertahankan kehadiran ${categoryName} yang sudah sangat baik`;
      else if (kehadiranPct >= 81) kehadiranRec = `Tingkatkan kehadiran ${categoryName} untuk mencapai kategori Istimewa`;
      else if (kehadiranPct >= 71) kehadiranRec = `Perbaiki kehadiran ${categoryName} dengan monitoring lebih ketat`;
      else kehadiranRec = `Evaluasi dan pembinaan intensif untuk ${categoryName} yang sering tidak hadir`;

      if (disiplinPct >= 91) disiplinRec = `kedisiplinan waktu sudah sangat baik`;
      else if (disiplinPct >= 81) disiplinRec = `tingkatkan ketepatan waktu`;
      else if (disiplinPct >= 71) disiplinRec = `perbaiki kedisiplinan dengan reminder rutin`;
      else disiplinRec = `terapkan sanksi tegas untuk keterlambatan`;

      return { kehadiranRec, disiplinRec };
    };

    const pimpinanRec = generateRecommendation('Pimpinan', categoryEvaluation.Pimpinan.persenKehadiran, categoryEvaluation.Pimpinan.persenTepat);
    const guruRec = generateRecommendation('Guru', categoryEvaluation.Guru.persenKehadiran, categoryEvaluation.Guru.persenTepat);
    const tendikRec = generateRecommendation('Tendik', categoryEvaluation.Tendik.persenKehadiran, categoryEvaluation.Tendik.persenTepat);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(2);
    // Adjust height for content
    doc.roundedRect(40, yPos, pageWidth - 80, 165, 5, 5, 'FD');

    // Header Rekomendasi
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(40, yPos, pageWidth - 80, 25, 5, 5, 'F');
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('REKOMENDASI', 50, yPos + 17);

    doc.setTextColor(0, 0, 0);
    const leftColX = 50;
    const rightColX = (pageWidth / 2) + 20;
    const colWidth = (pageWidth / 2) - 60;

    let recLeftY = yPos + 45;
    let recRightY = yPos + 45;

    // LEFT COL
    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(59, 130, 246);
    doc.text('1. Pimpinan:', leftColX, recLeftY);
    doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal'); doc.setFontSize(9);
    recLeftY += 12;
    const pText = doc.splitTextToSize(`${pimpinanRec.kehadiranRec}, ${pimpinanRec.disiplinRec}.`, colWidth);
    doc.text(pText, leftColX + 5, recLeftY);
    recLeftY += pText.length * 11 + 10;

    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(34, 197, 94);
    doc.text('2. Guru:', leftColX, recLeftY);
    doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal'); doc.setFontSize(9);
    recLeftY += 12;
    const gText = doc.splitTextToSize(`${guruRec.kehadiranRec}, ${guruRec.disiplinRec}.`, colWidth);
    doc.text(gText, leftColX + 5, recLeftY);
    recLeftY += gText.length * 11 + 10;

    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(251, 191, 36);
    doc.text('3. Tendik:', leftColX, recLeftY);
    doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal'); doc.setFontSize(9);
    recLeftY += 12;
    const tText = doc.splitTextToSize(`${tendikRec.kehadiranRec}, ${tendikRec.disiplinRec}.`, colWidth);
    doc.text(tText, leftColX + 5, recLeftY);

    // RIGHT COL
    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
    doc.text('Tindakan Umum:', rightColX, recRightY);
    doc.setFont(undefined, 'normal'); doc.setFontSize(9);
    recRightY += 15;
    const act1 = doc.splitTextToSize('• Tingkatkan pemantauan waktu kedatangan normal', colWidth);
    doc.text(act1, rightColX + 5, recRightY);
    recRightY += act1.length * 11 + 8;
    const act2 = doc.splitTextToSize('• Adakan pembinaan manajemen waktu', colWidth);
    doc.text(act2, rightColX + 5, recRightY);
    recRightY += act2.length * 11 + 8;
    const act3 = doc.splitTextToSize('• Reward & Punishment', colWidth);
    doc.text(act3, rightColX + 5, recRightY);

    doc.save(`evaluasi-kategori-${summaryData.periode}.pdf`);
  };

  // Handler Hari Libur
  const addHoliday = () => {
    if (!newHoliday) return;
    if (holidays.includes(newHoliday)) {
      alert('Tanggal libur ini sudah ada!');
      return;
    }
    const updatedHolidays = [...holidays, newHoliday].sort();
    setHolidays(updatedHolidays);
    localStorage.setItem('holidays', JSON.stringify(updatedHolidays));
    setNewHoliday('');
  };

  const removeHoliday = (dateToRemove) => {
    const updatedHolidays = holidays.filter((date) => date !== dateToRemove);
    setHolidays(updatedHolidays);
    localStorage.setItem('holidays', JSON.stringify(updatedHolidays));
  };

  const downloadRankingAsPdf = async () => {
    if (!rankingData || !summaryData) return;

    const doc = new jsPDF('l', 'pt', 'a4'); // Landscape
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 50;

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('PERINGKAT KARYAWAN', 40, yPos);
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`MTs. An-Nur Bululawang`, 40, yPos + 25);
    doc.setFontSize(10);
    doc.text(`Periode: ${summaryData.periode}`, 40, yPos + 40);

    yPos = 100;

    // Tabel 1: Disiplin Waktu
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('1. Peringkat Disiplin Waktu Tertinggi', 40, yPos);
    yPos += 10;

    const disiplinData = rankingData.topDisiplin.map((emp, idx) => [
      idx + 1,
      emp.id,
      emp.name,
      emp.position,
      emp.hijau,
      `${emp.persenHijau}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'ID', 'Nama', 'Jabatan', 'Total Hijau', '%']],
      body: disiplinData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 40, right: 40 },
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // Tabel 2: Tertib Administrasi
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('2. Peringkat Tertib Administrasi', 40, yPos);
    yPos += 10;

    const tertibData = rankingData.topTertib.map((emp, idx) => [
      idx + 1,
      emp.id,
      emp.name,
      emp.position,
      emp.biru,
      `${emp.persenBiru}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'ID', 'Nama', 'Jabatan', 'Total Biru', '%']],
      body: tertibData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 40, right: 40 },
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // Tabel 3: Rendah Kesadaran
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('3. Peringkat Rendah Kesadaran Absensi', 40, yPos);
    yPos += 10;

    const rendahData = rankingData.topRendah.map((emp, idx) => [
      idx + 1,
      emp.id,
      emp.name,
      emp.position,
      emp.merah,
      `${emp.persenMerah}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'ID', 'Nama', 'Jabatan', 'Total Merah', '%']],
      body: rendahData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 40, right: 40 },
    });

    doc.save(`peringkat-karyawan-${summaryData.periode}.pdf`);
  };

  const handleCopyPanduan = async () => {
    if (panduanRef.current) {
      const canvas = await html2canvas(panduanRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          alert('Gambar berhasil disalin ke clipboard!');
        }
      });
    }
  };

  const validateFile = (file) => {
    if (!file) return false;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setErrorMessage('File harus berformat .xlsx atau .xls');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const processAttendanceFile = (file) => {
    if (!validateFile(file)) return;
    setIsLoadingAttendance(true);

    // Extract tanggal dari nama file
    // Format: attendance_report_detail_2025-11-01_2025-11-22.xlsx
    const fileName = file.name;
    const datePattern = /(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/;
    const match = fileName.match(datePattern);

    if (match) {
      const extractedStartDate = match[1]; // 2025-11-01
      const extractedEndDate = match[2]; // 2025-11-22

      // Set tanggal otomatis
      setStartDate(extractedStartDate);
      setEndDate(extractedEndDate);

      console.log(
        '✅ Periode terdeteksi dari nama file:',
        extractedStartDate,
        'sampai',
        extractedEndDate
      );

      // Tampilkan notifikasi
      setTimeout(() => {
        alert(
          `📅 Periode terdeteksi otomatis dari nama file:\n\nDari: ${extractedStartDate}\nSampai: ${extractedEndDate}\n\n✅ Tanggal sudah diset otomatis!`
        );
      }, 1000);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const formatTime = (val) => {
          if (!val || val === '-' || val === '') return '-';
          if (typeof val === 'string') {
            if (val.includes(':')) {
              const parts = val.split(':');
              if (parts.length >= 2) {
                const hours = parts[0].padStart(2, '0');
                const minutes = parts[1].padStart(2, '0');
                return hours + ':' + minutes;
              }
            }
            if (val === '-') return '-';
          }
          if (typeof val === 'number') {
            if (val < 0 || val > 1) return '-';
            const totalMinutes = Math.round(val * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return (
              String(hours).padStart(2, '0') +
              ':' +
              String(minutes).padStart(2, '0')
            );
          }
          return String(val);
        };

        const attendance = [];
        let currentEmployee = null;

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];

          if (row[0] === 'Nama Karyawan' && row[1]) {
            if (currentEmployee && currentEmployee.records.length > 0) {
              attendance.push(currentEmployee);
            }

            currentEmployee = {
              name: row[1] || '',
              id: '',
              position: 'Guru', // default sementara
              records: [],
            };

            // Ambil jabatan dari kolom J pada 3 baris berikutnya
            for (let j = 0; j < 4; j++) {
              if (
                i + j < jsonData.length &&
                jsonData[i + j][9] &&
                typeof jsonData[i + j][9] === 'string'
              ) {
                const val = jsonData[i + j][9].trim();
                if (val && val !== 'MTs. An-Nur Bululawang' && val !== '') {
                  currentEmployee.position = val;
                  break;
                }
              }
            }

            if (i + 1 < jsonData.length && jsonData[i + 1][0] === 'ID/NIK') {
              const idCell = jsonData[i + 1][1] || '';
              currentEmployee.id = normalizeId(idCell);
            }

            if (i + 2 < jsonData.length && jsonData[i + 2][0] === 'Jabatan') {
              // Versi paling aman – cari nilai di kolom setelah "Jabatan"
              let jabatan = '';
              if (row[8] === 'Jabatan' && row[9]) {
                jabatan = row[9];
              } else if (
                (row[9] &&
                  typeof row[9] === 'string' &&
                  row[9].includes('amad')) ||
                row[9].includes('uru')
              ) {
                // fallback langsung ambil kolom J
                jabatan = row[9];
              }
              currentEmployee.position = jabatan.trim();
            }
          }

          if (currentEmployee && row[0]) {
            const cellValue = String(row[0]);
            const dateMatch = cellValue.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
              currentEmployee.records.push({
                date: dateMatch[3],
                month: dateMatch[2],
                year: dateMatch[1],
                checkIn: formatTime(row[4]),
                checkOut: formatTime(row[5]),
              });
            }
          }

          if (row[0] === 'TOTAL' && currentEmployee) {
            if (currentEmployee.records.length > 0) {
              attendance.push(currentEmployee);
            }
            currentEmployee = null;
          }
        }

        if (currentEmployee && currentEmployee.records.length > 0) {
          attendance.push(currentEmployee);
        }

        if (attendance.length === 0) {
          throw new Error('Tidak ada data karyawan yang valid ditemukan');
        }

        console.log(
          '✅ Data absensi berhasil dimuat:',
          attendance.length,
          'karyawan'
        );
        setAttendanceData(attendance);
      } catch (error) {
        console.error('Error membaca file absensi:', error);
        setErrorMessage('Gagal membaca file absensi: ' + error.message);
      } finally {
        setIsLoadingAttendance(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processScheduleFile = (file) => {
    if (!validateFile(file)) return;
    setIsLoadingSchedule(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(
          '📊 Raw data jadwal (5 baris pertama):',
          jsonData.slice(0, 5)
        );

        const formatTime = (val) => {
          if (!val || val === 'OFF' || val === 'L' || val === '-') return val;
          if (typeof val === 'string' && val.includes(':')) return val;
          if (typeof val === 'number' && val < 1) {
            const totalMinutes = Math.round(val * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return (
              String(hours).padStart(2, '0') +
              ':' +
              String(minutes).padStart(2, '0')
            );
          }
          return String(val);
        };

        // Header ada di baris 1-2, data mulai dari baris 3 (index 2)
        const schedules = jsonData
          .slice(2) // Skip 2 baris header
          .filter((row) => row[0] && row[0] !== '') // ID harus ada
          .map((row) => {
            // Membaca kategori dari kolom R, S, T
            const categories = [];
            const colR = String(row[17] || '').trim().toLowerCase(); // Pimpinan
            const colS = String(row[18] || '').trim().toLowerCase(); // Guru
            const colT = String(row[19] || '').trim().toLowerCase(); // Tendik

            if (colR.includes('pimpinan')) categories.push('Pimpinan');
            if (colS.includes('guru')) categories.push('Guru');
            if (colT.includes('tendik') || colT.includes('kependidikan')) categories.push('Tendik');

            // Jika tidak ada kategori sama sekali, default ke Tendik
            if (categories.length === 0) categories.push('Tendik');

            return {
              id: String(row[0] || '').trim(),
              name: row[2] || '', // Kolom C = NAMA DEPAN
              categories: categories, // Array kategori
              schedule: {
                sabtu: { start: formatTime(row[3]) }, // Kolom D = SABTU Mulai
                minggu: { start: formatTime(row[5]) }, // Kolom F = AHAD Mulai
                senin: { start: formatTime(row[7]) }, // Kolom H = SENIN Mulai
                selasa: { start: formatTime(row[9]) }, // Kolom J = SELASA Mulai
                rabu: { start: formatTime(row[11]) }, // Kolom L = RABU Mulai
                kamis: { start: formatTime(row[13]) }, // Kolom N = KAMIS Mulai
                jumat: 'L', // JUMAT = Libur
              },
            };
          });

        if (schedules.length === 0) {
          throw new Error('Tidak ada data jadwal yang valid ditemukan');
        }

        console.log(
          '✅ Data jadwal berhasil dimuat:',
          schedules.length,
          'karyawan'
        );
        console.log('📋 Sample jadwal pertama:', schedules[0]);
        setScheduleData(schedules);
      } catch (error) {
        console.error('Error membaca file jadwal:', error);
        setErrorMessage('Gagal membaca file jadwal: ' + error.message);
      } finally {
        setIsLoadingSchedule(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getDateLabel = (date) => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Ags',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const d = new Date(date);
    return d.getDate() + ' ' + months[d.getMonth()];
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    const days = [
      'minggu',
      'senin',
      'selasa',
      'rabu',
      'kamis',
      'jumat',
      'sabtu',
    ];
    return days[date.getDay()];
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === '-' || timeStr === 'OFF' || timeStr === 'L')
      return null;
    const timeString = String(timeStr).trim();
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return null;
  };

  const evaluateAttendance = (checkIn, schedule) => {
    if (schedule === 'L' || schedule === 'OFF') {
      return { status: 'L', color: 'FFFFFF', text: 'L' };
    }
    if (schedule === '-') {
      if (checkIn !== '-') {
        return { status: 'H', color: '90EE90', text: 'H' };
      } else {
        return { status: 'A', color: 'FFB3B3', text: '-' };
      }
    }
    if (checkIn === '-') {
      return { status: 'A', color: 'FFB3B3', text: '-' };
    }
    const checkInMin = timeToMinutes(checkIn);
    const schedMin = timeToMinutes(schedule);
    if (checkInMin === null || schedMin === null) {
      return { status: 'H', color: 'FFFF99', text: 'H' };
    }
    if (checkInMin <= schedMin) {
      return { status: 'H', color: '90EE90', text: 'H' };
    } else {
      return { status: 'T', color: 'FFFF99', text: 'H' };
    }
  };

  const getDateRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    return dates;
  };

  const generateRecapTables = () => {
    if (attendanceData.length === 0) {
      alert('Silakan upload file laporan absensi');
      return;
    }

    try {
      const dateRange = getDateRange();
      const recap = attendanceData.map((emp, index) => {
        const schedRecord = scheduleData.find((s) => s.id === emp.id);
        const dailyRecords = {};
        const dailyEvaluation = {};

        dateRange.forEach((dateStr) => {
          const [year, month, day] = dateStr.split('-');
          const dayStr = day.padStart(2, '0');
          const record = emp.records.find((r) => {
            const recordDay = r.date.padStart(2, '0');
            return recordDay === dayStr && r.month === month && r.year === year;
          });

          dailyRecords[dateStr] = {
            in: record?.checkIn || '-',
            out: record?.checkOut || '-',
          };

          if (holidays.includes(dateStr)) {
            // Priority 1: Cek Hari Libur Khusus (Manual)
            dailyEvaluation[dateStr] = {
              status: 'L',
              color: 'FFFFFF',
              text: 'L',
            };
          } else if (schedRecord) {
            const dayName = getDayName(dateStr);
            const scheduleStart = schedRecord.schedule[dayName]?.start || 'L';
            dailyEvaluation[dateStr] = evaluateAttendance(
              dailyRecords[dateStr].in,
              scheduleStart
            );
          } else {
            const hasIn = dailyRecords[dateStr].in !== '-';
            dailyEvaluation[dateStr] = {
              status: hasIn ? 'H' : 'A',
              color: hasIn ? 'ADD8E6' : 'FFB3B3',
              text: hasIn ? 'H' : '-',
            };
          }
        });

        return {
          no: index + 1,
          id: emp.id,
          name: emp.name,
          position: emp.position,
          dailyRecords,
          dailyEvaluation,
        };
      });
      recap.sort((a, b) => String(a.id).localeCompare(String(b.id)));
      recap.forEach((emp, idx) => {
        emp.no = idx + 1;
      });

      const newRecapData = { recap, dateRange };
      setRecapData(newRecapData);

      // Automatically generate summary and ranking
      let totalHariKerja = 0;
      let totalHadir = 0;
      let totalTepat = 0;
      let totalTelat = 0;
      let totalAlfa = 0;

      recap.forEach((emp) => {
        dateRange.forEach((dateStr) => {
          const ev = emp.dailyEvaluation[dateStr];
          if (ev.text !== 'L') {
            totalHariKerja++;
            if (ev.text === 'H') {
              totalHadir++;
              if (ev.color === '90EE90') totalTepat++;
              else if (ev.color === 'FFFF99') totalTelat++;
            } else if (ev.text === '-') {
              totalAlfa++;
            }
          }
        });
      });

      const persentaseKehadiran =
        totalHariKerja > 0 ? Math.round((totalHadir / totalHariKerja) * 100) : 0;
      const persentaseTepat =
        totalHariKerja > 0 ? Math.round((totalTepat / totalHariKerja) * 100) : 0;
      const persentaseTelat =
        totalHariKerja > 0 ? Math.round((totalTelat / totalHariKerja) * 100) : 0;
      const persentaseAlfa =
        totalHariKerja > 0 ? Math.round((totalAlfa / totalHariKerja) * 100) : 0;

      let predikat = '';
      let warna = '';
      let icon = '';

      if (persentaseKehadiran >= 96) {
        predikat = 'UNGGUL';
        warna = 'from-green-500 to-emerald-600';
        icon = '🏆';
      } else if (persentaseKehadiran >= 91) {
        predikat = 'BAIK SEKALI / ISTIMEWA';
        warna = 'from-blue-500 to-indigo-600';
        icon = '⭐';
      } else if (persentaseKehadiran >= 86) {
        predikat = 'BAIK';
        warna = 'from-cyan-500 to-blue-600';
        icon = '👍';
      } else if (persentaseKehadiran >= 81) {
        predikat = 'CUKUP';
        warna = 'from-yellow-500 to-orange-600';
        icon = '⚠️';
      } else if (persentaseKehadiran >= 76) {
        predikat = 'BURUK';
        warna = 'from-orange-500 to-red-600';
        icon = '⚡';
      } else {
        predikat = 'BURUK SEKALI';
        warna = 'from-red-500 to-red-700';
        icon = '🚨';
      }

      const startD = new Date(startDate);
      const endD = new Date(endDate);
      const periode = `${startD.toLocaleDateString(
        'id-ID'
      )} - ${endD.toLocaleDateString('id-ID')}`;

      setSummaryData({
        predikat,
        warna,
        icon,
        persentaseKehadiran,
        totalKaryawan: recap.length,
        totalHariKerja,
        totalHadir,
        persentaseTepat,
        totalTepat,
        persentaseTelat,
        totalTelat,
        persentaseAlfa,
        totalAlfa,
        periode,
      });

      // Calculate ranking with the new data
      const rankings = calculateRankings(recap, dateRange);
      setRankingData(rankings);

      // Calculate category evaluation
      const catEval = calculateCategoryEvaluation(recap, dateRange);
      setCategoryEvaluation(catEval);

    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const calculateRankings = (recap, dateRange) => {
    if (!recap || !dateRange) return null;

    const employeeStats = recap.map((emp) => {
      const sched = scheduleData.find((s) => s.id === emp.id);
      let hariKerja = 0;
      let hijau = 0; // Disiplin waktu
      let biru = 0; // Tertib administrasi
      let merah = 0; // Alfa

      dateRange.forEach((dateStr) => {
        const ev = emp.dailyEvaluation[dateStr];
        if (ev.text !== 'L') {
          hariKerja++;
          const rec = emp.dailyRecords[dateStr];
          const hasIn = rec.in !== '-';
          const hasOut = rec.out !== '-';

          // Hitung untuk Tabel 2: Kedisiplinan Waktu
          if (!hasIn && !hasOut) {
            merah++;
          } else if (hasIn && hasOut) {
            biru++;
          } else if (hasIn) {
            const dayName = getDayName(dateStr);
            const schedStart = sched?.schedule[dayName]?.start;
            const inMin = timeToMinutes(rec.in);
            const schedMin = timeToMinutes(schedStart);
            if (schedMin && inMin && inMin <= schedMin) {
              hijau++;
            }
          }
        }
      });

      return {
        id: emp.id,
        name: emp.name,
        position: emp.position,
        hariKerja,
        hijau,
        biru,
        merah,
        persenHijau: hariKerja > 0 ? Math.round((hijau / hariKerja) * 100) : 0,
        persenBiru: hariKerja > 0 ? Math.round((biru / hariKerja) * 100) : 0,
        persenMerah: hariKerja > 0 ? Math.round((merah / hariKerja) * 100) : 0,
      };
    });

    // Top 10 Disiplin Waktu (Hijau persen tertinggi)
    const topDisiplin = [...employeeStats]
      .sort((a, b) => b.persenHijau - a.persenHijau || b.hijau - a.hijau)
      .slice(0, 10);

    // Top 10 Tertib Administrasi (Biru persen tertinggi)
    const topTertib = [...employeeStats]
      .sort((a, b) => b.persenBiru - a.persenBiru || b.biru - a.biru)
      .slice(0, 10);

    // Top 10 Rendah Kesadaran (Merah persen tertinggi)
    const topRendah = [...employeeStats]
      .sort((a, b) => b.persenMerah - a.persenMerah || b.merah - a.merah)
      .slice(0, 10);

    return { topDisiplin, topTertib, topRendah };
  };

  const calculateCategoryEvaluation = (recap, dateRange) => {
    if (!recap || !dateRange || !scheduleData) return null;

    const categories = {
      Pimpinan: { totalHariKerja: 0, totalHadir: 0, totalTepat: 0, count: 0 },
      Guru: { totalHariKerja: 0, totalHadir: 0, totalTepat: 0, count: 0 },
      Tendik: { totalHariKerja: 0, totalHadir: 0, totalTepat: 0, count: 0 },
    };

    recap.forEach((emp) => {
      const sched = scheduleData.find((s) => s.id === emp.id);
      if (!sched) return;

      const empCats = sched.categories || [];

      empCats.forEach(category => {
        if (categories[category]) {
          categories[category].count++;

          dateRange.forEach((dateStr) => {
            const ev = emp.dailyEvaluation[dateStr];
            if (ev.text !== 'L') {
              categories[category].totalHariKerja++;
              if (ev.text === 'H') {
                categories[category].totalHadir++;
                if (ev.color === '90EE90') {
                  categories[category].totalTepat++;
                }
              }
            }
          });
        }
      });
    });

    // Hitung persentase
    const result = {};
    Object.keys(categories).forEach((cat) => {
      const data = categories[cat];
      result[cat] = {
        count: data.count,
        totalHariKerja: data.totalHariKerja,
        totalHadir: data.totalHadir,
        totalTepat: data.totalTepat,
        persenKehadiran: data.totalHariKerja > 0
          ? Math.round((data.totalHadir / data.totalHariKerja) * 100)
          : 0,
        persenTepat: data.totalHadir > 0
          ? Math.round((data.totalTepat / data.totalHadir) * 100)
          : 0,
      };
    });

    return result;
  };

  const getPredicate = (pct) => {
    if (pct >= 91) return 'Istimewa';
    if (pct >= 81) return 'Baik';
    if (pct >= 71) return 'Cukup';
    return 'Kurang';
  };


  const generateSummary = () => {
    if (!recapData) {
      alert('Silakan generate tabel rekap terlebih dahulu');
      return;
    }

    let totalHariKerja = 0;
    let totalHadir = 0;
    let totalTepat = 0;
    let totalTelat = 0;
    let totalAlfa = 0;

    recapData.recap.forEach((emp) => {
      recapData.dateRange.forEach((dateStr) => {
        const ev = emp.dailyEvaluation[dateStr];
        if (ev.text !== 'L') {
          totalHariKerja++;
          if (ev.text === 'H') {
            totalHadir++;
            if (ev.color === '90EE90') totalTepat++;
            else if (ev.color === 'FFFF99') totalTelat++;
          } else if (ev.text === '-') {
            totalAlfa++;
          }
        }
      });
    });

    const persentaseKehadiran =
      totalHariKerja > 0 ? Math.round((totalHadir / totalHariKerja) * 100) : 0;
    const persentaseTepat =
      totalHariKerja > 0 ? Math.round((totalTepat / totalHariKerja) * 100) : 0;
    const persentaseTelat =
      totalHariKerja > 0 ? Math.round((totalTelat / totalHariKerja) * 100) : 0;
    const persentaseAlfa =
      totalHariKerja > 0 ? Math.round((totalAlfa / totalHariKerja) * 100) : 0;

    let predikat = '';
    let warna = '';
    let icon = '';

    if (persentaseKehadiran >= 96) {
      predikat = 'UNGGUL';
      warna = 'from-green-500 to-emerald-600';
      icon = '🏆';
    } else if (persentaseKehadiran >= 91) {
      predikat = 'BAIK SEKALI / ISTIMEWA';
      warna = 'from-blue-500 to-indigo-600';
      icon = '⭐';
    } else if (persentaseKehadiran >= 86) {
      predikat = 'BAIK';
      warna = 'from-cyan-500 to-blue-600';
      icon = '👍';
    } else if (persentaseKehadiran >= 81) {
      predikat = 'CUKUP';
      warna = 'from-yellow-500 to-orange-600';
      icon = '⚠️';
    } else if (persentaseKehadiran >= 76) {
      predikat = 'BURUK';
      warna = 'from-orange-500 to-red-600';
      icon = '⚡';
    } else {
      predikat = 'BURUK SEKALI';
      warna = 'from-red-500 to-red-700';
      icon = '🚨';
    }

    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const periode = `${startD.toLocaleDateString(
      'id-ID'
    )} - ${endD.toLocaleDateString('id-ID')}`;

    setSummaryData({
      predikat,
      warna,
      icon,
      persentaseKehadiran,
      totalKaryawan: recapData.recap.length,
      totalHariKerja,
      totalHadir,
      persentaseTepat,
      totalTepat,
      persentaseTelat,
      totalTelat,
      persentaseAlfa,
      totalAlfa,
      periode,
    });

    // Hitung ranking
    const rankings = calculateRankings();
    setRankingData(rankings);
  };

  const copyTableToClipboard = (tableId) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    try {
      const range = document.createRange();
      range.selectNode(table);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
      alert('Tabel berhasil di-copy! Paste di Excel dengan Ctrl+V');
    } catch (err) {
      alert('Gagal copy. Silakan select tabel dan tekan Ctrl+C');
    }
  };

  const downloadTableAsExcel = (tableId, fileName) => {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Clone table untuk manipulasi
    const clonedTable = table.cloneNode(true);

    // Inject inline styles ke setiap cell untuk Excel
    const allCells = clonedTable.querySelectorAll('td, th');
    allCells.forEach((cell) => {
      const classList = cell.className;
      let bgColor = '#FFFFFF';
      let fontWeight = 'normal';
      let textAlign = 'center';

      // Deteksi warna dari className
      if (
        classList.includes('bg-blue-200') ||
        classList.includes('bg-blue-100')
      ) {
        bgColor = '#ADD8E6';
      } else if (classList.includes('bg-blue-300')) {
        bgColor = '#93C5FD';
      } else if (
        classList.includes('bg-yellow-200') ||
        classList.includes('bg-yellow-100')
      ) {
        bgColor = '#FFFF99';
      } else if (classList.includes('bg-yellow-300')) {
        bgColor = '#FDE047';
      } else if (
        classList.includes('bg-red-200') ||
        classList.includes('bg-red-100')
      ) {
        bgColor = '#FFB3B3';
      } else if (
        classList.includes('bg-green-200') ||
        classList.includes('bg-green-100')
      ) {
        bgColor = '#90EE90';
      } else if (classList.includes('bg-green-300')) {
        bgColor = '#86EFAC';
      } else if (classList.includes('bg-gray-100')) {
        bgColor = '#F3F4F6';
      } else if (classList.includes('bg-gray-600')) {
        bgColor = '#4B5563';
      } else if (classList.includes('bg-gray-700')) {
        bgColor = '#374151';
      } else if (classList.includes('bg-purple-100')) {
        bgColor = '#E9D5FF';
      } else if (classList.includes('bg-indigo-100')) {
        bgColor = '#C7D2FE';
      } else if (classList.includes('bg-gray-300')) {
        bgColor = '#D1D5DB';
      }

      // Check inline background color
      if (cell.style.backgroundColor) {
        const inlineColor = cell.style.backgroundColor;
        if (inlineColor.startsWith('rgb')) {
          const match = inlineColor.match(/\d+/g);
          if (match && match.length >= 3) {
            bgColor =
              '#' +
              match
                .slice(0, 3)
                .map((x) => parseInt(x).toString(16).padStart(2, '0'))
                .join('');
          }
        } else if (inlineColor.startsWith('#')) {
          bgColor = inlineColor;
        }
      }

      // Deteksi bold
      if (classList.includes('font-bold')) {
        fontWeight = 'bold';
      }

      // Set inline style untuk Excel
      cell.setAttribute(
        'style',
        `background-color: ${bgColor}; font-weight: ${fontWeight}; text-align: ${textAlign}; border: 1px solid #000000; padding: 5px;`
      );
    });

    // Convert ke HTML string
    let html = '<html><head><meta charset="utf-8"></head><body>';
    html +=
      '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">';
    html += clonedTable.innerHTML;
    html += '</table></body></html>';

    // Create blob dan download sebagai .xls (HTML format)
    const blob = new Blob([html], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadCompletePdf = async () => {
    if (!summaryData || !recapData) {
      alert('Silakan generate Kesimpulan Profil terlebih dahulu');
      return;
    }

    const doc = new jsPDF('l', 'pt', 'a4'); // LANDSCAPE
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ============= HALAMAN 1: KESIMPULAN =============
    let yPos = 50;

    // Header
    const headerHeight = 80;
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);

    // Hitung posisi tengah vertikal
    const centerY = headerHeight / 2;

    // Judul utama
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('KESIMPULAN PROFIL ABSENSI', 40, centerY - 8);

    // Subjudul
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('MTs. AN-NUR BULULAWANG', 40, centerY + 10);

    // Periode
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Periode: ${summaryData.periode}`, 40, centerY + 26);

    // yPos setelah header
    yPos = headerHeight + 20;
    doc.setTextColor(0, 0, 0);

    // 4 KOTAK INFORMASI UTAMA (1 BARIS)
    const summaryBoxes = [
      {
        label: 'Predikat',
        value: summaryData.predikat,
        color: [240, 240, 255],
        fontSize: 16, // Lebih kecil dari sebelumnya (20)
      },
      {
        label: 'Total Guru & Karyawan',
        value: `${summaryData.totalKaryawan} orang`,
        color: [230, 230, 240],
        fontSize: 18,
      },
      {
        label: 'Total Hari Kerja',
        value: `${summaryData.totalHariKerja} hari`,
        color: [230, 230, 240],
        fontSize: 18,
      },
      {
        label: 'Tingkat Kehadiran',
        value: `${summaryData.persentaseKehadiran}%`,
        color: [220, 220, 240],
        fontSize: 18,
      },
    ];

    const summarySpacing = 15;
    const summaryBoxWidth = (pageWidth - 80 - (3 * summarySpacing)) / 4;
    const summaryBoxHeight = 70;

    summaryBoxes.forEach((box, idx) => {
      const xPos = 40 + idx * (summaryBoxWidth + summarySpacing);
      doc.setFillColor(...box.color);
      doc.roundedRect(xPos, yPos, summaryBoxWidth, summaryBoxHeight, 5, 5, 'F');

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(box.label, xPos + 15, yPos + 25);

      doc.setFontSize(box.fontSize);
      doc.setFont(undefined, 'bold');
      doc.text(box.value, xPos + 15, yPos + 50);
    });

    yPos += summaryBoxHeight + 30;

    // Rincian Kehadiran Header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(220, 220, 240);
    doc.roundedRect(40, yPos, pageWidth - 80, 30, 5, 5, 'F');
    doc.text('Rincian Kehadiran:', 60, yPos + 20);

    yPos += 40;

    const details = [
      {
        label: 'Hadir Total',
        value: `${summaryData.totalHadir} (${summaryData.persentaseKehadiran}%)`,
        color: [200, 230, 255],
      },
      {
        label: 'Tepat Waktu',
        value: `${summaryData.totalTepat} (${summaryData.persentaseTepat}%)`,
        color: [200, 255, 200],
      },
      {
        label: 'Terlambat',
        value: `${summaryData.totalTelat} (${summaryData.persentaseTelat}%)`,
        color: [255, 255, 200],
      },
      {
        label: 'Alfa',
        value: `${summaryData.totalAlfa} (${summaryData.persentaseAlfa}%)`,
        color: [255, 200, 200],
      },
    ];

    // 4 box dalam 1 baris, lebar sama dan simetris (Full Justified)
    const detailSpacing = 15; // Spacing antar box
    const detailBoxWidth = (pageWidth - 80 - (3 * detailSpacing)) / 4;
    const detailBoxHeight = 60;

    details.forEach((detail, idx) => {
      const xPos = 40 + idx * (detailBoxWidth + detailSpacing);
      doc.setFillColor(...detail.color);
      doc.roundedRect(xPos, yPos, detailBoxWidth, detailBoxHeight, 5, 5, 'F');

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(detail.label, xPos + 15, yPos + 25);

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(detail.value, xPos + 15, yPos + 45);
    });

    yPos += detailBoxHeight + 30;

    // ============= DESKRIPSI KESIMPULAN (DYNAMIC HEIGHT) =============

    // 1. Hitung dulu semua teks untuk menentukan tinggi kotak
    const contentWidth = pageWidth - 120; // Lebar area teks (margin kiri 60, kanan 60)

    // Paragraf Pembuka
    const introText = `Profil absensi periode ${summaryData.periode} menunjukkan tingkat kehadiran ${summaryData.persentaseKehadiran}% yang termasuk kategori ${summaryData.predikat}.`;
    const introLines = doc.splitTextToSize(introText, contentWidth);

    // Analisis Kehadiran
    let analisisText = '';
    if (summaryData.persentaseKehadiran >= 96) {
      analisisText = 'Tingkat kehadiran sangat luar biasa dengan konsistensi kehadiran hampir sempurna.';
    } else if (summaryData.persentaseKehadiran >= 91) {
      analisisText = 'Tingkat kehadiran sangat memuaskan dengan komitmen tinggi dari guru & karyawan.';
    } else if (summaryData.persentaseKehadiran >= 86) {
      analisisText = 'Tingkat kehadiran baik dan menunjukkan dedikasi yang konsisten.';
    } else if (summaryData.persentaseKehadiran >= 81) {
      analisisText = 'Tingkat kehadiran cukup baik namun masih ada ruang perbaikan.';
    } else if (summaryData.persentaseKehadiran >= 76) {
      analisisText = 'Tingkat kehadiran di bawah standar dengan cukup banyak ketidakhadiran.';
    } else {
      analisisText = 'Tingkat kehadiran di bawah standar minimal dengan banyak ketidakhadiran tanpa keterangan jelas.';
    }
    const analisisLines = doc.splitTextToSize(analisisText, contentWidth);

    // Kesadaran Absensi
    let kesadaranText = '';
    if (summaryData.persentaseKehadiran >= 96) {
      kesadaranText = 'Ketertiban scan masuk-pulang sangat sempurna. Hampir semua guru & karyawan konsisten melakukan scan lengkap.';
    } else if (summaryData.persentaseKehadiran >= 91) {
      kesadaranText = 'Ketertiban scan masuk-pulang sangat baik. Mayoritas konsisten melakukan scan lengkap setiap hari.';
    } else if (summaryData.persentaseKehadiran >= 86) {
      kesadaranText = 'Ketertiban scan masuk-pulang baik. Sebagian besar melakukan scan dengan tertib.';
    } else if (summaryData.persentaseKehadiran >= 81) {
      kesadaranText = 'Ketertiban perlu ditingkatkan. Masih ditemukan kasus lupa scan pulang atau tidak scan sama sekali.';
    } else if (summaryData.persentaseKehadiran >= 76) {
      kesadaranText = 'Ketertiban scan masuk-pulang kurang. Cukup banyak guru & karyawan lupa scan pulang sehingga data tidak lengkap.';
    } else {
      kesadaranText = 'Ketertiban scan masuk-pulang rendah. Banyak guru & karyawan lupa scan pulang sehingga data tidak lengkap, menunjukkan kurangnya kesadaran administrasi.';
    }
    const kesadaranLines = doc.splitTextToSize(kesadaranText, contentWidth);

    // Kedisiplinan Waktu
    let kedisiplinanText = '';
    if (summaryData.persentaseKehadiran >= 96) {
      kedisiplinanText = 'Ketepatan waktu sangat sempurna. Hampir semua datang sebelum jadwal yang ditentukan.';
    } else if (summaryData.persentaseKehadiran >= 91) {
      kedisiplinanText = 'Ketepatan waktu sangat baik. Sebagian besar datang sebelum atau tepat jadwal yang ditentukan.';
    } else if (summaryData.persentaseKehadiran >= 86) {
      kedisiplinanText = 'Ketepatan waktu baik. Mayoritas guru & karyawan datang tepat waktu sesuai jadwal.';
    } else if (summaryData.persentaseKehadiran >= 81) {
      kedisiplinanText = 'Ketepatan waktu bervariasi. Sebagian disiplin namun masih ada yang sering terlambat.';
    } else if (summaryData.persentaseKehadiran >= 76) {
      kedisiplinanText = 'Ketepatan waktu kurang. Cukup banyak guru & karyawan datang terlambat dari jadwal.';
    } else {
      kedisiplinanText = 'Ketepatan waktu rendah. Banyak guru & karyawan datang terlambat setelah jadwal dimulai.';
    }
    const kedisiplinanLines = doc.splitTextToSize(kedisiplinanText, contentWidth);

    // Rekomendasi/Apresiasi
    const rekomendasiLabel = summaryData.persentaseKehadiran >= 91 ? 'Apresiasi:' : 'Rekomendasi:';
    let rekomendasiText = '';
    if (summaryData.persentaseKehadiran >= 96) {
      rekomendasiText = 'Prestasi luar biasa! Pertahankan kedisiplinan sempurna ini dan jadilah teladan bagi yang lain.';
    } else if (summaryData.persentaseKehadiran >= 91) {
      rekomendasiText = 'Prestasi sangat baik! Pertahankan disiplin ini dan tingkatkan menuju level UNGGUL.';
    } else if (summaryData.persentaseKehadiran >= 86) {
      rekomendasiText = 'Performa baik, pertahankan dan tingkatkan konsistensi untuk mencapai kategori BAIK SEKALI.';
    } else if (summaryData.persentaseKehadiran >= 81) {
      rekomendasiText = 'Disarankan reminder rutin dan evaluasi berkala untuk mencapai kategori BAIK atau BAIK SEKALI.';
    } else if (summaryData.persentaseKehadiran >= 76) {
      rekomendasiText = 'Perlu pembinaan dan monitoring ketat untuk perbaikan kedisiplinan secara bertahap.';
    } else {
      rekomendasiText = 'Perlu evaluasi individual, pembinaan intensif, dan penerapan sanksi tegas untuk perbaikan kedisiplinan.';
    }
    const rekomendasiLines = doc.splitTextToSize(rekomendasiText, contentWidth);

    // Hitung total tinggi yang dibutuhkan
    // Header (20) + Intro (lines*12 + 10) + 4 section * (Title 12 + lines*12 + 8) + Padding Bottom (20)
    let totalBoxHeight = 20 + (introLines.length * 12 + 10) + 20; // Base padding
    totalBoxHeight += 12 + analisisLines.length * 12 + 8;
    totalBoxHeight += 12 + kesadaranLines.length * 12 + 8;
    totalBoxHeight += 12 + kedisiplinanLines.length * 12 + 8;
    totalBoxHeight += 12 + rekomendasiLines.length * 12;

    // Gambar Kotak Background
    doc.setFillColor(245, 245, 250);
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(1.5);
    doc.roundedRect(40, yPos, pageWidth - 80, totalBoxHeight, 5, 5, 'FD');

    // Render Teks
    let textY = yPos + 25;

    // Judul
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('Deskripsi Kesimpulan Profil Absensi', 60, textY);
    textY += 20;

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    // Intro
    doc.text(introLines, 60, textY);
    textY += introLines.length * 12 + 10;

    // Analisis
    doc.setFont(undefined, 'bold');
    doc.text('Analisis Kehadiran:', 60, textY);
    textY += 12;
    doc.setFont(undefined, 'normal');
    doc.text(analisisLines, 60, textY);
    textY += analisisLines.length * 12 + 8;

    // Kesadaran
    doc.setFont(undefined, 'bold');
    doc.text('Kesadaran Absensi:', 60, textY);
    textY += 12;
    doc.setFont(undefined, 'normal');
    doc.text(kesadaranLines, 60, textY);
    textY += kesadaranLines.length * 12 + 8;

    // Kedisiplinan
    doc.setFont(undefined, 'bold');
    doc.text('Kedisiplinan Waktu:', 60, textY);
    textY += 12;
    doc.setFont(undefined, 'normal');
    doc.text(kedisiplinanLines, 60, textY);
    textY += kedisiplinanLines.length * 12 + 8;

    // Rekomendasi
    doc.setFont(undefined, 'bold');
    doc.text(rekomendasiLabel, 60, textY);
    textY += 12;
    doc.setFont(undefined, 'normal');
    doc.text(rekomendasiLines, 60, textY);

    // ============= HALAMAN 2: EVALUASI KATEGORI =============
    if (categoryEvaluation) {
      doc.addPage();

      // Header
      doc.setFillColor(79, 70, 229); // Indigo - sama dengan header Peringkat
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('EVALUASI BERDASARKAN KATEGORI', 40, 25);
      doc.setFontSize(14);
      doc.text('MTs. AN-NUR BULULAWANG', 40, 40);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Periode: ${summaryData.periode}`, 40, 55);

      yPos = 80;
      doc.setTextColor(0, 0, 0);

      // 1. KEHADIRAN
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('1. KEHADIRAN', 40, yPos);
      yPos += 15;

      const catWidth = (pageWidth - 100) / 3;
      const catX = [40, 40 + catWidth + 10, 40 + 2 * (catWidth + 10)];
      const categories = ['Pimpinan', 'Guru', 'Tendik'];

      categories.forEach((cat, idx) => {
        const data = categoryEvaluation[cat];

        // Kotak berwarna berbeda untuk setiap kategori - SOFT COLORS
        if (cat === 'Pimpinan') {
          doc.setFillColor(200, 230, 255); // Soft Blue
        } else if (cat === 'Guru') {
          doc.setFillColor(200, 255, 200); // Soft Green
        } else {
          doc.setFillColor(255, 255, 200); // Soft Yellow
        }
        doc.roundedRect(catX[idx], yPos, catWidth, 75, 5, 5, 'F');

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(cat, catX[idx] + 10, yPos + 15);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Jumlah: ${data.count} orang`, catX[idx] + 10, yPos + 28);

        // Persentase besar
        doc.setFontSize(26);
        doc.setFont(undefined, 'bold');
        const persenText = `${data.persenKehadiran}%`;
        const persenWidth = doc.getTextWidth(persenText);
        doc.text(persenText, catX[idx] + 10, yPos + 52);

        // Predikat dalam badge/kontainer terpisah - DI SAMPING PERSEN
        const predikat = getPredicate(data.persenKehadiran);
        const predikatText = predikat;

        // Ukur lebar teks predikat
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const predikatWidth = doc.getTextWidth(predikatText);
        const badgeWidth = predikatWidth + 12;
        const badgeHeight = 16;
        const badgeX = catX[idx] + 10 + persenWidth + 8; // Di samping persen dengan jarak 8px
        const badgeY = yPos + 52 - 12; // Sejajar dengan baseline persen

        // Gambar badge dengan border radius
        doc.setFillColor(255, 255, 255); // Putih
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'FD');

        // Teks predikat di dalam badge
        doc.setTextColor(0, 0, 0);
        doc.text(predikatText, badgeX + 6, badgeY + 11);

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`${data.totalHadir} dari ${data.totalHariKerja} hari`, catX[idx] + 10, yPos + 65);
      });

      yPos += 90;

      // 2. KEDISIPLINAN WAKTU
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('2. KEDISIPLINAN WAKTU', 40, yPos);
      yPos += 15;

      categories.forEach((cat, idx) => {
        const data = categoryEvaluation[cat];

        // Kotak berwarna berbeda untuk setiap kategori - SOFT COLORS
        if (cat === 'Pimpinan') {
          doc.setFillColor(200, 230, 255); // Soft Blue
        } else if (cat === 'Guru') {
          doc.setFillColor(200, 255, 200); // Soft Green
        } else {
          doc.setFillColor(255, 255, 200); // Soft Yellow
        }
        doc.roundedRect(catX[idx], yPos, catWidth, 75, 5, 5, 'F');

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(cat, catX[idx] + 10, yPos + 15);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Tepat Waktu', catX[idx] + 10, yPos + 28);

        // Persentase besar
        doc.setFontSize(26);
        doc.setFont(undefined, 'bold');
        const persenText = `${data.persenTepat}%`;
        const persenWidth = doc.getTextWidth(persenText);
        doc.text(persenText, catX[idx] + 10, yPos + 52);

        // Predikat dalam badge/kontainer terpisah - DI SAMPING PERSEN
        const predikat = getPredicate(data.persenTepat);
        const predikatText = predikat;

        // Ukur lebar teks predikat
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const predikatWidth = doc.getTextWidth(predikatText);
        const badgeWidth = predikatWidth + 12;
        const badgeHeight = 16;
        const badgeX = catX[idx] + 10 + persenWidth + 8; // Di samping persen dengan jarak 8px
        const badgeY = yPos + 52 - 12; // Sejajar dengan baseline persen

        // Gambar badge dengan border radius
        doc.setFillColor(255, 255, 255); // Putih
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'FD');

        // Teks predikat di dalam badge
        doc.setTextColor(0, 0, 0);
        doc.text(predikatText, badgeX + 6, badgeY + 11);

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`${data.totalTepat} dari ${data.totalHadir} hari hadir`, catX[idx] + 10, yPos + 65);
      });

      yPos += 90;

      // REKOMENDASI - REDESIGNED WITH DYNAMIC CONTENT
      // Fungsi untuk generate rekomendasi spesifik
      const generateRecommendation = (category, kehadiranPct, disiplinPct) => {
        const categoryName = category;
        let kehadiranRec = '';
        let disiplinRec = '';

        // Rekomendasi Kehadiran
        if (kehadiranPct >= 91) {
          kehadiranRec = `Pertahankan kehadiran ${categoryName} yang sudah sangat baik`;
        } else if (kehadiranPct >= 81) {
          kehadiranRec = `Tingkatkan kehadiran ${categoryName} untuk mencapai kategori Istimewa`;
        } else if (kehadiranPct >= 71) {
          kehadiranRec = `Perbaiki kehadiran ${categoryName} dengan monitoring lebih ketat`;
        } else {
          kehadiranRec = `Evaluasi dan pembinaan intensif untuk ${categoryName} yang sering tidak hadir`;
        }

        // Rekomendasi Disiplin
        if (disiplinPct >= 91) {
          disiplinRec = `kedisiplinan waktu sudah sangat baik`;
        } else if (disiplinPct >= 81) {
          disiplinRec = `tingkatkan ketepatan waktu`;
        } else if (disiplinPct >= 71) {
          disiplinRec = `perbaiki kedisiplinan dengan reminder rutin`;
        } else {
          disiplinRec = `terapkan sanksi tegas untuk keterlambatan`;
        }

        return { kehadiranRec, disiplinRec };
      };

      const pimpinanRec = generateRecommendation('Pimpinan', categoryEvaluation.Pimpinan.persenKehadiran, categoryEvaluation.Pimpinan.persenTepat);
      const guruRec = generateRecommendation('Guru', categoryEvaluation.Guru.persenKehadiran, categoryEvaluation.Guru.persenTepat);
      const tendikRec = generateRecommendation('Tendik', categoryEvaluation.Tendik.persenKehadiran, categoryEvaluation.Tendik.persenTepat);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(2);
      doc.roundedRect(40, yPos, pageWidth - 80, 165, 5, 5, 'FD');

      // Header Rekomendasi
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(40, yPos, pageWidth - 80, 25, 5, 5, 'F');
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('REKOMENDASI', 50, yPos + 17);

      doc.setTextColor(0, 0, 0);

      // LAYOUT 2 KOLOM
      const leftColX = 50;
      const rightColX = (pageWidth / 2) + 20;
      const colWidth = (pageWidth / 2) - 60;

      let recLeftY = yPos + 45;
      let recRightY = yPos + 45;

      // ===== KOLOM KIRI: REKOMENDASI PER KATEGORI =====

      // Rekomendasi Pimpinan
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('1. Pimpinan:', leftColX, recLeftY);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      recLeftY += 12;
      const pimpinanText = `${pimpinanRec.kehadiranRec}, ${pimpinanRec.disiplinRec}.`;
      const pimpinanLines = doc.splitTextToSize(pimpinanText, colWidth);
      doc.text(pimpinanLines, leftColX + 5, recLeftY);
      recLeftY += pimpinanLines.length * 11 + 10;

      // Rekomendasi Guru
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('2. Guru:', leftColX, recLeftY);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      recLeftY += 12;
      const guruText = `${guruRec.kehadiranRec}, ${guruRec.disiplinRec}.`;
      const guruLines = doc.splitTextToSize(guruText, colWidth);
      doc.text(guruLines, leftColX + 5, recLeftY);
      recLeftY += guruLines.length * 11 + 10;

      // Rekomendasi Tendik
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(251, 191, 36);
      doc.text('3. Tendik:', leftColX, recLeftY);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      recLeftY += 12;
      const tendikText = `${tendikRec.kehadiranRec}, ${tendikRec.disiplinRec}.`;
      const tendikLines = doc.splitTextToSize(tendikText, colWidth);
      doc.text(tendikLines, leftColX + 5, recLeftY);

      // ===== KOLOM KANAN: TINDAKAN UMUM =====
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Tindakan Umum:', rightColX, recRightY);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      recRightY += 15;

      const tindakan1 = doc.splitTextToSize('• Tingkatkan pemantauan waktu kedatangan dan kepulangan secara real-time', colWidth);
      doc.text(tindakan1, rightColX + 5, recRightY);
      recRightY += tindakan1.length * 11 + 8;

      const tindakan2 = doc.splitTextToSize('• Adakan pembinaan manajemen waktu dan kesadaran administrasi', colWidth);
      doc.text(tindakan2, rightColX + 5, recRightY);
      recRightY += tindakan2.length * 11 + 8;

      const tindakan3 = doc.splitTextToSize('• Terapkan sistem reward untuk yang disiplin dan sanksi untuk yang sering melanggar', colWidth);
      doc.text(tindakan3, rightColX + 5, recRightY);
    }

    // ============= HALAMAN 3: RANKING (3 KOLOM) =============
    if (rankingData) {
      doc.addPage();
      yPos = 40;

      // Header Peringkat
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('PERINGKAT GURU & KARYAWAN', 40, 25);

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('MTs. AN-NUR BULULAWANG', 40, 40);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Periode: ${summaryData.periode}`, 40, 55);

      yPos = 80;

      // Lebar kolom untuk 3 tabel
      const colWidth = (pageWidth - 100) / 3;
      const startX = [40, 40 + colWidth + 10, 40 + 2 * (colWidth + 10)];

      // Tabel 1: Disiplin Waktu
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(34, 197, 94); // Green
      doc.roundedRect(startX[0], yPos, colWidth, 25, 5, 5, 'F');
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Disiplin Waktu Tertinggi', startX[0] + 10, yPos + 17);

      // Tabel 2: Tertib Administrasi
      doc.setFillColor(59, 130, 246); // Blue
      doc.roundedRect(startX[1], yPos, colWidth, 25, 5, 5, 'F');
      doc.text('Tertib Administrasi', startX[1] + 10, yPos + 17);

      // Tabel 3: Rendah Kesadaran
      doc.setFillColor(239, 68, 68); // Red
      doc.roundedRect(startX[2], yPos, colWidth, 25, 5, 5, 'F');
      doc.text('Rendah Kesadaran', startX[2] + 10, yPos + 17);

      yPos += 50;

      // Data Ranking (max 10 baris)
      const maxRows = 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      const rowHeight = 30; // Tinggi baris 30px

      for (let i = 0; i < maxRows; i++) {
        const emp1 = rankingData.topDisiplin[i];
        const emp2 = rankingData.topTertib[i];
        const emp3 = rankingData.topRendah[i];

        // Kolom 1 - Disiplin Waktu
        if (emp1) {
          doc.setFillColor(i % 2 === 0 ? 240 : 255, 255, 240);
          doc.rect(startX[0], yPos, colWidth, rowHeight, 'F');
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.text(`${i + 1}.`, startX[0] + 5, yPos + 17);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          // Nama - potong jika terlalu panjang dan tambahkan ellipsis
          const maxNameLength = Math.floor(colWidth / 7);
          const displayName =
            emp1.name.length > maxNameLength
              ? emp1.name.substring(0, maxNameLength - 3) + '...'
              : emp1.name;
          doc.text(displayName, startX[0] + 24, yPos + 12);
          doc.setFontSize(7.5);
          doc.setTextColor(100, 100, 100);
          const maxPosLength = Math.floor(colWidth / 5.5);
          const displayPos =
            emp1.position.length > maxPosLength
              ? emp1.position.substring(0, maxPosLength - 3) + '...'
              : emp1.position;
          doc.text(displayPos, startX[0] + 24, yPos + 21);

          // Hari Kerja (abu-abu)
          doc.setTextColor(80, 80, 80);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.text(
            `${emp1.hariKerja} hr`,
            startX[0] + colWidth - 85,
            yPos + 17
          );

          // Total (warna hijau)
          doc.setTextColor(0, 128, 0); // Hijau
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.text(
            `${emp1.hijau}`,
            startX[0] + colWidth - 60,
            yPos + 17
          );

          // Persentase (warna hitam)
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(11);
          doc.text(
            `${emp1.persenHijau}%`,
            startX[0] + colWidth - 35,
            yPos + 17
          );
        }

        // Kolom 2 - Tertib Administrasi
        if (emp2) {
          doc.setFillColor(240, 248, i % 2 === 0 ? 255 : 250);
          doc.rect(startX[1], yPos, colWidth, rowHeight, 'F');
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.text(`${i + 1}.`, startX[1] + 5, yPos + 17);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const maxNameLength = Math.floor(colWidth / 7);
          const displayName =
            emp2.name.length > maxNameLength
              ? emp2.name.substring(0, maxNameLength - 3) + '...'
              : emp2.name;
          doc.text(displayName, startX[1] + 24, yPos + 12);
          doc.setFontSize(7.5);
          doc.setTextColor(100, 100, 100);
          const maxPosLength = Math.floor(colWidth / 5.5);
          const displayPos =
            emp2.position.length > maxPosLength
              ? emp2.position.substring(0, maxPosLength - 3) + '...'
              : emp2.position;
          doc.text(displayPos, startX[1] + 24, yPos + 21);

          // Hari Kerja (abu-abu)
          doc.setTextColor(80, 80, 80);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.text(
            `${emp2.hariKerja} hr`,
            startX[1] + colWidth - 85,
            yPos + 17
          );

          // Total (warna biru)
          doc.setTextColor(0, 0, 255); // Biru
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.text(
            `${emp2.biru}`,
            startX[1] + colWidth - 60,
            yPos + 17
          );

          // Persentase (warna hitam)
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(11);
          doc.text(`${emp2.persenBiru}%`, startX[1] + colWidth - 35, yPos + 17);
        }

        // Kolom 3 - Rendah Kesadaran
        if (emp3) {
          doc.setFillColor(255, i % 2 === 0 ? 240 : 250, 240);
          doc.rect(startX[2], yPos, colWidth, rowHeight, 'F');
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.text(`${i + 1}.`, startX[2] + 5, yPos + 17);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const maxNameLength = Math.floor(colWidth / 7);
          const displayName =
            emp3.name.length > maxNameLength
              ? emp3.name.substring(0, maxNameLength - 3) + '...'
              : emp3.name;
          doc.text(displayName, startX[2] + 24, yPos + 12);
          doc.setFontSize(7.5);
          doc.setTextColor(100, 100, 100);
          const maxPosLength = Math.floor(colWidth / 5.5);
          const displayPos =
            emp3.position.length > maxPosLength
              ? emp3.position.substring(0, maxPosLength - 3) + '...'
              : emp3.position;
          doc.text(displayPos, startX[2] + 24, yPos + 21);

          // Hari Kerja (abu-abu)
          doc.setTextColor(80, 80, 80);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.text(
            `${emp3.hariKerja} hr`,
            startX[2] + colWidth - 85,
            yPos + 17
          );

          // Total (warna merah)
          doc.setTextColor(255, 0, 0); // Merah
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.text(
            `${emp3.merah}`,
            startX[2] + colWidth - 60,
            yPos + 17
          );

          // Persentase (warna hitam)
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(11);
          doc.text(
            `${emp3.persenMerah}%`,
            startX[2] + colWidth - 35,
            yPos + 17
          );
        }

        yPos += rowHeight;
      }

      // Keterangan perhitungan di bawah tabel peringkat
      yPos += 10;
      doc.setFontSize(7);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(100, 100, 100);

      const note1 = 'Keterangan: hr = Hari Kerja | Total = Jumlah hari | % = Persentase dari Hari Kerja';
      doc.text(note1, startX[0], yPos);
      yPos += 10;
      const note2 = 'Contoh: 15 hr | 12 | 80% = Dari 15 hari kerja, ada 12 hari yang memenuhi kriteria (80%)';
      doc.text(note2, startX[0], yPos);
    }

    // ============= HALAMAN 3-5: TABEL 1, 2, 3 =============
    for (let i = 1; i <= 3; i++) {
      doc.addPage();
      const tableId = `tabel${i}`;
      const table = document.getElementById(tableId);
      if (!table) continue;

      let tableTitle = '';
      if (i === 1) tableTitle = '1. REKAP MESIN (DATA MENTAH)';
      else if (i === 2) tableTitle = '2. KEDISIPLINAN WAKTU';
      else if (i === 3) tableTitle = '3. EVALUASI KEHADIRAN';

      // Clone table untuk capture jika hidden
      const clone = table.cloneNode(true);
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '0';
      container.style.width = '1200px';
      container.style.backgroundColor = '#ffffff';
      container.appendChild(clone);
      document.body.appendChild(container);

      let canvas;
      try {
        canvas = await html2canvas(clone, {
          scale: 1.5, // Skala tabel tetap
          backgroundColor: '#ffffff',
          logging: false,
        });
      } finally {
        document.body.removeChild(container);
      }
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Header Halaman
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Sistem Rekap Absensi', 40, 25);
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('MTs. AN-NUR BULULAWANG', 40, 45);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(tableTitle, 40, 80);

      if (startDate && endDate) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const periode = `Periode: ${new Date(startDate).toLocaleDateString(
          'id-ID'
        )} - ${new Date(endDate).toLocaleDateString('id-ID')}`;
        doc.text(periode, pageWidth - 220, 80);
      }

      const marginTop = 100;
      const marginLeft = 30;
      const marginRight = 30;
      const marginBottom = 50;

      const contentWidth = pageWidth - marginLeft - marginRight;
      // Untuk tabel 3, kurangi contentHeight agar ada ruang untuk panduan
      const guideReservedSpace = (i === 3) ? 65 : 0; // Reservasi 65pt untuk panduan tabel 3 (lebih tinggi)
      const contentHeight = pageHeight - marginTop - marginBottom - guideReservedSpace;

      const ratio = Math.min(
        contentWidth / imgWidth,
        contentHeight / imgHeight
      );
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      let yPosition = marginTop;
      doc.addImage(
        imgData,
        'JPEG',
        marginLeft,
        yPosition,
        scaledWidth,
        scaledHeight
      );

      // ===== PANDUAN 4 KOTAK DI BAWAH TABEL (SELALU TAMPIL) =====
      const guideY = yPosition + scaledHeight + 10; // 10pt spacing dari tabel
      const guideBoxHeight = 50; // Lebih tinggi untuk teks yang lebih panjang

      let guideBoxes = [];

      if (i === 1) {
        // Tabel 1: Rekap Mesin
        guideBoxes = [
          { label: 'BIRU', desc: 'Scan MASUK dan PULANG keduanya tercatat', color: [173, 216, 230] },
          { label: 'KUNING', desc: 'Hanya scan MASUK saja atau PULANG saja', color: [255, 255, 153] },
          { label: 'MERAH', desc: 'Tidak ada scan MASUK maupun PULANG (Alpha)', color: [255, 179, 179] },
          { label: 'PUTIH + L', desc: 'Hari LIBUR atau tidak ada jadwal (Jumat/OFF)', color: [255, 255, 255] },
        ];
      } else if (i === 2) {
        // Tabel 2: Kedisiplinan Waktu
        guideBoxes = [
          { label: 'HIJAU', desc: 'Datang SEBELUM jadwal mengajar dimulai (Disiplin Tinggi)', color: [144, 238, 144] },
          { label: 'KUNING', desc: 'Datang SETELAH jadwal (Terlambat)', color: [255, 255, 153] },
          { label: 'MERAH', desc: 'Tidak scan sama sekali (Alpha)', color: [255, 179, 179] },
          { label: 'PUTIH + L', desc: 'Hari LIBUR atau tidak ada jadwal (Jumat/OFF)', color: [255, 255, 255] },
        ];
      } else if (i === 3) {
        // Tabel 3: Evaluasi Kehadiran
        guideBoxes = [
          { label: 'H', desc: 'Karyawan hadir (ada scan masuk)', color: [144, 238, 144] },
          { label: 'T', desc: 'Hadir tapi datang setelah jadwal', color: [255, 255, 153] },
          { label: 'A', desc: 'Tidak hadir (tidak ada scan)', color: [255, 179, 179] },
          { label: 'L', desc: 'Hari LIBUR atau tidak ada jadwal (Jumat/OFF)', color: [255, 255, 255] },
        ];
      }

      const guideSpacing = 10;
      const guideBoxWidth = (pageWidth - 80 - (3 * guideSpacing)) / 4;

      guideBoxes.forEach((box, idx) => {
        const xPos = 40 + idx * (guideBoxWidth + guideSpacing);
        doc.setFillColor(...box.color);
        doc.roundedRect(xPos, guideY, guideBoxWidth, guideBoxHeight, 3, 3, 'F');

        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(box.label, xPos + 10, guideY + 15);

        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        // Split teks panjang menjadi beberapa baris
        const descLines = doc.splitTextToSize(box.desc, guideBoxWidth - 20);
        doc.text(descLines, xPos + 10, guideY + 28);
      });

      // Logika untuk handling tabel panjang (paging)
      let heightLeft = scaledHeight - contentHeight;
      while (heightLeft > 0) {
        doc.addPage();
        // ... (Header halaman lanjutan sama seperti sebelumnya) ...
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageWidth, 50, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('MTs. AN-NUR BULULAWANG', 40, 20);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`${tableTitle} (lanjutan)`, 40, 38);

        const nextPageMarginTop = 70;
        yPosition = nextPageMarginTop - (scaledHeight - heightLeft);
        doc.addImage(
          imgData,
          'JPEG',
          marginLeft,
          yPosition,
          scaledWidth,
          scaledHeight
        );
        heightLeft -= pageHeight - nextPageMarginTop - marginBottom;
      }
    }

    // ============= HALAMAN 6: PANDUAN LENGKAP (3 KOLOM) =============
    doc.addPage();

    // Header Halaman Panduan
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('PANDUAN LENGKAP 3 TABEL REKAP', 40, 25);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('MTs. AN-NUR BULULAWANG', 40, 45);

    yPos = 80;
    doc.setTextColor(0, 0, 0);

    // Lebar kolom untuk 3 panduan
    const colWidth = (pageWidth - 100) / 3;
    const startX = [40, 40 + colWidth + 10, 40 + 2 * (colWidth + 10)];

    // ========== KOLOM 1: TABEL 1 - REKAP MESIN ==========
    doc.setFillColor(59, 130, 246); // Blue
    doc.roundedRect(startX[0], yPos, colWidth, 30, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('TABEL 1: REKAP MESIN', startX[0] + 10, yPos + 20);

    // ========== KOLOM 2: TABEL 2 - KEDISIPLINAN ==========
    doc.setFillColor(34, 197, 94); // Green
    doc.roundedRect(startX[1], yPos, colWidth, 30, 5, 5, 'F');
    doc.text('TABEL 2: KEDISIPLINAN', startX[1] + 10, yPos + 20);

    // ========== KOLOM 3: TABEL 3 - EVALUASI ==========
    doc.setFillColor(168, 85, 247); // Purple
    doc.roundedRect(startX[2], yPos, colWidth, 30, 5, 5, 'F');
    doc.text('TABEL 3: EVALUASI', startX[2] + 10, yPos + 20);

    yPos += 45;
    doc.setTextColor(0, 0, 0);

    // Subtitle
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Data Mentah Mesin', startX[0] + 10, yPos);
    doc.text('Evaluasi Disiplin Waktu', startX[1] + 10, yPos);
    doc.text('Evaluasi Kehadiran', startX[2] + 10, yPos);

    yPos += 15;

    // ===== KOLOM 1: ITEM 1 - BIRU =====
    doc.setFillColor(173, 216, 230); // Light Blue
    doc.roundedRect(startX[0], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 139);
    doc.text('BIRU', startX[0] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const biru1 = doc.splitTextToSize('Scan MASUK dan PULANG keduanya tercatat', colWidth - 20);
    doc.text(biru1, startX[0] + 10, yPos + 28);

    // ===== KOLOM 2: ITEM 1 - HIJAU =====
    doc.setFillColor(144, 238, 144); // Light Green
    doc.roundedRect(startX[1], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 100, 0);
    doc.text('HIJAU', startX[1] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const hijau1 = doc.splitTextToSize('Datang SEBELUM jadwal mengajar dimulai (Disiplin Tinggi)', colWidth - 20);
    doc.text(hijau1, startX[1] + 10, yPos + 28);

    // ===== KOLOM 3: ITEM 1 - H =====
    doc.setFillColor(144, 238, 144); // Light Green
    doc.roundedRect(startX[2], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 100, 0);
    doc.text('H = HADIR', startX[2] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const h1 = doc.splitTextToSize('Karyawan hadir (ada scan masuk)', colWidth - 20);
    doc.text(h1, startX[2] + 10, yPos + 28);

    yPos += 60;

    // ===== KOLOM 1: ITEM 2 - KUNING =====
    doc.setFillColor(255, 255, 153); // Light Yellow
    doc.roundedRect(startX[0], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(184, 134, 11);
    doc.text('KUNING', startX[0] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const kuning1 = doc.splitTextToSize('Hanya scan MASUK saja atau PULANG saja', colWidth - 20);
    doc.text(kuning1, startX[0] + 10, yPos + 28);

    // ===== KOLOM 2: ITEM 2 - KUNING =====
    doc.setFillColor(255, 255, 153);
    doc.roundedRect(startX[1], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(184, 134, 11);
    doc.text('KUNING', startX[1] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const kuning2 = doc.splitTextToSize('Datang SETELAH jadwal (Terlambat)', colWidth - 20);
    doc.text(kuning2, startX[1] + 10, yPos + 28);

    // ===== KOLOM 3: ITEM 2 - T =====
    doc.setFillColor(255, 255, 153);
    doc.roundedRect(startX[2], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(184, 134, 11);
    doc.text('T = TERLAMBAT', startX[2] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const t1 = doc.splitTextToSize('Hadir tapi datang setelah jadwal', colWidth - 20);
    doc.text(t1, startX[2] + 10, yPos + 28);

    yPos += 60;

    // ===== KOLOM 1: ITEM 3 - MERAH =====
    doc.setFillColor(255, 179, 179); // Light Red - sesuai dengan tabel
    doc.roundedRect(startX[0], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(139, 0, 0);
    doc.text('MERAH', startX[0] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const merah1 = doc.splitTextToSize('Tidak ada scan MASUK maupun PULANG (Alpha)', colWidth - 20);
    doc.text(merah1, startX[0] + 10, yPos + 28);

    // ===== KOLOM 2: ITEM 3 - MERAH =====
    doc.setFillColor(255, 179, 179);
    doc.roundedRect(startX[1], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(139, 0, 0);
    doc.text('MERAH', startX[1] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const merah2 = doc.splitTextToSize('Tidak scan sama sekali (Alpha)', colWidth - 20);
    doc.text(merah2, startX[1] + 10, yPos + 28);

    // ===== KOLOM 3: ITEM 3 - A =====
    doc.setFillColor(255, 179, 179);
    doc.roundedRect(startX[2], yPos, colWidth, 50, 3, 3, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(139, 0, 0);
    doc.text('A = ALPHA', startX[2] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const a1 = doc.splitTextToSize('Tidak hadir (tidak ada scan)', colWidth - 20);
    doc.text(a1, startX[2] + 10, yPos + 28);

    yPos += 60;

    // ===== KOLOM 1: ITEM 4 - PUTIH L =====
    doc.setFillColor(255, 255, 255); // White - sesuai dengan tabel
    doc.setDrawColor(200, 200, 200); // Border abu-abu agar terlihat
    doc.roundedRect(startX[0], yPos, colWidth, 50, 3, 3, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(105, 105, 105);
    doc.text('PUTIH + L', startX[0] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const putih1 = doc.splitTextToSize('Hari LIBUR atau tidak ada jadwal (Jumat/OFF)', colWidth - 20);
    doc.text(putih1, startX[0] + 10, yPos + 28);

    // ===== KOLOM 2: ITEM 4 - PUTIH L =====
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(startX[1], yPos, colWidth, 50, 3, 3, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(105, 105, 105);
    doc.text('PUTIH + L', startX[1] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const putih2 = doc.splitTextToSize('Hari LIBUR (tidak perlu scan)', colWidth - 20);
    doc.text(putih2, startX[1] + 10, yPos + 28);

    // ===== KOLOM 3: ITEM 4 - L =====
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(startX[2], yPos, colWidth, 50, 3, 3, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(105, 105, 105);
    doc.text('L = LIBUR', startX[2] + 10, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const l1 = doc.splitTextToSize('Hari libur (Jumat/OFF)', colWidth - 20);
    doc.text(l1, startX[2] + 10, yPos + 28);

    yPos += 60;

    // Catatan Tambahan
    doc.setFillColor(255, 248, 220); // Light Yellow Background
    doc.roundedRect(40, yPos, pageWidth - 80, 60, 5, 5, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CATATAN PENTING:', 50, yPos + 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    const catatan = [
      '• Tabel 1 menampilkan data mentah dari mesin fingerprint tanpa evaluasi.',
      '• Tabel 2 mengevaluasi kedisiplinan waktu berdasarkan jadwal mengajar.',
      '• Tabel 3 mengevaluasi kehadiran secara umum (hadir/tidak hadir).',
    ];
    let catatanY = yPos + 30;
    catatan.forEach(line => {
      doc.text(line, 50, catatanY);
      catatanY += 10;
    });

    // Footer semua halaman
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Halaman ${i} dari ${totalPages}`, 40, pageHeight - 20);
      doc.text(
        'Generated by Matsanuba Management Technology',
        pageWidth - 280,
        pageHeight - 20
      );
    }

    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`laporan_lengkap_absensi_${timestamp}.pdf`);
  };

  const downloadAsPdf = async (tableId, fileName, includeSummary = false) => {
    const table = document.getElementById(tableId);
    if (!table) {
      alert('Tabel tidak ditemukan!');
      return;
    }

    // Tentukan judul berdasarkan tableId
    let tableTitle = '';
    if (tableId === 'tabel1') {
      tableTitle = '1. REKAP MESIN (DATA MENTAH)';
    } else if (tableId === 'tabel2') {
      tableTitle = '2. KEDISIPLINAN WAKTU';
    } else if (tableId === 'tabel3') {
      tableTitle = '3. EVALUASI KEHADIRAN';
    }

    // Clone table untuk capture jika hidden
    const clone = table.cloneNode(true);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '0';
    container.style.width = '1200px'; // Lebar cukup untuk tabel
    container.style.backgroundColor = '#ffffff';
    container.appendChild(clone);
    document.body.appendChild(container);

    // Capture tabel sebagai canvas dengan html2canvas
    let canvas;
    try {
      canvas = await html2canvas(clone, {
        scale: 1.8, // Quality lebih tinggi untuk 2-3 MB
        backgroundColor: '#ffffff',
        logging: false,
      });
    } finally {
      document.body.removeChild(container);
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG dengan quality 90%
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Buat PDF landscape A4
    const doc = new jsPDF('l', 'px', 'a4');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    // Margin
    const marginLeft = 30;
    const marginTop = 100; // Perbesar margin atas untuk header
    const marginRight = 30;
    const marginBottom = 50; // Perbesar margin bawah untuk footer

    // Area konten
    const contentWidth = pdfWidth - marginLeft - marginRight;
    const contentHeight = pdfHeight - marginTop - marginBottom;

    // Header - Logo dan Judul (hanya di halaman pertama)
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, pdfWidth, 70, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Sistem Rekap Absensi', marginLeft, 30);

    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('MTs. AN-NUR BULULAWANG', marginLeft, 50);

    // Judul Tabel (di bawah header biru)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(tableTitle, marginLeft, 85);

    // Periode (pojok kanan)
    if (startDate && endDate) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      const startD = new Date(startDate);
      const endD = new Date(endDate);
      const periode = `Periode: ${startD.toLocaleDateString(
        'id-ID'
      )} - ${endD.toLocaleDateString('id-ID')}`;
      doc.text(periode, pdfWidth - marginRight - 180, 85);
    }

    // Hitung skala agar fit di area konten
    const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Tambahkan gambar ke PDF dengan margin
    let yPosition = marginTop;
    doc.addImage(
      imgData,
      'JPEG',
      marginLeft,
      yPosition,
      scaledWidth,
      scaledHeight
    );

    // Jika gambar lebih tinggi dari 1 halaman, buat multiple pages
    let heightLeft = scaledHeight - contentHeight;

    while (heightLeft > 0) {
      doc.addPage();

      // Header mini di halaman berikutnya
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pdfWidth, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('MTs. AN-NUR BULULAWANG', marginLeft, 25);
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`${tableTitle} (lanjutan)`, marginLeft, 45);

      // Margin atas untuk halaman lanjutan
      const nextPageMarginTop = 80;
      yPosition = nextPageMarginTop - (scaledHeight - heightLeft);
      doc.addImage(
        imgData,
        'JPEG',
        marginLeft,
        yPosition,
        scaledWidth,
        scaledHeight
      );
      heightLeft -= pdfHeight - nextPageMarginTop - marginBottom;
    }

    // Footer di semua halaman
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Halaman ${i} dari ${pageCount}`, marginLeft, pdfHeight - 20);
      doc.text(
        'Generated by Matsanuba Management Technology',
        pdfWidth - marginRight - 250,
        pdfHeight - 20
      );
    }

    doc.save(`${fileName}.pdf`);
  };

  const rgbToHex = (rgb) => {
    // Handle null/undefined
    if (!rgb) return null;

    // Handle jika rgb adalah object (dari className match)
    if (typeof rgb === 'object') return null;

    // Handle string
    const rgbString = String(rgb);

    // Jika sudah hex format
    if (rgbString.startsWith('#')) return rgbString;

    // Parse RGB format: rgb(255, 255, 255)
    const match = rgbString.match(/\d+/g);
    if (match && match.length >= 3) {
      return (
        '#' +
        match
          .slice(0, 3)
          .map((x) => parseInt(x).toString(16).padStart(2, '0'))
          .join('')
      );
    }

    return null;
  };

  const downloadSummaryAsPdf = () => {
    if (!summaryData) return;

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 50;

    // Header dengan warna gradient (simulasi)
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, pageWidth, 100, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    // Hilangkan emoji, gunakan text saja
    doc.text('KESIMPULAN PROFIL ABSENSI', 40, yPos);

    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`MTs. An-Nur Bululawang`, 40, yPos + 25);

    yPos = 120;
    doc.setTextColor(0, 0, 0);

    // Periode dan Predikat
    doc.setFillColor(240, 240, 255);
    doc.roundedRect(40, yPos, pageWidth - 80, 100, 5, 5, 'F');

    yPos += 25;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Periode: ${summaryData.periode}`, 60, yPos);

    yPos += 30;
    doc.setFontSize(20);
    doc.text(summaryData.predikat, 60, yPos);

    yPos += 30;
    doc.setFontSize(16);
    doc.text(
      `Tingkat Kehadiran: ${summaryData.persentaseKehadiran}%`,
      60,
      yPos
    );

    yPos += 50;

    // Total Karyawan dan Hari Kerja
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');

    doc.setFillColor(230, 230, 240);
    doc.roundedRect(40, yPos, (pageWidth - 100) / 2, 60, 5, 5, 'F');
    doc.roundedRect(
      40 + (pageWidth - 100) / 2 + 20,
      yPos,
      (pageWidth - 100) / 2,
      60,
      5,
      5,
      'F'
    );

    doc.setFont(undefined, 'normal');
    doc.text('Total Karyawan', 60, yPos + 25);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(18);
    doc.text(`${summaryData.totalKaryawan} orang`, 60, yPos + 45);

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Total Hari Kerja', 60 + (pageWidth - 100) / 2 + 20, yPos + 25);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(18);
    doc.text(
      `${summaryData.totalHariKerja} hari`,
      60 + (pageWidth - 100) / 2 + 20,
      yPos + 45
    );

    yPos += 80;

    // Rincian Kehadiran
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(220, 220, 240);
    doc.roundedRect(40, yPos, pageWidth - 80, 30, 5, 5, 'F');
    doc.text('Rincian Kehadiran:', 60, yPos + 20);

    yPos += 50;

    const details = [
      {
        label: 'Hadir Total',
        value: `${summaryData.totalHadir} (${summaryData.persentaseKehadiran}%)`,
        color: [200, 230, 255],
      },
      {
        label: 'Tepat Waktu',
        value: `${summaryData.totalTepat} (${summaryData.persentaseTepat}%)`,
        color: [200, 255, 200],
      },
      {
        label: 'Terlambat',
        value: `${summaryData.totalTelat} (${summaryData.persentaseTelat}%)`,
        color: [255, 255, 200],
      },
      {
        label: 'Alfa',
        value: `${summaryData.totalAlfa} (${summaryData.persentaseAlfa}%)`,
        color: [255, 200, 200],
      },
    ];

    // Gunakan ukuran yang sama dengan box Total Karyawan & Total Hari Kerja
    const boxWidth = (pageWidth - 100) / 2;
    const boxHeight = 60;
    let col = 0;
    let row = 0;

    details.forEach((detail, index) => {
      const xPos = 40 + col * (boxWidth + 20);
      const yBoxPos = yPos + row * (boxHeight + 10);

      doc.setFillColor(...detail.color);
      doc.roundedRect(xPos, yBoxPos, boxWidth, boxHeight, 5, 5, 'F');

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(detail.label, xPos + 15, yBoxPos + 25);

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(detail.value, xPos + 15, yBoxPos + 45);

      col++;
      if (col >= 2) {
        col = 0;
        row++;
      }
    });

    yPos += 140;

    // Deskripsi Kesimpulan Profil Absensi dengan Container
    doc.setFillColor(245, 245, 250);
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(1.5);
    doc.roundedRect(40, yPos, pageWidth - 80, 240, 5, 5, 'FD');

    yPos += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('Deskripsi Kesimpulan Profil Absensi', 60, yPos);

    yPos += 20;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    // Paragraf Pembuka
    const interpretasiText = `Profil absensi periode ${summaryData.periode} menunjukkan tingkat kehadiran ${summaryData.persentaseKehadiran}% yang termasuk kategori ${summaryData.predikat}.`;
    const interpretasiLines = doc.splitTextToSize(
      interpretasiText,
      pageWidth - 120
    );
    doc.text(interpretasiLines, 60, yPos);
    yPos += interpretasiLines.length * 12 + 10;

    // Analisis Kehadiran
    doc.setFont(undefined, 'bold');
    doc.text('Analisis Kehadiran:', 60, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 12;
    let analisisText = '';
    if (summaryData.persentaseKehadiran >= 96) {
      analisisText =
        'Tingkat kehadiran sangat luar biasa dengan konsistensi kehadiran hampir sempurna.';
    } else if (summaryData.persentaseKehadiran >= 91) {
      analisisText =
        'Tingkat kehadiran sangat memuaskan dengan komitmen tinggi dari guru & karyawan.';
    } else if (summaryData.persentaseKehadiran >= 86) {
      analisisText =
        'Tingkat kehadiran baik dan menunjukkan dedikasi yang konsisten.';
    } else if (summaryData.persentaseKehadiran >= 81) {
      analisisText =
        'Tingkat kehadiran cukup baik namun masih ada ruang perbaikan.';
    } else if (summaryData.persentaseKehadiran >= 76) {
      analisisText =
        'Tingkat kehadiran di bawah standar dengan cukup banyak ketidakhadiran.';
    } else {
      analisisText =
        'Tingkat kehadiran di bawah standar minimal dengan banyak ketidakhadiran tanpa keterangan jelas.';
    }
    const analisisLines = doc.splitTextToSize(analisisText, pageWidth - 120);
    doc.text(analisisLines, 60, yPos);
    yPos += analisisLines.length * 12 + 8;

    // Kesadaran Absensi
    doc.setFont(undefined, 'bold');
    doc.text('Kesadaran Absensi:', 60, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 12;
    let kesadaranText = '';
    if (summaryData.persentaseKehadiran >= 96) {
      kesadaranText =
        'Ketertiban scan masuk-pulang sangat sempurna. Hampir semua guru & karyawan konsisten melakukan scan lengkap.';
    } else if (summaryData.persentaseKehadiran >= 91) {
      kesadaranText =
        'Ketertiban scan masuk-pulang sangat baik. Mayoritas konsisten melakukan scan lengkap setiap hari.';
    } else if (summaryData.persentaseKehadiran >= 86) {
      kesadaranText =
        'Ketertiban scan masuk-pulang baik. Sebagian besar melakukan scan dengan tertib.';
    } else if (summaryData.persentaseKehadiran >= 81) {
      kesadaranText =
        'Ketertiban perlu ditingkatkan. Masih ditemukan kasus lupa scan pulang atau tidak scan sama sekali.';
    } else if (summaryData.persentaseKehadiran >= 76) {
      kesadaranText =
        'Ketertiban scan masuk-pulang kurang. Cukup banyak guru & karyawan lupa scan pulang sehingga data tidak lengkap.';
    } else {
      kesadaranText =
        'Ketertiban scan masuk-pulang rendah. Banyak guru & karyawan lupa scan pulang sehingga data tidak lengkap, menunjukkan kurangnya kesadaran administrasi.';
    }
    const kesadaranLines = doc.splitTextToSize(kesadaranText, pageWidth - 120);
    doc.text(kesadaranLines, 60, yPos);
    yPos += kesadaranLines.length * 12 + 8;

    // Kedisiplinan Waktu
    doc.setFont(undefined, 'bold');
    doc.text('Kedisiplinan Waktu:', 60, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 12;
    let kedisiplinanText = '';
    if (summaryData.persentaseKehadiran >= 96) {
      kedisiplinanText =
        'Ketepatan waktu sangat sempurna. Hampir semua datang sebelum jadwal yang ditentukan.';
    } else if (summaryData.persentaseKehadiran >= 91) {
      kedisiplinanText =
        'Ketepatan waktu sangat baik. Sebagian besar datang sebelum atau tepat jadwal yang ditentukan.';
    } else if (summaryData.persentaseKehadiran >= 86) {
      kedisiplinanText =
        'Ketepatan waktu baik. Mayoritas guru & karyawan datang tepat waktu sesuai jadwal.';
    } else if (summaryData.persentaseKehadiran >= 81) {
      kedisiplinanText =
        'Ketepatan waktu bervariasi. Sebagian disiplin namun masih ada yang sering terlambat.';
    } else if (summaryData.persentaseKehadiran >= 76) {
      kedisiplinanText =
        'Ketepatan waktu kurang. Cukup banyak guru & karyawan datang terlambat dari jadwal.';
    } else {
      kedisiplinanText =
        'Ketepatan waktu rendah. Banyak guru & karyawan datang terlambat setelah jadwal dimulai.';
    }
    const kedisiplinanLines = doc.splitTextToSize(
      kedisiplinanText,
      pageWidth - 120
    );
    doc.text(kedisiplinanLines, 60, yPos);
    yPos += kedisiplinanLines.length * 12 + 8;

    // Rekomendasi/Apresiasi
    doc.setFont(undefined, 'bold');
    const rekomendasiLabel =
      summaryData.persentaseKehadiran >= 91 ? 'Apresiasi:' : 'Rekomendasi:';
    doc.text(rekomendasiLabel, 60, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 12;
    let rekomendasiText = '';
    if (summaryData.persentaseKehadiran >= 96) {
      rekomendasiText =
        'Prestasi luar biasa! Pertahankan kedisiplinan sempurna ini dan jadilah teladan bagi yang lain.';
    } else if (summaryData.persentaseKehadiran >= 91) {
      rekomendasiText =
        'Prestasi sangat baik! Pertahankan disiplin ini dan tingkatkan menuju level UNGGUL.';
    } else if (summaryData.persentaseKehadiran >= 86) {
      rekomendasiText =
        'Performa baik, pertahankan dan tingkatkan konsistensi untuk mencapai kategori BAIK SEKALI.';
    } else if (summaryData.persentaseKehadiran >= 81) {
      rekomendasiText =
        'Disarankan reminder rutin dan evaluasi berkala untuk mencapai kategori BAIK atau BAIK SEKALI.';
    } else if (summaryData.persentaseKehadiran >= 76) {
      rekomendasiText =
        'Perlu pembinaan dan monitoring ketat untuk perbaikan kedisiplinan secara bertahap.';
    } else {
      rekomendasiText =
        'Perlu evaluasi individual, pembinaan intensif, dan penerapan sanksi tegas untuk perbaikan kedisiplinan.';
    }
    const rekomendasiLines = doc.splitTextToSize(
      rekomendasiText,
      pageWidth - 120
    );
    doc.text(rekomendasiLines, 60, yPos);

    // Tambahkan 3 Tabel Ranking jika ada
    if (rankingData) {
      // SELALU pindah ke halaman baru untuk peringkat
      doc.addPage();
      yPos = 40;

      // Header Peringkat (tanpa emoji)
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(40, yPos, pageWidth - 80, 40, 5, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('PERINGKAT GURU & KARYAWAN', 60, yPos + 25);

      yPos += 60;

      // Tabel 1: Disiplin Waktu Tertinggi
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(34, 197, 94); // Green
      doc.roundedRect(40, yPos, pageWidth - 80, 25, 5, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(
        '1. Peringkat Disiplin Waktu Tertinggi (Datang Sebelum Jadwal)',
        60,
        yPos + 17
      );

      yPos += 35;

      const table1Data = rankingData.topDisiplin.map((emp, idx) => [
        idx + 1,
        emp.id,
        emp.name,
        emp.position,
        emp.hijau,
        emp.persenHijau + '%',
      ]);

      autoTable(doc, {
        head: [
          ['Peringkat', 'ID', 'Nama', 'Jabatan', 'Total Hijau', 'Persentase'],
        ],
        body: table1Data,
        startY: yPos,
        theme: 'grid',
        headStyles: {
          fillColor: [34, 197, 94],
          fontStyle: 'bold',
          fontSize: 8,
        },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 },
          1: { halign: 'center', cellWidth: 35 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { halign: 'center', cellWidth: 35 },
          5: { halign: 'center', cellWidth: 40 },
        },
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // Cek halaman baru sebelum tabel 2
      if (yPos > 680) {
        doc.addPage();
        yPos = 40;
      }

      // Tabel 2: Tertib Administrasi
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(59, 130, 246); // Blue
      doc.roundedRect(40, yPos, pageWidth - 80, 25, 5, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(
        '2. Peringkat Tertib Administrasi (Scan Masuk & Pulang Lengkap)',
        60,
        yPos + 17
      );

      yPos += 35;

      const table2Data = rankingData.topTertib.map((emp, idx) => [
        idx + 1,
        emp.id,
        emp.name,
        emp.position,
        emp.biru,
        emp.persenBiru + '%',
      ]);

      autoTable(doc, {
        head: [
          ['Peringkat', 'ID', 'Nama', 'Jabatan', 'Total Biru', 'Persentase'],
        ],
        body: table2Data,
        startY: yPos,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          fontStyle: 'bold',
          fontSize: 8,
        },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 },
          1: { halign: 'center', cellWidth: 35 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { halign: 'center', cellWidth: 35 },
          5: { halign: 'center', cellWidth: 40 },
        },
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // Cek halaman baru sebelum tabel 3
      if (yPos > 680) {
        doc.addPage();
        yPos = 40;
      }

      // Tabel 3: Rendah Kesadaran
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(239, 68, 68); // Red
      doc.roundedRect(40, yPos, pageWidth - 80, 25, 5, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(
        '3. Peringkat Rendah Kesadaran Absensi (Alfa/Tidak Scan)',
        60,
        yPos + 17
      );

      yPos += 35;

      const table3Data = rankingData.topRendah.map((emp, idx) => [
        idx + 1,
        emp.id,
        emp.name,
        emp.position,
        emp.merah,
        emp.persenMerah + '%',
      ]);

      autoTable(doc, {
        head: [
          ['Peringkat', 'ID', 'Nama', 'Jabatan', 'Total Merah', 'Persentase'],
        ],
        body: table3Data,
        startY: yPos,
        theme: 'grid',
        headStyles: {
          fillColor: [239, 68, 68],
          fontStyle: 'bold',
          fontSize: 8,
        },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 },
          1: { halign: 'center', cellWidth: 35 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { halign: 'center', cellWidth: 35 },
          5: { halign: 'center', cellWidth: 40 },
        },
      });
    }

    doc.save('kesimpulan_profil_absensi.pdf');
  };
  const downloadAllTablesAsExcel = () => {
    if (!recapData) {
      alert('Silakan generate tabel rekap terlebih dahulu');
      return;
    }

    // Helper function untuk clone dan style table
    const prepareTableHTML = (tableId, title) => {
      const table = document.getElementById(tableId);
      if (!table) return '';

      const clonedTable = table.cloneNode(true);

      // Inject inline styles ke setiap cell
      const allCells = clonedTable.querySelectorAll('td, th');
      allCells.forEach((cell) => {
        const classList = cell.className;
        let bgColor = '#FFFFFF';
        let fontWeight = 'normal';
        let textAlign = 'center';

        // Deteksi warna dari className
        if (
          classList.includes('bg-blue-200') ||
          classList.includes('bg-blue-100')
        ) {
          bgColor = '#ADD8E6';
        } else if (classList.includes('bg-blue-300')) {
          bgColor = '#93C5FD';
        } else if (
          classList.includes('bg-yellow-200') ||
          classList.includes('bg-yellow-100')
        ) {
          bgColor = '#FFFF99';
        } else if (classList.includes('bg-yellow-300')) {
          bgColor = '#FDE047';
        } else if (
          classList.includes('bg-red-200') ||
          classList.includes('bg-red-100')
        ) {
          bgColor = '#FFB3B3';
        } else if (
          classList.includes('bg-green-200') ||
          classList.includes('bg-green-100')
        ) {
          bgColor = '#90EE90';
        } else if (classList.includes('bg-green-300')) {
          bgColor = '#86EFAC';
        } else if (classList.includes('bg-gray-100')) {
          bgColor = '#F3F4F6';
        } else if (classList.includes('bg-gray-600')) {
          bgColor = '#4B5563';
        } else if (classList.includes('bg-gray-700')) {
          bgColor = '#374151';
        } else if (classList.includes('bg-purple-100')) {
          bgColor = '#E9D5FF';
        } else if (classList.includes('bg-indigo-100')) {
          bgColor = '#C7D2FE';
        } else if (classList.includes('bg-gray-300')) {
          bgColor = '#D1D5DB';
        }

        // Check inline background color
        if (cell.style.backgroundColor) {
          const inlineColor = cell.style.backgroundColor;
          if (inlineColor.startsWith('rgb')) {
            const match = inlineColor.match(/\d+/g);
            if (match && match.length >= 3) {
              bgColor =
                '#' +
                match
                  .slice(0, 3)
                  .map((x) => parseInt(x).toString(16).padStart(2, '0'))
                  .join('');
            }
          } else if (inlineColor.startsWith('#')) {
            bgColor = inlineColor;
          }
        }

        // Deteksi bold
        if (classList.includes('font-bold')) {
          fontWeight = 'bold';
        }

        // Set inline style untuk Excel
        cell.setAttribute(
          'style',
          `background-color: ${bgColor}; font-weight: ${fontWeight}; text-align: ${textAlign}; border: 1px solid #000000; padding: 5px;`
        );
      });

      // Wrap dengan div dan title
      return `
        <div style="margin-top: 10px; margin-bottom: 20px;">
          <p style="color: black; padding: 8px 0; text-align: left; margin: 0; font-weight: bold; font-size: 14pt;">${title}</p>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-top: 0;">
            ${clonedTable.innerHTML}
          </table>
        </div>
      `;
    };

    // Prepare 3 tabel dengan title
    const table1HTML = prepareTableHTML('tabel1', '1. REKAP MESIN');
    const table2HTML = prepareTableHTML('tabel2', '2. KEDISIPLINAN WAKTU');
    const table3HTML = prepareTableHTML('tabel3', '3. EVALUASI KEHADIRAN');

    // Gabungkan horizontal dalam 1 HTML
    let html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; }
            td, th { border: 1px solid #000000; padding: 5px; }
            p { font-size: 14pt; font-weight: bold; color: black; }
          </style>
        </head>
        <body>
          <div style="margin-top: 10px;">
            ${table1HTML}
            ${table2HTML}
            ${table3HTML}
          </div>
        </body>
      </html>
    `;

    // Create blob dan download
    const blob = new Blob([html], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `rekap_absensi_lengkap_${timestamp}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);

    setTimeout(() => {
      alert(
        '✅ Excel berhasil didownload!\n\n💡 Tips: Scroll ke bawah untuk melihat tabel 2 dan 3'
      );
    }, 500);
  };

  const renderSummary = () => {
    if (!summaryData) return null;

    return (
      <div
        ref={summaryRef}
        className={
          'p-6 rounded-xl shadow-lg text-white bg-gradient-to-br mb-8 ' +
          summaryData.warna
        }
      >
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            {summaryData.icon} KESIMPULAN PROFIL ABSENSI
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadSummaryAsPdf}
              className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg hover:bg-opacity-30 flex items-center gap-2 text-sm transition-all border border-white border-opacity-30"
            >
              <Download size={16} /> <span className="md:hidden">PDF</span><span className="hidden md:inline">Download PDF</span>
            </button>
            <button
              onClick={downloadAllTablesAsExcel}
              className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg hover:bg-opacity-30 flex items-center gap-2 text-sm transition-all border border-white border-opacity-30"
            >
              <Download size={16} /> <span className="md:hidden">Excel</span><span className="hidden md:inline">Download Excel (3 Tabel)</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg hover:bg-opacity-30 flex items-center gap-2 text-sm transition-all border border-white border-opacity-30"
            >
              <FileText size={16} /> <span className="md:hidden">Copy JPG</span><span className="hidden md:inline">Copy JPG</span>
            </button>
            <button
              onClick={handleDownloadSummaryJPG}
              className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg hover:bg-opacity-30 flex items-center gap-2 text-sm transition-all border border-white border-opacity-30"
            >
              <Download size={16} /> <span className="md:hidden">JPG</span><span className="hidden md:inline">Download JPG</span>
            </button>
          </div>
        </div>
        {/* MODIFIKASI DISINI: 
          Menggunakan Grid 3 Kolom untuk:
          1. Periode/Status
          2. Total Guru
          3. Hari Kerja
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* KOLOM 1: Periode & Status */}
          <div className="bg-white bg-opacity-20 rounded-lg p-5 flex flex-col justify-center">
            <p className="text-lg font-semibold mb-1 opacity-90">
              Periode: {summaryData.periode}
            </p>
            <p className="text-4xl font-bold my-2">{summaryData.predikat}</p>
            <p className="text-lg opacity-90">
              Tingkat Kehadiran: {summaryData.persentaseKehadiran}%
            </p>
          </div>

          {/* KOLOM 2: Total Guru */}
          <div className="bg-white bg-opacity-20 rounded-lg p-5 flex flex-col justify-center">
            <p className="text-sm opacity-90 mb-1">Total Guru & Karyawan</p>
            <p className="text-3xl font-bold">
              {summaryData.totalKaryawan} orang
            </p>
          </div>

          {/* KOLOM 3: Hari Kerja */}
          <div className="bg-white bg-opacity-20 rounded-lg p-5 flex flex-col justify-center">
            <p className="text-sm opacity-90 mb-1">
              Hari Kerja Guru & Karyawan
            </p>
            <p className="text-3xl font-bold">
              {summaryData.totalHariKerja} hari
            </p>
          </div>
        </div>

        {/* Bagian Bawah: Rincian Kehadiran (Tetap full width) */}
        <div className="bg-white bg-opacity-20 rounded-lg p-5">
          <p className="font-semibold mb-4 text-lg">Rincian Kehadiran:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="opacity-80 text-xs uppercase tracking-wider mb-1">
                Hadir Total
              </p>
              <p className="text-xl font-bold">
                {summaryData.totalHadir}{' '}
                <span className="text-base font-normal opacity-90">
                  ({summaryData.persentaseKehadiran}%)
                </span>
              </p>
            </div>
            <div>
              <p className="opacity-80 text-xs uppercase tracking-wider mb-1">
                Tepat Waktu
              </p>
              <p className="text-xl font-bold">
                {summaryData.totalTepat}{' '}
                <span className="text-base font-normal opacity-90">
                  ({summaryData.persentaseTepat}%)
                </span>
              </p>
            </div>
            <div>
              <p className="opacity-80 text-xs uppercase tracking-wider mb-1">
                Terlambat
              </p>
              <p className="text-xl font-bold">
                {summaryData.totalTelat}{' '}
                <span className="text-base font-normal opacity-90">
                  ({summaryData.persentaseTelat}%)
                </span>
              </p>
            </div>
            <div>
              <p className="opacity-80 text-xs uppercase tracking-wider mb-1">
                Alfa
              </p>
              <p className="text-xl font-bold">
                {summaryData.totalAlfa}{' '}
                <span className="text-base font-normal opacity-90">
                  ({summaryData.persentaseAlfa}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white bg-opacity-10 rounded-lg text-sm">
          <p className="opacity-90 mb-2">
            <strong>Deskripsi Kesimpulan Profil Absensi</strong>
          </p>
          <p className="opacity-90 mb-4">
            Profil absensi periode {summaryData.periode} menunjukkan tingkat
            kehadiran {summaryData.persentaseKehadiran}% yang termasuk kategori{' '}
            <strong>{summaryData.predikat}</strong>.
          </p>

          {/* Layout 3 Kolom dengan Grid */}
          <div className="space-y-3">
            {/* Analisis Kehadiran */}
            <div className="grid grid-cols-[160px_auto_1fr] gap-2 opacity-90">
              <div className="font-bold">Analisis Kehadiran</div>
              <div>:</div>
              <div className="flex-1">
                {summaryData.persentaseKehadiran >= 96 &&
                  'Tingkat kehadiran sangat luar biasa dengan konsistensi kehadiran hampir sempurna.'}
                {summaryData.persentaseKehadiran >= 91 &&
                  summaryData.persentaseKehadiran < 96 &&
                  'Tingkat kehadiran sangat memuaskan dengan komitmen tinggi dari guru & karyawan.'}
                {summaryData.persentaseKehadiran >= 86 &&
                  summaryData.persentaseKehadiran < 91 &&
                  'Tingkat kehadiran baik dan menunjukkan dedikasi yang konsisten.'}
                {summaryData.persentaseKehadiran >= 81 &&
                  summaryData.persentaseKehadiran < 86 &&
                  'Tingkat kehadiran cukup baik namun masih ada ruang perbaikan.'}
                {summaryData.persentaseKehadiran >= 76 &&
                  summaryData.persentaseKehadiran < 81 &&
                  'Tingkat kehadiran di bawah standar dengan cukup banyak ketidakhadiran.'}
                {summaryData.persentaseKehadiran < 76 &&
                  'Tingkat kehadiran di bawah standar minimal dengan banyak ketidakhadiran tanpa keterangan jelas.'}
              </div>
            </div>

            {/* Kesadaran Absensi */}
            <div className="grid grid-cols-[160px_auto_1fr] gap-2 opacity-90">
              <div className="font-bold">Kesadaran Absensi</div>
              <div>:</div>{' '}
              <div className="flex-1">
                {summaryData.persentaseKehadiran >= 96 &&
                  'Ketertiban scan masuk-pulang sangat sempurna. Hampir semua guru & karyawan konsisten melakukan scan lengkap.'}
                {summaryData.persentaseKehadiran >= 91 &&
                  summaryData.persentaseKehadiran < 96 &&
                  'Ketertiban scan masuk-pulang sangat baik. Mayoritas konsisten melakukan scan lengkap setiap hari.'}
                {summaryData.persentaseKehadiran >= 86 &&
                  summaryData.persentaseKehadiran < 91 &&
                  'Ketertiban scan masuk-pulang baik. Sebagian besar melakukan scan dengan tertib.'}
                {summaryData.persentaseKehadiran >= 81 &&
                  summaryData.persentaseKehadiran < 86 &&
                  'Ketertiban perlu ditingkatkan. Masih ditemukan kasus lupa scan pulang atau tidak scan sama sekali.'}
                {summaryData.persentaseKehadiran >= 76 &&
                  summaryData.persentaseKehadiran < 81 &&
                  'Ketertiban scan masuk-pulang kurang. Cukup banyak guru & karyawan lupa scan pulang sehingga data tidak lengkap.'}
                {summaryData.persentaseKehadiran < 76 &&
                  'Ketertiban scan masuk-pulang rendah. Banyak guru & karyawan lupa scan pulang sehingga data tidak lengkap, menunjukkan kurangnya kesadaran administrasi.'}
              </div>
            </div>

            {/* Kedisiplinan Waktu */}
            <div className="grid grid-cols-[160px_auto_1fr] gap-2 opacity-90">
              <div className="font-bold">Kedisiplinan Waktu</div>
              <div>:</div>
              <div className="flex-1">
                {summaryData.persentaseKehadiran >= 96 &&
                  'Ketepatan waktu sangat sempurna. Hampir semua datang sebelum jadwal yang ditentukan.'}
                {summaryData.persentaseKehadiran >= 91 &&
                  summaryData.persentaseKehadiran < 96 &&
                  'Ketepatan waktu sangat baik. Sebagian besar datang sebelum atau tepat jadwal yang ditentukan.'}
                {summaryData.persentaseKehadiran >= 86 &&
                  summaryData.persentaseKehadiran < 91 &&
                  'Ketepatan waktu baik. Mayoritas guru & karyawan datang tepat waktu sesuai jadwal.'}
                {summaryData.persentaseKehadiran >= 81 &&
                  summaryData.persentaseKehadiran < 86 &&
                  'Ketepatan waktu bervariasi. Sebagian disiplin namun masih ada yang sering terlambat.'}
                {summaryData.persentaseKehadiran >= 76 &&
                  summaryData.persentaseKehadiran < 81 &&
                  'Ketepatan waktu kurang. Cukup banyak guru & karyawan datang terlambat dari jadwal.'}
                {summaryData.persentaseKehadiran < 76 &&
                  'Ketepatan waktu rendah. Banyak guru & karyawan datang terlambat setelah jadwal dimulai.'}
              </div>
            </div>

            {/* Rekomendasi/Apresiasi */}
            <div className="grid grid-cols-[160px_auto_1fr] gap-2 opacity-90">
              <div className="font-bold">
                {summaryData.persentaseKehadiran >= 91
                  ? 'Apresiasi'
                  : 'Rekomendasi'}
              </div>
              <div>:</div>
              <div className="flex-1">
                {summaryData.persentaseKehadiran >= 96 &&
                  'Prestasi luar biasa! Pertahankan kedisiplinan sempurna ini dan jadilah teladan bagi yang lain.'}
                {summaryData.persentaseKehadiran >= 91 &&
                  summaryData.persentaseKehadiran < 96 &&
                  'Prestasi sangat baik! Pertahankan disiplin ini dan tingkatkan menuju level UNGGUL.'}
                {summaryData.persentaseKehadiran >= 86 &&
                  summaryData.persentaseKehadiran < 91 &&
                  'Performa baik, pertahankan dan tingkatkan konsistensi untuk mencapai kategori BAIK SEKALI.'}
                {summaryData.persentaseKehadiran >= 81 &&
                  summaryData.persentaseKehadiran < 86 &&
                  'Disarankan reminder rutin dan evaluasi berkala untuk mencapai kategori BAIK atau BAIK SEKALI.'}
                {summaryData.persentaseKehadiran >= 76 &&
                  summaryData.persentaseKehadiran < 81 &&
                  'Perlu pembinaan dan monitoring ketat untuk perbaikan kedisiplinan secara bertahap.'}
                {summaryData.persentaseKehadiran < 76 &&
                  'Perlu evaluasi individual, pembinaan intensif, dan penerapan sanksi tegas untuk perbaikan kedisiplinan.'}
              </div>
            </div>
          </div>
        </div>




      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <img
                src="https://numufidz.github.io/overlay/logo_mtsannur.png" // Ganti dengan path logo sekolah Anda
                alt="Logo MTs. An-Nur Bululawang"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-indigo-800">
                  Sistem Rekap Absensi
                </h1>
                <h2 className="text-xl font-semibold text-gray-800">
                  MTs. An-Nur Bululawang
                </h2>
                <p className="text-sm text-gray-600">
                  Jl. Diponegoro IV Bululawang
                </p>
              </div>
            </div>
            <div className="text-center md:text-right text-sm text-gray-500">
              <p>Powered by:</p>
              <p>Matsanuba Management Technology</p>
              <p>Version 1.0 Netlify | © 2025</p>
            </div>
          </div>
          <p className="text-gray-600 mb-8 border-t pt-4">
            Sistem profesional untuk evaluasi absensi karyawan berdasarkan data
            mesin fingerprint dan jadwal kerja. Menyediakan analisis
            kedisiplinan, rekap mentah, dan peringkat performa secara akurat dan
            efisien.
          </p>
          {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 relative">
              <label className="cursor-pointer block">
                <div className="flex flex-col items-center gap-3">
                  <Upload className="text-indigo-600" size={40} />
                  <span className="text-lg font-semibold text-gray-700">
                    Laporan Absensi
                  </span>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Upload file excel yang diunduh dari{' '}
                    <a
                      href="https://fingerspot.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline"
                    >
                      fingerspot.io
                    </a>
                    {' '}atau mesin absensi Fingerspot.{' '}
                    <a
                      href="/contoh_attendance_report_detail_fingerspot.xlsx"
                      download
                      className="text-indigo-600 hover:text-indigo-800 underline font-medium block mt-1"
                    >
                      Download contoh file rekap di sini
                    </a>
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) =>
                    e.target.files &&
                    e.target.files[0] &&
                    processAttendanceFile(e.target.files[0])
                  }
                  className="hidden"
                />
              </label>
              {isLoadingAttendance && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                  <Loader className="animate-spin text-indigo-600" size={40} />
                </div>
              )}
              {attendanceData.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium text-sm">
                    Data dimuat
                  </p>
                </div>
              )}
            </div>
            <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 relative">
              <label className="cursor-pointer block">
                <div className="flex flex-col items-center gap-3">
                  <Upload className="text-purple-600" size={40} />
                  <span className="text-lg font-semibold text-gray-700">
                    Jadwal Kerja
                  </span>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Upload file jadwal kerja,{' '}
                    <a
                      href="/template_jadwal_kerja.xlsx"
                      download
                      className="text-purple-600 hover:text-purple-800 underline font-medium"
                    >
                      klik di sini untuk contoh format
                    </a>
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) =>
                    e.target.files &&
                    e.target.files[0] &&
                    processScheduleFile(e.target.files[0])
                  }
                  className="hidden"
                />
              </label>
              {isLoadingSchedule && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                  <Loader className="animate-spin text-purple-600" size={40} />
                </div>
              )}
              {scheduleData.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium text-sm">
                    {scheduleData.length} jadwal
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-6 mb-8">
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Pengaturan Periode & Libur</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                {/* Kolom 1: Tanggal Awal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Awal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Kolom 2: Tanggal Akhir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Kolom 3: Input Hari Libur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    🎉 Libur Khusus
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newHoliday}
                      onChange={(e) => setNewHoliday(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Pilih tanggal"
                    />
                    <button
                      onClick={addHoliday}
                      className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
                      title="Tambah Hari Libur"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Kolom 4: List Libur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daftar Libur ({holidays.length})
                  </label>
                  <div className="bg-white p-2 rounded-lg border border-gray-200 h-[42px] overflow-x-auto overflow-y-hidden whitespace-nowrap flex items-center">
                    {holidays.length > 0 ? (
                      <div className="flex gap-2">
                        {holidays.map((date, idx) => (
                          <div
                            key={idx}
                            className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs flex items-center gap-1 flex-shrink-0"
                          >
                            <span>{getDateLabel(date)}</span>
                            <button
                              onClick={() => removeHoliday(date)}
                              className="hover:text-red-900 focus:outline-none flex items-center"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic px-1">Belum ada data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Generate</h4>
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={generateRecapTables}
                  disabled={attendanceData.length === 0}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                >
                  Tabel Rekap
                </button>
                <button
                  onClick={downloadCompletePdf}
                  disabled={!recapData}
                  className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  <span className="md:hidden">PDF Laporan</span><span className="hidden md:inline">Download PDF Laporan Lengkap</span>
                </button>
              </div>
            </div>
          </div>
          {recapData && (
            <div className="flex gap-2 mb-6 border-b overflow-x-auto">
              <button
                onClick={() => setActiveRecapTab('summary')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeRecapTab === 'summary'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                1. Profil Absensi
              </button>
              <button
                onClick={() => setActiveRecapTab('category')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeRecapTab === 'category'
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                2. Evaluasi Kategori
              </button>
              <button
                onClick={() => setActiveRecapTab('ranking')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeRecapTab === 'ranking'
                  ? 'text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                3. Peringkat
              </button>
              <button
                onClick={() => setActiveRecapTab('table1')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeRecapTab === 'table1'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                4. Rekap Mesin
              </button>
              <button
                onClick={() => setActiveRecapTab('table2')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeRecapTab === 'table2'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                5. Kedisiplinan
              </button>
              <button
                onClick={() => setActiveRecapTab('table3')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeRecapTab === 'table3'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                6. Evaluasi
              </button>
              <button
                onClick={() => setActiveRecapTab('guide')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeRecapTab === 'guide'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                7. Panduan
              </button>
            </div>
          )}
          <div className="space-y-8">
            {activeRecapTab === 'summary' && renderSummary()}
            {activeRecapTab === 'category' && categoryEvaluation && (
              <div
                ref={categoryRef}
                className="p-8 rounded-xl shadow-lg bg-gradient-to-br from-indigo-50 to-teal-100 border border-indigo-200"
              >
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-indigo-900 mb-2">📊 Evaluasi Berdasarkan Kategori</h2>
                      <p className="text-indigo-700">Analisis kehadiran dan kedisiplinan per kategori jabatan</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={downloadCategoryAsPdf}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                      >
                        <Download size={16} /> <span className="md:hidden">PDF</span><span className="hidden md:inline">Download PDF</span>
                      </button>
                      <button
                        onClick={handleCopyCategory}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                      >
                        <FileText size={16} /> <span className="md:hidden">Copy JPG</span><span className="hidden md:inline">Copy JPG</span>
                      </button>
                      <button
                        onClick={handleDownloadCategoryJPG}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                      >
                        <Download size={16} /> <span className="md:hidden">JPG</span><span className="hidden md:inline">Download JPG</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Komponen Evaluasi */}
                <div className="space-y-6 mb-8">
                  <h3 className="text-xl font-bold text-indigo-800">1. Kehadiran</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Pimpinan', 'Guru', 'Tendik'].map((cat) => (
                      <div key={cat} className="bg-white p-4 rounded-lg shadow">
                        <h4 className="font-bold text-lg mb-2 text-gray-800">{cat}</h4>
                        <p className="text-sm text-gray-600">Jumlah: {categoryEvaluation[cat].count} orang</p>
                        <p className="text-3xl font-bold text-teal-800 mt-2">
                          {categoryEvaluation[cat].persenKehadiran}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {categoryEvaluation[cat].totalHadir} dari {categoryEvaluation[cat].totalHariKerja} hari kerja
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <h3 className="text-xl font-bold text-indigo-800">2. Kedisiplinan Waktu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Pimpinan', 'Guru', 'Tendik'].map((cat) => (
                      <div key={cat} className="bg-white p-4 rounded-lg shadow">
                        <h4 className="font-bold text-lg mb-2 text-gray-800">{cat}</h4>
                        <p className="text-sm text-gray-600">Tepat Waktu</p>
                        <p className="text-3xl font-bold text-green-800 mt-2">
                          {categoryEvaluation[cat].persenTepat}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {categoryEvaluation[cat].totalTepat} dari {categoryEvaluation[cat].totalHadir} hari hadir
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hasil Evaluasi */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-xl font-bold mb-4 text-teal-700">Hasil Evaluasi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                    <div>
                      <h4 className="font-bold text-teal-800 mb-2">1. Kehadiran</h4>
                      <ul className="list-disc list-inside space-y-1 pl-2">
                        <li><strong>Pimpinan:</strong> {categoryEvaluation.Pimpinan.persenKehadiran}% ({getPredicate(categoryEvaluation.Pimpinan.persenKehadiran)})</li>
                        <li><strong>Guru:</strong> {categoryEvaluation.Guru.persenKehadiran}% ({getPredicate(categoryEvaluation.Guru.persenKehadiran)})</li>
                        <li><strong>Tenaga Kependidikan:</strong> {categoryEvaluation.Tendik.persenKehadiran}% ({getPredicate(categoryEvaluation.Tendik.persenKehadiran)})</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-teal-800 mb-2">2. Kedisiplinan Waktu</h4>
                      <ul className="list-disc list-inside space-y-1 pl-2">
                        <li><strong>Pimpinan:</strong> {categoryEvaluation.Pimpinan.persenTepat}% ({getPredicate(categoryEvaluation.Pimpinan.persenTepat)})</li>
                        <li><strong>Guru:</strong> {categoryEvaluation.Guru.persenTepat}% ({getPredicate(categoryEvaluation.Guru.persenTepat)})</li>
                        <li><strong>Tenaga Kependidikan:</strong> {categoryEvaluation.Tendik.persenTepat}% ({getPredicate(categoryEvaluation.Tendik.persenTepat)})</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Rekomendasi */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold mb-4 text-teal-700">Rekomendasi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold">1. Pimpinan</h4>
                        <p className="text-sm">Semua pimpinan dapat mempertahankan atau meningkatkan tingkat kehadiran mereka di masa depan.</p>
                      </div>
                      <div>
                        <h4 className="font-bold">2. Guru</h4>
                        <p className="text-sm">Perlunya peningkatan dalam hal kehadiran bagi beberapa individu.</p>
                      </div>
                      <div>
                        <h4 className="font-bold">3. Tenaga Kependidikan</h4>
                        <p className="text-sm">Perlu diterapkan upaya perbaikan dan penegasan disiplin kehadiran.</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Rekomendasi Umum</h4>
                      <div className="pl-4 border-l-4 border-teal-500">
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Meningkatkan pemantauan waktu kedatangan dan kepulangan</li>
                          <li>Mengadakan pembinaan manajemen waktu</li>
                          <li>Menerapkan sanksi untuk keterlambatan dan beri penghargaan bagi yang tepat waktu</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeRecapTab === 'ranking' && rankingData && (
              <div
                ref={rankingRef}
                className="p-8 rounded-xl shadow-lg bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200"
              >
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-3xl font-bold text-amber-900 mb-2 flex items-center gap-2">
                        🏆 Peringkat Guru & Karyawan
                      </h3>
                      <p className="text-amber-700">Ranking berdasarkan disiplin waktu dan ketertiban administrasi</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={downloadRankingAsPdf}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                      >
                        <Download size={16} /> <span className="md:hidden">PDF</span><span className="hidden md:inline">Download PDF</span>
                      </button>
                      <button
                        onClick={handleCopyRanking}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                      >
                        <FileText size={16} /> <span className="md:hidden">Copy JPG</span><span className="hidden md:inline">Copy JPG</span>
                      </button>
                      <button
                        onClick={handleDownloadRankingJPG}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                      >
                        <Download size={16} /> <span className="md:hidden">JPG</span><span className="hidden md:inline">Download JPG</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Tabel 1: Disiplin Waktu Tertinggi */}
                  <div className="bg-white rounded-lg p-5 shadow-md">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        1
                      </span>
                      Peringkat Disiplin Waktu Tertinggi (Datang Sebelum Jadwal)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm bg-white rounded-lg">
                        <thead className="bg-green-600 text-white">
                          <tr>
                            <th className="px-3 py-2 text-center w-20">Peringkat</th>
                            <th className="px-3 py-2 text-center w-24">ID</th>
                            <th className="px-3 py-2 text-left w-64">Nama</th>
                            <th className="px-3 py-2 text-left w-48">Jabatan</th>
                            <th className="px-3 py-2 text-center w-28">
                              Total Hijau
                            </th>
                            <th className="px-3 py-2 text-center w-28">Persentase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankingData.topDisiplin.map((emp, idx) => (
                            <tr
                              key={emp.id}
                              className={idx % 2 === 0 ? 'bg-green-50' : 'bg-white'}
                            >
                              <td className="px-3 py-2 text-center font-bold text-green-700">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-700">
                                {emp.id}
                              </td>
                              <td className="px-3 py-2 text-gray-800">{emp.name}</td>
                              <td className="px-3 py-2 text-gray-600 text-sm">
                                {emp.position}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-green-600">
                                {emp.hijau}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-green-600">
                                {emp.persenHijau}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabel 2: Tertib Administrasi */}
                  <div className="bg-white rounded-lg p-5 shadow-md">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                        2
                      </span>
                      Peringkat Tertib Administrasi (Scan Masuk & Pulang Lengkap)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm bg-white rounded-lg">
                        <thead className="bg-blue-600 text-white">
                          <tr>
                            <th className="px-3 py-2 text-center w-20">Peringkat</th>
                            <th className="px-3 py-2 text-center w-24">ID</th>
                            <th className="px-3 py-2 text-left w-64">Nama</th>
                            <th className="px-3 py-2 text-left w-48">Jabatan</th>
                            <th className="px-3 py-2 text-center w-28">Total Biru</th>
                            <th className="px-3 py-2 text-center w-28">Persentase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankingData.topTertib.map((emp, idx) => (
                            <tr
                              key={emp.id}
                              className={idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}
                            >
                              <td className="px-3 py-2 text-center font-bold text-blue-700">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-700">
                                {emp.id}
                              </td>
                              <td className="px-3 py-2 text-gray-800">{emp.name}</td>
                              <td className="px-3 py-2 text-gray-600 text-sm">
                                {emp.position}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-blue-600">
                                {emp.biru}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-blue-600">
                                {emp.persenBiru}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabel 3: Rendah Kesadaran */}
                  <div className="bg-white rounded-lg p-5 shadow-md">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        3
                      </span>
                      Peringkat Rendah Kesadaran Absensi (Alfa/Tidak Scan)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm bg-white rounded-lg">
                        <thead className="bg-red-600 text-white">
                          <tr>
                            <th className="px-3 py-2 text-center w-20">Peringkat</th>
                            <th className="px-3 py-2 text-center w-24">ID</th>
                            <th className="px-3 py-2 text-left w-64">Nama</th>
                            <th className="px-3 py-2 text-left w-48">Jabatan</th>
                            <th className="px-3 py-2 text-center w-28">
                              Total Merah
                            </th>
                            <th className="px-3 py-2 text-center w-28">Persentase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankingData.topRendah.map((emp, idx) => (
                            <tr
                              key={emp.id}
                              className={idx % 2 === 0 ? 'bg-red-50' : 'bg-white'}
                            >
                              <td className="px-3 py-2 text-center font-bold text-red-700">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-700">
                                {emp.id}
                              </td>
                              <td className="px-3 py-2 text-gray-800">{emp.name}</td>
                              <td className="px-3 py-2 text-gray-600 text-sm">
                                {emp.position}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-red-600">
                                {emp.merah}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-red-600">
                                {emp.persenMerah}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeRecapTab === 'guide' && (
              <div
                ref={panduanRef}
                className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl"
              >
                <div className="max-w-6xl mx-auto p-6 bg-gray-50">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                    <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      📊 Panduan Lengkap 3 Tabel Rekap
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyPanduan}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all text-sm"
                      >
                        <FileText size={16} />
                        Copy JPG
                      </button>
                      <button
                        onClick={handleDownloadPanduan}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all text-sm"
                      >
                        <Download size={16} />
                        Download JPG
                      </button>
                    </div>
                  </div>

                  {/* TABEL 1: Rekap Mesin */}
                  <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <h5 className="font-bold text-xl text-blue-700 mb-3">
                      1️⃣ Rekap Mesin (Data Mentah)
                    </h5>
                    <p className="text-gray-700 mb-5">
                      Data langsung dari mesin fingerprint tanpa proses evaluasi
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Biru */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-blue-300 rounded-lg flex flex-col items-center justify-center text-xs font-bold">
                              <div>07:15</div>
                              <div className="text-blue-800">16:30</div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-blue-800 text-base">
                              🔵 BIRU = Scan Lengkap
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Scan <strong>MASUK dan PULANG</strong> keduanya
                              tercatat
                            </p>
                            <p className="text-xs text-blue-700 mt-1 italic">
                              ✅ Data absensi lengkap
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Kuning */}
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-yellow-300 rounded-lg flex flex-col items-center justify-center text-xs font-bold">
                              <div>07:15</div>
                              <div className="text-yellow-800">-</div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-yellow-800 text-base">
                              🟡 KUNING = Scan Tidak Lengkap
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Hanya scan <strong>MASUK saja</strong> atau{' '}
                              <strong>PULANG saja</strong>
                            </p>
                            <p className="text-xs text-yellow-700 mt-1 italic">
                              ⚠️ Data absensi tidak lengkap
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Merah */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-red-300 rounded-lg flex flex-col items-center justify-center text-xs font-bold">
                              <div>-</div>
                              <div className="text-red-800">-</div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-red-800 text-base">
                              🔴 MERAH = Tidak Scan
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Tidak ada scan{' '}
                              <strong>MASUK maupun PULANG</strong> (Alpha)
                            </p>
                            <p className="text-xs text-red-700 mt-1 italic">
                              ❌ Tidak ada data absensi
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Putih L */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-white border-2 border-gray-400 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-700">
                              L
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-gray-800 text-base">
                              ⚪ PUTIH + L = Libur
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Hari <strong>LIBUR</strong> atau tidak ada jadwal
                              (Jumat/OFF)
                            </p>
                            <p className="text-xs text-gray-600 mt-1 italic">
                              📅 Tidak perlu scan
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TABEL 2: Kedisiplinan Waktu */}
                  <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                    <h5 className="font-bold text-xl text-green-700 mb-3">
                      2️⃣ Kedisiplinan Waktu (Evaluasi Disiplin)
                    </h5>
                    <p className="text-gray-700 mb-5">
                      Evaluasi kedisiplinan berdasarkan jadwal mengajar dan
                      kelengkapan scan
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Hijau */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-green-300 rounded-lg flex flex-col items-center justify-center text-xs font-bold">
                              <div>Jadwal: 07:00</div>
                              <div className="text-green-800">
                                Scan: 06:45 ✓
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-green-800 text-base">
                              🟢 HIJAU = Disiplin Tinggi
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Datang <strong>SEBELUM</strong> jadwal mengajar
                              dimulai
                            </p>
                            <p className="text-xs text-green-700 mt-1 italic">
                              ✨ Guru paling disiplin!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Biru */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-blue-300 rounded-lg flex flex-col items-center justify-center text-xs font-bold">
                              <div>Masuk: 07:15</div>
                              <div className="text-blue-800">
                                Pulang: 16:30 ✓
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-blue-800 text-base">
                              🔵 BIRU = Scan Lengkap
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Scan <strong>MASUK dan PULANG</strong> lengkap
                              (administrasi tertib)
                            </p>
                            <p className="text-xs text-blue-700 mt-1 italic">
                              📋 Tertib administrasi
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Kuning */}
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-yellow-300 rounded-lg flex flex-col items-center justify-center text-xs font-bold">
                              <div>Masuk: 08:15</div>
                              <div className="text-yellow-800">Pulang: - ✗</div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-yellow-800 text-base">
                              🟡 KUNING = Tidak Lengkap
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Datang tapi <strong>LUPA scan pulang</strong>,
                              atau datang setelah jadwal
                            </p>
                            <p className="text-xs text-yellow-700 mt-1 italic">
                              ⚠️ Perlu lebih teliti scan
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Merah */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-red-300 rounded-lg flex flex-col items-center justify-center text-xs font-bold">
                              <div>Masuk: -</div>
                              <div className="text-red-800">Pulang: -</div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-red-800 text-base">
                              🔴 MERAH = Tidak Absen / Alfa
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Datang tapi tidak scan sama sekali, atau tidak
                              hadir
                            </p>
                            <p className="text-xs text-red-700 mt-1 italic">
                              ❌ Kesadaran absensi kurang
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TABEL 3: Evaluasi Kehadiran */}
                  <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <h5 className="font-bold text-xl text-purple-700 mb-3">
                      3️⃣ Evaluasi Kehadiran (Status Resmi)
                    </h5>
                    <p className="text-gray-700 mb-5">
                      Status kehadiran berdasarkan jadwal mengajar dan ketepatan
                      waktu
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* H Hijau */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-green-300 rounded-lg flex items-center justify-center text-3xl font-bold text-green-800">
                              H
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-green-800 text-base">
                              🟢 H HIJAU = Hadir Tepat Waktu
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Scan <strong>SEBELUM/TEPAT</strong> jadwal
                              mengajar dimulai
                            </p>
                            <p className="text-xs text-green-700 mt-1 italic">
                              ✅ Status kehadiran sempurna
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* H Kuning */}
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-yellow-300 rounded-lg flex items-center justify-center text-3xl font-bold text-yellow-800">
                              H
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-yellow-800 text-base">
                              🟡 H KUNING = Hadir Terlambat
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Scan <strong>SETELAH</strong> jadwal mengajar
                              dimulai
                            </p>
                            <p className="text-xs text-yellow-700 mt-1 italic">
                              ⚠️ Status kehadiran terlambat
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Strip Merah */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-red-300 rounded-lg flex items-center justify-center text-4xl font-bold text-red-800">
                              -
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-red-800 text-base">
                              🔴 STRIP = Alpha
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Tidak hadir padahal <strong>ADA JADWAL</strong>{' '}
                              mengajar
                            </p>
                            <p className="text-xs text-red-700 mt-1 italic">
                              ❌ Status tidak hadir
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* L Putih */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-white border-2 border-gray-400 rounded-lg flex items-center justify-center text-3xl font-bold text-gray-700">
                              L
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-gray-800 text-base">
                              ⚪ L = Libur
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              Tidak ada <strong>JADWAL MENGAJAR</strong>{' '}
                              (OFF/Jumat)
                            </p>
                            <p className="text-xs text-gray-600 mt-1 italic">
                              📅 Status hari libur
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tips Membaca */}
                  <div className="mb-6 p-5 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-300">
                    <h6 className="font-bold text-lg text-indigo-800 mb-3">
                      💡 Tips Membaca Rekap:
                    </h6>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600 min-w-[70px]">
                          Tabel 1
                        </span>
                        <span>
                          untuk cek kehadiran mentah (ada scan atau tidak)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600 min-w-[70px]">
                          Tabel 2
                        </span>
                        <span>
                          untuk evaluasi kedisiplinan (tepat waktu atau lupa
                          scan pulang)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600 min-w-[70px]">
                          Tabel 3
                        </span>
                        <span>untuk status resmi kehadiran (H/L/-)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600 min-w-[70px]">
                          Kolom Kanan
                        </span>
                        <span>
                          di setiap tabel menunjukkan{' '}
                          <strong>total perhitungan</strong>
                        </span>
                      </li>
                    </ul>
                  </div>


                </div>
              </div>
            )}
            {recapData && (
              <>
                <div style={{ display: activeRecapTab === 'table1' ? 'block' : 'none' }}>
                  <div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl mb-4 shadow-sm border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-bold text-blue-800 mb-1">
                            1. Rekap Mesin
                          </h3>
                          <p className="text-sm text-blue-600">Data mentah dari mesin fingerprint</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyTableToClipboard('tabel1')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Copy Tabel ke Excel
                          </button>
                          <button
                            onClick={() =>
                              downloadTableAsExcel('tabel1', 'rekap_mesin')
                            }
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Download Excel
                          </button>
                          <button
                            onClick={() => downloadAsPdf('tabel1', 'rekap_mesin')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto border rounded-lg mb-8">
                      <table
                        id="tabel1"
                        className="min-w-full text-sm border-collapse bg-white"
                      >
                        <thead>
                          <tr className="bg-gray-300">
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold">
                              No
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold">
                              ID
                            </th>
                            <th
                              className="border border-gray-400 px-2 py-3 text-black font-bold"
                              style={{ minWidth: '220px' }}
                            >
                              Nama
                            </th>
                            <th className="border border-gray-400 px-6 py-3 text-black font-bold min-w-[120px]">
                              Jabatan
                            </th>
                            {recapData.dateRange.map((date) => (
                              <th
                                key={date}
                                className="border border-gray-400 px-2 py-3 text-black font-bold"
                                colSpan={2}
                              >
                                {getDateLabel(date)}
                              </th>
                            ))}
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-gray-300">
                              Hari Kerja
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-blue-200">
                              Biru
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-yellow-200">
                              Kuning
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-red-200">
                              Merah
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-indigo-200">
                              Hadir
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-purple-200">
                              %
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-teal-200">
                              Durasi Kerja
                            </th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-400" colSpan={4}></th>
                            {recapData.dateRange.map((date) => (
                              <React.Fragment key={date}>
                                <th className="border border-gray-400 px-1 py-1 text-gray-700 text-xs">
                                  Masuk
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-gray-700 text-xs">
                                  Pulang
                                </th>
                              </React.Fragment>
                            ))}
                            <th className="border border-gray-400" colSpan={7}></th>
                          </tr>{' '}
                        </thead>
                        <tbody>
                          {recapData.recap.map((emp) => {
                            let hariKerja = 0;
                            let biru = 0;
                            let kuning = 0;
                            let merah = 0;
                            let totalMinutes = 0;

                            recapData.dateRange.forEach((dateStr) => {
                              const ev = emp.dailyEvaluation[dateStr];
                              if (ev.text !== 'L') {
                                hariKerja++;
                                const rec = emp.dailyRecords[dateStr];
                                const hasIn = rec.in !== '-';
                                const hasOut = rec.out !== '-';

                                if (hasIn && hasOut) {
                                  biru++;
                                  // Hitung durasi hanya untuk hari berwarna biru
                                  const inMinutes = timeToMinutes(rec.in);
                                  const outMinutes = timeToMinutes(rec.out);
                                  if (inMinutes !== null && outMinutes !== null) {
                                    let duration = outMinutes - inMinutes;
                                    if (duration < 0) duration += 24 * 60; // Handle midnight crossing
                                    totalMinutes += duration;
                                  }
                                }
                                else if (!hasIn && !hasOut) merah++;
                                else kuning++;
                              }
                            });

                            const hadir = biru + kuning;
                            const persentase =
                              hariKerja > 0
                                ? Math.round((hadir / hariKerja) * 100)
                                : 0;

                            const durasiHours = Math.floor(totalMinutes / 60);
                            const durasiMinutes = totalMinutes % 60;
                            const durasiText = `${String(durasiHours).padStart(2, '0')}:${String(durasiMinutes).padStart(2, '0')}`;

                            return (
                              <tr key={emp.no}>
                                <td className="border border-gray-400 px-2 py-2 text-center">
                                  {emp.no}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center">
                                  {emp.id}
                                </td>
                                <td className="border border-gray-400 px-2 py-2">
                                  {emp.name}
                                </td>
                                <td className="border border-gray-400 px-2 py-2">
                                  {emp.position}
                                </td>
                                {recapData.dateRange.map((date) => {
                                  const rec = emp.dailyRecords[date];
                                  const ev = emp.dailyEvaluation[date];
                                  if (ev.text === 'L') {
                                    return (
                                      <>
                                        <td
                                          key={date + '-in'}
                                          className="border border-gray-400 text-center font-bold"
                                        >
                                          L
                                        </td>
                                        <td
                                          key={date + '-out'}
                                          className="border border-gray-400 text-center font-bold"
                                        >
                                          L
                                        </td>
                                      </>
                                    );
                                  }
                                  const hasIn = rec.in !== '-';
                                  const hasOut = rec.out !== '-';
                                  const bg =
                                    hasIn && hasOut
                                      ? 'bg-blue-200'
                                      : !hasIn && !hasOut
                                        ? 'bg-red-200'
                                        : 'bg-yellow-200';
                                  return (
                                    <React.Fragment key={date}>
                                      <td
                                        className={
                                          'border border-gray-400 px-1 py-1 text-center text-xs ' +
                                          bg
                                        }
                                      >
                                        {rec.in}
                                      </td>
                                      <td
                                        className={
                                          'border border-gray-400 px-1 py-1 text-center text-xs ' +
                                          bg
                                        }
                                      >
                                        {rec.out}
                                      </td>
                                    </React.Fragment>
                                  );
                                })}
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-gray-100">
                                  {hariKerja}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-blue-100">
                                  {biru}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-yellow-100">
                                  {kuning}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-red-100">
                                  {merah}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-indigo-100">
                                  {hadir}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-purple-100">
                                  {persentase}%
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-teal-100">
                                  {durasiText}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div style={{ display: activeRecapTab === 'table2' ? 'block' : 'none' }}>
                  <div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl mb-4 shadow-sm border border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-bold text-green-800 mb-1">
                            2. Kedisiplinan Waktu
                          </h3>
                          <p className="text-sm text-green-600">Evaluasi ketepatan waktu kehadiran</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyTableToClipboard('tabel2')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Copy Tabel ke Excel
                          </button>
                          <button
                            onClick={() =>
                              downloadTableAsExcel('tabel2', 'kedisiplinan_waktu')
                            }
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Download Excel
                          </button>
                          <button
                            onClick={() =>
                              downloadAsPdf('tabel2', 'kedisiplinan_waktu')
                            }
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto border rounded-lg mb-8">
                      <table
                        id="tabel2"
                        className="min-w-full text-sm border-collapse bg-white"
                      >
                        <thead>
                          <tr className="bg-gray-300">
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold">
                              No
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold">
                              ID
                            </th>
                            <th
                              className="border border-gray-400 px-2 py-3 text-black font-bold"
                              style={{ minWidth: '220px' }}
                            >
                              Nama
                            </th>
                            <th className="border border-gray-400 px-6 py-3 text-black font-bold min-w-[120px]">
                              Jabatan
                            </th>
                            {recapData.dateRange.map((date) => (
                              <th
                                key={date}
                                className="border border-gray-400 px-2 py-3 text-black font-bold"
                                colSpan={2}
                              >
                                {getDateLabel(date)}
                              </th>
                            ))}
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-gray-300">
                              Hari Kerja
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-green-200">
                              Hijau
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-blue-200">
                              Biru
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-yellow-200">
                              Kuning
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-red-200">
                              Merah
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-purple-200">
                              %
                            </th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-400" colSpan={4}></th>
                            {recapData.dateRange.map((date) => (
                              <React.Fragment key={date}>
                                <th className="border border-gray-400 px-1 py-1 text-gray-700 text-xs">
                                  Masuk
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-gray-700 text-xs">
                                  Pulang
                                </th>
                              </React.Fragment>
                            ))}
                            <th className="border border-gray-400" colSpan={6}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {recapData.recap.map((emp) => {
                            const sched = scheduleData.find((s) => s.id === emp.id);
                            let hariKerja = 0;
                            let hijau = 0;
                            let biru = 0;
                            let kuning = 0;
                            let merah = 0;

                            recapData.dateRange.forEach((dateStr) => {
                              const ev = emp.dailyEvaluation[dateStr];
                              if (ev.text !== 'L') {
                                hariKerja++;
                                const rec = emp.dailyRecords[dateStr];
                                const hasIn = rec.in !== '-';
                                const hasOut = rec.out !== '-';

                                if (!hasIn && !hasOut) {
                                  merah++;
                                } else if (hasIn && hasOut) {
                                  biru++;
                                } else if (hasIn) {
                                  const dayName = getDayName(dateStr);
                                  const schedStart =
                                    sched?.schedule[dayName]?.start;
                                  const inMin = timeToMinutes(rec.in);
                                  const schedMin = timeToMinutes(schedStart);
                                  if (schedMin && inMin && inMin <= schedMin) {
                                    hijau++;
                                  } else {
                                    kuning++;
                                  }
                                } else {
                                  kuning++;
                                }
                              }
                            });

                            const disiplin = hijau + biru;
                            const persentase =
                              hariKerja > 0
                                ? Math.round((disiplin / hariKerja) * 100)
                                : 0;

                            return (
                              <tr key={emp.no}>
                                <td className="border border-gray-400 px-2 py-2 text-center">
                                  {emp.no}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center">
                                  {emp.id}
                                </td>
                                <td className="border border-gray-400 px-2 py-2">
                                  {emp.name}
                                </td>
                                <td className="border border-gray-400 px-2 py-2">
                                  {emp.position}
                                </td>
                                {recapData.dateRange.map((date) => {
                                  const rec = emp.dailyRecords[date];
                                  const ev = emp.dailyEvaluation[date];
                                  if (ev.text === 'L') {
                                    return (
                                      <>
                                        <td
                                          key={date + '-in'}
                                          className="border border-gray-400 text-center font-bold"
                                        >
                                          L
                                        </td>
                                        <td
                                          key={date + '-out'}
                                          className="border border-gray-400 text-center font-bold"
                                        >
                                          L
                                        </td>
                                      </>
                                    );
                                  }
                                  const hasIn = rec.in !== '-';
                                  const hasOut = rec.out !== '-';
                                  let bg = 'bg-red-200';
                                  if (hasIn && hasOut) {
                                    bg = 'bg-blue-300';
                                  } else if (hasIn) {
                                    const dayName = getDayName(date);
                                    const schedStart =
                                      sched?.schedule[dayName]?.start;
                                    const inMin = timeToMinutes(rec.in);
                                    const schedMin = timeToMinutes(schedStart);
                                    if (schedMin && inMin && inMin <= schedMin) {
                                      bg = 'bg-green-300';
                                    } else {
                                      bg = 'bg-yellow-300';
                                    }
                                  } else if (hasOut) {
                                    bg = 'bg-yellow-300';
                                  }
                                  return (
                                    <React.Fragment key={date}>
                                      <td
                                        className={
                                          'border border-gray-400 px-1 py-1 text-center text-xs ' +
                                          bg
                                        }
                                      >
                                        {rec.in}
                                      </td>
                                      <td
                                        className={
                                          'border border-gray-400 px-1 py-1 text-center text-xs ' +
                                          bg
                                        }
                                      >
                                        {rec.out}
                                      </td>
                                    </React.Fragment>
                                  );
                                })}
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-gray-100">
                                  {hariKerja}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-green-100">
                                  {hijau}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-blue-100">
                                  {biru}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-yellow-100">
                                  {kuning}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-red-100">
                                  {merah}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-purple-100">
                                  {persentase}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div style={{ display: activeRecapTab === 'table3' ? 'block' : 'none' }}>
                  <div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-xl mb-4 shadow-sm border border-purple-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-bold text-purple-800 mb-1">
                            3. Evaluasi Kehadiran
                          </h3>
                          <p className="text-sm text-purple-600">Status kehadiran berdasarkan jadwal</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyTableToClipboard('tabel3')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Copy Tabel ke Excel
                          </button>
                          <button
                            onClick={() =>
                              downloadTableAsExcel('tabel3', 'evaluasi_kehadiran')
                            }
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Download Excel
                          </button>
                          <button
                            onClick={() =>
                              downloadAsPdf('tabel3', 'evaluasi_kehadiran')
                            }
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Download size={16} /> Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto border rounded-lg mb-8">
                      <table
                        id="tabel3"
                        className="min-w-full text-sm border-collapse bg-white"
                      >
                        <thead>
                          <tr className="bg-gray-300">
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold">
                              No
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold">
                              ID
                            </th>
                            <th
                              className="border border-gray-400 px-2 py-3 text-black font-bold"
                              style={{ minWidth: '220px' }}
                            >
                              Nama
                            </th>
                            <th className="border border-gray-400 px-6 py-3 text-black font-bold min-w-[120px]">
                              Jabatan
                            </th>
                            {recapData.dateRange.map((date) => (
                              <th
                                key={date}
                                className="border border-gray-400 px-8 py-3 text-black font-bold"
                                style={{ minWidth: '85px' }}
                              >
                                {getDateLabel(date)}
                              </th>
                            ))}
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-gray-300">
                              Hari Kerja
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-green-200">
                              Hadir
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-green-200">
                              Tepat
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-yellow-200">
                              Telat
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-red-200">
                              Alfa
                            </th>
                            <th className="border border-gray-400 px-2 py-3 text-black font-bold bg-purple-200">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recapData.recap.map((emp) => {
                            let hariKerja = 0;
                            let totalH = 0;
                            let tepat = 0;
                            let telat = 0;
                            let alfa = 0;

                            recapData.dateRange.forEach((dateStr) => {
                              const ev = emp.dailyEvaluation[dateStr];
                              if (ev.text !== 'L') {
                                hariKerja++;
                                if (ev.text === 'H') {
                                  totalH++;
                                  if (ev.color === '90EE90') tepat++;
                                  else if (ev.color === 'FFFF99') telat++;
                                } else if (ev.text === '-') {
                                  alfa++;
                                }
                              }
                            });

                            const persentase =
                              hariKerja > 0
                                ? Math.round((totalH / hariKerja) * 100)
                                : 0;

                            return (
                              <tr key={emp.no}>
                                <td className="border border-gray-400 px-2 py-2 text-center">
                                  {emp.no}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center">
                                  {emp.id}
                                </td>
                                <td className="border border-gray-400 px-2 py-2">
                                  {emp.name}
                                </td>
                                <td className="border border-gray-400 px-2 py-2">
                                  {emp.position}
                                </td>
                                {recapData.dateRange.map((date) => {
                                  const ev = emp.dailyEvaluation[date];
                                  const bgColor = '#' + ev.color;
                                  return (
                                    <td
                                      key={date}
                                      className="border border-gray-400 px-8 py-2 text-center font-bold"
                                      style={{ backgroundColor: bgColor, minWidth: '85px' }}
                                    >
                                      {ev.text}
                                    </td>
                                  );
                                })}
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-gray-100">
                                  {hariKerja}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-green-100">
                                  {totalH}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-green-100">
                                  {tepat}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-yellow-100">
                                  {telat}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-red-100">
                                  {alfa}
                                </td>
                                <td className="border border-gray-400 px-2 py-2 text-center font-bold bg-purple-100">
                                  {persentase}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              Cara Penggunaan:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>Upload Laporan Absensi</li>
              <li>Upload Jadwal Kerja (opsional)</li>
              <li>Pilih tanggal awal dan akhir</li>
              <li>Klik Generate Tabel Rekap</li>
              <li>Klik Generate Kesimpulan Profil</li>
              <li>
                Klik Copy atau Download Excel atau Download PDF pada tabel yang
                diinginkan
              </li>
            </ol>
          </div>
        </div >
      </div >
    </div >
  );
};

export default AttendanceRecapSystem;
