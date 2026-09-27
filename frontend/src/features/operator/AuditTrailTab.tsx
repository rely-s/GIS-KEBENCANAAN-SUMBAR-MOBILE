import React from 'react';
import { RefreshCw, Clock, History } from 'lucide-react';

interface AuditTrailTabProps {
  auditLogs: any[];
  loadAudit: () => void;
}

export const AuditTrailTab: React.FC<AuditTrailTabProps> = ({
  auditLogs,
  loadAudit,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-[#141E28] p-3 rounded-xl border border-[#243444] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Jejak Rekam Mutasi Data Geospasial</h3>
            <p className="text-[11px] text-slate-400">Audit trail kepatuhan integritas data operasional Pusdalops BPBD Prov. Sumbar.</p>
          </div>
        </div>

        <button
          onClick={loadAudit}
          className="px-2.5 py-1 text-xs rounded-lg bg-[#0F1720] border border-[#243444] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh Log</span>
        </button>
      </div>

      <div className="bg-[#141E28] rounded-xl border border-[#243444] overflow-hidden">
        <div className="max-h-80 overflow-y-auto divide-y divide-[#243444]">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada riwayat audit trail tercatat dalam sesi ini.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-3 hover:bg-[#1B2733]/40 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-300 text-[11px] uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      {log.aksi}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Tabel: {log.tabel} #{log.record_id || '-'}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Oleh: <strong className="text-white">{log.operator}</strong> ({log.role?.toUpperCase() || 'SISTEM'})
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    <span>{log.waktu ? new Date(log.waktu).toLocaleTimeString('id-ID') : '-'}</span>
                  </div>
                  <div>{log.ip_address || '127.0.0.1'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
