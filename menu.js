import {
  ClipboardCheck,
  FilePenLine,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Megaphone,
  PencilLine,
  ShieldAlert,
  Users,
  Video,
} from 'lucide-react'

// path '' = halaman dashboard. `modul` = modul pengerjaan fitur tersebut.
const dashboard = { path: '', label: 'Dashboard', icon: LayoutDashboard, desc: 'Ringkasan dan notifikasi.' }

export const menus = {
  siswa: {
    groups: [
      {
        items: [
          dashboard,
          { path: 'materi', label: 'Materi Video', icon: Video, desc: 'Tonton materi Himpunan.', modul: 4 },
          { path: 'lkpd', label: 'LKPD', icon: FileText, desc: 'Lembar kerja peserta didik.', modul: 4 },
          { path: 'latihan', label: 'Latihan Soal', icon: PencilLine, desc: 'Asah pemahamanmu.', modul: 4 },
          { path: 'evaluasi', label: 'Evaluasi', icon: ClipboardCheck, desc: 'Ukur capaian belajarmu.', modul: 4 },
          { path: 'nilai', label: 'Hasil & Nilai', icon: LineChart, desc: 'Grafik dan daftar nilai.', modul: 7 },
          { path: 'pengumuman', label: 'Pengumuman', icon: Megaphone, desc: 'Info terbaru dari guru.', modul: 4 },
        ],
      },
    ],
  },

  guru: {
    groups: [
      {
        items: [
          dashboard,
          { path: 'kelola-materi', label: 'Kelola Materi Video', icon: Video, desc: 'Tambah dan hapus video.', modul: 3 },
          { path: 'kelola-lkpd', label: 'Kelola LKPD', icon: FileText, desc: 'Atur soal dan jadwal LKPD.', modul: 3 },
          { path: 'kelola-latihan', label: 'Kelola Latihan Soal', icon: PencilLine, desc: 'Atur soal dan jadwal latihan.', modul: 3 },
          { path: 'kelola-evaluasi', label: 'Kelola Evaluasi', icon: ClipboardCheck, desc: 'Atur soal dan jadwal evaluasi.', modul: 3 },
          { path: 'kecurangan', label: 'Kecurangan Siswa', icon: ShieldAlert, desc: 'Log pindah tab saat mengerjakan.', modul: 6 },
          { path: 'penilaian', label: 'Penilaian Siswa', icon: ListChecks, desc: 'Koreksi dan tetapkan nilai akhir.', modul: 3 },
          { path: 'pengumuman', label: 'Pengumuman', icon: Megaphone, desc: 'Buat pengumuman untuk siswa.', modul: 3 },
        ],
      },
    ],
  },

  admin: {
    groups: [
      {
        title: 'Navigasi Utama',
        items: [
          dashboard,
          { path: 'materi', label: 'Materi Video', icon: Video, desc: 'Lihat materi seperti siswa.', modul: 4 },
          { path: 'lkpd', label: 'LKPD', icon: FileText, desc: 'Lihat LKPD seperti siswa.', modul: 4 },
          { path: 'latihan', label: 'Latihan Soal', icon: PencilLine, desc: 'Lihat latihan seperti siswa.', modul: 4 },
          { path: 'evaluasi', label: 'Evaluasi', icon: ClipboardCheck, desc: 'Lihat evaluasi seperti siswa.', modul: 4 },
          { path: 'nilai', label: 'Hasil & Nilai', icon: LineChart, desc: 'Rekap nilai semua siswa.', modul: 7 },
          { path: 'pengumuman', label: 'Pengumuman', icon: Megaphone, desc: 'Buat dan hapus pengumuman.', modul: 3 },
        ],
      },
      {
        title: 'Pengelolaan Guru',
        items: [
          { path: 'kelola-materi', label: 'Kelola Materi Video', icon: Video, desc: 'Tambah dan hapus video.', modul: 3 },
          { path: 'kelola-lkpd', label: 'Kelola LKPD', icon: FileText, desc: 'Atur soal dan jadwal LKPD.', modul: 3 },
          { path: 'kelola-latihan', label: 'Kelola Latihan Soal', icon: PencilLine, desc: 'Atur soal dan jadwal latihan.', modul: 3 },
          { path: 'kelola-evaluasi', label: 'Kelola Evaluasi', icon: ClipboardCheck, desc: 'Atur soal dan jadwal evaluasi.', modul: 3 },
          { path: 'kecurangan', label: 'Kecurangan Siswa', icon: ShieldAlert, desc: 'Log pindah tab saat mengerjakan.', modul: 6 },
          { path: 'penilaian', label: 'Penilaian Siswa', icon: ListChecks, desc: 'Koreksi dan tetapkan nilai akhir.', modul: 3 },
        ],
      },
      {
        title: 'Manajemen Admin',
        items: [
          { path: 'peserta', label: 'Kelola Peserta', icon: Users, desc: 'ACC, tolak, tambah, nonaktifkan akun.', modul: 2 },
        ],
      },
    ],
  },
}

export const roleCards = {
  siswa: { label: 'Siswa', icon: GraduationCap, desc: 'Belajar materi, kerjakan tugas, dan pantau nilaimu.' },
  guru: { label: 'Guru', icon: FilePenLine, desc: 'Kelola materi, soal, penilaian, dan pengumuman.' },
  admin: { label: 'Admin', icon: Users, desc: 'Kelola peserta dan seluruh fitur SETLAND.' },
}

export const flatItems = (role) => menus[role].groups.flatMap((g) => g.items)
