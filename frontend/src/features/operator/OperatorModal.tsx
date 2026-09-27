import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mail, 
  KeyRound, 
  AlertOctagon, 
  X, 
  LogOut, 
  CheckCircle, 
  RefreshCw,
  Building2,
  AlertTriangle,
  Users,
  Sliders,
  ShieldCheck,
  History,
  Activity,
  FileCheck
} from 'lucide-react';

import { type UserSession, WILAYAH_SUMBAR_LIST } from './constants';
import { PoskoManagementTab } from './PoskoManagementTab';
import { BencanaTab } from './BencanaTab';
import { BlokadeJalanTab } from './BlokadeJalanTab';
import { VerifikasiTab } from './VerifikasiTab';
import { AuditTrailTab } from './AuditTrailTab';
import { PenggunaManagementTab } from './PenggunaManagementTab';
import { ExecutiveDashboardTab } from './ExecutiveDashboardTab';

export { WILAYAH_SUMBAR_LIST };
export type { UserSession };

export type CommandTab = 'posko' | 'bencana' | 'blokade' | 'verifikasi' | 'audit' | 'pengguna' | 'eksekutif';

interface OperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onLoginSuccess: (user: UserSession, token: string) => void;
  onLogout: () => void;
  onJalanCreated?: () => void;
  onPoskoChanged?: () => void;
  onBencanaChanged?: () => void;
  pickedCoords?: { lat: number; lng: number } | null;
  onRequestPickLocation?: (target: 'posko' | 'bencana') => void;
  initialTab?: CommandTab;
}

