# Siaga Sumbar Mobile - Aplikasi Kedaruratan & Taktis Bencana

Aplikasi mobile tanggap darurat dan pemantauan risiko bencana Sumatera Barat, dikembangkan oleh **BPBD Provinsi Sumatera Barat** bekerja sama dengan **LPPM Universitas Putra Indonesia "YPTK" Padang**.

---

## 🚀 Fitur Utama

1. **Radar Bahaya Geodesik (GIS Live & Offline Fallback):**
   - Perhitungan otomatis jarak koordinat Anda ke 4 zona ancaman utama: **Tsunami Pesisir**, **Sesar Darat Semangko (Sianok/Sumani)**, **Lahar Dingin Galodo Marapi**, dan **Banjir DAS**.
   - Hero Banner Status Keselamatan: **STATUS AMAN**, **WASPADA**, atau **ZONA BAHAYA LANGSUNG**.
2. **Shelter Evakuasi Terdekat (TES):**
   - Menampilkan Tempat Evakuasi Sementara (TES bertingkat tahan tsunami) terdekat, estimasi jarak, fasilitas (air/medis), dan daya tampung jiwa.
3. **Posko Darurat & Medis:**
   - Akses kontak cepat ke Posko Utama BPBD (112) dan Pos Medis Darurat PMI (118).
4. **Lapor Kejadian Lapangan:**
   - Bottom sheet modal cepat dengan auto-geotagging GPS.
   - Kompresi foto on-device otomatis format WebP (<200KB) agar hemat kuota darurat.
   - Antrean kirim tangguh (Offline Queue).
5. **Feed Data Riil Lapangan:**
   - Data gempa bumi terkini BMKG (Magnitudo, Kedalaman, Potensi Tsunami).
   - Peringatan ruas jalan terputus akibat longsor/galodo.
   - Riwayat dan tracking verifikasi laporan warga oleh operator Pusdalops BPBD.
6. **Handoff Web GIS:**
   - Tombol pembuka peta interaktif via In-App Browser (`expo-web-browser`) berparameter koordinat GPS pengguna tanpa membebani memori HP.

---

## 🛠️ Cara Menjalankan Aplikasi Mobile

Pastikan Anda berada di direktori `mobile/`:

```powershell
cd "e:\LPPM\Riset GIS Dashboard Kebencanaan Provinsi\GIS-Kebencanaan-Sumbar\mobile"

# 1. Jalankan Expo Dev Server
npx expo start
```

### Cara Menjalankan di Perangkat Fisik (HP):
1. Unduh aplikasi **Expo Go** dari Google Play Store (Android) atau App Store (iOS).
2. Pastikan HP dan laptop terhubung dalam **satu jaringan Wi-Fi** yang sama.
3. Buka kamera HP atau aplikasi Expo Go, lalu **scan QR Code** yang muncul di terminal.

### Cara Menjalankan di Browser (Testing Cepat):
Tekan huruf `w` di terminal Expo untuk membuka tampilan di web browser desktop.
