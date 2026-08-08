import React from 'react';
import {
  ShieldCheck,
  Lock,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Clock,
  Menu,
  User,
  LogOut,
} from 'lucide-react';
import { VaultSettings } from '../types/vault';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewItemModal: () => void;
  onOpenSettingsModal: () => void;
  onLockVault: () => void;
  onOpenMobileMenu?: () => void;
  autoLockMinutes: number;
  totalItems: number;
  activeProfileName?: string;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNewItemModal,
  onOpenSettingsModal,
  onLockVault,
  onOpenMobileMenu,
  autoLockMinutes,
  totalItems,
  activeProfileName,
  isCloudSynced,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left branding / menu */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white leading-tight">
                  VaultLock
                </h1>
                {activeProfileName && (
                  <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[11px] rounded-full font-medium flex items-center gap-1">
                    <User className="w-3 h-3 text-cyan-400" />
                    <span>{activeProfileName}</span>
                  </span>
                )}
                {isCloudSynced && (
                  <span className="hidden md:flex px-2 py-0.5 bg-emerald-950 border border-emerald-800/80 text-emerald-300 text-[10px] rounded-full font-medium items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Sincronizado en Nube</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {totalItems} {totalItems === 1 ? 'elemento cifrado' : 'elementos cifrados'} • Cifrado AES-256
              </p>
            </div>
          </div>
        </div>

        {/* Center Search input */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar en la bóveda (título, usuario, url, notas)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white placeholder-slate-500 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewItemModal}
            className="py-2 px-3.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-cyan-900/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Elemento</span>
          </button>

          <button
            onClick={onOpenSettingsModal}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
            title="Configuración de Bóveda"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onLockVault}
            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
            title="Bloquear Bóveda Ahora"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden md:inline">Bloquear</span>
          </button>
        </div>
      </div>
    </header>
  );
};
