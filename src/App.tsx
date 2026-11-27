import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  PenSquare,
  Menu,
  X,
  Share2,
  ArrowUp,
  ChevronRight,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Edit3,
  Trash2,
  Eye,
  Flag,
  Newspaper,
  TrendingUp,
  Sparkles,
  Clock,
  User,
  Phone,
  Image as ImageIcon,
  Lock,
  LogOut,
  FileText,
  Info,
  Mail,
  BookOpen,
  Layers,
  Filter,
  ArrowLeft,
  Send
} from 'lucide-react';

/**
 * ============================================================================
 * KONFIGURASI & DATA AWAL (SIMULASI PROTOTIPE SIAP CLOUDFLARE WORKERS + D1)
 * ============================================================================
 * Catatan Arsitektur:
 * - Prototipe ini menggunakan state memori & simulasi data awal tanpa backend aktif.
 * - Kode kepemilikan berita pada prototipe disimpan secara lokal di memori/state
 *   untuk keperluan simulasi alur penulis. Pada produksi (Cloudflare Workers + D1),
 *   verifikasi kepemilikan, hashing kode, dan otentikasi admin wajib dilakukan
 *   di sisi server (Workers) dengan basis data D1.
 */

const INITIAL_CATEGORIES = [
  'Berita Warga',
  'Peristiwa',
  'Lingkungan',
  'Pendidikan',
  'Teknologi',
  'Kesehatan dan Gaya Hidup',
  'Kuliner',
  'Jalan-Jalan',
  'Hiburan',
  'Olahraga',
  'Inspirasi',
  'Unik dan Menarik'
];

// Ilustrasi SVG inline berkualitas tinggi agar mandiri tanpa ketergantungan URL gambar eksternal bermasalah
function createIllustrationDataUrl({ title, tag, bgStart, bgEnd, accentColor }) {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeTag = tag.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgStart}" />
          <stop offset="100%" stop-color="${bgEnd}" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#bg)" />
      <circle cx="670" cy="95" r="130" fill="${accentColor}" opacity="0.16" />
      <circle cx="120" cy="390" r="160" fill="#ffffff" opacity="0.08" />
      <path d="M0 355 Q 200 300 400 350 T 800 330 L 800 450 L 0 450 Z" fill="#000000" opacity="0.18" />
      <rect x="44" y="42" width="210" height="36" rx="18" fill="${accentColor}" />
      <text x="149" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">${safeTag.toUpperCase()}</text>
      <text x="44" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" fill="#ffffff" opacity="0.95">${safeTitle.slice(0, 42)}</text>
      <text x="44" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" fill="#ffffff" opacity="0.95">${safeTitle.length > 42 ? safeTitle.slice(42, 84) : ''}</text>
      <text x="44" y="408" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="600" fill="#ffffff" opacity="0.78">WARTAKITA • Berita dari Warga, Untuk Semua</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const INITIAL_ARTICLES = [
  {
    id: 'wk-101',
    slug: 'gotong-royong-sungai-bersih-warga-cihampelas',
    title: 'Warga Bantaran Sungai Cihampelas Gelar Aksi Bersih Sungai dan Tanam Bambu',
    category: 'Lingkungan',
    summary: 'Ratusan warga bersama komunitas pemuda setempat bergotong royong mengangkat sampah plastik dan menanam 350 bibit bambu untuk mencegah erosi.',
    content: `Sabtu pagi, ratusan warga dari tiga rukun tetangga di bantaran Sungai Cihampelas berkumpul sejak pukul 06.30 WIB membawa peralatan kebersihan dan bibit tanaman. Kegiatan ini diprakarsai oleh forum warga peduli lingkungan setelah melihat meningkatnya tumpukan sampah kiriman saat hujan deras pekan lalu.\n\nDalam waktu empat jam, warga berhasil mengumpulkan lebih dari 40 karung sampah anorganik untuk dipilah bersama bank sampah RW. Selain membersihkan aliran air, peserta juga menanam 350 bibit bambu di titik-titik tebing yang rawan longsor.\n\nKoordinator kegiatan, Bapak Hendra Wijaya, menyampaikan bahwa menjaga kebersihan sungai tidak bisa dilakukan sesekali saja. Warga sepakat mengadakan jadwal patroli kebersihan mingguan serta memasang papan edukasi agar tidak ada lagi pembuangan sampah sembarangan ke aliran sungai.`,
    author: 'Hendra Wijaya',
    whatsapp: '0812-3456-7801',
    publishedAt: '25 Nov 2026 • 08:15 WIB',
    timestamp: 1795569300000,
    views: 482,
    isFeatured: true,
    status: 'published', // 'published' | 'flagged' | 'deleted'
    reportCount: 0,
    reportReason: '',
    // Simulasi kode kepemilikan khusus prototipe (tidak ditampilkan di publik)
    ownershipCode: 'WK-SUNGAI-8492',
    image: createIllustrationDataUrl({
      title: 'Aksi Bersih Sungai & Tanam Bambu Warga',
      tag: 'Lingkungan',
      bgStart: '#0f294a',
      bgEnd: '#166534',
      accentColor: '#ea580c'
    })
  },
  {
    id: 'wk-102',
    slug: 'kelas-literasi-digital-lanjutan-di-balai-warga',
    title: 'Kelas Literasi Digital Gratis Bantu Pelaku UMKM Lokal Kelola Katalog Online',
    category: 'Teknologi',
    summary: 'Relawan teknologi menggelar pelatihan praktis memotret produk dengan ponsel, menulis deskripsi menarik, dan menjaga keamanan transaksi digital.',
    content: `Sebanyak 45 pelaku usaha mikro, kecil, dan menengah (UMKM) di Kecamatan Sukajadi mengikuti kelas literasi digital yang digelar di balai warga akhir pekan lalu. Materi difokuskan pada keterampilan praktis yang bisa langsung diterapkan sehari-hari.\n\nPeserta diajak berlatih memanfaatkan pencahayaan alami saat memotret makanan dan kerajinan menggunakan kamera ponsel, menyusun katalog produk yang informatif, serta mengenali ciri-ciri tautan atau pesan penipuan digital.\n\nSalah satu peserta, Ibu Ratna Sari yang merintis usaha kue kering rumahan, mengaku kini lebih percaya diri memasarkan produknya ke luar kota. Para relawan juga membuka sesi konsultasi lanjutan setiap bulan agar warga tetap didampingi.`,
    author: 'Nadia Kusuma',
    whatsapp: '0813-9876-5402',
    publishedAt: '24 Nov 2026 • 16:40 WIB',
    timestamp: 1795513200000,
    views: 619,
    isFeatured: true,
    status: 'published',
    reportCount: 0,
    reportReason: '',
    ownershipCode: 'WK-DIGIT-3071',
    image: createIllustrationDataUrl({
      title: 'Literasi Digital UMKM di Balai Warga',
      tag: 'Teknologi',
      bgStart: '#0b1f3a',
      bgEnd: '#1d4ed8',
      accentColor: '#f97316'
    })
  },
  {
    id: 'wk-103',
    slug: 'festival-kuliner-kampung-lauk-pauk-nusantara',
    title: 'Festival Kuliner Kampung Hadirkan 28 Stan Masakan Rumahan Khas Daerah',
    category: 'Kuliner',
    summary: 'Dari pepes ikan mas, gulai pakis, hingga kue talam pandan, festival akhir pekan ini menjadi ajang silaturahmi sekaligus penggerak ekonomi warga.',
    content: `Suasana halaman lapangan serbaguna tampak semarak saat Festival Kuliner Kampung resmi dibuka pada Minggu pagi. Sebanyak 28 stan milik warga menyajikan aneka hidangan rumahan dengan resep turun-temurun.\n\nPengunjung dapat mencicipi beragam menu mulai dari sarapan hangat seperti bubur sumsum, nasi uduk rempah, hingga aneka camilan tradisional dan minuman herbal segar. Seluruh pedagang menerapkan standar kebersihan kemasan dan menyediakan opsi porsi hemat untuk keluarga.\n\nPanitia mencatat lebih dari seribu pengunjung datang silih berganti sepanjang hari. Selain berburu kuliner, pengunjung juga menikmati pertunjukan musik akustik warga dan lomba mewarnai untuk anak-anak.`,
    author: 'Bima Pratama',
    whatsapp: '0856-7788-9903',
    publishedAt: '24 Nov 2026 • 11:20 WIB',
    timestamp: 1795494000000,
    views: 734,
    isFeatured: true,
    status: 'published',
    reportCount: 0,
    reportReason: '',
    ownershipCode: 'WK-KULIN-5529',
    image: createIllustrationDataUrl({
      title: 'Festival Kuliner Kampung & Resep Daerah',
      tag: 'Kuliner',
      bgStart: '#102a43',
      bgEnd: '#9a3412',
      accentColor: '#f97316'
    })
  },
  {
    id: 'wk-104',
    slug: 'perpustakaan-keliling-sepeda-baca-anak',
    title: 'Sepeda Baca Keliling Hadir Setiap Sore di Taman Lingkungan Perumahan',
    category: 'Pendidikan',
    summary: 'Inisiatif seorang guru honorer dan mahasiswa setempat membawa ratusan buku cerita anak, komik edukasi, dan alat gambar ke taman bermain.',
    content: `Setiap pukul 15.30 WIB, sebuah sepeda yang dimodifikasi dengan rak buku kayu berwarna cerah tiba di taman lingkungan. Anak-anak sekitar langsung berkerumun memilih buku cerita bergambar, ensiklopedia ringan, hingga buku aktivitas sains.\n\nProgram Sepeda Baca ini bermula dari keinginan sederhana untuk mengurangi waktu menatap layar gawai pada anak-anak di jam pulang sekolah. Selain membaca mandiri, relawan juga mengadakan sesi mendongeng singkat setiap hari Jumat.\n\nOrang tua warga menyambut baik kegiatan positif ini karena membantu anak-anak melatih konsentrasi, kosakata, serta kebiasaan berbagi buku dengan teman sebaya.`,
    author: 'Siti Rahmawati',
    whatsapp: '0821-4455-6604',
    publishedAt: '23 Nov 2026 • 15:50 WIB',
    timestamp: 1795423800000,
    views: 390,
    isFeatured: false,
    status: 'published',
    reportCount: 0,
    reportReason: '',
    ownershipCode: 'WK-BUKU-6184',
    image: createIllustrationDataUrl({
      title: 'Sepeda Baca Keliling di Taman Warga',
      tag: 'Pendidikan',
      bgStart: '#0f294a',
      bgEnd: '#0369a1',
      accentColor: '#ea580c'
    })
  },
  {
    id: 'wk-105',
    slug: 'senam-pagi-dan-cek-kesehatan-rutin-warga',
    title: 'Senam Pagi Bersama dan Pemeriksaan Tekanan Darah Rutin di Posyandu',
    category: 'Kesehatan dan Gaya Hidup',
    summary: 'Warga lintas usia mengikuti olahraga ringan bersama setiap pekan dilanjutkan pemantauan kesehatan dasar dan edukasi pola tidur.',
    content: `Kegiatan olahraga bersama kini semakin diminati bukan hanya oleh lansia, tetapi juga pekerja kantoran dan ibu rumah tangga di lingkungan sekitar. Gerakan senam berintensitas sedang dipilih agar aman diikuti oleh berbagai kelompok usia.\n\nSetelah sesi peregangan dan jalan santai selama 30 menit, kader kesehatan membantu warga melakukan pengecekan tekanan darah, lingkar perut, serta konsultasi ringan mengenai pengaturan menu seimbang dan hidrasi harian.\n\nMelalui kegiatan rutin ini, warga lebih sadar pentingnya deteksi dini dan menjaga kebugaran tubuh di tengah kesibukan sehari-hari.`,
    author: 'dr. Arif Nugroho',
    whatsapp: '0811-2233-4405',
    publishedAt: '22 Nov 2026 • 09:05 WIB',
    timestamp: 1795313100000,
    views: 518,
    isFeatured: false,
    status: 'published',
    reportCount: 0,
    reportReason: '',
    ownershipCode: 'WK-SEHAT-9204',
    image: createIllustrationDataUrl({
      title: 'Senam Pagi & Cek Kesehatan Rutin Warga',
      tag: 'Kesehatan',
      bgStart: '#0c2340',
      bgEnd: '#0f766e',
      accentColor: '#f97316'
    })
  },
  {
    id: 'wk-106',
    slug: 'jalur-jalan-kaki-bukit-pinus-akhir-pekan',
    title: 'Menyusuri Jalur Jalan Kaki Bukit Pinus: Udara Sejuk dan Pemandangan Lembah',
    category: 'Jalan-Jalan',
    summary: 'Rute jalan santai sepanjang 4 kilometer yang ramah pemula ini menawarkan udara segar perbukitan serta warung kopi warga di pos peristirahatan.',
    content: `Bagi warga yang ingin melepas penat tanpa harus menempuh perjalanan jauh, jalur jalan kaki di kawasan Bukit Pinus bisa menjadi pilihan menarik di akhir pekan. Jalurnya terawat dengan penanda arah yang jelas dan tanjakan yang landai.\n\nSepanjang perjalanan, pejalan kaki disambut rimbunnya pepohonan pinus, suara burung, serta pemandangan lembah hijau dari beberapa titik pandang. Di pertengahan rute, terdapat pos singgah sederhana yang dikelola warga setempat.\n\nPengunjung disarankan datang pada pagi hari, mengenakan sepatu yang nyaman, membawa air minum secukupnya, serta selalu membawa kembali sampah pribadi agar kelestarian kawasan tetap terjaga.`,
    author: 'Raka Mahendra',
    whatsapp: '0857-1122-3306',
    publishedAt: '21 Nov 2026 • 07:30 WIB',
    timestamp: 1795221000000,
    views: 645,
    isFeatured: false,
    status: 'published',
    reportCount: 0,
    reportReason: '',
    ownershipCode: 'WK-JALAN-4718',
    image: createIllustrationDataUrl({
      title: 'Jalur Jalan Kaki Bukit Pinus Akhir Pekan',
      tag: 'Jalan-Jalan',
      bgStart: '#102a43',
      bgEnd: '#1e3a8a',
      accentColor: '#ea580c'
    })
  },
  {
    id: 'wk-107',
    slug: 'turnamen-bulu-tangkis-persahabatan-antar-rt',
    title: 'Turnamen Bulu Tangkis Persahabatan Antar-RT Pererat Keakraban Warga',
    category: 'Olahraga',
    summary: 'Digelar dengan semangat sportivitas dan keceriaan, ajang olahraga komunitas ini melibatkan pemain pemula hingga veteran lingkungan.',
    content: `Sorak sorai pendukung mewarnai gedung olahraga setempat saat partai final turnamen bulu tangkis persahabatan antar-RT berlangsung. Berbeda dari kompetisi ketat pada umumnya, turnamen ini mengedepankan keakraban dan partisipasi merata.\n\nSetiap tim memadukan pemain berpengalaman dengan anggota baru agar suasana pertandingan tetap seimbang dan seru. Panitia juga menyiapkan kategori ganda campuran keluarga yang mengundang banyak tawa penonton.\n\nSelain memperebutkan piala bergilir lingkungan, kegiatan ini menjadi wadah positif bagi warga untuk berolahraga rutin sekaligus mempererat tali silaturahmi.`,
    author: 'Yusuf Firmansyah',
    whatsapp: '0819-5566-7707',
    publishedAt: '20 Nov 2026 • 18:10 WIB',
    timestamp: 1795173000000,
    views: 312,
    isFeatured: false,
    status: 'published',
    reportCount: 1,
    reportReason: 'Permintaan pengecekan jadwal pertandingan lanjutan oleh pembaca.',
    ownershipCode: 'WK-SPORT-7391',
    image: createIllustrationDataUrl({
      title: 'Turnamen Bulu Tangkis Persahabatan Antar-RT',
      tag: 'Olahraga',
      bgStart: '#0b1f3a',
      bgEnd: '#1e40af',
      accentColor: '#f97316'
    })
  },
  {
    id: 'wk-108',
    slug: 'pengrajin-anyaman-bambu-bertahan-dengan-desain-modern',
    title: 'Kisah Inspiratif Pengrajin Anyaman Bambu Menghadirkan Keranjang Modern',
    category: 'Inspirasi',
    summary: 'Menggabungkan teknik anyaman tradisional dengan bentuk minimalis fungsional, produk kerajinan lokal kini diminati untuk dekorasi rumah.',
    content: `Di sebuah bengkel kecil yang teduh, tangan-tangan terampil menganyam bilah bambu yang telah melalui proses perendaman dan pengeringan alami. Selama puluhan tahun, usaha keluarga ini memproduksi wadah tradisional yang kini mulai beradaptasi dengan selera pasar modern.\n\nDengan berdiskusi bersama desainer produk dan pembeli, pengrajin mulai membuat tempat penyimpanan serbaguna, kap lampu gantung, dan organizer meja dengan sentuhan warna alami yang lebih halus.\n\nPerjalanan ini menunjukkan bahwa keterampilan tradisional tetap relevan dan bernilai tinggi ketika dipadukan dengan kemauan belajar serta ketekunan menjaga kualitas pengerjaan.`,
    author: 'Dewi Anggraini',
    whatsapp: '0878-8899-0008',
    publishedAt: '19 Nov 2026 • 14:00 WIB',
    timestamp: 1795071600000,
    views: 428,
    isFeatured: false,
    status: 'published',
    reportCount: 0,
    reportReason: '',
    ownershipCode: 'WK-INSP-2845',
    image: createIllustrationDataUrl({
      title: 'Anyaman Bambu Modern Karya Pengrajin Lokal',
      tag: 'Inspirasi',
      bgStart: '#0f294a',
      bgEnd: '#7c2d12',
      accentColor: '#f97316'
    })
  }
];

