const XLSX = require('xlsx');

// Membuat template jadwal kerja
const createScheduleTemplate = () => {
    // Header baris 1
    const header1 = [
        'NIK',
        '',
        'NAMA DEPAN',
        'SABTU',
        '',
        'AHAD',
        '',
        'SENIN',
        '',
        'SELASA',
        '',
        'RABU',
        '',
        'KAMIS',
        '',
        'JUMAT',
        '',
        'Pimpinan',
        'Guru',
        'Tendik'
    ];

    // Header baris 2
    const header2 = [
        '',
        '',
        '',
        'Mulai',
        'Pulang',
        'Mulai',
        'Pulang',
        'Mulai',
        'Pulang',
        'Mulai',
        'Pulang',
        'Mulai',
        'Pulang',
        'Mulai',
        'Pulang',
        'Mulai',
        'Pulang',
        '',
        '',
        ''
    ];

    // Contoh data karyawan
    const sampleData = [
        ['1', '', 'Ahmad Fauzi', '07:00', '15:00', 'OFF', 'OFF', '07:00', '15:00', '07:00', '15:00', '07:00', '15:00', '07:00', '15:00', 'L', 'L', 'Pimpinan', '', ''],
        ['2', '', 'Siti Nurhaliza', '07:00', '15:00', 'OFF', 'OFF', '07:00', '15:00', '07:00', '15:00', '07:00', '15:00', '07:00', '15:00', 'L', 'L', '', 'Guru', ''],
        ['3', '', 'Budi Santoso', '07:00', '15:00', 'OFF', 'OFF', '07:00', '15:00', '07:00', '15:00', '07:00', '15:00', '07:00', '15:00', 'L', 'L', '', '', 'Tendik'],
        ['4', '', 'Dewi Lestari', '07:00', '15:00', 'OFF', 'OFF', '07:00', '15:00', '07:00', '15:00', '07:00', '15:00', '07:00', '15:00', 'L', 'L', '', 'Guru', ''],
    ];

    // Gabungkan semua data
    const data = [header1, header2, ...sampleData];

    // Buat worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 8 },   // NIK
        { wch: 3 },   // Empty
        { wch: 20 },  // NAMA DEPAN
        { wch: 8 },   // SABTU Mulai
        { wch: 8 },   // SABTU Pulang
        { wch: 8 },   // AHAD Mulai
        { wch: 8 },   // AHAD Pulang
        { wch: 8 },   // SENIN Mulai
        { wch: 8 },   // SENIN Pulang
        { wch: 8 },   // SELASA Mulai
        { wch: 8 },   // SELASA Pulang
        { wch: 8 },   // RABU Mulai
        { wch: 8 },   // RABU Pulang
        { wch: 8 },   // KAMIS Mulai
        { wch: 8 },   // KAMIS Pulang
        { wch: 8 },   // JUMAT Mulai
        { wch: 8 },   // JUMAT Pulang
        { wch: 10 },  // Pimpinan
        { wch: 10 },  // Guru
        { wch: 10 },  // Tendik
    ];

    // Buat workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Kerja');

    // Simpan file
    XLSX.writeFile(wb, './public/template_jadwal_kerja.xlsx');
    console.log('✅ Template jadwal kerja berhasil dibuat di public/template_jadwal_kerja.xlsx');
};

createScheduleTemplate();
