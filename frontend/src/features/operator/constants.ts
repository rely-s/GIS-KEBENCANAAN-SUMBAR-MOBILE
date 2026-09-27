export const WILAYAH_SUMBAR_LIST = [
  { id: 1, nama: 'Provinsi Sumatera Barat (Umum / Multi-Wilayah)' },
  { id: 2, nama: 'Kota Padang' },
  { id: 3, nama: 'Kab. Agam' },
  { id: 4, nama: 'Kab. Tanah Datar' },
  { id: 5, nama: 'Kab. Padang Pariaman' },
  { id: 6, nama: 'Kab. Pesisir Selatan' },
  { id: 7, nama: 'Kab. Solok' },
  { id: 8, nama: 'Kota Bukittinggi' },
  { id: 9, nama: 'Kota Solok' },
  { id: 10, nama: 'Kota Sawahlunto' },
  { id: 11, nama: 'Kota Padang Panjang' },
  { id: 12, nama: 'Kota Payakumbuh' },
  { id: 13, nama: 'Kota Pariaman' },
  { id: 14, nama: 'Kab. Pasaman' },
  { id: 15, nama: 'Kab. Pasaman Barat' },
  { id: 16, nama: 'Kab. Lima Puluh Kota' },
  { id: 17, nama: 'Kab. Solok Selatan' },
  { id: 18, nama: 'Kab. Sijunjung' },
  { id: 19, nama: 'Kab. Dharmasraya' },
  { id: 20, nama: 'Kab. Kepulauan Mentawai' },
];

export interface UserSession {
  id: number;
  nama: string;
  email: string;
  role: 'operator' | 'pusdalops' | 'admin' | 'pimpinan' | 'super_admin';
  wilayah_tugas_id?: number | null;
}

export type CommandTab = 'posko' | 'bencana' | 'blokade' | 'verifikasi' | 'audit' | 'pengguna' | 'eksekutif';