/**
 * Menghasilkan kode kepemilikan acak unik yang tidak mudah ditebak
 * untuk simulasi di prototipe.
 */
function generateOwnershipCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomPart = (len) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  };
  return `WK-${randomPart(4)}-${randomPart(4)}`;
}

function makeSlug(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) +
    '-' +
    Math.floor(100 + Math.random() * 900)
  );
}

function formatIndonesianDate(dateObj = new Date()) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const mins = String(dateObj.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} • ${hours}:${mins} WIB`;
}

function buildArticleUrl(article) {
  try {
    const rawOrigin = window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'https://wartakita.id';
    const cleanOrigin = rawOrigin.replace(/\/+$/, '');
    const slugOrId = encodeURIComponent(article.slug || article.id);
    return `${cleanOrigin}/berita/${slugOrId}`;
  } catch {
    return `https://wartakita.id/berita/${encodeURIComponent(article.id)}`;
  }
}

function buildWhatsAppShareUrl(article) {
  const url = buildArticleUrl(article);
  const text = `Berita menarik dari WARTAKITA\n${article.title}\nBaca selengkapnya:\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * ============================================================================
 * KOMPONEN UI PENDUKUNG & NOTIFIKASI NON-ALERT
 * ============================================================================
 */
function ToastBanner({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 transition-all"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm font-medium ${
          isError
            ? 'bg-red-950 text-red-50 border-red-700'
            : isWarning
            ? 'bg-amber-950 text-amber-50 border-amber-600'
            : 'bg-[#0b1f3a] text-white border-orange-500/60'
        }`}
      >
        {isError || isWarning ? (
          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 leading-snug">{toast.message}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="text-white/70 hover:text-white p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * KOMPONEN HEADER & NAVIGASI
 * ============================================================================
 */
function Header({
  activeView,
  selectedCategory,
  searchQuery,
  onSearchChange,
  onNavigate,
  onSelectCategory,
  categories,
  mobileMenuOpen,
  setMobileMenuOpen,
  isAdminAuthenticated
}) {
  return (
    <header className="sticky top-0 z-40 bg-[#0b1f3a] text-white shadow-md border-b border-white/10">
      {/* Baris Atas: Logo, Pencarian, Tombol Aksi */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3">
          {/* Logo WARTAKITA */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Buka atau tutup menu navigasi"
              className="lg:hidden inline-flex items-center justify-center p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('Semua');
                onNavigate('home');
              }}
              className="flex items-center gap-2.5 text-left group focus:outline-none min-w-0"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm group-hover:bg-orange-600 transition shrink-0">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                    WARTA<span className="text-orange-400">KITA</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate hidden sm:block">
                  Berita dari Warga, Untuk Semua.
                </p>
              </div>
            </button>
          </div>

          {/* Kolom Pencarian (Desktop & Tablet) */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (activeView !== 'home' && activeView !== 'category') {
                    onNavigate('home');
                  }
                }}
                placeholder="Cari berita warga, topik, atau penulis..."
                aria-label="Cari berita"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Navigasi Utama & Tombol TULIS BERITA */}
          <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('manage')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeView === 'manage'
                  ? 'bg-white/20 text-orange-300'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Kelola Berita Saya</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate(isAdminAuthenticated ? 'admin-dashboard' : 'admin-login')}
              className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeView.startsWith('admin')
                  ? 'bg-white/20 text-orange-300'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('write')}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs sm:text-sm font-bold shadow-md transition whitespace-nowrap"
            >
              <PenSquare className="w-4 h-4 shrink-0" />
              <span>TULIS BERITA</span>
            </button>
          </nav>
        </div>

        {/* Kolom Pencarian Mobile */}
        <div className="pb-3 md:hidden">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (activeView !== 'home' && activeView !== 'category') {
                  onNavigate('home');
                }
              }}
              placeholder="Cari berita di WARTAKITA..."
              aria-label="Cari berita di perangkat mobile"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Baris Navigasi Kategori Horizontal */}
      <div className="bg-[#081629] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                onSelectCategory('Semua');
                onNavigate('home');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                selectedCategory === 'Semua' && activeView === 'home'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Semua Berita
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat && (activeView === 'category' || activeView === 'home');
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat);
                    onNavigate('category');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                    isSelected && activeView === 'category'
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drawer Navigasi Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#091a30] border-t border-white/10 px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              onSelectCategory('Semua');
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10"
          >
            <span>Beranda</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('write');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-orange-300 hover:bg-white/10"
          >
            <span>Tulis Berita (Tanpa Daftar)</span>
            <PenSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('manage');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10"
          >
            <span>Kelola Berita Saya</span>
            <Edit3 className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate(isAdminAuthenticated ? 'admin-dashboard' : 'admin-login');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10"
          >
            <span>{isAdminAuthenticated ? 'Dashboard Admin' : 'Login Admin'}</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </button>

          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onNavigate('about');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left text-slate-200"
            >
              Tentang Kami
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('guidelines');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left text-slate-200"
            >
              Pedoman Publikasi
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('privacy');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left text-slate-200"
            >
              Kebijakan Privasi
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('contact');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left text-slate-200"
            >
              Hubungi Kami
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * ============================================================================
 * KOMPONEN KARTU BERITA
 * ============================================================================
 */
