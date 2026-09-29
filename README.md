# 🌐 GIS Kebencanaan Sumatera Barat — Platform Geospasial Terpadu BPBD

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.2+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![React Native / Expo](https://img.shields.io/badge/Expo-SDK_52-000020.svg?logo=expo&logoColor=white)](https://expo.dev)
[![Mobile: Android & iOS](https://img.shields.io/badge/Mobile-Android_%7C_iOS-blue.svg)](mobile/)
[![MapLibre GL JS](https://img.shields.io/badge/MapLibre_GL-6.9+-0078A8.svg?logo=maplibre&logoColor=white)](https://maplibre.org)
[![PostgreSQL 18 + PostGIS](https://img.shields.io/badge/PostGIS-3.6+-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-blueviolet.svg?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![A11y WCAG 2.1 AA](https://img.shields.io/badge/A11y-WCAG_2.1_AA-success.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Tests: All Passed](https://img.shields.io/badge/Verification-100%25_Passed-brightgreen.svg)](mobile/test_mobile_api.py)

> **Kolaborasi Riset Institusional & Kesiapsiagaan Bencana**:  
> 🏛️ **Badan Nasional Penanggulangan Bencana (BNPB)**  
> 🏛️ **Badan Penanggulangan Bencana Daerah (BPBD) Provinsi Sumatera Barat**  
> 🎓 **Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) Universitas Putra Indonesia "YPTK" Padang**  
>
> *Platform Satu Data & Operasi Geospasial Kebencanaan Multi-Kanal (WebGIS Dashboard Pusdalops & Mobile App Taktis Siaga Sumbar). Dilengkapi Navigasi Evakuasi Multi-Moda Sadar-Blokade, Radar Ancaman Geodesik PostGIS WGS84, 12 Lapisan Spasial Operasional & Katalog InaRISK BNPB ($R = H \times V / C$), Pemantauan 19 Simpul Cuaca Real-Time Resmi BMKG Se-Sumbar, Standardisasi Kartografi Kemanusiaan Internasional (UN OCHA / BNPB / ISO), RBAC 4 Tingkatan Pusdalops-Pimpinan, Crowdsourcing Lapor Bencana dengan Kompresi WebP On-Device, serta Otomasi Situation Report (SITREP).*

---

## 📌 Daftar Isi

1. [Tentang Platform & Latar Belakang](#1-tentang-platform--latar-belakang)
2. [Arsitektur Sistem & Spesifikasi Teknologi](#2-arsitektur-sistem--spesifikasi-teknologi)
3. [📱 Platform Mobile Taktis: Siaga Sumbar (React Native & Expo)](#3--platform-mobile-taktis-siaga-sumbar-react-native--expo)
4. [Inventarisasi Data Geospasial & Sensor Real-Time](#4-inventarisasi-data-geospasial--sensor-real-time)
5. [Jaringan 19 Simpul Cuaca Resmi BMKG Se-Sumbar](#5-jaringan-19-simpul-cuaca-resmi-bmkg-se-sumbar)
6. [Integritas Data, Model Indikatif & Batasan Sistem](#6-integritas-data-model-indikatif--batasan-sistem)
7. [Standardisasi UI/UX & Aksesibilitas WCAG 2.1 AA](#7-standardisasi-uiux--aksesibilitas-wcag-21-aa)
8. [Hierarki Hak Akses (RBAC) & Manajemen Pusdalops](#8-hierarki-hak-akses-rbac--manajemen-pusdalops)
9. [Struktur Direktori Proyek](#9-struktur-direktori-proyek)
10. [Panduan Instalasi & Menjalankan Sistem](#10-panduan-instalasi--menjalankan-sistem)
11. [Spesifikasi API Endpoint RESTful](#11-spesifikasi-api-endpoint-restful)
12. [Pengujian Kualitas & Reliability (Testing Trophy)](#12-pengujian-kualitas--reliability-testing-trophy)
13. [Peta Pengetahuan Graf AI (Graphify Knowledge Graph)](#13-peta-pengetahuan-graf-ai-graphify-knowledge-graph)
14. [🤖 Panduan Injeksi Konteks untuk AI Luar (ChatGPT / Claude Prompt)](#14--panduan-injeksi-konteks-untuk-ai-luar-chatgpt--claude-prompt)
15. [Hak Cipta & Lisensi](#15-hak-cipta--lisensi)

---

## 1. Tentang Platform & Latar Belakang

Provinsi Sumatera Barat secara geografis dan geologis berada pada kawasan cincin api Pasifik (*Ring of Fire*) dengan kompleksitas multi-ancaman bencana (*multi-hazard environment*) paling dinamis di Indonesia:
- **Zona Subduksi Megathrust Mentawai**: Ancaman gempa bumi magnitudo hingga M8.9 di lepas pantai barat dengan potensi gelombang tsunami dan *Golden Time* evakuasi 20–30 menit bagi kawasan pesisir (Kota Padang, Pariaman, Pesisir Selatan, Pasaman Barat, dan Kepulauan Mentawai).
- **Patahan Aktif Sesar Geser Semangko (*The Great Sumatran Fault*)**: Zona sesar aktif daratan Bukit Barisan (Segmen Sianok, Sumani, dan Suliti dengan laju pergeseran 11–14 mm/tahun).
- **Kompleks Gunung Api Aktif & Vulkanik**: Jalur vulkanik aktif (Gunung Marapi dan Talang) dengan ancaman aliran lahar dingin hujan (*Galodo*) ke permukiman lereng dan lembah sungai (Batang Anai, Batang Bukik Batabuah).
- **Topografi Curam Perbukitan**: Kerentanan gerakan tanah dan tanah longsor yang kerap memutus jalur logistik vital nasional (seperti ruas Lembah Anai, Sitinjau Lauik, dan Kelok 9).

Platform ini dibangun sebagai sistem operasi geospasial tanggap darurat mandiri, gratis, dan bersumber terbuka (**100% Free & Open-Source Software / FOSS**), tanpa dependensi API peta berbayar komersial (bebas biaya tagihan Mapbox maupun Google Maps API).

---

## 2. Arsitektur Sistem & Spesifikasi Teknologi

Sistem mengadopsi arsitektur terpadu multi-kanal (*Decoupled Multi-Client Architecture*) dengan pemisahan tugas yang tegas:

```
┌────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│      KLIEN 1: WEB GIS DASHBOARD        │ │      KLIEN 2: MOBILE APP TAKTIS        │
│   React 19 + TypeScript + MapLibre GL  │ │     React Native + Expo SDK 52         │
│   · 100dvh Zero-Scroll UI Dashboard    │ │     · Single-Glance Status Keselamatan │
│   · 12 Layer Spasial & Opasitas WebGL  │ │     · 5-Metrics Grid Jarak Bahaya      │
│   · Generator SITREP PDF Resmi BNPB    │ │     · Lapor Warga (Auto WebP <200KB)   │
│   · Mode Handoff (?view=mobile_lite)   │ │     · SOS Dial Center 112/115/118      │
└───────────────────┬────────────────────┘ └───────────────────┬────────────────────┘
                    │                                          │
                    │ HTTP REST / SSE Stream / MVT Tiles       │ HTTP REST / Offline Queue
                    └─────────────────────┬────────────────────┘
                                          │
┌─────────────────────────────────────────▼──────────────────────────────────────────┐
│                 BACKEND API GATEWAY & GEO ENGINE (FastAPI / Python 3.11+)          │
│   JWT Auth (HttpOnly) · RBAC 4 Roles Guard (Super Admin / Pimpinan / Admin / TRC)  │
│   · PostGIS Spatial Proximity Engine (ST_Distance Spheroidal Geodesic WGS84)       │
│   · Binary Vector Tiles MVT Caching · Crowdsourcing Ingestion & Audit Trail        │
│   · BMKG 19 ADM4 Weather Ingestion · Realtime BMKG TEWS SSE Stream Hub             │
└───────────────┬─────────────────────────┬──────────────────────────┬───────────────┘
                │                         │                          │
┌───────────────▼──────────────┐ ┌────────▼──────────────┐ ┌─────────▼───────────────┐
│ PostGIS Database (Port 5433) │ │ Engine Routing        │ │ Sensor Eksternal BMKG   │
│ Dedicated Instance           │ │ OSRM + Shapely Avoid  │ │ · BMKG TEWS Gempa Real  │
│ · ancaman_geologis           │ │ (Multi-Moda Mobil &   │ │ · Nowcast Cuaca 19 ADM4 │
│ · posko_shelter              │ │  Jalan Kaki TES)      │ │ · Feed Resmi BIM        │
│ · jalan_terputus             │ │ · Detour Jalan Putus  │ │ · Ingestion Tiap Jam    │
└──────────────────────────────┘ └───────────────────────┘ └─────────────────────────┘
```

| Komponen | Teknologi | Versi | Peran Utama |
|---|---|---|---|
| **Web Dashboard** | React + Vite | 19.2 / 8.3 | Antarmuka reaktif operasional Pusdalops & Pimpinan |
| **Mobile App** | React Native + Expo | SDK 52 / RN 0.86 | Aplikasi taktis lapangan untuk warga, relawan, & TRC |
| **Peta Spasial** | MapLibre GL JS | 6.9+ | Rendering peta berbasis WebGL/GPU, native MVT tiles |
| **Grafik Statistik** | Apache ECharts | 6.1+ | Visualisasi ranking kerugian, dampak korban, & choropleth |
| **Offline Engine** | Vite PWA & AsyncStorage | 1.3+ / 2.0+ | Cache-first tiles satelit & offline queue pengiriman laporan |
| **Backend API** | FastAPI + Uvicorn | 0.115+ | Framework API asynchronous performa tinggi |
| **ORM & Migrasi** | SQLAlchemy Async + Alembic | 2.0+ | Pemodelan entitas basis data spasial & migrasi skema |
| **Basis Data Spasial** | PostgreSQL + PostGIS | 18 / 3.6+ | Indeks spasial GIST, query geodesik, binary vector tiles |
| **Routing Engine** | OSRM / Haversine fallback | — | Navigasi evakuasi sadar-blokade turn-by-turn |
| **Orchestrator** | Python Subprocess Pipeline | 3.10+ | Single-command launcher (`run.py`) dengan health check & cleanup |

---

## 3. 📱 Platform Mobile Taktis: Siaga Sumbar (React Native & Expo)

Aplikasi mobile dirancang secara khusus untuk menjawab kebutuhan nyata di lapangan saat kondisi darurat bencana, **tanpa membebani memori smartphone pengguna**:

```
+-------------------------------------------------------------+
| ⚡ SIAGA SUMBAR (BPBD SUMBAR)                 [🚨 SOS 112]  |
| 📍 Padang Barat, Kota Padang                   [🔄 Perbarui] |
+-------------------------------------------------------------+
|                                                             |
|  ┌───────────────────────────────────────────────────────┐  |
|  │ 🛡️ STATUS LINGKUNGAN: STATUS AMAN                     │  | <- Hero Status Banner
|  │ Anda berada di luar radius bahaya terdekat saat ini.  │  |    (Kontras > 7:1)
|  └───────────────────────────────────────────────────────┘  |
|                                                             |
|  ┌───────────────────────────────────────────────────────┐  |
|  │ 📊 ANALISIS JARAK ZONA ANCAMAN (POSTGIS LIVE)         │  | <- 5-Metrics Grid
|  │ ┌───────────────┬───────────────┐                     │  |
|  │ │ 🌊 Tsunami    │ 🌋 Sesar      │                     │  |
|  │ │ 4.5 KM (Aman) │ 18.4 KM (Aman)│                     │  |
|  │ ├───────────────┼───────────────┤                     │  |
|  │ │ 💧 Banjir     │ ⛰️ Galodo     │                     │  |
|  │ │ 1.2 KM (Wasp.)│ 12.0 KM (Aman)│                     │  |
|  │ ├───────────────┴───────────────┤                     │  |
|  │ │ 🏢 Shelter Terdekat: 800 M - TES Ulak Karang Padang │  |
|  │ └───────────────────────────────┘                     │  |
|  └───────────────────────────────────────────────────────┘  |
|                                                             |
|  ┌───────────────────────────────────────────────────────┐  |
|  │ 🏢 SHELTER EVAKUASI TERDEKAT (Gedung TES Bertingkat)  │  | <- Shelter & Posko Medis
|  │ Kapasitas: 1.500 Jiwa • Air Bersih • Medis Siaga      │  |    (Direct Dial 112/118)
|  │ [ 🧭 Pandu Rute Evakuasi ]                            │  |
|  └───────────────────────────────────────────────────────┘  |
|                                                             |
|  ┌───────────────────────────────────────────────────────┐  |
|  │ 🗺️ BUKA PETA LENGKAP PUSDALOPS (WEB GIS HANDOFF)      │  | <- In-App Browser Mode
|  │ Visualisasi vektor sebaran & poligon zonasi lengkap   │  |
|  └───────────────────────────────────────────────────────┘  |
|                                                             |
+-------------------------------------------------------------+
| [ 🏠 Beranda ]    [ ➕ LAPOR ]   [ 📋 Data Riil ]   [ 👤 ]  | <- Thumb-Zone
+-------------------------------------------------------------+
```

### Keunggulan Fitur Mobile:
1. **Radar Bahaya Geodesik Mandiri (GIS Live & Offline Fallback):**
   - Menghitung jarak horizontal ke batas Zona Merah Tsunami (KRB III), jalur sesar aktif darat (Sianok/Sumani/Suliti), dan sempadan lahar Marapi.
   - Dilengkapi *fallback* formula Haversine lokal jika jaringan telekomunikasi seluler putus di lokasi bencana.
2. **Tempat Evakuasi Sementara (TES) & Posko Medis:**
   - Menampilkan kapasitas daya tampung jiwa, jumlah lantai gedung penyelamat tsunami, fasilitas air/medis, dan nomor PIC darurat.
3. **Lapor Bencana Cepat (Bottom Sheet) + Auto WebP Compression:**
   - Ambil foto kerusakan lapangan langsung dari kamera/galeri.
   - Foto dikompresi otomatis di perangkat menjadi **format WebP beresolusi maksimal 1200px ($< 200\text{ KB}$)** untuk menghemat kuota darurat dan mempercepat pengunggahan di jaringan 3G/Edge.
   - Didukung *Offline Storage Queue*: Jika internet mati, laporan tersimpan lokal dan disinkronkan otomatis saat sinyal kembali pulih.
4. **Pusat Panggilan Cepat SOS:**
   - Tombol satu sentuhan untuk memanggil **Call Center BPBD 112**, **Basarnas 115**, **Ambulans PMI 118**, serta tombol sebarkan koordinat GPS darurat langsung ke WhatsApp keluarga/rekan.
5. **Seamless Web GIS Handoff:**
   - Beban rendering vektor berat dialihkan ke Web GIS via In-App Browser berparameter (`?view=mobile_lite&lat=...&lon=...`), sehingga aplikasi mobile tetap ringan ($< 25\text{ MB}$), responsif, dan tidak mengalami *crash* memori di HP kelas menengah ke bawah.

---

## 4. Inventarisasi Data Geospasial & Sensor Real-Time

Platform WebGIS memadukan **7 klaster data geospasial resmi, autentik, dan terkurasi**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           KATALOG INTEGRASI DATA SPASIAL & SENSOR                               │
├────────────────────┬───────────────────────────────────┬────────────────────────────────────────┤
│ Layer / Sumber     │ Deskripsi Geospasial & Atribut    │ Entitas / Skema Basis Data             │
├────────────────────┼───────────────────────────────────┼────────────────────────────────────────┤
│ 1. Sesar Aktif     │ Koridor sesar darat Semangko      │ PostGIS: `ancaman_geologis`            │
│    (Pusgen / PVMBG)│ (Segmen Sianok, Sumani, Suliti)   │ Buffer: 2.000–2.500 meter              │
├────────────────────┼───────────────────────────────────┼────────────────────────────────────────┤
│ 2. Lahar Dingin    │ Sempadan aliran sungai lahar      │ PostGIS: `ancaman_geologis`            │
│    (Galodo Marapi) │ Marapi (Batang Anai & Bukik Bat.) │ Buffer sempadan: 250–300 meter         │
├────────────────────┼───────────────────────────────────┼────────────────────────────────────────┤
│ 3. Zonasi Tsunami  │ MultiPolygon KRB III (Merah),     │ PostGIS: `zonasi_tsunami`              │
│    (InaRISK BNPB)  │ KRB II (Kuning), KRB I (Waspada)  │ Inundasi rendaman hingga 8+ meter      │
├────────────────────┼───────────────────────────────────┼────────────────────────────────────────┤
│ 4. Shelter & Posko │ Tempat Evakuasi Sementara (TES),  │ PostGIS: `posko_evakuasi`              │
│    (BPBD Sumbar)   │ Posko Utama, Posko Medis, Sirine  │ Kapasitas, PIC, ketersediaan faskes/air│
├────────────────────┼───────────────────────────────────┼────────────────────────────────────────┤
│ 5. Jalan Terputus  │ LineString ruas jalan nasional/   │ PostGIS: `jalan_terputus`              │
│    (Pusdalops TRC) │ provinsi yang terputus longsor    │ Terintegrasi OSRM detour auto-routing  │
├────────────────────┼───────────────────────────────────┼────────────────────────────────────────┤
│ 6. BMKG TEWS       │ Sensor seismik gempa real-time    │ Model: `gempa_bmkg`                    │
│    (Sensor BMKG)   │ Episentrum, magnitudo, MMI        │ Ingestion otomatis & stream SSE        │
├────────────────────┼───────────────────────────────────┼────────────────────────────────────────┤
│ 7. Cuaca 19 Wilayah│ 19 stasiun pengamatan BMKG        │ Model: `peringatan_cuaca_bmkg`         │
│    (Stasiun BIM)   │ Curah hujan mm/jam, suhu, angin   │ Kode ADM4 wilayah Kemendagri           │
└────────────────────┴───────────────────────────────────┴────────────────────────────────────────┘
```

---

## 5. Jaringan 19 Simpul Cuaca Resmi BMKG Se-Sumbar

Platform melakukan sinkronisasi otomatis setiap jam terhadap 19 simpul pengamatan cuaca resmi BMKG:

| No | Wilayah Administratif | Stasiun / Titik Rujukan BMKG | Kode Wilayah |
|:---:|---|---|:---:|
| 1 | **Kota Padang** | Stasiun Meteorologi Maritim Teluk Bayur / Stasiun Klimatologi Padang Pariaman | `13.71` |
| 2 | **Kota Bukittinggi** | Stasiun Geofisika Sianok Bukittinggi | `13.75` |
| 3 | **Kota Padang Panjang** | Stasiun Pengamatan Lereng Marapi-Singgalang | `13.74` |
| 4 | **Kota Solok** | Simpul Agroklimat Lembah Nan Indah | `13.73` |
| 5 | **Kota Sawahlunto** | Simpul Pemantauan Ombilin | `13.72` |
| 6 | **Kota Payakumbuh** | Simpul Pengamatan Dataran Tinggi Luak Limopuluah | `13.76` |
| 7 | **Kota Pariaman** | Pos Meteorologi Stasiun BIM Pesisir Pariaman | `13.77` |
| 8 | **Kab. Agam** | Stasiun Pemantauan Marapi PVMBG & Pos Agam | `13.06` |
| 9 | **Kab. Tanah Datar** | Simpul Batusangkar / Batang Gadih | `13.04` |
| 10 | **Kab. Padang Pariaman** | Stasiun Meteorologi Minangkabau (BIM) Ketaping | `13.05` |
| 11 | **Kab. Pesisir Selatan** | Simpul Pesisir Painan & Tarusan | `13.01` |
| 12 | **Kab. Solok** | Simpul Danau Singkarak & Arosuka | `13.02` |
| 13 | **Kab. Solok Selatan** | Simpul Muara Labuh & Lembah Gumanti | `13.11` |
| 14 | **Kab. Pasaman** | Simpul Lubuk Sikaping | `13.08` |
| 15 | **Kab. Pasaman Barat** | Simpul Simpang Empat & Pesisir Sasak | `13.12` |
| 16 | **Kab. Lima Puluh Kota** | Simpul Sarilamak & Harau | `13.07` |
| 17 | **Kab. Sijunjung** | Simpul Muaro Sijunjung | `13.03` |
| 18 | **Kab. Dharmasraya** | Simpul Pulau Punjung | `13.10` |
| 19 | **Kab. Kep. Mentawai** | Stasiun Pengamatan Maritim Tuapejat & Siberut | `13.09` |

---

## 6. Integritas Data, Model Indikatif & Batasan Sistem

1. **Sensor Real-Time BMKG**:
   - Data gempa bumi bersumber langsung dari sistem BMKG TEWS.
   - Peringatan cuaca dan curah hujan presipitasi mm/jam diperbarui secara berkala dari server data terbuka BMKG.
2. **Data Model Indikatif (Kerugian & Korban Historis)**:
   - Nilai agregat korban jiwa dan estimasi nominal kerugian fisik berstatus **"Model Indikatif & Estimasi Historis Agregasi BPBD/BNPB"** untuk keperluan simulasi kesiapsiagaan darurat.
3. **Standar Keamanan OWASP**:
   - Token otentikasi JWT dikelola secara aman tanpa menyimpan kredensial rahasia di penyimpanan publik (*Zero Hardcoded Secrets*).

---

## 7. Standardisasi UI/UX & Aksesibilitas WCAG 2.1 AA

Antarmuka platform memenuhi standar aksesibilitas internasional:
- **Navigasi Keyboard Penuh**: Peta dapat dikontrol menggunakan tombol Panah, `+`, `-`, dan `R` untuk orientasi Utara.
- **Accessible Shelter Modal**: Alternatif tabel semantik posko untuk pengguna *screen-reader*.
- **Kontras Warna Tinggi**: Rasio kontras teks terhadap latar belakang gelap melebihi **4.5:1** (standar WCAG AA) dan **7:1** pada modul mobile darurat.

---

## 8. Hierarki Hak Akses (RBAC) & Manajemen Pusdalops

| Peran (*Role*) | Akses Fitur Utama | Otorisasi Khusus |
|---|---|---|
| **Super Admin** | Akses penuh ke seluruh modul, manajemen pengguna, audit trail | Mengelola akun operator, konfigurasi sistem |
| **Pimpinan** | Executive Dashboard, ringkasan kerugian, ekspor SITREP BNPB | Membaca dokumen situasi strategis Forkopimda |
| **Admin Pusdalops** | Verifikasi antrean laporan warga, kaji cepat, status posko | Validasi kebenaran data lapangan |
| **Operator Lapangan** | Input jalan terputus, pembaruan logistik shelter | Melaporkan kondisi terkini di titik bencana |

---

## 9. Struktur Direktori Proyek

```
GIS-Kebencanaan-Sumbar/
├── backend/                     # Layanan API REST & Mesin Geospasial FastAPI
│   ├── alembic/                 # Skrip migrasi skema tabel PostGIS
│   ├── app/
│   │   ├── core/                # Konfigurasi Pydantic, database pool, JWT
│   │   ├── models/              # Model SQLAlchemy (bencana, posko, jalan, dll.)
│   │   ├── routers/             # Endpoint REST (proximity, bencana, posko, jalan, tiles)
│   │   └── services/            # Integrasi BMKG, routing OSRM, audit trail
│   ├── tests/                   # Automated Pytest suite
│   └── requirements.txt
├── frontend/                    # Web GIS Dashboard Operasional (Vite + React 19)
│   ├── src/
│   │   ├── features/
│   │   │   ├── accessibility/   # AccessibleShelterModal (WCAG 2.1 AA)
│   │   │   ├── cuaca/           # CuacaAlertModal (19 Kab/Kota BMKG)
│   │   │   ├── evakuasi/        # Navigasi & rute evakuasi turn-by-turn
│   │   │   ├── map/             # MapCanvas (MapLibre GL), LayerDrawer, Chips
│   │   │   ├── operator/        # Pusat Komando Pusdalops & RBAC Management
│   │   │   └── sitrep/          # SitrepModal (Laporan Situasi Standar BNPB)
│   │   ├── App.tsx              # Komponen utama (mendukung ?view=mobile_lite)
│   │   └── styles/tokens.css    # Desain token warna & tipografi
│   └── package.json
├── mobile/                      # Aplikasi Mobile Taktis Lapangan (Expo SDK 52)
│   ├── src/
│   │   ├── api/client.ts        # Klien HTTP + Mesin Geodesik Haversine Offline
│   │   ├── components/          # Header, HeroStatus, DistanceGrid, ShelterSection
│   │   │   ├── ReportModal.tsx  # Bottom Sheet Form + Kompresi Foto WebP
│   │   │   ├── SosModal.tsx     # Pusat Panggilan Cepat 112/115/118
│   │   │   └── WebMapHandoff.tsx# Deep link ke Web GIS In-App Browser
│   │   ├── theme/colors.ts      # Token warna resmi BPBD & Dark Slate
│   │   └── types/index.ts       # Kontrak TypeScript sinkron dengan backend
│   ├── App.tsx                  # Antarmuka utama mobile (3-Tab + Center FAB Lapor)
│   ├── test_mobile_api.py       # Test suite integrasi endpoint mobile
│   └── package.json
├── gis-data/                    # Arsip Shapefile & GeoJSON batas wilayah Sumbar
├── scripts/
│   ├── start_database.bat       # Skrip peluncur PostgreSQL GIS port 5433
│   └── test_all_systems.py      # Verifikasi menyeluruh sistem backend & database
└── run.py                       # Master orchestrator peluncur sistem simultan
```

---

## 10. Panduan Instalasi & Menjalankan Sistem

### Prasyarat Sistem:
- **Python 3.10+** (disarankan 3.11 atau 3.12)
- **Node.js 18+** & npm
- **PostgreSQL 16+** dengan ekstensi **PostGIS** aktif di port `5433` (konfigurasi di `E:\pgsql` atau file `.env`)

### 1. Menjalankan Seluruh Subsistem (Rekomendasi Cepat):
Gunakan skrip master orchestrator untuk menjalankan database, backend, dan web frontend secara simultan:
```powershell
python run.py
```
Akses portal yang terbuka:
* **Dashboard Web GIS**: `http://127.0.0.1:5173/`
* **Dokumentasi API Swagger**: `http://127.0.0.1:8000/docs`

### 2. Menjalankan Aplikasi Mobile (Siaga Sumbar):
Masuk ke direktori `mobile` di terminal terpisah:
```powershell
cd mobile

# Jalankan Expo Development Server
npx expo start
```
* **Untuk HP Fisik:** Buka aplikasi **Expo Go** di HP Android/iOS Anda (pastikan terhubung di Wi-Fi yang sama), lalu *scan* QR Code yang muncul di terminal.
* **Untuk Pratinjau di Browser PC:** Buka alamat `http://localhost:8082` atau tekan tombol `w` di terminal Expo.

---

## 11. Spesifikasi API Endpoint RESTful

- `GET /api/proximity/check?lat={lat}&lon={lon}` — Perhitungan jarak geodesik PostGIS WGS84 ke zona ancaman tsunami, sesar darat, dan sempadan galodo.
- `GET /api/posko` — Daftar posko evakuasi aktif & shelter TES bertingkat (GeoJSON FeatureCollection).
- `GET /api/jalan-terputus` — Daftar ruas jalan terputus akibat longsor/galodo aktif.
- `POST /api/bencana/lapor` — Crowdsourcing pelaporan bencana warga dengan foto bukti visual.
- `GET /api/bencana` — Feed data bencana terverifikasi operator Pusdalops.
- `GET /api/eksternal/gempa-terkini` — Live feed sensor gempa BMKG TEWS.
- `GET /api/eksternal/cuaca-peringatan` — Peringatan cuaca 19 simpul BMKG se-Sumatera Barat.
- `GET /api/laporan/sitrep` — Ekspor Laporan Situasi (SITREP) darurat format resmi BNPB (HTML/PDF siap cetak).
- `POST /api/routing/evakuasi` — Kalkulasi rute evakuasi darurat sadar-blokade multi-moda.
- `GET /api/events/stream` — Real-Time Server-Sent Events (SSE) EWS broadcast hub.

---

## 12. Pengujian Kualitas & Reliability (Testing Trophy)

Seluruh komponen telah melalui proses verifikasi otomatis berstandar industri:

1. **Verifikasi Integrasi API Mobile (`mobile/test_mobile_api.py`)**:
   ```text
   =================================================================
   MOBILE APP INTEGRATION TEST - SIAGA SUMBAR (FASTAPI & POSTGIS)
   =================================================================
   [PASS] 1. Radar Ancaman (/proximity/check)       | HTTP 200 | Data OK
   [PASS] 2. Shelter Evakuasi & Posko (/posko)      | HTTP 200 | Data OK
   [PASS] 3. Feed Bencana Lapangan (/bencana)       | HTTP 200 | Data OK
   [PASS] 4. Jalan Terputus (/jalan-terputus)       | HTTP 200 | Data OK
   [PASS] 5. Lapor Kejadian Warga (/bencana/lapor)  | HTTP 201 | Data OK
   -----------------------------------------------------------------
   Hasil Pengujian: 5/5 Pengujian Lulus (100% OPERATIONAL)
   ```

2. **Kompilasi TypeScript Mobile (`mobile`)**:
   ```bash
   cd mobile && npx tsc --noEmit
   # Output: 0 Errors (Semua tipe data, modul, dan komponen tervalidasi ketat)
   ```

3. **Verifikasi Backend & Database Spasial (`scripts/test_all_systems.py`)**:
   ```bash
   python scripts/test_all_systems.py
   # Output: ALL TESTS PASSED! Backend, Database, Auth, SITREP, and Layers are 100% OPERATIONAL.
   ```

4. **Kompilasi Produksi Web Frontend (`frontend`)**:
   ```bash
   cd frontend && npm run build
   # Output: ✓ 2498 modules transformed in 11.39s (0 errors)
   ```

---

## 13. Peta Pengetahuan Graf AI (Graphify Knowledge Graph)

Proyek ini dipetakan secara holistik menggunakan **Graphify Knowledge Graph**:
- **1.150+ Simpul (*Nodes*)** dan **1.700+ Relasi (*Edges*)** terdistribusi ke dalam modul arsitektur.
- Visualisasi interaktif graf 2D/3D dapat dibuka langsung di peramban: `graphify-out/graph.html`.
- Pembaruan graf dapat dijalankan kapan saja melalui perintah:
  ```bash
  graphify update .
  ```

---

## 14. 🤖 Panduan Injeksi Konteks untuk AI Luar (ChatGPT / Claude Prompt)

Jika Anda ingin berdiskusi dengan AI eksternal mengenai repositori ini, salin teks berikut:

```markdown
### SYSTEM CONTEXT INJECTION: Multi-Channel Disaster GIS Platform Sumatera Barat

Kamu sedang menganalisis platform terpadu "GIS Kebencanaan Sumatera Barat", platform operasional tanggap darurat hasil riset kolaborasi LPPM UPI YPTK Padang dan BPBD Provinsi Sumatera Barat.

1. Arsitektur Terpadu (Monorepo):
- Backend: FastAPI (Python 3.11+), SQLAlchemy Async + Alembic, PostgreSQL 18 + PostGIS 3.6+ di port 5433.
- Web Frontend: React 19, TypeScript, Vite 8, MapLibre GL JS 6.9+ (WebGL), Apache ECharts.
- Mobile App: React Native, Expo SDK 52, TypeScript, NativeWind, Hermes Engine.
- Data Flow Spasial: Kalkulasi geodesik WGS84 di server PostGIS via ST_Distance (proximity/check) dan fallback lokal Haversine di client mobile.
- Web GIS Handoff: Parameter ?view=mobile_lite&lat=...&lon=... untuk transisi mulus dari mobile ke peta web tanpa membebani memori HP.

2. Aturan Domain Bencana:
- Selalu prioritaskan FOSS (100% Free & Open-Source, tanpa ketergantungan API komersial berbayar).
- Data gempa bumi & 19 simpul cuaca terhubung langsung ke API resmi BMKG.
- Data korban dan kerugian berstatus Model Indikatif Agregasi Historis BPBD/BNPB.
```

---

## 15. Hak Cipta & Lisensi

Proyek riset dan pengabdian masyarakat ini dikembangkan melalui kemitraan strategis:
- **Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) Universitas Putra Indonesia "YPTK" Padang**
- **Badan Penanggulangan Bencana Daerah (BPBD) Provinsi Sumatera Barat**

Dilisensikan di bawah lisensi terbuka [MIT License](LICENSE). Seluruh arsitektur didesain bebas dari keterikatan lisensi komersial tertutup demi kemaslahatan mitigasi bencana dan keselamatan masyarakat di Sumatera Barat dan Indonesia.
