import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  Lock,
  ArrowRight,
  Wand2,
} from 'lucide-react';
import { VaultItem } from '../types/vault';
import { auditVaultPasswords } from '../utils/passwordGenerator';

interface SecurityAuditViewProps {
  items: VaultItem[];
  onFixItem: (item: VaultItem) => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  items,
  onFixItem,
}) => {
  const audit = auditVaultPasswords(items);

  const getScoreColor = () => {
    if (audit.score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (audit.score >= 60) return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Score */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Auditoría de Salud de Bóveda</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Nivel de Seguridad de la Bóveda
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg">
            Análisis automático de patrones de contraseñas, reutilización de claves en múltiples servicios y antigüedad de credenciales.
          </p>
        </div>

        <div className={`p-6 rounded-3xl border text-center min-w-[160px] shadow-lg ${getScoreColor()}`}>
          <div className="text-4xl font-black font-mono tracking-tight">{audit.score}%</div>
          <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-90">
            {audit.score >= 85 ? 'Excelente' : audit.score >= 60 ? 'Aceptable' : 'Peligro'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold font-mono text-emerald-400">{audit.strongCount}</div>
          <div className="text-xs text-slate-400 mt-1">Claves Fuertes</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold font-mono text-rose-400">{audit.weakCount}</div>
          <div className="text-xs text-slate-400 mt-1">Claves Débiles</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold font-mono text-amber-400">{audit.reusedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Claves Repetidas</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold font-mono text-sky-400">{audit.oldCount}</div>
          <div className="text-xs text-slate-400 mt-1">Sin Cambiar (+6m)</div>
        </div>
      </div>

      {/* Issues Breakdown List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Alertas y Recomendaciones de Seguridad ({audit.issues.length})</span>
        </h3>

        {audit.issues.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-semibold text-white">¡Bóveda Completamente Segura!</h4>
            <p className="text-xs text-slate-400">
              No se detectaron contraseñas débiles o repetidas. ¡Buen trabajo manteniendo sus datos protegidos!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {audit.issues.map((issue, idx) => {
              const targetItem = items.find((i) => i.id === issue.itemId);
              if (!targetItem) return null;

              return (
                <div
                  key={`${issue.itemId}-${idx}`}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl shrink-0 mt-0.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{issue.itemTitle}</h4>
                      <p className="text-xs text-rose-400 mt-0.5 font-medium">{issue.message}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onFixItem(targetItem)}
                    className="py-2 px-3.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Actualizar Clave</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