export const OperatorModal: React.FC<OperatorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  onJalanCreated,
  onPoskoChanged,
  onBencanaChanged,
  pickedCoords,
  onRequestPickLocation,
  initialTab = 'posko',
}) => {
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab Navigasi Pusat Komando Operasional
  const [activeTab, setActiveTab] = useState<CommandTab>(initialTab);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  // Data States
  const [poskoList, setPoskoList] = useState<any[]>([]);
  const [bencanaList, setBencanaList] = useState<any[]>([]);
  const [jalanList, setJalanList] = useState<any[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [statistikData, setStatistikData] = useState<any | null>(null);
  const [syncingBmkg, setSyncingBmkg] = useState(false);

  // Helper authFetch berstandar OWASP: Otomatis menyertakan HttpOnly Cookie (credentials: 'include')
  const authFetch = (url: string, init: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gis_auth_token') : null;
    return fetch(url, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  };

  // Pemuatan Data
  const loadPosko = () => {
    fetch('/api/posko?include_nonaktif=true')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.features) setPoskoList(data.features);
      })
      .catch(() => {});
  };

  const loadBencana = () => {
    fetch('/api/bencana?limit=30')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.data) setBencanaList(data.data);
      })
      .catch(() => {});
  };

  const loadJalan = () => {
    fetch('/api/jalan-terputus')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.features) setJalanList(data.features);
      })
      .catch(() => {});
  };

  const loadQueue = () => {
    setLoadingQueue(true);
    authFetch('/api/admin/verifikasi-queue')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.data) setQueueItems(data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingQueue(false));
  };

  const loadAudit = () => {
    authFetch('/api/admin/audit-logs?limit=40')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.data) setAuditLogs(data.data);
      })
      .catch(() => {});
  };

  const loadUsers = () => {
    authFetch('/api/admin/pengguna')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.data) setUserList(data.data);
      })
      .catch(() => {});
  };

  const loadStatistik = () => {
    authFetch('/api/admin/statistik')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatistikData(data);
      })
      .catch(() => {});
  };

  // Efek Pemuatan Data Berdasarkan Tab Aktif
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'posko') loadPosko();
    if (activeTab === 'bencana') loadBencana();
    if (activeTab === 'blokade') loadJalan();

    if (currentUser) {
      if (activeTab === 'verifikasi') loadQueue();
      if (activeTab === 'audit') loadAudit();
      if (activeTab === 'pengguna') loadUsers();
      if (activeTab === 'eksekutif') loadStatistik();
    }
  }, [isOpen, activeTab, currentUser]);

  // Handler Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail?.error?.message || data?.detail || 'Kombinasi kredensial salah.');
      }

      onLoginSuccess(data.user, data.access_token);
      setSuccessMsg(`Selamat datang, ${data.user.nama} (${data.user.role.toUpperCase()})`);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'super_admin' | 'admin' | 'operator' | 'pimpinan') => {
    const emails = {
      super_admin: 'superadmin@sumbarprov.go.id',
      admin: 'admin@sumbarprov.go.id',
      operator: 'operator.padang@sumbarprov.go.id',
      pimpinan: 'pimpinan@sumbarprov.go.id'
    };
    setEmail(emails[role]);
    if (import.meta.env.DEV) {
      const devPasswords: Record<string, string> = {
        super_admin: 'SuperAdminSumbar2026!',
        admin: 'AdminSumbar2026!',
        operator: 'OperatorPadang2026!',
        pimpinan: 'PimpinanSumbar2026!'
      };
      setPassword(devPasswords[role] || '');
    } else {
      setPassword('');
    }
  };

  const handleSyncBmkg = async () => {
    setSyncingBmkg(true);
    try {
      const res = await authFetch('/api/eksternal/sync-gempa', { method: 'POST' });
      if (!res.ok) throw new Error('Gagal sinkronisasi sensor BMKG');
      setSuccessMsg('Sensor gempa BMKG TEWS multi-feed berhasil disinkronkan seketika!');
    } catch {
      setErrorMsg('Gagal menyinkronkan data sensor BMKG.');
    } finally {
      setSyncingBmkg(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl xl:max-w-6xl max-h-[90vh] bg-[#0F1720] border border-[#243444] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER MODAL */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-[#243444] bg-[#141E28]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                PUSAT KOMANDO PUSDALOPS PB
                {currentUser && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase tracking-wider ${
                    currentUser.role === 'super_admin'
                      ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                      : currentUser.role === 'pimpinan'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : currentUser.role === 'admin'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {currentUser.role}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {currentUser ? `${currentUser.nama} • BPBD Prov. Sumatera Barat` : 'Portal Akses & Manajemen Geospasial'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg transition-all"
                title="Keluar dari sesi"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* NOTIFIKASI TOAST BANNER */}
        {errorMsg && (
          <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-800/50 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">&times;</button>
          </div>
        )}
        {successMsg && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-800/50 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">&times;</button>
          </div>
        )}

        {/* KONTEN UTAMA */}
        {!currentUser ? (
          /* FORM LOGIN MULTI-ROLE */
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white font-display">Autentikasi Akses Petugas</h3>
                <p className="text-xs text-slate-400">
                  Masuk untuk mengelola data posko, shelter TES, blokade jalan, dan validasi kebencanaan.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5 bg-[#141E28] p-5 rounded-xl border border-[#243444]">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Kedinasan BPBD</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="superadmin@sumbarprov.go.id atau superadmin"
                      className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Masuk ke Dashboard Komando</span>
                </button>
              </form>

              {/* QUICK ACCESS PRESET BUTTONS UNTUK SIMULASI CEPAT (DEV ONLY) */}
              {import.meta.env.DEV && (
                <div className="space-y-2 border-t border-[#243444] pt-4">
                  <span className="text-[11px] font-mono text-slate-400 block text-center uppercase tracking-wider">
                    Preset Akun Simulasi Cepat (Mode Pengembang)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('super_admin')}
                      className="p-2 rounded-lg bg-[#141E28] hover:bg-[#1B2733] border border-[#243444] hover:border-purple-500/50 text-left transition-all group"
                    >
                      <div className="text-[11px] font-bold text-purple-400 group-hover:text-purple-300">Super Admin</div>
                      <div className="text-[10px] text-slate-400 truncate">Akses Mutlak</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin')}
                      className="p-2 rounded-lg bg-[#141E28] hover:bg-[#1B2733] border border-[#243444] hover:border-blue-500/50 text-left transition-all group"
                    >
                      <div className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300">Admin Pusdalops</div>
                      <div className="text-[10px] text-slate-400 truncate">Prov. Sumbar</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('operator')}
                      className="p-2 rounded-lg bg-[#141E28] hover:bg-[#1B2733] border border-[#243444] hover:border-emerald-500/50 text-left transition-all group"
                    >
                      <div className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">Operator</div>
                      <div className="text-[10px] text-slate-400 truncate">Kota Padang</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('pimpinan')}
                      className="p-2 rounded-lg bg-[#141E28] hover:bg-[#1B2733] border border-[#243444] hover:border-amber-500/50 text-left transition-all group"
                    >
                      <div className="text-[11px] font-bold text-amber-400 group-hover:text-amber-300">Pimpinan</div>
                      <div className="text-[10px] text-slate-400 truncate">Forkopimda</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PUSAT KENDALI OPERASIONAL MULTI-TAB (PUSDALOPS) */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* NAVBAR TAB OPERASIONAL (8 TAB KOMANDO) */}
            <div className="flex items-center gap-1 px-4 pt-2.5 border-b border-[#243444] bg-[#111A24] overflow-x-auto text-xs font-semibold scrollbar-thin scrollbar-thumb-[#243444] scrollbar-track-transparent">
              <button
                onClick={() => setActiveTab('posko')}
                className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 transition-all shrink-0 ${
                  activeTab === 'posko'
                    ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Posko & Shelter</span>
              </button>

              <button
                onClick={() => setActiveTab('bencana')}
                className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 transition-all shrink-0 ${
                  activeTab === 'bencana'
                    ? 'border-rose-500 text-rose-300 bg-rose-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Lapor & Dampak</span>
              </button>

              <button
                onClick={() => setActiveTab('blokade')}
                className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 transition-all shrink-0 ${
                  activeTab === 'blokade'
                    ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Blokade Jalan</span>
              </button>

              <button
                onClick={() => setActiveTab('verifikasi')}
                className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 transition-all shrink-0 relative ${
                  activeTab === 'verifikasi'
                    ? 'border-blue-500 text-blue-300 bg-blue-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Antrean Verifikasi</span>
                {queueItems.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 transition-all shrink-0 ${
                  activeTab === 'audit'
                    ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Trail</span>
              </button>

              {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                <button
                  onClick={() => setActiveTab('pengguna')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 transition-all shrink-0 ${
                    activeTab === 'pengguna'
                      ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Kelola Personel</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('eksekutif')}
                className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 transition-all shrink-0 ${
                  activeTab === 'eksekutif'
                    ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>KPI Eksekutif</span>
              </button>
            </div>

            {/* AREA KONTEN TAB */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {activeTab === 'posko' && (
                <PoskoManagementTab
                  currentUser={currentUser}
                  poskoList={poskoList}
                  loadPosko={loadPosko}
                  authFetch={authFetch}
                  setErrorMsg={setErrorMsg}
                  setSuccessMsg={setSuccessMsg}
                  onPoskoChanged={onPoskoChanged}
                  pickedCoords={pickedCoords}
                  onRequestPickLocation={onRequestPickLocation}
                  onClose={onClose}
                />
              )}


              {activeTab === 'bencana' && (
                <BencanaTab
                  currentUser={currentUser}
                  bencanaList={bencanaList}
                  loadBencana={loadBencana}
                  authFetch={authFetch}
                  setErrorMsg={setErrorMsg}
                  setSuccessMsg={setSuccessMsg}
                  onBencanaChanged={onBencanaChanged}
                  pickedCoords={pickedCoords}
                  onRequestPickLocation={onRequestPickLocation}
                  onClose={onClose}
                />
              )}

              {activeTab === 'blokade' && (
                <BlokadeJalanTab
                  currentUser={currentUser}
                  jalanList={jalanList}
                  loadJalan={loadJalan}
                  authFetch={authFetch}
                  setErrorMsg={setErrorMsg}
                  setSuccessMsg={setSuccessMsg}
                  onJalanCreated={onJalanCreated}
                />
              )}

              {activeTab === 'verifikasi' && (
                <VerifikasiTab
                  currentUser={currentUser}
                  queueItems={queueItems}
                  loadingQueue={loadingQueue}
                  loadQueue={loadQueue}
                  loadBencana={loadBencana}
                  authFetch={authFetch}
                  setErrorMsg={setErrorMsg}
                  setSuccessMsg={setSuccessMsg}
                  onBencanaChanged={onBencanaChanged}
                />
              )}

              {activeTab === 'audit' && (
                <AuditTrailTab
                  auditLogs={auditLogs}
                  loadAudit={loadAudit}
                />
              )}

              {activeTab === 'pengguna' && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                <PenggunaManagementTab
                  currentUser={currentUser}
                  userList={userList}
                  syncingBmkg={syncingBmkg}
                  handleSyncBmkg={handleSyncBmkg}
                />
              )}

              {activeTab === 'eksekutif' && (
                <ExecutiveDashboardTab
                  statistikData={statistikData}
                  setSuccessMsg={setSuccessMsg}
                />
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
