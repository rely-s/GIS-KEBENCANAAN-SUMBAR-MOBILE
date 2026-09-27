import React from 'react';
import { Users, RefreshCw, Radio } from 'lucide-react';
import { type UserSession } from './constants';

interface PenggunaManagementTabProps {
  currentUser: UserSession;
  userList: any[];
  syncingBmkg: boolean;
  handleSyncBmkg: () => void;
}

export const PenggunaManagementTab: React.FC<PenggunaManagementTabProps> = ({
  currentUser,
  userList,
  syncingBmkg,
  handleSyncBmkg,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-[#141E28] p-3 rounded-xl border border-[#243444] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daftar Personel & Hak Akses Berjenjang (RBAC)</h3>
            <p className="text-[11px] text-slate-400">Pengelolaan otoritas operator lapangan, admin pusdalops, dan pimpinan daerah.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
            Sesi: <strong>{currentUser.nama}</strong>
          </span>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30 font-bold">
            {userList.length} Personel Terdaftar
          </span>
        </div>
      </div>

      <div className="bg-[#141E28] rounded-xl border border-[#243444] overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0F1720] text-slate-400 text-[11px] uppercase font-mono border-b border-[#243444]">
            <tr>
              <th className="py-2.5 px-3">Nama Petugas</th>
              <th className="py-2.5 px-3">Email Kedinasan</th>
              <th className="py-2.5 px-3">Role Otoritas</th>
              <th className="py-2.5 px-3">Wilayah Tugas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243444]">
            {userList.map((u) => (
              <tr key={u.id} className="hover:bg-[#1B2733]/40 transition-colors">
                <td className="py-2.5 px-3 font-bold text-white">{u.nama}</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">{u.email}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                    u.role === 'super_admin'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : u.role === 'admin'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : u.role === 'pimpinan'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">{u.wilayah_tugas || 'Provinsi Sumbar'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sync Sensor BMKG Card */}
      <div className="p-4 rounded-xl bg-[#141E28] border border-[#243444] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Radio className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Sinkronisasi Sensor BMKG TEWS (Multi-Feed)</h4>
            <p className="text-[11px] text-slate-400">
              Sinkronisasi autogempa.json (Nasional M5.0+) dan gempadirasakan.json (Gempa Darat Lokal Sesar Semangko Bounding Box Sumbar).
            </p>
          </div>
        </div>
        <button
          onClick={handleSyncBmkg}
          disabled={syncingBmkg}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncingBmkg ? 'animate-spin' : ''}`} />
          <span>Tarik Feed BMKG</span>
        </button>
      </div>
    </div>
  );
};
