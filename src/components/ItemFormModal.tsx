import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  FileText,
  CreditCard,
  UserCheck,
  Building2,
  Wand2,
  Save,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, ItemType, VaultItem } from '../types/vault';
import { generatePassword } from '../utils/passwordGenerator';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: Partial<VaultItem>) => void;
  editingItem?: VaultItem | null;
  defaultType?: ItemType;
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

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  editingItem,
  defaultType = 'password',
}) => {
  const [type, setType] = useState<ItemType>(defaultType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('General');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');

  // Password fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');

  // Note fields
  const [noteContent, setNoteContent] = useState('');

  // Card fields
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [bankName, setBankName] = useState('');

  // Identity fields
  const [fullName, setFullName] = useState('');
  const [idType, setIdType] = useState('DNI / Identificación');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Bank fields
  const [bankAccountBankName, setBankAccountBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'Ahorros' | 'Corriente' | 'Nómina'>('Ahorros');
  const [iban, setIban] = useState('');

  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setTitle(editingItem.title);
      setCategory(editingItem.category);
      setTagsInput(editingItem.tags ? editingItem.tags.join(', ') : '');
      setNotes(editingItem.notes || '');

      if (editingItem.passwordData) {
        setUsername(editingItem.passwordData.username || '');
        setPassword(editingItem.passwordData.password || '');
        setUrl(editingItem.passwordData.url || '');
      }
      if (editingItem.noteData) {
        setNoteContent(editingItem.noteData.content || '');
      }
      if (editingItem.cardData) {
        setCardholderName(editingItem.cardData.cardholderName || '');
        setCardNumber(editingItem.cardData.cardNumber || '');
        setExpiryDate(editingItem.cardData.expiryDate || '');
        setCvv(editingItem.cardData.cvv || '');
        setBankName(editingItem.cardData.bankName || '');
      }
      if (editingItem.identityData) {
        setFullName(editingItem.identityData.fullName || '');
        setIdType(editingItem.identityData.idType || 'DNI');
        setIdNumber(editingItem.identityData.idNumber || '');
        setPhone(editingItem.identityData.phone || '');
        setAddress(editingItem.identityData.address || '');
      }
      if (editingItem.bankData) {
        setBankAccountBankName(editingItem.bankData.bankName || '');
        setAccountNumber(editingItem.bankData.accountNumber || '');
        setAccountType(editingItem.bankData.accountType || 'Ahorros');
        setIban(editingItem.bankData.iban || '');
      }
    } else {
      setType(defaultType);
      setTitle('');
      setCategory('General');
      setTagsInput('');
      setNotes('');
      setUsername('');
      setPassword('');
      setUrl('');
      setNoteContent('');
      setCardholderName('');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setBankName('');
      setFullName('');
      setIdType('DNI / Identificación');
      setIdNumber('');
      setPhone('');
      setAddress('');
      setBankAccountBankName('');
      setAccountNumber('');
      setAccountType('Ahorros');
      setIban('');
    }
  }, [editingItem, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const generated = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      avoidAmbiguous: true,
      type: 'random',
    });
    setPassword(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newItemData: Partial<VaultItem> = {
      id: editingItem?.id,
      type,
      title,
      category,
      tags,
      notes,
      favorite: editingItem?.favorite || false,
    };

    if (type === 'password') {
      newItemData.passwordData = { username, password, url };
    } else if (type === 'note') {
      newItemData.noteData = { content: noteContent };
    } else if (type === 'card') {
      newItemData.cardData = {
        cardholderName,
        cardNumber,
        expiryDate,
        cvv,
        bankName,
      };
    } else if (type === 'identity') {
      newItemData.identityData = {
        fullName,
        idType,
        idNumber,
        phone,
        address,
      };
    } else if (type === 'bank') {
      newItemData.bankData = {
        bankName: bankAccountBankName,
        accountNumber,
        accountType,
        iban,
      };
    }

    onSaveItem(newItemData);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 shadow-2xl relative my-8 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">
              {editingItem ? 'Editar Elemento' : 'Nuevo Elemento Cifrado'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 my-4 overflow-y-auto pr-1 flex-1">
            {/* Type selector if creating new */}
            {!editingItem && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Tipo de Información
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setType('password')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                      type === 'password'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Clave</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('note')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                      type === 'note'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Nota</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('card')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                      type === 'card'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Tarjeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('identity')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                      type === 'identity'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>DNI / ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('bank')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                      type === 'bank'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Banco</span>
                  </button>
                </div>
              </div>
            )}

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título del Registro *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Netflix, Correo Trabajo, Visa"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PASSWORD SPECIFIC FIELDS */}
            {type === 'password' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Usuario / Email
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ejemplo@dominio.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Generar Clave Fuerte</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL o Sitio Web
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://ejemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* NOTE SPECIFIC FIELDS */}
            {type === 'note' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contenido de la Nota *
                </label>
                <textarea
                  rows={5}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Escriba aquí datos confidenciales, códigos de recuperación, licencias, etc..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                  required
                />
              </div>
            )}

            {/* CARD SPECIFIC FIELDS */}
            {type === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre en la Tarjeta
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="JUAN PEREZ"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 0000 0000 0000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Vencimiento
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-xs font-mono text-center text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CVV / CVC
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-xs font-mono text-center text-cyan-300 placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Banco
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Visa / Banco"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* IDENTITY SPECIFIC FIELDS */}
            {type === 'identity' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tipo de Documento
                    </label>
                    <input
                      type="text"
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      placeholder="DNI / Pasaporte / Licencia"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Número de Documento
                    </label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="Nº de documento"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-xs font-mono text-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BANK SPECIFIC FIELDS */}
            {type === 'bank' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre del Banco
                  </label>
                  <input
                    type="text"
                    value={bankAccountBankName}
                    onChange={(e) => setBankAccountBankName(e.target.value)}
                    placeholder="Ej. Banco Santander, BBVA"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Número de Cuenta
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0000 0000 0000"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-xs font-mono text-cyan-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tipo de Cuenta
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) =>
                        setAccountType(e.target.value as 'Ahorros' | 'Corriente' | 'Nómina')
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                      <option value="Nómina">Nómina</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    IBAN / CLABE / Swift
                  </label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="ES00 0000 0000 0000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Additional notes & tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Etiquetas (separadas por comas)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="personal, importante, trabajo"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            {type !== 'note' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              </div>
            )}

            {/* Submit */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cifrado</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
