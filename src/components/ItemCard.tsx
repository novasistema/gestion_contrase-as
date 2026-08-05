import React from 'react';
import {
  KeyRound,
  FileText,
  CreditCard,
  UserCheck,
  Building2,
  Star,
  Copy,
  Eye,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { VaultItem } from '../types/vault';
import { calculatePasswordEntropy } from '../utils/passwordGenerator';

interface ItemCardProps {
  item: VaultItem;
  onSelect: (item: VaultItem) => void;
  onToggleFavorite: (itemId: string, e: React.MouseEvent) => void;
  onCopyPassword: (password: string, title: string, e: React.MouseEvent) => void;
  onCopyUsername: (username: string, title: string, e: React.MouseEvent) => void;
  showPasswordStrength: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onSelect,
  onToggleFavorite,
  onCopyPassword,
  onCopyUsername,
  showPasswordStrength,
}) => {
  const getItemIcon = () => {
    switch (item.type) {
      case 'password':
        return <KeyRound className="w-5 h-5 text-emerald-400" />;
      case 'note':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-purple-400" />;
      case 'identity':
        return <UserCheck className="w-5 h-5 text-sky-400" />;
      case 'bank':
        return <Building2 className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSubtitle = () => {
    switch (item.type) {
      case 'password':
        return item.passwordData?.username || item.passwordData?.url || 'Sin usuario';
      case 'note':
        return item.noteData?.content.slice(0, 40) + '...' || 'Nota vacía';
      case 'card':
        return `${item.cardData?.bankName || 'Tarjeta'} • ${item.cardData?.cardNumber ? item.cardData.cardNumber.slice(-4) : '••••'}`;
      case 'identity':
        return item.identityData?.fullName || item.identityData?.idNumber || 'Documento';
      case 'bank':
        return `${item.bankData?.bankName || 'Banco'} (${item.bankData?.accountNumber || 'Cuenta'})`;
    }
  };

  const passwordEntropy =
    item.type === 'password' && item.passwordData?.password
      ? calculatePasswordEntropy(item.passwordData.password)
      : null;

  return (
    <div
      onClick={() => onSelect(item)}
      className="group bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-slate-800/90 group-hover:bg-slate-700/80 border border-slate-700/50 rounded-xl shrink-0 transition-colors">
            {getItemIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
              {item.title}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {getSubtitle()}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => onToggleFavorite(item.id, e)}
          className={`p-1.5 rounded-lg transition-colors ${
            item.favorite
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-slate-600 hover:text-slate-400'
          }`}
          aria-label="Marcar favorito"
        >
          <Star className={`w-4 h-4 ${item.favorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Middle preview area */}
      <div className="my-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
        {item.type === 'password' && item.passwordData?.password && (
          <div className="flex items-center gap-2 font-mono text-slate-400">
            <span>••••••••••••</span>
            {showPasswordStrength && passwordEntropy && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-medium ${
                  passwordEntropy.color.split(' ')[0]
                } bg-slate-800/80`}
              >
                {passwordEntropy.label}
              </span>
            )}
          </div>
        )}

        {item.type === 'card' && item.cardData?.cardNumber && (
          <div className="font-mono text-slate-400">
            •••• •••• •••• {item.cardData.cardNumber.slice(-4)}
          </div>
        )}

        {item.type === 'note' && (
          <span className="text-[11px] text-slate-500 italic">Nota protegida</span>
        )}

        <span className="text-[10px] px-2 py-0.5 bg-slate-800/80 border border-slate-700/50 text-slate-400 rounded-md font-medium ml-auto">
          {item.category}
        </span>
      </div>

      {/* Bottom Actions */}
      <div className="pt-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {item.type === 'password' && item.passwordData?.password && (
            <button
              type="button"
              onClick={(e) =>
                onCopyPassword(item.passwordData!.password!, item.title, e)
              }
              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
              title="Copiar contraseña"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Clave</span>
            </button>
          )}

          {item.type === 'password' && item.passwordData?.username && (
            <button
              type="button"
              onClick={(e) =>
                onCopyUsername(item.passwordData!.username!, item.title, e)
              }
              className="py-1 px-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
              title="Copiar usuario"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Usuario</span>
            </button>
          )}
        </div>

        <div className="flex items-center text-slate-500 group-hover:text-cyan-400 text-xs font-medium gap-0.5 ml-auto">
          <span>Ver</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
