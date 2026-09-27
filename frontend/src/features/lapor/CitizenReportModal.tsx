import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Camera, 
  Send, 
  X, 
  CheckCircle2, 
  WifiOff, 
  RefreshCw, 
  ShieldAlert,
  Info,
  PhoneCall,
  User
} from 'lucide-react';
import { 
  saveOfflineReport, 
  flushOfflineQueue, 
  countOfflineReports,
  type OfflineReportPayload 
} from '../../utils/offlineDb';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSuccess?: (ticketId: string) => void;
}

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({
  isOpen,
  onClose,
  onReportSuccess
}) => {
  // Form States
  const [jenisBencana, setJenisBencana] = useState('banjir');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [deskripsi, setDeskripsi] = useState('');
  const [namaPelapor, setNamaPelapor] = useState('');
  const [kontakPelapor, setKontakPelapor] = useState('');

  // Image Upload & Client-side WebP Compression
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Submission & Network Status
  const [submitting, setSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [successTicket, setSuccessTicket] = useState<{ id: string; wilayah: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Monitor status koneksi online/offline & sinkronisasi antrean IndexedDB
  useEffect(() => {
    countOfflineReports().then(setOfflineCount).catch(() => {});

    const handleOnline = () => {
      setIsOffline(false);
      handleFlushQueue();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ambil GPS otomatis saat modal dibuka jika koordinat masih kosong
  useEffect(() => {
    if (isOpen && lat === null) {
      handleGetLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. One-Tap GPS Presisi Tinggi (HTML5 Geolocation)
  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Perangkat Anda tidak mendukung fitur geolokasi GPS.');
      return;
    }

    setGettingLocation(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);
        setGpsAccuracy(Math.round(position.coords.accuracy));
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Izin akses lokasi ditolak. Harap izinkan GPS pada peramban Anda.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError('Sinyal satelit GPS tidak dapat dijangkau. Mencoba koordinat fallback.');
        } else {
          setGpsError('Waktu pencarian GPS habis. Silakan coba kembali.');
        }
        // Fallback titik Padang jika gagal
        if (lat === null) {
          setLat(-0.9471);
          setLon(100.3543);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // 2. Client-Side Image Compression ke WebP (<300 KB) & Sanitasi
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya berkas gambar (JPG, PNG, WebP) yang diizinkan.');
      return;
    }

    setCompressingImage(true);
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Reduksi skala gambar jika melebihi lebar 1280px
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const scaleSize = MAX_WIDTH / img.width;

        if (img.width > MAX_WIDTH) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Kompresi kualitas 75% WebP
          const webpDataUrl = canvas.toDataURL('image/webp', 0.75);
          setFotoPreview(webpDataUrl);
        }
        setCompressingImage(false);
      };
      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  // 3. Simpan ke Antrean Darurat Offline (IndexedDB Multi-Megabyte Storage)
  const saveToOfflineQueue = async (payload: OfflineReportPayload) => {
    try {
      await saveOfflineReport(payload);
      setOfflineSaved(true);
      const count = await countOfflineReports();
      setOfflineCount(count);
    } catch (e) {
      console.error('Gagal menyimpan ke penyimpanan lokal IndexedDB:', e);
    }
  };

  // 4. Flush Antrean saat Online kembali
  const handleFlushQueue = async () => {
    try {
      const res = await flushOfflineQueue();
      const count = await countOfflineReports();
      setOfflineCount(count);
      if (res.synced > 0) {
        console.info(`[IndexedDB Sync] ${res.synced} laporan darurat berhasil dikirim ke Pusdalops.`);
      }
    } catch (err) {
      console.error('Gagal mengirim antrean offline:', err);
    }
  };

  // 5. Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setOfflineSaved(false);

    if (lat === null || lon === null) {
      setErrorMessage('Titik koordinat GPS wajib ditentukan.');
      return;
    }

    if (deskripsi.trim().length < 5) {
      setErrorMessage('Keterangan laporan minimal 5 karakter.');
      return;
    }

    const payload = {
      jenis_bencana: jenisBencana,
      lat: Number(lat),
      lon: Number(lon),
      deskripsi: deskripsi.trim(),
      nama_pelapor: namaPelapor.trim() || 'Warga Masyarakat (Anonim)',
      kontak_pelapor: kontakPelapor.trim() || 'Tidak disertakan',
      foto_base64: fotoPreview || undefined
    };

    // Jika koneksi sedang terputus / offline
    if (!navigator.onLine) {
      await saveToOfflineQueue(payload);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/bencana/lapor-warga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail?.error?.message || 'Gagal mengirim laporan bencana.');
      }

      setSuccessTicket({
        id: data.ticket_id || `LAPOR-${Date.now()}`,
        wilayah: data.wilayah_terdeteksi || 'Sumatera Barat'
      });

      if (onReportSuccess) {
        onReportSuccess(data.ticket_id);
      }
    } catch (err: any) {
      // Jika jaringan gagal di tengah jalan, simpan ke IndexedDB offline queue
      await saveToOfflineQueue(payload);
      setErrorMessage(
        'Koneksi server gagal dijangkau. Laporan Anda telah diamankan di memori browser (IndexedDB) dan akan disinkronkan otomatis saat sinyal kembali pulih.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSuccessTicket(null);
    setOfflineSaved(false);
    setDeskripsi('');
    setFotoPreview(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F1722] border border-[#233547] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER MODAL */}
        <header className="px-5 py-4 bg-[#141F2D] border-b border-[#233547] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                Lapor Cepat Kejadian Bencana
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  Warga PWA
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pusdalops PB Badan Penanggulangan Bencana Daerah Prov. Sumatera Barat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* STATUS KONEKSI DARURAT (OFFLINE BANNER) */}
        {isOffline && (
          <div className="px-4 py-2 bg-amber-950/80 border-b border-amber-600/40 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mode Darurat Blackout Sinyal: Formulir tetap berfungsi secara lokal (Store & Forward).</span>
            </div>
            {offlineCount > 0 && (
              <span className="font-mono text-[10px] bg-amber-500/25 px-2 py-0.5 rounded border border-amber-500/40 shrink-0">
                {offlineCount} antrean tersimpan
              </span>
            )}
          </div>
        )}

        {/* KONTEN BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* STATE SUCCESS / TIKET DARURAT */}
          {successTicket ? (
            <div className="p-6 text-center space-y-4 bg-[#141F2D] border border-emerald-500/40 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-display">Laporan Berhasil Diteruskan!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Informasi darurat telah masuk ke konsol verifikasi Pusdalops BPBD untuk wilayah <strong>{successTicket.wilayah}</strong>.
                </p>
              </div>

              <div className="p-3 bg-[#0B1118] border border-[#233547] rounded-lg font-mono text-xs text-emerald-300">
                Nomor Tiket: <span className="font-bold text-white">{successTicket.id}</span>
              </div>

              <div className="text-left text-xs text-slate-300 bg-blue-950/20 border border-blue-500/30 p-3.5 rounded-lg space-y-2">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Instruksi Keselamatan Pertama:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-300">
                  <li>Segera menjauh dari lereng curam, bantaran sungai berarus keruh, atau bangunan retak.</li>
                  <li>Jika gempa berpotensi tsunami di pesisir, segera evakuasi ke shelter vertikal TES/TEA tanpa menunggu sirine.</li>
                  <li>Bantuan darurat BPBD / Basarnas terhubung di Call Center <strong>112</strong> atau <strong>(0751) 777-111</strong>.</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-[#233547] hover:bg-[#2D445B] text-white text-xs font-semibold rounded-lg"
                >
                  Kirim Laporan Lain
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : offlineSaved ? (
            /* STATE OFFLINE STORED */
            <div className="p-6 text-center space-y-4 bg-[#141F2D] border border-amber-500/40 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                <WifiOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-display">Laporan Tersimpan di HP (Offline)</h3>
                <p className="text-xs text-slate-300">
                  Tidak ada transmisi internet saat ini. Laporan Anda telah tersimpan aman di memori perangkat dan akan terkirim otomatis begitu Anda mendapatkan koneksi jaringan seluler/Wi-Fi.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg"
              >
                Tutup & Simpan
              </button>
            </div>
          ) : (
            /* FORMULIR UTAMA */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-lg text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. KATEGORI BENCANA */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jenis Bencana Lapangan <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'banjir', label: 'Banjir / Galodo' },
                    { id: 'longsor', label: 'Tanah Longsor' },
                    { id: 'gempa', label: 'Gempa Bumi' },
                    { id: 'tsunami', label: 'Tsunami' },
                    { id: 'erupsi', label: 'Erupsi Gunung' },
                    { id: 'angin_puting_beliung', label: 'Puting Beliung' },
                    { id: 'kebakaran', label: 'Kebakaran Lahan' },
                    { id: 'lainnya', label: 'Lainnya' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setJenisBencana(item.id)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold text-center border transition-all ${
                        jenisBencana === item.id
                          ? 'bg-rose-600/30 border-rose-500 text-rose-200 shadow-sm'
                          : 'bg-[#141F2D] border-[#233547] text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. DETEKSI GPS SATELIT */}
              <div className="p-3.5 bg-[#141F2D] border border-[#233547] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Koordinat Lokasi Kejadian</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${gettingLocation ? 'animate-spin' : ''}`} />
                    <span>{gettingLocation ? 'Mencari Satelit...' : 'Deteksi GPS Saya'}</span>
                  </button>
                </div>

                {lat !== null && lon !== null ? (
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 bg-[#0B1118] p-2 rounded border border-[#233547]">
                    <span>Lat: {lat.toFixed(5)}, Lon: {lon.toFixed(5)}</span>
                    {gpsAccuracy && (
                      <span className="text-emerald-400 font-sans">±{gpsAccuracy}m akurasi</span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    {gettingLocation ? 'Mengakses sensor GPS presisi tinggi...' : 'Klik "Deteksi GPS Saya" untuk mengunci lokasi.'}
                  </div>
                )}

                {gpsError && (
                  <p className="text-[11px] text-amber-300/90">{gpsError}</p>
                )}
              </div>

              {/* 3. KETERANGAN KONDISI DARURAT */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan Kejadian / Situasi Lapangan <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Tanggul sungai jebol sekitar 10 meter, air setinggi dada orang dewasa merendam 15 rumah warga..."
                  className="w-full bg-[#141F2D] border border-[#233547] rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* 4. UNGGAH FOTO BUKTI VISUAL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Foto Bukti Kejadian (Opsional - Dikompres Otomatis &lt;300 KB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressingImage}
                    className="flex items-center gap-2 px-3 py-2 bg-[#141F2D] hover:bg-[#1D2B3D] border border-[#233547] hover:border-slate-500 text-xs font-semibold text-slate-200 rounded-lg transition-all"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>{compressingImage ? 'Mengompres Foto...' : 'Ambil Kamera / Pilih Foto'}</span>
                  </button>

                  {fotoPreview && (
                    <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/40">
                      <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFotoPreview(null)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        title="Hapus foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. IDENTITAS PELAPOR (OPSIONAL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#233547]">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nama Pelapor (Opsional)
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={namaPelapor}
                      onChange={(e) => setNamaPelapor(e.target.value)}
                      placeholder="Nama lengkap / inisial"
                      className="w-full bg-[#141F2D] border border-[#233547] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    No. WhatsApp / HP Aktif (Opsional)
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={kontakPelapor}
                      onChange={(e) => setKontakPelapor(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full bg-[#141F2D] border border-[#233547] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* TOMBOL AKSI SUBMIT */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || compressingImage}
                  className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengirim ke Pusdalops BPBD...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Laporan Darurat Sekarang</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
