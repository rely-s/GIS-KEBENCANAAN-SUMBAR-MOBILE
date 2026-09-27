# 🌐 GIS Kebencanaan Sumatera Barat — Platform Geospasial Terpadu BPBD

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.2+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![MapLibre GL JS](https://img.shields.io/badge/MapLibre_GL-6.9+-0078A8.svg?logo=maplibre&logoColor=white)](https://maplibre.org)
[![PostgreSQL 18 + PostGIS](https://img.shields.io/badge/PostGIS-3.6+-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-blueviolet.svg?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![A11y WCAG 2.1 AA](https://img.shields.io/badge/A11y-WCAG_2.1_AA-success.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Tests: 34 Passed](https://img.shields.io/badge/Pytest-34_Passed_(100%25)-brightgreen.svg)](backend/tests/)

> **Kolaborasi Riset Institusional & Kesiapsiagaan Bencana**:  
> 🏛️ **Badan Nasional Penanggulangan Bencana (BNPB)**  
> 🏛️ **Badan Penanggulangan Bencana Daerah (BPBD) Provinsi Sumatera Barat**  
> 🎓 **Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) Universitas Putra Indonesia "YPTK" Padang**  
>
> *Platform WebGIS Operasional Tanggap Darurat Bencana: Navigasi Evakuasi Multi-Moda Sadar-Blokade, 12 Lapisan Spasial Operasional & Katalog InaRISK BNPB ($R = H \times V / C$), Kontrol Opasitas Dinamis WebGL, Pemantauan 19 Simpul Cuaca Real-Time Resmi BMKG Se-Sumatera Barat, Standardisasi Kartografi Kemanusiaan Internasional (UN OCHA / BNPB / ISO / UNESCO), RBAC 4 Tingkatan Pusdalops-Pimpinan, serta Otomasi Situation Report (SITREP).*

---

## 📌 Daftar Isi

1. [Tentang Platform & Latar Belakang](#1-tentang-platform--latar-belakang)
2. [Arsitektur Sistem & Spesifikasi Teknologi](#2-arsitektur-sistem--spesifikasi-teknologi)
3. [Inventarisasi Data Geospasial & Sensor Real-Time](#3-inventarisasi-data-geospasial--sensor-real-time)
4. [Jaringan 19 Simpul Cuaca Resmi BMKG Se-Sumbar](#4-jaringan-19-simpul-cuaca-resmi-bmkg-se-sumbar)
5. [Integritas Data, Model Indikatif & Batasan Sistem](#5-integritas-data-model-indikatif--batasan-sistem)
6. [Standardisasi UI/UX & Aksesibilitas WCAG 2.1 AA](#6-standardisasi-uiux--aksesibilitas-wcag-21-aa)
7. [Hierarki Hak Akses (RBAC) & Manajemen Pusdalops](#7-hierarki-hak-akses-rbac--manajemen-pusdalops)
8. [Struktur Direktori Proyek](#8-struktur-direktori-proyek)
9. [Panduan Instalasi & Menjalankan Sistem](#9-panduan-instalasi--menjalankan-sistem)
10. [Spesifikasi API Endpoint RESTful](#10-spesifikasi-api-endpoint-restful)
11. [Pengujian Kualitas & Reliability (Testing Trophy)](#11-pengujian-kualitas--reliability-testing-trophy)
12. [Peta Pengetahuan Graf AI (Graphify Knowledge Graph)](#12-peta-pengetahuan-graf-ai-graphify-knowledge-graph)
13. [🤖 Panduan Injeksi Konteks untuk AI Luar (ChatGPT / Claude Prompt)](#13--panduan-injeksi-konteks-untuk-ai-luar-chatgpt--claude-prompt)
14. [Hak Cipta & Lisensi](#14-hak-cipta--lisensi)

---

## 1. Tentang Platform & Latar Belakang

Provinsi Sumatera Barat secara geografis dan geologis berada pada kawasan cincin api Pasifik (*Ring of Fire*) dengan kompleksitas multi-ancaman bencana (*multi-hazard environment*) paling dinamis di Indonesia:
- **Zona Subduksi Megathrust Mentawai**: Ancaman gempa bumi magnitudo hingga M8.9 di lepas pantai barat dengan potensi gelombang tsunami dan *Golden Time* evakuasi 20–30 menit.
- **Patahan Aktif Sesar Geser Semangko (*The Great Sumatran Fault*)**: Zona sesar aktif daratan Bukit Barisan (Segmen Sianok, Sumani, dan Suliti dengan laju pergeseran 11–14 mm/tahun).
- **Kompleks Gunung Api Aktif & Vulkanik**: Jalur vulkanik aktif (Gunung Marapi dan Talang) dengan ancaman aliran lahar dingin hujan (*Galodo*) ke permukiman lereng dan lembah sungai.
- **Topografi Curam Perbukitan**: Kerentanan gerakan tanah dan tanah longsor yang kerap memutus jalur logistik vital nasional (seperti ruas Lembah Anai, Sitinjau Lauik, dan Malalak).

Platform ini dibangun sebagai sistem operasi geospasial tanggap darurat mandiri, gratis, dan bersumber terbuka (**100% Free & Open-Source Software / FOSS**), tanpa dependensi API peta berbayar komersial (bebas biaya tagihan Mapbox maupun Google Maps API).

---

## 2. Arsitektur Sistem & Spesifikasi Teknologi

Sistem mengadopsi arsitektur terpisah (*Decoupled Architecture*) dengan standar performa dan ketahanan tinggi:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 KLIEN ANTARMUKA (Browser / PWA Desktop & Mobile)            │
│   React 19 + TypeScript + MapLibre GL JS + ECharts + Workbox PWA Offline    │
│   · 100dvh Zero-Scroll UI · WCAG 2.1 AA Compliance (A11y Semantic Tables)   │
│   · 12 Operational Layers Drawer · Dynamic WebGL Layer Opacity Sliders      │
│   · InaRISK BNPB Catalog Tab · Active Layer Chips · Real-time BMKG Popups   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTP REST + Binary Vector Tiles (MVT)
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                    BACKEND API GATEWAY (FastAPI / Python 3.11+)             │
│    JWT Auth (HttpOnly) · RBAC 4 Roles Guard (Super Admin / Pimpinan / Admin)│
│    · PostGIS Spatial Engine (ST_AsMVT LRU Cached) · SITREP BNPB Generator   │
│    · BMKG 19 ADM4 Weather Ingestion · Realtime BMKG TEWS SSE Stream Hub     │
└──────┬───────────────────────┬──────────────────────────────┬───────────────┘
       │                       │                              │
┌──────▼─────────────┐ ┌───────▼─────────────┐ ┌──────────────▼───────────────┐
│ PostGIS Database   │ │ Engine Routing      │ │ Sensor Eksternal BMKG        │
│ Dedicated Port 5433│ │ OSRM + Shapely Avoid│ │ · BMKG TEWS Gempa Real-time  │
│ · posko_shelter    │ │ (Multi-Moda Mobil & │ │ · Nowcast Cuaca 19 ADM4      │
│ · kaji_cepat_bnpb  │ │  Jalan Kaki TES)    │ │ · Feed Resmi Stasiun BIM     │
└────────────────────┘ └─────────────────────┘ └──────────────────────────────┘
```

| Komponen | Teknologi | Versi | Peran Utama |
|---|---|---|---|
| **Frontend Framework** | React + Vite | 19.2 / 8.3 | Antarmuka reaktif modular, dynamic viewport `100dvh` |
| **Peta Spasial** | MapLibre GL JS | 6.9+ | Rendering peta berbasis WebGL/GPU, native MVT tiles |
| **Grafik Statistik** | Apache ECharts | 6.1+ | Visualisasi ranking kerugian, dampak korban, dan rekapitulasi |
| **Offline Engine** | Vite PWA / Workbox | 1.3+ | Cache-first tiles satelit & service worker tanggap darurat |
| **Backend API** | FastAPI + Uvicorn | 0.115+ | Framework API asynchronous performa tinggi |
| **ORM & Migrasi** | SQLAlchemy Async + Alembic | 2.0+ | Pemodelan entitas basis data spasial & migrasi skema |
| **Basis Data Spasial** | PostgreSQL + PostGIS | 18 / 3.6+ | Indeks spasial GIST, binary vector tiles `ST_AsMVT` |
| **Routing Engine** | OSRM / Haversine fallback | — | Navigasi evakuasi sadar-blokade turn-by-turn |
| **Orchestrator** | Python Subprocess Pipeline | 3.10+ | Single-command launcher (`run.py`) dengan health check & cleanup |

---

## 3. Inventarisasi Data Geospasial & Sensor Real-Time

Platform WebGIS ini memadukan **7 klaster data geospasial resmi, autentik, dan terkurasi** yang bersumber langsung dari BNPB, BMKG, BPBD Provinsi Sumatera Barat, PVMBG, dan Pusgen:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           KATALOG INTEGRASI DATA SPASIAL & SENSOR                               │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────────┤
│ 1. Batas Wilayah Administrasi│ 2. Dampak Bencana & SITREP   │ 3. Titik Evakuasi & Shelter TES   │
│ · 19 Kota/Kabupaten Sumbar   │ · Agregasi Korban & Kerugian │ · 47 Posko Aktif & TES Vertikal   │
│ · 179 Kecamatan              │ · Status Tanggap Darurat Aktif│ · Kapasitas, PIC & Navigasi Rute  │
│ · MVT Vector Tiles Port 8000 │ · SITREP Standar BNPB        │ · Standar Aksesibel WCAG 2.1 AA   │
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────────┤
│ 4. Patahan Sesar Semangko    │ 5. Subduksi Megathrust       │ 6. Inundasi KRB Tsunami           │
│ · Segmen Sianok, Sumani,     │ · Zona Megathrust Mentawai   │ · Skenario Run-Up 6m, 8m, 12m     │
│   dan Suliti (PusGen 2017)   │ · Parameter Seismik M8.9     │ · Pemodelan Inundasi Perka BNPB   │
├──────────────────────────────┴──────────────────────────────┴───────────────────────────────────┤
│ 7. Sensor Real-Time BMKG & Early Warning System (EWS)                                           │
│ · Feed Real-Time Gempa M5.0+ BMKG TEWS (Episentrum, Magnitudo, Kedalaman, ShakeMap)             │
│ · 19 Simpul Cuaca Resmi BMKG ADM4 se-Sumbar (Suhu, Presipitasi mm/jam, Kecepatan Angin)         │
│ · Pemantauan Ruas Jalan Terputus (Sitinjau Lauik, Lembah Anai, Malalak)                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Jaringan 19 Simpul Cuaca Resmi BMKG Se-Sumbar

Seluruh 19 Kota dan Kabupaten di Provinsi Sumatera Barat terintegrasi secara langsung ke API Publik BMKG (`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=...`):

| No | Wilayah Administratif | Kode BMKG ADM4 | Koordinat Titik | Potensi Ancaman Utama |
|---|---|---|---|---|
| 1 | **Kota Padang** | `13.71.01.1001` | -0.947, 100.354 | Banjir Genangan, Pasang Rob & Longsor Pesisir |
| 2 | **Kota Bukittinggi** | `13.75.01.1001` | -0.305, 100.369 | Angin Kencang, Longsor Ngarai Sianok & Kabut Tebal |
| 3 | **Kota Solok** | `13.72.01.1001` | -0.798, 100.655 | Luapan Sungai Batang Lembang & Genangan |
| 4 | **Kota Padang Panjang** | `13.74.01.1001` | -0.463, 100.400 | Curah Hujan Ekstrem, Aliran Lahar Dingin & Kabut |
| 5 | **Kota Payakumbuh** | `13.76.01.1001` | -0.225, 100.631 | Luapan Sungai Batang Agam & Genangan Pemukiman |
| 6 | **Kota Sawahlunto** | `13.73.01.1001` | -0.681, 100.777 | Pergerakan Tanah & Longsor Lereng Tebing |
| 7 | **Kota Pariaman** | `13.77.01.1001` | -0.626, 100.121 | Gelombang Pasang, Abrasi Pantai & Genangan Muara |
| 8 | **Kab. Agam** | `13.06.01.2001` | -0.375, 100.410 | Lahar Hujan Marapi, Longsor Maninjau & Galodo |
| 9 | **Kab. Tanah Datar** | `13.04.01.2001` | -0.470, 100.380 | Lahar Marapi/Singgalang, Longsor Lembah Anai |
| 10 | **Kab. Padang Pariaman** | `13.05.01.2001` | -0.640, 100.280 | Banjir DAS Batang Anai & Longsor Tebing |
| 11 | **Kab. Pesisir Selatan** | `13.01.01.2001` | -1.350, 100.570 | Banjir Bandang Batang Tapan, Longsor & Abrasi |
| 12 | **Kab. Pasaman Barat** | `13.12.01.2001` | 0.180, 99.820 | Luapan Sungai Batang Pasaman & Longsor Talamau |
| 13 | **Kab. Pasaman** | `13.08.01.2001` | 0.147, 100.170 | Banjir Bandang Batang Sumpur & Longsor Bonjol |
| 14 | **Kab. Lima Puluh Kota** | `13.07.01.2001` | -0.142, 100.666 | Longsor Tebing Lembah Harau & Luapan Pangkalan |
| 15 | **Kab. Solok** | `13.02.06.2001` | -1.085, 100.730 | Banjir Bandang Lembah Gumanti & Longsor Danau |
| 16 | **Kab. Solok Selatan** | `13.11.01.2001` | -1.480, 101.120 | Banjir Bandang Batang Suliti & Batang Bangko |
| 17 | **Kab. Sijunjung** | `13.03.01.2001` | -0.691, 101.001 | Luapan Sungai Batang Kuantan & Longsor |
| 18 | **Kab. Dharmasraya** | `13.10.01.2001` | -0.986, 101.371 | Luapan Sungai Batang Hari & Genangan |
| 19 | **Kab. Kep. Mentawai** | `13.09.01.2001` | -2.024, 99.594 | Gelombang Tinggi Samudera Hindia & Pasang Pesisir |

*Catatan Teknis*: Parameter real-time mencakup suhu udara (°C), curah hujan presipitasi (`tp` mm/jam), kecepatan angin (`ws` km/jam), arah angin (`wd`), dan kelembapan udara (`hu` %). Sinkronisasi berkala dikelola oleh scheduler otomatis backend.

---

## 5. Integritas Data, Model Indikatif & Batasan Sistem

Sesuai prinsip etika rekayasa perangkat lunak dan integritas ilmiah:
1. **Data Sensor Live (100% Real-Time Resmi)**:
   - Data gempa bersumber langsung dari BMKG TEWS.
   - Data kondisi cuaca dan curah hujan bersumber dari BMKG Publik API.
   - Data laporan masyarakat yang masuk melalui portal tanggap darurat diverifikasi oleh Pusdalops.
2. **Data Kerusakan & Korban Jiwa (Model Indikatif)**:
   - Karena instansi pemerintah daerah belum membuka feed dinamis real-time untuk data korban jiwa per jam, angka kerugian dan korban yang tampil di dashboard merupakan **Model Indikatif & Estimasi Agregasi Historis BPBD/BNPB**.
   - Setiap dokumen SITREP dan modal statistik secara eksplisit mencantumkan label transparansi: `Estimasi Kerugian (Model Indikatif BPBD/BNPB)`.
3. **Peniadaan Fitur Spekulatif (Zero Pseudo-Data)**:
   - Platform **tidak menggunakan** simulasi arah angin buatan (`WindParticleLayer`) karena tidak didukung asimilasi citra satelit atau model atmosfer riil. Integritas ilmiah diutamakan di atas sekadar animasi kosmetik.

---

## 6. Standardisasi UI/UX & Aksesibilitas WCAG 2.1 AA

Antarmuka WebGIS mengadopsi standar **WCAG 2.1 AA** untuk menjamin aksesibilitas bagi relawan, operator, dan pimpinan:
- **Accessible Shelter Modal**: Alternatif penyajian data spasial berbasis tabel HTML semantik (`<table>`, `<th>`, `aria-label`), lengkap dengan pencarian real-time dan fokus kamera ke peta.
- **Navigasi Keyboard Mandiri**:
  - Tombol `Panah` (Atas/Bawah/Kiri/Kanan): Geser (*pan*) peta sebesar 80px.
  - Tombol `+` / `-`: Perbesar / perkecil zoom peta.
  - Tombol `R` / `r`: Reset orientasi peta ke arah Utara (bearing 0°).
  - Tombol `Escape`: Menutup semua modal popup seketika.
- **Pewarnaan Kontras Tinggi**: Kontras teks memenuhi rasio minimal 4.5:1 terhadap latar belakang gelap (*dark mode*) bertema Pusdalops.

---

## 7. Hierarki Hak Akses (RBAC) & Manajemen Pusdalops

Sistem menerapkan kontrol akses berbasis peran (*Role-Based Access Control*) pada backend FastAPI:

| Peran (*Role*) | Akses Fitur Utama | Otorisasi Khusus |
|---|---|---|
| **Super Admin** | Akses penuh ke seluruh modul, manajemen pengguna, audit logs | Mengelola akun operator, bypass guard sistem |
| **Pimpinan** | Executive Dashboard, ringkasan kerugian, ekspor SITREP | Membaca dokumen situasi strategis BNPB/BPBD |
| **Admin Pusdalops** | Verifikasi antrean laporan warga, kaji cepat, manajemen posko | Validasi kebenaran data lapangan |
| **Operator Lapangan** | Input data jalan terputus, pembaruan status posko pengungsi | Melaporkan kondisi terkini di titik terdampak |

*Catatan Keamanan*: Kredensial tidak pernah ditampilkan di antarmuka publik pada mode produksi (*Zero Hardcoded Secrets*).

---

## 8. Struktur Direktori Proyek

```
GIS-Kebencanaan-Sumbar/
├── backend/
│   ├── alembic/                 # Migrasi basis data PostGIS
│   ├── app/
│   │   ├── core/                # Konfigurasi, database engine, dependensi JWT
│   │   ├── models/              # Model SQLAlchemy (bencana, posko, pengguna, dll.)
│   │   ├── routers/             # Endpoint REST API (tiles, posko, bencana, sitrep, dll.)
│   │   └── services/            # Integrasi BMKG, routing evakuasi, storage
│   ├── tests/                   # 34 Automated Unit & Integration Tests (100% Pass)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── accessibility/   # AccessibleShelterModal (WCAG 2.1 AA)
│   │   │   ├── cuaca/           # CuacaAlertModal (19 Kab/Kota BMKG)
│   │   │   ├── evakuasi/        # Navigasi & rute evakuasi turn-by-turn
│   │   │   ├── map/             # MapCanvas (MapLibre GL), DisasterLayerDrawer
│   │   │   ├── operator/        # Pusat Komando Pusdalops PB & RBAC Management
│   │   │   └── sitrep/          # SitrepModal (Laporan Situasi Standar BNPB)
│   │   ├── App.tsx              # Komponen utama & state hub
│   │   └── styles/tokens.css    # Desain token warna & tipografi
│   └── package.json
└── run.py                       # Master orchestrator server & database
```

---

## 9. Panduan Instalasi & Menjalankan Sistem

### Prasyarat:
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL 16+ dengan ekstensi PostGIS

### Menjalankan Seluruh Sistem (Rekomendasi):
Gunakan skrip master orchestrator untuk menjalankan database, backend, dan frontend secara simultan:
```bash
python run.py
```

### Menjalankan Secara Manual:
1. **Jalankan Database**: Pastikan PostgreSQL PostGIS aktif di port `5433` (atau sesuai konfigurasi `DATABASE_URL`).
2. **Jalankan Backend**:
   ```bash
   cd backend
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
3. **Jalankan Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
4. Buka peramban di `http://localhost:5173`.

---

## 10. Spesifikasi API Endpoint RESTful

- `GET /api/tiles/{z}/{x}/{y}.pbf` — Vector Tiles MVT (agregasi batas wilayah, risiko, kecamatan/kabupaten).
- `GET /api/posko` — Daftar posko evakuasi aktif (GeoJSON).
- `GET /api/jalan-terputus` — Daftar ruas jalan terputus akibat longsor/banjir.
- `GET /api/eksternal/gempa-terkini` — Live feed sensor BMKG TEWS gempa bumi.
- `GET /api/eksternal/cuaca-peringatan` — Peringatan cuaca 19 simpul BMKG se-Sumbar.
- `GET /api/admin/sitrep` — Ekstraksi Laporan Situasi (SITREP) darurat format BNPB.
- `POST /api/routing/evakuasi` — Kalkulasi rute evakuasi sadar-blokade multi-moda.

---

## 11. Pengujian Kualitas & Reliability (Testing Trophy)

- **Backend Pytest**:
  ```bash
  cd backend && python -m pytest -q
  # Output: 34 passed in 48s (100% PASS)
  ```
- **Frontend Build & TypeScript Check**:
  ```bash
  cd frontend && npm run build
  # Output: ✓ built in ~1.3s (0 errors)
  ```

---

## 12. Peta Pengetahuan Graf AI (Graphify Knowledge Graph)

Proyek ini dipetakan secara holistik menggunakan **Graphify Knowledge Graph**:
- **1.150 Simpul (*Nodes*)** dan **1.709 Relasi (*Edges*)** terdistribusi ke dalam modul arsitektur.
- Visualisasi interaktif graf 2D/3D dapat dibuka langsung di peramban: `graphify-out/graph.html`.
- Pembaruan graf dapat dijalankan kapan saja setelah refactoring melalui perintah:
  ```bash
  graphify update .
  ```

---

## 13. 🤖 Panduan Injeksi Konteks untuk AI Luar (ChatGPT / Claude Prompt)

Jika Anda ingin berdiskusi atau meminta bantuan AI eksternal (seperti **ChatGPT**, **Claude 3.5 Sonnet**, atau **DeepSeek**) mengenai repositori ini, salin dan tempelkan blok teks berikut ke dalam prompt pembuka AI tersebut. Prompt ini telah dikalibrasi agar AI langsung memahami seluruh konteks tanpa menebak-nebak:

```markdown
### SYSTEM CONTEXT INJECTION: WebGIS Kebencanaan Provinsi Sumatera Barat

Kamu sedang menganalisis proyek "GIS Kebencanaan Sumatera Barat", sebuah platform WebGIS operasional tanggap darurat bencana hasil riset kolaborasi antara LPPM UPI YPTK Padang dan BPBD Provinsi Sumatera Barat.

#### 1. Arsitektur Teknis
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy Async + Alembic, PostgreSQL 18 + PostGIS 3.6+ di port 5433.
- **Frontend**: React 19, TypeScript, Vite 8, MapLibre GL JS 6.9+ (WebGL), Apache ECharts, Tailwind/Vanilla CSS.
- **Tiles**: Vector Tiles MVT binary (endpoint `/api/tiles/{z}/{x}/{y}.pbf`) dengan caching LRU.
- **Aksesibilitas**: WCAG 2.1 AA (Tabel semantik alternatif posko, navigasi keyboard Arrow/Plus/Minus/Escape).

#### 2. Integritas Data & Ground Truth (Aturan Ketat)
- **Data Real-Time BMKG**:
  1. Gempa bumi real-time bersumber dari BMKG TEWS (episentrum, magnitudo, kedalaman, shakemap).
  2. Data cuaca bersumber dari API Resmi BMKG Publik untuk 19 Kabupaten/Kota di Sumbar (kode ADM4 Kemendagri). Mengambil data suhu, curah hujan presipitasi mm/jam, kecepatan angin, kelembapan.
- **Data Model Indikatif**:
  Data korban jiwa dan kerugian materi saat ini berstatus "Model Indikatif & Estimasi Agregasi Historis BPBD/BNPB" karena instansi pemda belum membuka feed dinamis per jam. JANGAN berasumsi data korban ini sudah live feed dinamis dari dinas.
- **Fitur Non-Aktif**:
  Layer partikel angin canvas buatan (`WindParticleLayer`) telah DIHAPUS karena tidak memiliki asimilasi citra satelit atau model atmosfer riil.

#### 3. Struktur Modul Inti
- `frontend/src/features/map/MapCanvas.tsx`: Inti rendering MapLibre GL, layer MVT, tooltip stasiun BMKG, kontrol navigasi keyboard.
- `frontend/src/features/cuaca/CuacaAlertModal.tsx`: Modal pemantauan 19 simpul cuaca BMKG se-Sumbar.
- `frontend/src/features/accessibility/AccessibleShelterModal.tsx`: Modal tabel posko semantik ramah screen-reader.
- `frontend/src/features/sitrep/SitrepModal.tsx`: Modal Laporan Situasi darurat format BNPB.
- `frontend/src/features/operator/OperatorModal.tsx`: Pusat Komando Pusdalops PB (manajemen posko, blokade jalan, verifikasi laporan warga, audit trail).
- `backend/app/services/bmkg_weather_service.py`: Modul sinkronisasi 19 simpul cuaca ADM4 BMKG.
- `backend/app/routers/sitrep.py`: Agregasi laporan situasi BNPB.

#### 4. Panduan Interaksi
Saat menjawab pertanyaan atau membuat kode:
- Gunakan Bahasa Indonesia yang presisi, profesional, dan berbasis first-principles.
- Pertahankan standar FOSS (100% Free & Self-Hostable, tanpa API berbayar seperti Google Maps/Mapbox).
- Selalu patuhi standar keamanan OWASP dan hindari mengekspos kredensial ke publik.
```

---

## 14. Hak Cipta & Lisensi

Proyek riset dan pengabdian masyarakat ini dikembangkan melalui kemitraan strategis:
- **Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) Universitas Putra Indonesia "YPTK" Padang**
- **Badan Penanggulangan Bencana Daerah (BPBD) Provinsi Sumatera Barat**

Dilisensikan di bawah lisensi terbuka [MIT License](LICENSE). Seluruh arsitektur didesain bebas dari keterikatan lisensi komersial tertutup demi kemaslahatan mitigasi bencana dan keselamatan masyarakat di Sumatera Barat dan Indonesia.
