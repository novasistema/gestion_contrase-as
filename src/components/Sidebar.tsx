import React from 'react';
import {
  KeyRound,
  FileText,
  CreditCard,
  UserCheck,
  Building2,
  Star,
  ShieldCheck,
  Wand2,
  Folder,
  Layers,
  X,
} from 'lucide-react';
import { Category, ItemType } from '../types/vault';

interface SidebarProps {
  selectedType: ItemType | 'all' | 'favorites' | 'audit' | 'generator';
  onSelectType: (type: ItemType | 'all' | 'favorites' | 'audit' | 'generator') => void;
  selectedCategory: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
  categoryCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  favoriteCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const CATEGORIES: Category[] = [
  'General',
  'Social',
  'Trabajo',
  'Finanzas',
  'Streaming',
  'Email',
  'Compras',
  'Personal',
  'Servidores',
];

export const Sidebar: React.FC<SidebarProps> = ({
  selectedType,
  onSelectType,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  typeCounts,
  favoriteCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const sidebarContent = (
    <div className="flex flex-col h-full py-4 px-3 space-y-6 overflow-y-auto">
      {/* Types Section */}
      <div>
        <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Categorías de Datos
        </h3>
        <nav className="space-y-1">
          <button
            onClick={() => {
              onSelectType('all');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'all' && selectedCategory === 'all'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Todos los Elementos</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
              {typeCounts.all || 0}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectType('password');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'password'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Contraseñas</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
              {typeCounts.password || 0}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectType('note');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'note'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Notas Secretas</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
              {typeCounts.note || 0}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectType('card');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'card'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Tarjetas de Crédito</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
              {typeCounts.card || 0}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectType('identity');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'identity'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>Identidades / Documentos</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
              {typeCounts.identity || 0}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectType('bank');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'bank'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Cuentas Bancarias</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
              {typeCounts.bank || 0}
            </span>
          </button>
        </nav>
      </div>

      {/* Specialty Views */}
      <div>
        <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Herramientas y Vistas
        </h3>
        <nav className="space-y-1">
          <button
            onClick={() => {
              onSelectType('favorites');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'favorites'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Favoritos</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
              {favoriteCount}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectType('audit');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'audit'
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Auditoría de Seguridad</span>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectType('generator');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedType === 'generator'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <span>Generador de Claves</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Folders / Custom Categories */}
      <div>
        <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Etiquetas por Tema
        </h3>
        <div className="flex flex-wrap gap-1.5 px-2">
          <button
            onClick={() => {
              onSelectCategory('all');
              if (selectedType === 'audit' || selectedType === 'generator') {
                onSelectType('all');
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-700 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                onSelectCategory(cat);
                if (selectedType === 'audit' || selectedType === 'generator') {
                  onSelectType('all');
                }
                onCloseMobile?.();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Folder className="w-3 h-3 text-cyan-400" />
              <span>{cat}</span>
              {categoryCounts[cat] > 0 && (
                <span className="text-[10px] opacity-70">({categoryCounts[cat]})</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-slate-900/60 border-r border-slate-800 shrink-0 h-[calc(100vh-57px)] sticky top-[57px]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 bg-slate-900 h-full shadow-2xl border-r border-slate-800 flex flex-col z-10">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white">Navegación</span>
              <button
                onClick={onCloseMobile}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