function ArticleCard({ article, onOpenDetail, onSelectCategory, onShareWhatsApp, compact = false }) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full">
      {/* Foto Berita Proporsional */}
      <button
        type="button"
        onClick={() => onOpenDetail(article.id)}
        className="relative block w-full aspect-[16/10] bg-slate-100 overflow-hidden text-left group focus:outline-none"
      >
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0b1f3a]/90 text-white backdrop-blur-xs">
          {article.category}
        </span>
      </button>

      {/* Isi Kartu */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            {article.author}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {article.publishedAt}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[#0b1f3a] leading-snug mb-2">
          <button
            type="button"
            onClick={() => onOpenDetail(article.id)}
            className="text-left hover:text-orange-600 transition line-clamp-2"
          >
            {article.title}
          </button>
        </h3>

        {!compact && (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 flex-1">
            {article.summary}
          </p>
        )}

        {/* Tombol Aksi Kartu */}
        <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(article.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b1f3a] hover:bg-[#13335e] text-white text-xs font-semibold transition"
          >
            <span>Baca Selengkapnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onShareWhatsApp(article)}
            aria-label={`Bagikan ${article.title} ke WhatsApp`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold transition"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span>Bagikan ke WhatsApp</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * ============================================================================
 * HALAMAN UTAMA (BERANDA PORTAL BERITA)
 * ============================================================================
 */
function HomeView({
  articles,
  categories,
  searchQuery,
  onClearSearch,
  onSelectCategory,
  onNavigate,
  onOpenDetail,
  onShareWhatsApp
}) {
  const activeArticles = useMemo(
    () => articles.filter((a) => a.status === 'published'),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeArticles;
    return activeArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [activeArticles, searchQuery]);

  const featuredArticles = useMemo(
    () => activeArticles.filter((a) => a.isFeatured).slice(0, 3),
    [activeArticles]
  );

  const latestArticles = useMemo(
    () => [...filteredArticles].sort((a, b) => b.timestamp - a.timestamp),
    [filteredArticles]
  );

  const popularArticles = useMemo(
    () => [...activeArticles].sort((a, b) => b.views - a.views).slice(0, 4),
    [activeArticles]
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="space-y-10">
      {/* Banner Utama / Hero Portal Warga */}
      <section className="bg-gradient-to-br from-[#0b1f3a] via-[#102e56] to-[#163d70] text-white rounded-2xl p-5 sm:p-8 shadow-md border border-[#0b1f3a]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Portal Berita Komunitas • Tanpa Daftar Akun</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Berita dari Warga, <span className="text-orange-400">Untuk Semua.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
              Bagikan cerita lingkungan, kegiatan sosial, kuliner lokal, inovasi warga, dan kabar
              bermanfaat di sekitar Anda dengan mudah, terbuka, dan penuh tanggung jawab.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('write')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg transition"
              >
                <PenSquare className="w-4 h-4" />
                <span>TULIS BERITA SEKARANG</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('manage')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Kelola Berita Saya</span>
              </button>
            </div>
          </div>

          {/* Kartu Sorotan Berita Pilihan */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-300">
                <Sparkles className="w-3.5 h-3.5" />
                Berita Pilihan
              </span>
              <span className="text-[11px] text-slate-300">Kurasi Warga</span>
            </div>
            {featuredArticles.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenDetail(item.id)}
                className="w-full text-left p-2.5 rounded-xl bg-[#081629]/60 hover:bg-[#081629] transition flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                  <span className="text-[11px] text-slate-300">{item.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Hasil Pencarian Jika Aktif */}
      {isSearching && (
        <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#0b1f3a]">
                Hasil Pencarian: &ldquo;{searchQuery}&rdquo;
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Ditemukan {filteredArticles.length} berita yang sesuai.
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSearch}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 transition"
            >
              Reset Pencarian
            </button>
          </div>
        </section>
      )}

      {/* Grid Utama: Berita Terbaru + Sidebar Berita Populer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Berita Terbaru (8 Kolom) */}
        <section className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between border-b-2 border-[#0b1f3a] pb-2.5">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-extrabold text-[#0b1f3a]">
                {isSearching ? 'Daftar Berita Ditemukan' : 'Berita Terbaru'}
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {latestArticles.length} berita
            </span>
          </div>

          {latestArticles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <p className="text-base font-bold text-[#0b1f3a]">
                Belum ada berita yang cocok dengan kata kunci tersebut.
              </p>
              <p className="text-sm text-slate-600">
                Coba gunakan kata kunci lain atau terbitkan berita pertama untuk topik ini.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {isSearching && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Tampilkan Semua Berita
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('write')}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                >
                  Tulis Berita Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {latestArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onOpenDetail={onOpenDetail}
                  onSelectCategory={onSelectCategory}
                  onShareWhatsApp={onShareWhatsApp}
                />
              ))}
            </div>
          )}
        </section>

        {/* Sidebar: Berita Populer & Jelajah Kategori (4 Kolom) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Berita Populer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-extrabold text-[#0b1f3a]">Berita Populer</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {popularArticles.map((pop, index) => (
                <div key={pop.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#0b1f3a] text-orange-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    0{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-orange-600 uppercase">
                      {pop.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenDetail(pop.id)}
                      className="block text-left text-sm font-bold text-[#0b1f3a] hover:text-orange-600 leading-snug mt-0.5"
                    >
                      {pop.title}
                    </button>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {pop.author} • {pop.views} dibaca
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kategori Warga */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-extrabold text-[#0b1f3a]">Kategori Berita</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat);
                    onNavigate('category');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0b1f3a] hover:text-white text-slate-700 text-xs font-semibold transition"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * HALAMAN KATEGORI TERSENDIRI
 * ============================================================================
 */
function CategoryView({
  category,
  categories,
  articles,
  onSelectCategory,
  onNavigate,
  onOpenDetail,
  onShareWhatsApp
}) {
  const categoryArticles = useMemo(
    () =>
      articles
        .filter((a) => a.status === 'published' && a.category === category)
        .sort((a, b) => b.timestamp - a.timestamp),
    [articles, category]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b1f3a] mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mb-2">
              <Filter className="w-3.5 h-3.5" />
              Kanal Kategori
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a]">{category}</h1>
            <p className="text-sm text-slate-600 mt-1">
              Menampilkan {categoryArticles.length} berita terbit pada kategori {category}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('write')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold transition self-start sm:self-auto"
          >
            <PenSquare className="w-4 h-4" />
            <span>Tulis di {category}</span>
          </button>
        </div>

        {/* Pilihan cepat antar kategori */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                cat === category
                  ? 'bg-[#0b1f3a] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {categoryArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <p className="text-base font-bold text-[#0b1f3a]">
            Belum ada berita pada kategori &ldquo;{category}&rdquo;.
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Jadilah warga pertama yang membagikan informasi atau cerita menarik pada kategori ini.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('write')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold"
          >
            <PenSquare className="w-4 h-4" />
            <span>Tulis Berita Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onOpenDetail={onOpenDetail}
              onSelectCategory={onSelectCategory}
              onShareWhatsApp={onShareWhatsApp}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * HALAMAN DETAIL BERITA
 * ============================================================================
 */
function ArticleDetailView({
  article,
  allArticles,
  onOpenDetail,
  onSelectCategory,
  onNavigate,
  onShareWhatsApp,
  onReportArticle
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  if (!article) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0b1f3a]">Berita tidak ditemukan</h2>
        <p className="text-sm text-slate-600">
          Berita mungkin telah dihapus atau tautan tidak lagi tersedia.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="px-4 py-2.5 rounded-xl bg-[#0b1f3a] text-white text-sm font-semibold"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const relatedArticles = allArticles
    .filter(
      (a) =>
        a.status === 'published' &&
        a.id !== article.id &&
        (a.category === article.category || true)
    )
    .sort((a, b) => {
      const aSameCat = a.category === article.category ? 1 : 0;
      const bSameCat = b.category === article.category ? 1 : 0;
      if (bSameCat !== aSameCat) return bSameCat - aSameCat;
      return b.timestamp - a.timestamp;
    })
    .slice(0, 3);

  const paragraphs = article.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    onReportArticle(article.id, reportText.trim());
    setReportText('');
    setReportOpen(false);
  };

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-[#0b1f3a]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Daftar Berita</span>
      </button>

      <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Foto utama selalu ditampilkan di bagian paling atas detail berita */}
        <div className="w-full bg-slate-100 border-b border-slate-100 overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="block w-full aspect-[16/9] object-cover"
            loading="eager"
            onError={(event) => {
              const imageElement = event.currentTarget;
              if (imageElement.dataset.fallbackApplied === 'true') return;
              imageElement.dataset.fallbackApplied = 'true';
              imageElement.src = createIllustrationDataUrl({
                title: article.title || 'Berita WARTAKITA',
                tag: article.category || 'Berita Warga',
                bgStart: '#0b1f3a',
                bgEnd: '#1e3a8a',
                accentColor: '#f97316'
              });
            }}
          />
        </div>

        <div className="p-5 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectCategory(article.category);
                onNavigate('category');
              }}
              className="px-3 py-1 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold transition"
            >
              {article.category}
            </button>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500">{article.publishedAt}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500">{article.views} kali dibaca</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0b1f3a] leading-tight">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed border-l-4 border-orange-500 pl-4 py-1 bg-slate-50/70 rounded-r-lg">
              {article.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#0b1f3a] text-white font-bold text-sm flex items-center justify-center">
                {article.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0b1f3a]">{article.author}</p>
                <p className="text-xs text-slate-500">Kontributor Warga WARTAKITA</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onShareWhatsApp(article)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-sm transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan ke WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setReportOpen(!reportOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <Flag className="w-3.5 h-3.5 text-slate-500" />
                <span>Laporkan</span>
              </button>
            </div>
          </div>

          {/* Form Laporan Konten (Simulasi Moderasi) */}
          {reportOpen && (
            <form
              onSubmit={handleReportSubmit}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3"
            >
              <p className="text-xs font-bold text-amber-950">
                Laporkan berita jika melanggar pedoman publikasi (SARA, ujaran kebencian, fitnah, atau informasi palsu):
              </p>
              <textarea
                rows={2}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Tuliskan alasan pelaporan secara singkat dan jelas..."
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-amber-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold"
                >
                  Kirim Laporan
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Isi Berita */}
        <div className="p-5 sm:p-8 space-y-5">
          <div className="space-y-4 text-slate-800 text-base leading-relaxed">
            {paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          {/* Tombol Berbagi di Bagian Bawah Artikel */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Bermanfaat? Sebarkan informasi ini kepada warga lainnya:
            </span>
            <button
              type="button"
              onClick={() => onShareWhatsApp(article)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan Berita via WhatsApp</span>
            </button>
          </div>

          {/* Keterangan Tanggung Jawab Penulis & Moderasi */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#0b1f3a] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Isi berita merupakan tanggung jawab penulis atau pembuat berita. WARTAKITA menyediakan
              platform publikasi bagi masyarakat dan berhak melakukan moderasi terhadap konten yang
              melanggar ketentuan.
            </p>
          </div>
        </div>
      </article>

      {/* Berita Terkait */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[#0b1f3a]">Berita Terkait</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedArticles.map((rel) => (
              <ArticleCard
                key={rel.id}
                article={rel}
                onOpenDetail={onOpenDetail}
                onSelectCategory={onSelectCategory}
                onShareWhatsApp={onShareWhatsApp}
                compact
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * HALAMAN TULIS BERITA TANPA MENDAFTAR + PRATINJAU + KONFIRMASI KODE
 * ============================================================================
 */
function WriteArticleView({ categories, onPublishArticle, onNavigate, onShowToast }) {
  const [author, setAuthor] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Berita Warga');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [publishedConfirmation, setPublishedConfirmation] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copyErrorMsg, setCopyErrorMsg] = useState('');
  const [formError, setFormError] = useState('');
  const copyTimerRef = useRef(null);
  const codeTextRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Silakan pilih berkas gambar yang valid (JPG, PNG, atau WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setFormError('Ukuran foto maksimal 3 MB agar nyaman dimuat di perangkat mobile.');
      return;
    }

    setFormError('');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!author.trim()) return 'Nama penulis wajib diisi.';
    if (!whatsapp.trim() || whatsapp.trim().length < 8) {
      return 'Nomor WhatsApp wajib diisi dengan format yang valid.';
    }
    if (!title.trim()) return 'Judul berita wajib diisi.';
    if (!category.trim()) return 'Kategori berita wajib dipilih.';
    if (!content.trim()) return 'Isi berita wajib diisi.';
    if (!agreed) {
      return 'Anda wajib menyetujui pernyataan tanggung jawab isi berita sebelum menerbitkan.';
    }
    return '';
  };

  const handlePreviewClick = () => {
    setFormError('');
    if (!title.trim() && !content.trim()) {
      setFormError('Isi minimal judul atau isi berita terlebih dahulu untuk melihat pratinjau.');
      return;
    }
    setShowPreview((prev) => !prev);
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setFormError(err);
      onShowToast(err, 'warning');
      return;
    }

    setFormError('');
    const fallbackImg = createIllustrationDataUrl({
      title: title.trim(),
      tag: category,
      bgStart: '#0b1f3a',
      bgEnd: '#1e3a8a',
      accentColor: '#f97316'
    });

    const created = await onPublishArticle({
      author: author.trim(),
      whatsapp: whatsapp.trim(),
      title: title.trim(),
      category,
      summary:
        summary.trim() ||
        content
          .trim()
          .replace(/\\s+/g, ' ')
          .slice(0, 155) + (content.trim().length > 155 ? '...' : ''),
      content: content.trim(),
      image: imagePreview || fallbackImg
    });

    if (!created) return;

    setPublishedConfirmation(created);
    setCopiedCode(false);
    setCopyErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fallbackCopyText = (text) => {
    let textArea = null;
    try {
      textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.style.fontSize = '16px';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      const successful = document.execCommand('copy');
      return Boolean(successful);
    } catch {
      return false;
    } finally {
      if (textArea && textArea.parentNode) {
        textArea.parentNode.removeChild(textArea);
      }
    }
  };

  const handleCopyCode = async (code) => {
    const exactCode = String(code || '').trim();
    if (!exactCode) return;

    setCopyErrorMsg('');
    let isCopied = false;

    // 1. Coba Clipboard API modern terlebih dahulu
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(exactCode);
        isCopied = true;
      } catch {
        isCopied = false;
      }
    }

    // 2. Fallback menggunakan textarea sementara & document.execCommand('copy')
    // (Berguna pada iframe pratinjau Gemini Canvas atau browser Android tertentu)
    if (!isCopied) {
      isCopied = fallbackCopyText(exactCode);
    }

    if (isCopied) {
      setCopiedCode(true);
      onShowToast('Kode kepemilikan berita berhasil disalin ke clipboard.');
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopiedCode(false);
      }, 3000);
    } else {
      setCopiedCode(false);
      // Seleksi teks kode di layar agar pengguna mudah menyalin secara manual
      if (codeTextRef.current && typeof window !== 'undefined' && window.getSelection) {
        try {
          const range = document.createRange();
          range.selectNodeContents(codeTextRef.current);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        } catch {
          // Abaikan jika seleksi otomatis tidak didukung
        }
      }
      const failMsg = 'Kode gagal disalin. Silakan salin kode secara manual.';
      setCopyErrorMsg(failMsg);
      onShowToast(failMsg, 'error');
    }
  };

  const resetFormForNewArticle = () => {
    setAuthor('');
    setWhatsapp('');
    setTitle('');
    setCategory(categories[0] || 'Berita Warga');
    setSummary('');
    setContent('');
    setImagePreview('');
    setAgreed(false);
    setShowPreview(false);
    setPublishedConfirmation(null);
    setCopiedCode(false);
    setCopyErrorMsg('');
    setFormError('');
  };

  // Tampilan Halaman Konfirmasi Setelah Berita Terbit
  if (publishedConfirmation) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Publikasi Berhasil
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1f3a] mt-0.5">
              Berita Anda Telah Diterbitkan!
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Judul: <strong className="text-slate-900">{publishedConfirmation.title}</strong>
            </p>
          </div>
        </div>

        {/* Kotak Kode Kepemilikan Rahasia */}
        <div className="bg-[#0b1f3a] text-white rounded-2xl p-5 sm:p-6 space-y-3 border border-orange-500/40">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
            Kode Kepemilikan Berita Anda
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/10 rounded-xl p-4 border border-white/15">
            <code
              ref={codeTextRef}
              className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-orange-300 select-all"
            >
              {publishedConfirmation.ownershipCode}
            </code>
            <button
              type="button"
              onClick={() => handleCopyCode(publishedConfirmation.ownershipCode)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold transition shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'TERSALIN' : 'SALIN KODE'}</span>
            </button>
          </div>
          {copyErrorMsg && (
            <p role="alert" className="text-xs font-semibold text-amber-200 pt-1">
              {copyErrorMsg}
            </p>
          )}
        </div>

        {/* Peringatan Wajib */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-900 font-medium leading-relaxed">
            PENTING! Kode ini merupakan bukti kepemilikan berita Anda. Simpan kode ini dengan
            baik. Kode ini diperlukan untuk mengedit atau menghapus berita Anda. Jangan berikan kode
            ini kepada orang lain. Jika kode hilang, kepemilikan berita tidak dapat diverifikasi
            melalui kode tersebut.
          </p>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Catatan prototipe: Kode kepemilikan ini disimulasikan di sisi klien untuk pengujian
          alur. Pada tahap produksi dengan Cloudflare Workers dan D1, kode akan dibuat aman serta
          diverifikasi di server.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('detail', publishedConfirmation.id)}
            className="px-4 py-2.5 rounded-xl bg-[#0b1f3a] hover:bg-[#13335e] text-white text-xs sm:text-sm font-bold transition"
          >
            Lihat Berita Terbit
          </button>
          <button
            type="button"
            onClick={() => onNavigate('manage')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold transition"
          >
            Kelola Berita Saya
          </button>
          <button
            type="button"
            onClick={resetFormForNewArticle}
            className="px-4 py-2.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs sm:text-sm font-semibold transition"
          >
            Tulis Berita Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b1f3a]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
            Tanpa Buat Akun
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a]">Tulis Berita Warga</h1>
        <p className="text-sm text-slate-600 mt-1">
          Lengkapi formulir berikut untuk menerbitkan berita Anda secara langsung. Setelah terbit,
          Anda akan menerima kode kepemilikan rahasia untuk mengedit atau menghapus berita.
        </p>

        {formError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-sm font-medium flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handlePublishSubmit} className="mt-6 space-y-5">
          {/* 1. Nama Penulis & 2. Nomor WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">
                Nama Penulis <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">
                Nomor WhatsApp <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Digunakan untuk keperluan verifikasi kontak jika dibutuhkan redaksi/moderasi.
              </p>
            </div>
          </div>

          {/* 3. Judul Berita */}
          <div>
            <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">
              Judul Berita <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tuliskan judul yang jelas, informatif, dan menarik"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 4. Kategori Berita */}
          <div>
            <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">
              Kategori Berita <span className="text-orange-600">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Ringkasan Berita */}
          <div>
            <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">
              Ringkasan Berita <span className="text-xs font-normal text-slate-500">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ringkasan singkat 1–2 kalimat tentang inti berita..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 6. Isi Berita */}
          <div>
            <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">
              Isi Berita <span className="text-orange-600">*</span>
            </label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan kronologi, fakta, wawancara singkat, atau cerita lengkap berita warga..."
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 7. Foto Utama Berita (Opsional) */}
          <div>
            <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">
              Foto Utama Berita <span className="text-xs font-normal text-slate-500">(Opsional)</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <ImageIcon className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>Pilih foto dari galeri perangkat (maksimal 3 MB). Jika kosong, ilustrasi otomatis akan digunakan.</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-xs text-slate-700 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0b1f3a] file:text-white hover:file:bg-[#13335e]"
                />
              </div>
              {imagePreview && (
                <div className="mt-3 relative">
                  <img
                    src={imagePreview}
                    alt="Pratinjau foto utama"
                    className="w-full max-h-60 object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview('')}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <X className="w-3.5 h-3.5" /> Hapus foto terpilih
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 8. Persetujuan Tanggung Jawab Isi Berita (Wajib) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-1 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 shrink-0"
              />
              <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <strong className="text-[#0b1f3a]">Persetujuan Tanggung Jawab (Wajib):</strong>{' '}
                Saya menyatakan bahwa seluruh informasi, tulisan, foto, dan materi yang saya
                kirimkan merupakan tanggung jawab saya sepenuhnya sebagai penulis atau pembuat
                berita. Saya bertanggung jawab atas kebenaran, keaslian, dan legalitas konten yang
                saya publikasikan.
              </span>
            </label>
          </div>

          {/* Tombol PRATINJAU BERITA & TERBITKAN BERITA */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={handlePreviewClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-[#0b1f3a] text-[#0b1f3a] hover:bg-slate-50 text-sm font-bold transition"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'TUTUP PRATINJAU' : 'PRATINJAU BERITA'}</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-extrabold shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>TERBITKAN BERITA</span>
            </button>
          </div>
        </form>
      </div>

      {/* Panel Pratinjau Berita */}
      {showPreview && (
        <section className="bg-white rounded-2xl border-2 border-orange-400/70 p-5 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600">
              <Eye className="w-4 h-4" />
              Pratinjau Sebelum Terbit
            </span>
            <span className="text-xs text-slate-500">{category}</span>
          </div>

          <h2 className="text-2xl font-extrabold text-[#0b1f3a]">
            {title.trim() || 'Judul Berita Belum Diisi'}
          </h2>
          <p className="text-xs text-slate-500">
            Oleh <strong>{author.trim() || 'Nama Penulis'}</strong> • {formatIndonesianDate()}
          </p>

          {(imagePreview || title.trim()) && (
            <img
              src={
                imagePreview ||
                createIllustrationDataUrl({
                  title: title.trim() || 'Pratinjau Berita Warga',
                  tag: category,
                  bgStart: '#0b1f3a',
                  bgEnd: '#1e3a8a',
                  accentColor: '#f97316'
                })
              }
              alt="Pratinjau berita"
              className="w-full max-h-72 object-cover rounded-xl"
            />
          )}

          {summary.trim() && (
            <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3.5 rounded-xl border-l-4 border-orange-500">
              {summary.trim()}
            </p>
          )}

          <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
            {content.trim() || 'Isi berita akan tampil di sini saat Anda mengetik.'}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * HALAMAN KELOLA BERITA SAYA (EDIT & HAPUS DENGAN KODE KEPEMILIKAN)
 * ============================================================================
 */
function ManageMyArticlesView({
  articles,
  categories,
  onUpdateArticle,
  onDeleteArticle,
  onNavigate,
  onShowToast
}) {
  const [codeInput, setCodeInput] = useState('');
  const [verifiedArticleId, setVerifiedArticleId] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // State form edit
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const verifiedArticle = useMemo(
    () => articles.find((a) => a.id === verifiedArticleId && a.status !== 'deleted') || null,
    [articles, verifiedArticleId]
  );

  useEffect(() => {
    if (verifiedArticleId && !verifiedArticle) {
      setVerifiedArticleId(null);
      setConfirmDeleteOpen(false);
    }
  }, [verifiedArticleId, verifiedArticle]);

  const loadArticleIntoEditState = (art) => {
    setEditTitle(art.title);
    setEditCategory(art.category);
    setEditSummary(art.summary);
    setEditContent(art.content);
    setEditImage(art.image);
    setConfirmDeleteOpen(false);
  };

  const handleCheckCode = async (e) => {
    e.preventDefault();
    const cleanCode = codeInput.trim().toUpperCase();
    setLookupError('');
    setVerifiedArticleId(null);

    if (!cleanCode) {
      setLookupError('Silakan masukkan kode kepemilikan berita Anda.');
      return;
    }

    try {
      const response = await fetch('/api/articles/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          ownership_code: cleanCode
        })
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.article) {
        throw new Error(result.message || 'Kode kepemilikan tidak valid.');
      }

      const item = result.article;
      const verified = {
        id: item.id,
        slug: item.slug,
        title: item.title,
        category: item.category_name || categories[0] || 'Berita Warga',
        summary: item.summary || '',
        content: item.content || '',
        author: item.author_name || 'Warga',
        whatsapp: item.author_whatsapp || '',
        publishedAt: item.created_at || '',
        timestamp: Date.now(),
        views: Number(item.views || 0),
        isFeatured: false,
        status: item.status || 'published',
        reportCount: 0,
        reportReason: '',
        image: item.image_url || ''
      };

      setVerifiedArticleId(verified.id);
      loadArticleIntoEditState(verified);
      onShowToast('Kode valid! Berita milik Anda berhasil ditemukan.');
    } catch (error) {
      setLookupError(error.message || 'Kode kepemilikan tidak valid.');
      onShowToast(error.message || 'Kode kepemilikan tidak valid.', 'error');
    }
  };

  const handleReplaceImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast('Pilih berkas gambar yang valid.', 'warning');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      onShowToast('Ukuran foto maksimal 3 MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditImage(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!verifiedArticle) return;
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();
    if (trimmedTitle.length < 10 || trimmedTitle.length > 200 || trimmedContent.length < 50) {
      onShowToast('Judul harus 10–200 karakter dan isi berita minimal 50 karakter.', 'warning');
      return;
    }

    const saved = await onUpdateArticle(verifiedArticle.id, {
      title: trimmedTitle,
      category: editCategory,
      summary: editSummary.trim(),
      content: trimmedContent
    }, codeInput.trim().toUpperCase());

    if (saved) {
      const refreshed = {
        ...verifiedArticle,
        title: trimmedTitle,
        category: editCategory,
        summary: editSummary.trim(),
        content: trimmedContent
      };
      loadArticleIntoEditState(refreshed);
    }
  };

  const handleConfirmDelete = async () => {
    if (!verifiedArticle) return;
    const deleted = await onDeleteArticle(
      verifiedArticle.id,
      'Dihapus oleh pemilik berita',
      codeInput.trim().toUpperCase()
    );
    if (deleted) {
      setVerifiedArticleId(null);
      setCodeInput('');
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b1f3a]/10 text-[#0b1f3a] text-xs font-bold mb-2">
            <Edit3 className="w-3.5 h-3.5" />
            Portal Penulis Warga
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a]">Kelola Berita Saya</h1>
          <p className="text-sm text-slate-600 mt-1">
            Masukkan kode kepemilikan rahasia yang Anda terima saat menerbitkan berita untuk
            mengubah atau menghapus berita Anda. Anda hanya dapat mengelola berita milik Anda sendiri.
          </p>
        </div>

        <form onSubmit={handleCheckCode} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Masukkan kode kepemilikan 32 karakter"
            aria-label="Kode kepemilikan berita"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#0b1f3a] hover:bg-[#13335e] text-white text-sm font-bold transition shrink-0"
          >
            PERIKSA KODE
          </button>
        </form>

        {lookupError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{lookupError}</span>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed">
          <strong>Keamanan:</strong> Kode kepemilikan diverifikasi oleh server menggunakan hash
          SHA-256. Jangan bagikan kode ini kepada orang lain.
        </div>
      </div>

      {/* Form Edit & Hapus Berita Setelah Kode Valid */}
      {verifiedArticle && (
        <div className="bg-white rounded-2xl border-2 border-[#0b1f3a] p-5 sm:p-7 shadow-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase">
                Kepemilikan Terverifikasi
              </span>
              <h2 className="text-xl font-extrabold text-[#0b1f3a]">Edit Berita Milik Anda</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('detail', verifiedArticle.id)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
            >
              Lihat Halaman Berita
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">Judul Berita</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">Kategori</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">Ringkasan</label>
              <textarea
                rows={2}
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">Isi Berita</label>
              <textarea
                rows={7}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0b1f3a] mb-1.5">
                Pratinjau Foto Berita (foto baru belum tersimpan ke server)
              </label>
              {editImage && (
                <img
                  src={editImage}
                  alt="Foto berita saat ini"
                  className="w-full max-h-56 object-cover rounded-xl border border-slate-200 mb-3"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleReplaceImage}
                className="text-xs text-slate-700 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0b1f3a] file:text-white"
              />
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-bold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Berita</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>

          {/* Konfirmasi Sebelum Menghapus Berita */}
          {confirmDeleteOpen && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-900">
                Konfirmasi Penghapusan Berita
              </p>
              <p className="text-xs sm:text-sm text-red-800">
                Apakah Anda yakin ingin menghapus berita &ldquo;{verifiedArticle.title}&rdquo;?
                Tindakan ini akan menghapus berita dari tampilan publik.
              </p>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Ya, Hapus Berita Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * HALAMAN LOGIN ADMIN & DASHBOARD MODERASI (SIMULASI PROTOTIPE)
 * ============================================================================
 * Catatan Keamanan:
 * - Tidak ada kredensial/password admin yang ditanamkan di dalam kode frontend.
 * - Pada prototipe ini, masuk ke mode simulasi admin menggunakan token akses sesi
 *   simulasi dan tidak boleh dianggap sebagai autentikasi admin sungguhan.
 */
function AdminLoginView({ onLoginSuccess, onNavigate }) {
  const [configured, setConfigured] = useState(null);
  const [username, setUsername] = useState('Agusto');
  const [password, setPassword] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/setup')
      .then((response) => response.json())
      .then((data) => setConfigured(Boolean(data.success && data.configured)))
      .catch(() => setErrorMsg('Tidak dapat memeriksa status akun admin. Muat ulang halaman.'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setBusy(true);
    try {
      const endpoint = configured ? '/api/admin/login' : '/api/admin/setup';
      const payload = configured
        ? { username, password }
        : { username: 'Agusto', password, setup_secret: setupSecret };
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Permintaan gagal.');
      if (configured) {
        // Pastikan cookie sesi benar-benar tersimpan dan diterima server.
        const sessionResponse = await fetch('/api/admin/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        });
        const sessionData = await sessionResponse.json();
        if (!sessionResponse.ok || !sessionData.success || !sessionData.authenticated) {
          throw new Error('Login diterima, tetapi sesi admin belum terbaca. Periksa cookie sesi pada server.');
        }
        onLoginSuccess(sessionData.username || data.username || username);
      } else {
        setConfigured(true);
        setPassword('');
        setSetupSecret('');
        setErrorMsg('Akun admin berhasil dibuat. Silakan masukkan password untuk login.');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#0b1f3a] text-orange-400 flex items-center justify-center"><Lock className="w-5 h-5" /></div>
        <div><h1 className="text-xl font-extrabold text-[#0b1f3a]">{configured ? 'Login Admin WARTAKITA' : 'Buat Akun Admin WARTAKITA'}</h1><p className="text-xs text-slate-500">Autentikasi aman melalui server</p></div>
      </div>
      {configured === null ? <p className="text-sm text-slate-500">Memeriksa status akun admin...</p> : (
        <>
          {!configured && <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950">Ini adalah setup awal satu kali. Username admin ditetapkan sebagai <strong>Agusto</strong>. Kode setup hanya digunakan untuk membuat akun pertama.</div>}
          {errorMsg && <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-semibold">{errorMsg}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {configured ? <div><label className="block text-xs font-bold text-[#0b1f3a] mb-1.5">Username Admin</label><input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm" /></div> : <div><label className="block text-xs font-bold text-[#0b1f3a] mb-1.5">Kode Setup Rahasia</label><input type="password" value={setupSecret} onChange={(e) => setSetupSecret(e.target.value)} autoComplete="off" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm" /></div>}
            <div><label className="block text-xs font-bold text-[#0b1f3a] mb-1.5">{configured ? 'Password' : 'Buat Password (minimal 12 karakter)'}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={configured ? 'current-password' : 'new-password'} minLength={12} required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm" /></div>
            <button type="submit" disabled={busy} className="w-full py-3 rounded-xl bg-[#0b1f3a] hover:bg-[#13335e] disabled:opacity-60 text-white text-sm font-bold transition">{busy ? 'Memproses...' : configured ? 'Masuk ke Dashboard Admin' : 'Buat Akun Admin'}</button>
          </form>
        </>
      )}
      <button type="button" onClick={() => onNavigate('home')} className="w-full text-center text-xs font-semibold text-slate-600 hover:text-[#0b1f3a]">Kembali ke Halaman Utama</button>
    </div>
  );
}

function AdminDashboardView({
  adminUser,
  articles,
  categories,
  onAddCategory,
  onRemoveCategory,
  onAdminUpdateArticle,
  onAdminDeleteArticle,
  onAdminRestoreArticle,
  onOpenDetail,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'review' | 'deleted' | 'categories'
  const [editingArticle, setEditingArticle] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editImageChanged, setEditImageChanged] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [moderationNote, setModerationNote] = useState('');

  const totalCount = articles.length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const reportedCount = articles.filter((a) => a.reportCount > 0 && a.status !== 'deleted').length;
  const deletedCount = articles.filter((a) => a.status === 'deleted').length;

  const needsReviewArticles = useMemo(
    () => articles.filter((a) => a.status !== 'deleted' && (a.reportCount > 0 || a.status === 'flagged')),
    [articles]
  );

  const visibleArticles = useMemo(() => {
    if (activeTab === 'review') return needsReviewArticles;
    if (activeTab === 'deleted') return articles.filter((a) => a.status === 'deleted');
    return articles;
  }, [articles, activeTab, needsReviewArticles]);

  const startEdit = (art) => {
    setEditingArticle(art);
    setEditTitle(art.title);
    setEditCategory(art.category);
    setEditContent(art.content);
    setEditImage(art.image || '');
    setEditImageChanged(false);
  };

  useEffect(() => {
    if (!editingArticle) return;
    const latest = articles.find((a) => a.id === editingArticle.id);
    if (!latest || latest.status === 'deleted') {
      setEditingArticle(null);
    }
  }, [articles, editingArticle]);

  const handleAdminImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Pilih berkas gambar yang valid (JPG, PNG, atau WebP).');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto maksimal 5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => alert('Foto gagal dibaca. Silakan pilih ulang.');
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => alert('File foto tidak dapat dibuka.');
      image.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { alert('Perangkat tidak dapat memproses foto.'); return; }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.76);
        if (compressed.length > 1400000) {
          alert('Foto masih terlalu besar setelah diproses. Pilih foto lain yang lebih kecil.');
          return;
        }
        setEditImage(compressed);
        setEditImageChanged(true);
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAdminEdit = async (e) => {
    e.preventDefault();
    if (!editingArticle) return;
    const saved = await onAdminUpdateArticle(editingArticle.id, {
      title: editTitle.trim(),
      category: editCategory,
      content: editContent.trim(),
      image_url: editImageChanged ? editImage : undefined
    });
    if (saved) setEditingArticle(null);
  };

  const handleAddCat = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Dashboard */}
      <div className="bg-[#0b1f3a] text-white rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Dashboard Admin (Sesi Admin Aktif)
          </span>
          <h1 className="text-2xl font-extrabold">Moderasi &amp; Pengelolaan WARTAKITA</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Sesi simulasi: <strong>{adminUser}</strong> • Penegakan pedoman anti-SARA, anti-ujaran
            kebencian, anti-fitnah, dan anti-hoaks.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Statistik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500">Total Berita</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a] mt-1">{totalCount}</p>
          <p className="text-[11px] text-emerald-700 mt-1">{publishedCount} berita aktif</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500">Berita Terbaru</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a] mt-1">
            {publishedCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Urutan waktu terkini</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500">Berita Dilaporkan</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-orange-600 mt-1">
            {reportedCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Memerlukan pemeriksaan</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500">Berita Dihapus</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1">{deletedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Diarsipkan/dihapus</p>
        </div>
      </div>

      {/* Tab Navigasi Admin */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'all'
              ? 'bg-[#0b1f3a] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Seluruh Berita ({articles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'review'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Butuh Pemeriksaan &amp; Laporan ({needsReviewArticles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deleted')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'deleted'
              ? 'bg-[#0b1f3a] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Berita Dihapus ({deletedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'categories'
              ? 'bg-[#0b1f3a] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Kelola Kategori ({categories.length})
        </button>
      </div>

      {/* Modal/Panel Edit Berita oleh Admin */}
      {editingArticle && (
        <div className="bg-white rounded-2xl border-2 border-orange-500 p-5 sm:p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">
              Edit Berita (Mode Moderasi Admin)
            </h2>
            <button
              type="button"
              onClick={() => setEditingArticle(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSaveAdminEdit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-edit-title" className="block text-sm font-bold text-slate-700">
                Judul Berita
              </label>
              <input
                id="admin-edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Masukkan judul berita"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-edit-category" className="block text-sm font-bold text-slate-700">
                Kategori Berita
              </label>
              <select
                id="admin-edit-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Foto Berita</label>
              {editImage ? (
                <img src={editImage} alt="Pratinjau foto berita" className="w-full max-h-56 object-cover rounded-xl border border-slate-200" />
              ) : (
                <div className="w-full h-32 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-sm text-slate-500">Belum ada foto berita</div>
              )}
              <input
                id="admin-edit-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAdminImageChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700"
              />
              <p className="text-xs text-slate-500">Pilih foto baru dari galeri HP. Jika tidak memilih foto, foto lama tetap digunakan.</p>
              {editImageChanged && <p className="text-xs font-semibold text-emerald-700">Foto baru siap disimpan.</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-edit-content" className="block text-sm font-bold text-slate-700">
                Isi Berita
              </label>
              <textarea
                id="admin-edit-content"
                rows={6}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Tulis isi berita di sini"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingArticle(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
              >
                Simpan Perubahan Admin
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kelola Kategori */}
      {activeTab === 'categories' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Kelola Kategori Berita</h2>
            <p className="text-xs text-slate-500">
              Tambah atau kelola kategori warga (hindari kategori politik praktis / kampanye).
            </p>
          </div>

          <form onSubmit={handleAddCat} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori baru..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold"
            >
              Tambah Kategori
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              >
                <span className="text-sm font-semibold text-[#0b1f3a]">{cat}</span>
                {categories.length > 3 && (
                  <button
                    type="button"
                    onClick={() => onRemoveCategory(cat)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Daftar Berita untuk Moderasi Admin */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#0b1f3a]">
                {activeTab === 'review'
                  ? 'Daftar Berita yang Membutuhkan Pemeriksaan'
                  : activeTab === 'deleted'
                  ? 'Daftar Berita yang Telah Dihapus'
                  : 'Seluruh Berita Warga'}
              </h2>
              <p className="text-xs text-slate-500">
                Tindak lanjuti konten berunsur SARA, penghinaan agama/suku/kelompok, ujaran
                kebencian, fitnah, berita bohong, atau pelanggaran hukum.
              </p>
            </div>
            <input
              type="text"
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              placeholder="Catatan moderasi (opsional)..."
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:w-64"
            />
          </div>

          {visibleArticles.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Tidak ada berita pada tampilan ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleArticles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-20 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {art.image ? <img src={art.image} alt={`Foto ${art.title}`} loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">Tanpa foto</div>}
                    </div>
                    <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          art.status === 'deleted'
                            ? 'bg-red-100 text-red-700'
                            : art.reportCount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {art.status === 'deleted'
                          ? 'Dihapus'
                          : art.reportCount > 0
                          ? `Dilaporkan (${art.reportCount})`
                          : 'Terbit'}
                      </span>
                      <span className="text-xs font-semibold text-orange-600">{art.category}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">Penulis: {art.author}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#0b1f3a]">{art.title}</h3>

                    {art.reportReason && (
                      <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block">
                        Laporan: {art.reportReason}
                      </p>
                    )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {art.status !== 'deleted' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenDetail(art.id)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800"
                        >
                          Lihat
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(art)}
                          className="px-3 py-2 rounded-xl bg-[#0b1f3a] hover:bg-[#13335e] text-xs font-semibold text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAdminDeleteArticle(
                              art.id,
                              moderationNote.trim() || 'Dihapus oleh admin karena melanggar ketentuan'
                            )
                          }
                          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white"
                        >
                          Hapus Pelanggaran
                        </button>
                      </>
                    )}

                    {art.status === 'deleted' && (
                      <button
                        type="button"
                        onClick={() => onAdminRestoreArticle(art.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
                      >
                        Pulihkan Berita
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * HALAMAN INFORMASI TAMBAHAN (TENTANG KAMI, PEDOMAN, PRIVASI, HUBUNGI KAMI)
 * ============================================================================
 */
function InfoPageView({ pageKey, onNavigate, onShowToast }) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) return;
    setSentSuccess(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    onShowToast('Pesan Anda telah tercatat pada simulasi formulir Hubungi Kami.');
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b1f3a]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </button>

      {pageKey === 'about' && (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            Tentang Kami
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a]">
            Tentang WARTAKITA
          </h1>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            <strong>WARTAKITA</strong> hadir dengan semangat <em>&ldquo;Berita dari Warga, Untuk Semua.&rdquo;</em>{' '}
            Aplikasi ini dirancang sebagai ruang berbagi informasi, kegiatan lingkungan, cerita
            inspiratif, kuliner daerah, pendidikan, kesehatan, dan peristiwa sehari-hari yang
            dekat dengan kehidupan masyarakat Indonesia.
          </p>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            Pengunjung dapat menulis berita tanpa harus membuat akun, sekaligus memperoleh kode
            kepemilikan untuk mengelola berita yang diterbitkannya. Arsitektur aplikasi dipersiapkan
            agar dapat dihubungkan dengan layanan edge seperti Cloudflare Workers dan Cloudflare D1.
          </p>
        </div>
      )}

      {pageKey === 'guidelines' && (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Pedoman Publikasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a]">
            Pedoman Publikasi Warga
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed">
            Agar WARTAKITA tetap menjadi ruang informasi yang sehat, aman, dan bermanfaat bagi
            seluruh lapisan masyarakat, setiap penulis wajib mematuhi ketentuan berikut:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>Menyampaikan informasi yang jujur, faktual, dan dapat dipertanggungjawabkan.</li>
            <li>
              Dilarang keras memuat konten SARA, penghinaan terhadap agama, penghinaan terhadap suku
              atau kelompok masyarakat, ujaran kebencian, fitnah, berita bohong/hoaks, maupun
              materi yang melanggar hukum.
            </li>
            <li>
              Menghormati hak cipta dan privasi pihak lain atas foto maupun tulisan yang
              disertakan.
            </li>
            <li>
              WARTAKITA bukan wadah politik praktis maupun kampanye politik.
            </li>
          </ul>
        </div>
      )}

      {pageKey === 'privacy' && (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            Kebijakan Privasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a]">
            Kebijakan Privasi
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed">
            WARTAKITA menghargai privasi setiap kontributor dan pembaca. Nama penulis serta konten
            berita yang diterbitkan akan tampil pada halaman publik, sedangkan kode kepemilikan
            tidak ditampilkan pada halaman publik.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Pada tahap prototipe ini, seluruh data berjalan di memori aplikasi untuk keperluan uji
            coba dan simulasi. Pada tahap produksi dengan Cloudflare Workers dan Cloudflare D1,
            pengelolaan data dan verifikasi kepemilikan akan diproses melalui endpoint backend yang
            aman.
          </p>
        </div>
      )}

      {pageKey === 'contact' && (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
            <Mail className="w-3.5 h-3.5" />
            Hubungi Kami
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a]">Hubungi Kami</h1>
          <p className="text-sm text-slate-600">
            Punya masukan, pertanyaan moderasi, atau saran pengembangan untuk WARTAKITA? Kirimkan
            pesan melalui formulir berikut.
          </p>

          {sentSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3.5 text-sm font-medium">
              Terima kasih! Pesan Anda telah diterima dalam simulasi antarmuka WARTAKITA.
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1f3a] mb-1">Nama Anda</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0b1f3a] mb-1">
                Email / Nomor Kontak (Opsional)
              </label>
              <input
                type="text"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                placeholder="contoh@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0b1f3a] mb-1">Pesan</label>
              <textarea
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                placeholder="Tuliskan pesan Anda..."
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold"
            >
              Kirim Pesan
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * KOMPONEN FOOTER & TOMBOL KEMBALI KE ATAS
 * ============================================================================
 */
function Footer({ onNavigate, onSelectCategory, categories }) {
  return (
    <footer className="bg-[#0b1f3a] text-slate-300 mt-14 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white">
              <Newspaper className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold text-white">
              WARTA<span className="text-orange-400">KITA</span>
            </span>
          </div>
          <p className="text-sm font-semibold text-orange-300">
            Berita dari Warga, Untuk Semua.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Portal berita komunitas untuk berbagi informasi, cerita warga, kegiatan sosial, dan
            kabar positif di sekitar kita tanpa harus membuat akun.
          </p>
        </div>

        <div className="md:col-span-3 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Informasi</h3>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="hover:text-orange-300 transition"
              >
                Tentang Kami
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('guidelines')}
                className="hover:text-orange-300 transition"
              >
                Pedoman Publikasi
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="hover:text-orange-300 transition"
              >
                Kebijakan Privasi
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="hover:text-orange-300 transition"
              >
                Hubungi Kami
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Akses &amp; Kategori
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  onNavigate('category');
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-orange-500 text-xs text-slate-200 hover:text-white transition"
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="pt-2 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('manage')}
              className="text-orange-300 hover:underline font-semibold"
            >
              Kelola Berita Saya
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin-login')}
              className="text-slate-300 hover:text-white underline"
            >
              Portal Admin
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#081629] border-t border-white/10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} WARTAKITA. Seluruh hak cipta dilindungi.</p>
          <p className="text-[11px] text-slate-400">agusto-kopijono</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * ============================================================================
 * KOMPONEN UTAMA APLIKASI (APP)
 * ============================================================================
 */
export default function App() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [activeView, setActiveView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [articlesResponse, categoriesResponse] = await Promise.all([
          fetch('/api/articles-list'),
          fetch('/api/categories')
        ]);

        const articlesData = await articlesResponse.json();
        const categoriesData = await categoriesResponse.json();

        if (articlesResponse.ok && articlesData.success) {
          const normalizedArticles = (articlesData.articles || []).map((item) => {
            const articleDateText = String(item.created_at || '');
            const parsedDate = articleDateText
              ? new Date(
                  articleDateText.includes('T')
                    ? articleDateText
                    : `${articleDateText.replace(' ', 'T')}Z`
                )
              : new Date();
            const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
            const articleCategory = item.category_name || item.category || 'Berita Warga';

            return {
              id: item.id,
              slug: item.slug,
              title: item.title,
              category: articleCategory,
              summary: item.summary || '',
              content: item.content || '',
              author: item.author_name || item.author || 'Warga',
              whatsapp: item.author_whatsapp || item.whatsapp || '',
              publishedAt: formatIndonesianDate(safeDate),
              timestamp: safeDate.getTime(),
              views: Number(item.views || 0),
              isFeatured: Boolean(item.is_featured || item.isFeatured),
              status: item.status || 'published',
              reportCount: Number(item.report_count || item.reportCount || 0),
              reportReason: item.report_reason || item.reportReason || '',
              ownershipCode: '',
              image: item.image_url || createIllustrationDataUrl({
                title: item.title || 'Berita WARTAKITA',
                tag: articleCategory,
                bgStart: '#0b1f3a',
                bgEnd: '#1e3a8a',
                accentColor: '#f97316'
              })
            };
          });

          setArticles(normalizedArticles);
        }

        if (categoriesResponse.ok && categoriesData.success) {
          setCategoryRecords(categoriesData.categories || []);
          setCategories(
            (categoriesData.categories || []).map((category) => category.name)
          );
        }
      } catch (error) {
        console.error('Gagal mengambil data WARTAKITA:', error);
      }
    }

    loadData();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState('');

  useEffect(() => {
    fetch('/api/admin/session', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.authenticated) {
          setIsAdminAuthenticated(true);
          setAdminUser(data.username || 'Agusto');
        }
      })
      .catch(() => {});
  }, []);

  // Muat seluruh berita dari API khusus admin setelah sesi terverifikasi.
  // Endpoint ini mengambil data langsung dari D1, termasuk status moderasi.
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    let cancelled = false;

    async function loadAdminArticles() {
      try {
        const response = await fetch('/api/admin/articles', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Gagal mengambil daftar berita admin.');
        }

        const normalizedArticles = (data.articles || []).map((item) => {
          const dateText = String(item.created_at || item.updated_at || '');
          const parsedDate = dateText
            ? new Date(dateText.includes('T') ? dateText : `${dateText.replace(' ', 'T')}Z`)
            : new Date();
          const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
          const articleCategory = item.category_name || item.category || 'Berita Warga';

          return {
            id: item.id,
            slug: item.slug,
            title: item.title || '',
            category: articleCategory,
            summary: item.summary || '',
            content: item.content || '',
            author: item.author_name || item.author || 'Warga',
            whatsapp: item.author_whatsapp || item.whatsapp || '',
            publishedAt: formatIndonesianDate(safeDate),
            timestamp: safeDate.getTime(),
            views: Number(item.views || 0),
            isFeatured: Boolean(item.is_featured || item.isFeatured),
            status: item.status || 'published',
            reportCount: Number(item.report_count || item.reportCount || 0),
            reportReason: item.report_reason || item.reportReason || '',
            ownershipCode: '',
            image: item.image_url || createIllustrationDataUrl({
              title: item.title || 'Berita WARTAKITA',
              tag: articleCategory,
              bgStart: '#0b1f3a',
              bgEnd: '#1e3a8a',
              accentColor: '#f97316'
            })
          };
        });

        if (!cancelled) setArticles(normalizedArticles);
      } catch (error) {
        console.error('Gagal memuat berita admin dari D1:', error);
      }
    }

    loadAdminArticles();
    return () => {
      cancelled = true;
    };
  }, [isAdminAuthenticated]);
  const [toast, setToast] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const navigateTo = (view, articleId = null) => {
    if (view === 'admin-dashboard' && !isAdminAuthenticated) {
      setActiveView('admin-login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (articleId) {
      setSelectedArticleId(articleId);
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, views: a.views + 1 } : a))
      );
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDetail = (articleId) => {
    navigateTo('detail', articleId);
  };

  const handleShareWhatsApp = (article) => {
    const shareUrl = buildWhatsAppShareUrl(article);
    try {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      showToast('Membuka WhatsApp untuk membagikan tautan berita.');
    } catch {
      showToast('Tautan berbagi WhatsApp siap digunakan.');
    }
  };

  const handlePublishArticle = async (newData) => {
    try {
      const selectedCategoryRecord = categoryRecords.find(
        (item) => item.name === newData.category
      );

      if (!selectedCategoryRecord) {
        throw new Error('Kategori berita tidak ditemukan. Muat ulang halaman dan coba lagi.');
      }

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newData.title,
          content: newData.content,
          summary: newData.summary,
          category_id: selectedCategoryRecord.id,
          author_name: newData.author,
          author_whatsapp: newData.whatsapp,
          image_url: ''
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Berita gagal diterbitkan.');
      }

      const now = new Date();
      const newArticle = {
        id: result.article.id,
        slug: result.article.slug,
        title: result.article.title || newData.title,
        category: newData.category,
        summary: newData.summary,
        content: newData.content,
        author: newData.author,
        whatsapp: newData.whatsapp,
        publishedAt: formatIndonesianDate(now),
        timestamp: now.getTime(),
        views: 0,
        isFeatured: false,
        status: result.article.status || 'published',
        reportCount: 0,
        reportReason: '',
        ownershipCode: result.ownership_code,
        image: newData.image
      };

      setArticles((prev) => [newArticle, ...prev]);
      showToast('Berita berhasil diterbitkan! Simpan kode kepemilikan Anda.');
      return newArticle;
    } catch (error) {
      console.error('Gagal menerbitkan berita:', error);
      showToast(error.message || 'Berita gagal diterbitkan.', 'error');
      return null;
    }
  };

  const handleUpdateOwnedArticle = async (articleId, updates, ownershipCode) => {
    try {
      const selectedCategory = categoryRecords.find(
        (item) => item.name === updates.category
      );
      if (!selectedCategory) {
        throw new Error('Kategori berita tidak ditemukan.');
      }

      const response = await fetch('/api/articles/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          article_id: articleId,
          ownership_code: ownershipCode,
          title: updates.title,
          content: updates.content,
          summary: updates.summary,
          category_id: selectedCategory.id,
          ...(updates.image_url ? { image_url: updates.image_url } : {})
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Perubahan berita gagal disimpan.');
      }

      setArticles((prev) => prev.map((article) =>
        article.id === articleId
          ? { ...article, ...updates, image: article.image }
          : article
      ));
      showToast('Perubahan berita berhasil disimpan ke database.');
      return true;
    } catch (error) {
      showToast(error.message || 'Perubahan berita gagal disimpan.', 'error');
      return false;
    }
  };

  const handleDeleteOwnedArticle = async (articleId, reason, ownershipCode) => {
    try {
      const response = await fetch('/api/articles/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          article_id: articleId,
          ownership_code: ownershipCode
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Berita gagal dihapus.');
      }

      setArticles((prev) => prev.filter((article) => article.id !== articleId));
      showToast('Berita berhasil dihapus dari database.');
      return true;
    } catch (error) {
      showToast(error.message || 'Berita gagal dihapus.', 'error');
      return false;
    }
  };

  const handleUpdateArticle = async (articleId, updates) => {
    try {
      const selectedCategory = categoryRecords.find(
        (item) => item.name === updates.category
      );
      if (!selectedCategory) {
        throw new Error('Kategori berita tidak ditemukan. Muat ulang halaman dan coba lagi.');
      }

      const requestBody = {
        article_id: articleId,
        title: updates.title,
        content: updates.content,
        category_id: selectedCategory.id,
        ...(typeof updates.image_url === 'string' && updates.image_url.startsWith('data:image/')
          ? { image_url: updates.image_url }
          : {})
      };

      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Perubahan berita gagal disimpan.');
      }

      setArticles((prev) => prev.map((article) =>
        article.id === articleId
          ? {
              ...article,
              title: result.article.title,
              content: result.article.content,
              summary: result.article.summary,
              category: result.article.category_name,
              image: result.article.image_url || article.image
            }
          : article
      ));
      showToast('Perubahan berita berhasil disimpan ke database D1.');
      return true;
    } catch (error) {
      console.error('Gagal menyimpan edit berita admin:', error);
      showToast(error.message || 'Perubahan berita gagal disimpan.', 'error');
      return false;
    }
  };

  const handleDeleteArticle = async (articleId, reason = 'Dihapus oleh admin') => {
    try {
      const response = await fetch('/api/admin/articles', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, reason })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Berita gagal dihapus dari database.');
      }

      setArticles((prev) =>
        prev.map((article) =>
          article.id === articleId
            ? { ...article, status: 'deleted', reportReason: reason }
            : article
        )
      );
      showToast(result.message || 'Berita berhasil dihapus dari database.');
      return true;
    } catch (error) {
      console.error('Gagal menghapus berita admin:', error);
      showToast(error.message || 'Berita gagal dihapus.', 'error');
      return false;
    }
  };

  const handleReportArticle = (articleId, reason) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? {
              ...a,
              reportCount: a.reportCount + 1,
              reportReason: a.reportReason ? `${a.reportReason} | ${reason}` : reason
            }
          : a
      )
    );
    showToast('Laporan berita telah dikirim untuk diperiksa tim moderasi.');
  };

  const handleAdminRestoreArticle = async (articleId) => {
    try {
      const response = await fetch('/api/admin/articles', {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Berita gagal dipulihkan dari database.');
      }

      setArticles((prev) => prev.map((article) =>
        article.id === articleId
          ? { ...article, status: 'published', reportCount: 0, reportReason: '' }
          : article
      ));
      showToast(result.message || 'Berita berhasil dipulihkan dan diterbitkan kembali.');
      return true;
    } catch (error) {
      console.error('Gagal memulihkan berita admin:', error);
      showToast(error.message || 'Berita gagal dipulihkan.', 'error');
      return false;
    }
  };

  const handleAddCategory = (catName) => {
    if (categories.some((c) => c.toLowerCase() === catName.toLowerCase())) {
      showToast('Kategori tersebut sudah tersedia.', 'warning');
      return;
    }
    setCategories((prev) => [...prev, catName]);
    showToast(`Kategori "${catName}" berhasil ditambahkan.`);
  };

  const handleRemoveCategory = (catName) => {
    setCategories((prev) => prev.filter((c) => c !== catName));
    if (selectedCategory === catName) {
      setSelectedCategory('Semua');
    }
    showToast(`Kategori "${catName}" dihapus dari daftar.`);
  };

  const currentDetailArticle = useMemo(
    () => articles.find((a) => a.id === selectedArticleId) || null,
    [articles, selectedArticleId]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb] text-slate-900">
      <Header
        activeView={activeView}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigate={(v) => navigateTo(v)}
        onSelectCategory={setSelectedCategory}
        categories={categories}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'home' && (
          <HomeView
            articles={articles}
            categories={categories}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onSelectCategory={setSelectedCategory}
            onNavigate={(v, id) => navigateTo(v, id)}
            onOpenDetail={handleOpenDetail}
            onShareWhatsApp={handleShareWhatsApp}
          />
        )}

        {activeView === 'category' && (
          <CategoryView
            category={selectedCategory}
            categories={categories}
            articles={articles}
            onSelectCategory={setSelectedCategory}
            onNavigate={(v, id) => navigateTo(v, id)}
            onOpenDetail={handleOpenDetail}
            onShareWhatsApp={handleShareWhatsApp}
          />
        )}

        {activeView === 'detail' && (
          <ArticleDetailView
            article={currentDetailArticle}
            allArticles={articles}
            onOpenDetail={handleOpenDetail}
            onSelectCategory={setSelectedCategory}
            onNavigate={(v, id) => navigateTo(v, id)}
            onShareWhatsApp={handleShareWhatsApp}
            onReportArticle={handleReportArticle}
          />
        )}

        {activeView === 'write' && (
          <WriteArticleView
            categories={categories}
            onPublishArticle={handlePublishArticle}
            onNavigate={(v, id) => navigateTo(v, id)}
            onShowToast={showToast}
          />
        )}

        {activeView === 'manage' && (
          <ManageMyArticlesView
            articles={articles}
            categories={categories}
            onUpdateArticle={handleUpdateOwnedArticle}
            onDeleteArticle={handleDeleteOwnedArticle}
            onNavigate={(v, id) => navigateTo(v, id)}
            onShowToast={showToast}
          />
        )}

        {activeView === 'admin-login' && (
          <AdminLoginView
            onLoginSuccess={(userLabel) => {
              setIsAdminAuthenticated(true);
              setAdminUser(userLabel);
              setActiveView('admin-dashboard');
              showToast(`Berhasil masuk sebagai ${userLabel}.`);
            }}
            onNavigate={(v) => navigateTo(v)}
          />
        )}

        {activeView === 'admin-dashboard' && isAdminAuthenticated && (
          <AdminDashboardView
            adminUser={adminUser}
            articles={articles}
            categories={categories}
            onAddCategory={handleAddCategory}
            onRemoveCategory={handleRemoveCategory}
            onAdminUpdateArticle={handleUpdateArticle}
            onAdminDeleteArticle={handleDeleteArticle}
            onAdminRestoreArticle={handleAdminRestoreArticle}
            onOpenDetail={handleOpenDetail}
            onLogout={async () => {
              try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'include', cache: 'no-store' }); } catch {}
              setIsAdminAuthenticated(false);
              setAdminUser('');
              setActiveView('home');
              showToast('Sesi admin telah ditutup.');
            }}
          />
        )}

        {['about', 'guidelines', 'privacy', 'contact'].includes(activeView) && (
          <InfoPageView
            pageKey={activeView}
            onNavigate={(v) => navigateTo(v)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Tombol Kembali ke Atas */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Kembali ke atas"
          className="fixed bottom-6 right-5 z-30 w-11 h-11 rounded-full bg-[#0b1f3a] hover:bg-orange-500 text-white shadow-lg flex items-center justify-center transition"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <Footer
        onNavigate={(v) => navigateTo(v)}
        onSelectCategory={setSelectedCategory}
        categories={categories}
      />

      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}