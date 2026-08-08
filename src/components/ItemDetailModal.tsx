import React, { useState } from 'react';
import {
  X,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Edit2,
  Trash2,
  Star,
  ShieldCheck,
  Calendar,
  Clock,
  KeyRound,
  FileText,
  CreditCard,
  UserCheck,
  Building2,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VaultItem } from '../types/vault';
import { calculatePasswordEntropy } from '../utils/passwordGenerator';

interface ItemDetailModalProps {
  item: VaultItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
  onCopyText: (text: string, label: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyText,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !item) return null;

  const passwordEntropy =
    item.type === 'password' && item.passwordData?.password
      ? calculatePasswordEntropy(item.passwordData.password)
      : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 shadow-2xl relative my-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-800 border border-slate-700/60 rounded-2xl text-cyan-400">
                {item.type === 'password' && <KeyRound className="w-6 h-6 text-emerald-400" />}
                {item.type === 'note' && <FileText className="w-6 h-6 text-amber-400" />}
                {item.type === 'card' && <CreditCard className="w-6 h-6 text-purple-400" />}
                {item.type === 'identity' && <UserCheck className="w-6 h-6 text-sky-400" />}
                {item.type === 'bank' && <Building2 className="w-6 h-6 text-blue-400" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{item.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md font-medium">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    Modificado: {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleFavorite(item.id)}
                className={`p-2 rounded-xl transition-colors ${
                  item.favorite
                    ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Star className={`w-5 h-5 ${item.favorite ? 'fill-amber-400' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body according to type */}
          <div className="space-y-4">
            {/* PASSWORD ITEM DETAILS */}
            {item.type === 'password' && item.passwordData && (
              <>
                {item.passwordData.username && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Nombre de Usuario / Correo
                    </label>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <span className="text-sm font-mono text-slate-200 flex-1 truncate select-all">
                        {item.passwordData.username}
                      </span>
                      <button
                        onClick={() =>
                          onCopyText(item.passwordData!.username!, 'Usuario')
                        }
                        className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                )}

                {item.passwordData.password && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-400">
                        Contraseña
                      </label>
                      {passwordEntropy && (
                        <span
                          className={`text-xs font-semibold ${
                            passwordEntropy.color.split(' ')[0]
                          }`}
                        >
                          {passwordEntropy.label} ({passwordEntropy.entropy} bits)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <span className="text-sm font-mono text-cyan-300 flex-1 truncate select-all">
                        {showPassword
                          ? item.passwordData.password
                          : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() =>
                          onCopyText(item.passwordData!.password!, 'Contraseña')
                        }
                        className="py-1 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Clave</span>
                      </button>
                    </div>
                  </div>
                )}

                {item.passwordData.url && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Sitio Web / URL
                    </label>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <span className="text-sm text-sky-400 flex-1 truncate">
                        {item.passwordData.url}
                      </span>
                      <a
                        href={
                          item.passwordData.url.startsWith('http')
                            ? item.passwordData.url
                            : `https://${item.passwordData.url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Abrir</span>
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* SECURE NOTE ITEM DETAILS */}
            {item.type === 'note' && item.noteData && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Contenido de la Nota
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[120px] max-h-[250px] overflow-y-auto font-mono text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                  {item.noteData.content}
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => onCopyText(item.noteData!.content, 'Nota')}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copiar Nota Completa</span>
                  </button>
                </div>
              </div>
            )}

            {/* PAYMENT CARD DETAILS */}
            {item.type === 'card' && item.cardData && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-inner relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {item.cardData.bankName || 'Tarjeta Cifrada'}
                    </span>
                    <span className="text-xs font-bold uppercase text-cyan-400">
                      {item.cardData.cardType?.toUpperCase() || 'TARJETA'}
                    </span>
                  </div>
                  <div className="font-mono text-lg tracking-widest text-white my-3 select-all">
                    {item.cardData.cardNumber}
                  </div>
                  <div className="flex justify-between items-end text-xs text-slate-300">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Titular</div>
                      <div className="font-semibold">{item.cardData.cardholderName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Vence</div>
                      <div className="font-mono font-semibold">{item.cardData.expiryDate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">CVV</div>
                      <div className="font-mono font-semibold text-cyan-300">
                        {showCvv ? item.cardData.cvv : '•••'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onCopyText(item.cardData!.cardNumber, 'Número de Tarjeta')}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copiar Número</span>
                  </button>
                  <button
                    onClick={() => setShowCvv(!showCvv)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors"
                  >
                    {showCvv ? 'Ocultar CVV' : 'Ver CVV'}
                  </button>
                </div>
              </div>
            )}

            {/* IDENTITY ITEM DETAILS */}
            {item.type === 'identity' && item.identityData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500 block mb-0.5">Nombre Completo</span>
                  <span className="font-semibold text-slate-100">{item.identityData.fullName}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500 block mb-0.5">
                    {item.identityData.idType || 'Documento / DNI'}
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-semibold text-cyan-300">
                      {item.identityData.idNumber}
                    </span>
                    <button
                      onClick={() => onCopyText(item.identityData!.idNumber, 'Número DNI/Documento')}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {item.identityData.phone && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-500 block mb-0.5">Teléfono</span>
                    <span className="text-slate-200">{item.identityData.phone}</span>
                  </div>
                )}
                {item.identityData.address && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl sm:col-span-2">
                    <span className="text-slate-500 block mb-0.5">Dirección</span>
                    <span className="text-slate-200">{item.identityData.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* BANK ACCOUNT DETAILS */}
            {item.type === 'bank' && item.bankData && (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500 block mb-0.5">Banco</span>
                  <span className="font-semibold text-slate-100">{item.bankData.bankName}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500 block mb-0.5">Número de Cuenta</span>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-semibold text-cyan-300">
                      {item.bankData.accountNumber}
                    </span>
                    <button
                      onClick={() => onCopyText(item.bankData!.accountNumber, 'Número de Cuenta')}
                      className="py-1 px-2 bg-slate-800 text-slate-300 text-[11px] rounded flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
                {item.bankData.iban && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-500 block mb-0.5">IBAN / Clave Interbancaria</span>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-slate-200">{item.bankData.iban}</span>
                      <button
                        onClick={() => onCopyText(item.bankData!.iban!, 'IBAN')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes if present */}
            {item.notes && item.type !== 'note' && (
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Notas Adicionales
                </label>
                <p className="text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3 rounded-xl whitespace-pre-line">
                  {item.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 w-full bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl">
                <span className="text-xs text-rose-300 font-semibold flex-1">
                  ¿Confirmar eliminación?
                </span>
                <button
                  onClick={() => {
                    onDelete(item.id);
                    onClose();
                  }}
                  className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
                >
                  Sí, Eliminar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-1.5 px-3 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-2 px-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>

                <button
                  onClick={() => {
                    onEdit(item);
                    onClose();
                  }}
                  className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar Elemento</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
