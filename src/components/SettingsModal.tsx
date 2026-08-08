import React, { useState } from 'react';
import {
  X,
  Shield,
  KeyRound,
  Fingerprint,
  Clock,
  Download,
  Upload,
  AlertTriangle,
  Lock,
  CheckCircle2,
  RefreshCw,
  Copy,
  Trash2,
  FileCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VaultItem, VaultSettings } from '../types/vault';
import {
  registerWebAuthnBiometric,
  isWebAuthnSupported,
} from '../utils/crypto';
import {
  clearVaultData,
  setupQuickPin,
  getQuickPinData,
} from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VaultSettings;
  onUpdateSettings: (newSettings: VaultSettings) => void;
  masterPasswordKey: CryptoKey | null;
  items: VaultItem[];
  onImportItems: (importedItems: VaultItem[]) => void;
  onChangeMasterPassword: (currentPass: string, newPass: string) => Promise<boolean>;
  onResetVault: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  items,
  onImportItems,
  onChangeMasterPassword,
  onResetVault,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'backup' | 'danger'>('security');

  // Change Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [changingPassLoading, setChangingPassLoading] = useState(false);

  // PIN state
  const [pin, setPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Biometric state
  const [biometricLoading, setBiometricLoading] = useState(false);

  if (!isOpen) return null;

  const handleToggleBiometric = async () => {
    if (!settings.biometricEnabled) {
      setBiometricLoading(true);
      const credential = await registerWebAuthnBiometric('usuario');
      setBiometricLoading(false);

      if (credential || !isWebAuthnSupported()) {
        onUpdateSettings({ ...settings, biometricEnabled: true });
        onShowToast('Biometría Activada', 'Ahora puede desbloquear con su huella o rostro.', 'success');
      } else {
        onShowToast('Error Biométrico', 'No se pudo registrar la credencial biométrica.', 'error');
      }
    } else {
      onUpdateSettings({ ...settings, biometricEnabled: false });
      onShowToast('Biometría Desactivada', '', 'info');
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      onShowToast('PIN Inválido', 'El PIN debe tener al menos 4 dígitos.', 'error');
      return;
    }
    if (!currentPass) {
      onShowToast('Falta Contraseña Maestra', 'Ingrese su contraseña maestra para vincular el PIN.', 'error');
      return;
    }

    try {
      await setupQuickPin(pin, currentPass);
      onUpdateSettings({ ...settings, pinUnlockEnabled: true });
      setPinSuccess(true);
      setPin('');
      onShowToast('PIN de Acceso Rápido Guardado', 'Podrá desbloquear rápidamente con su PIN.', 'success');
    } catch (err) {
      onShowToast('Error al Guardar PIN', 'Verifique su contraseña maestra.', 'error');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) {
      onShowToast('Clave Corta', 'La nueva contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    if (newPass !== confirmNewPass) {
      onShowToast('No Coinciden', 'La nueva contraseña y la confirmación no coinciden.', 'error');
      return;
    }

    setChangingPassLoading(true);
    const success = await onChangeMasterPassword(currentPass, newPass);
    setChangingPassLoading(false);

    if (success) {
      setCurrentPass('');
      setNewPass('');
      setConfirmNewPass('');
      onShowToast('Contraseña Maestra Actualizada', 'Se ha re-cifrado la bóveda con la nueva clave.', 'success');
    } else {
      onShowToast('Error de Clave', 'La contraseña maestra actual es incorrecta.', 'error');
    }
  };

  const handleExportEncryptedBackup = () => {
    const rawPayload = localStorage.getItem('vaultlock_encrypted_payload_v1');
    if (!rawPayload) return;

    const blob = new Blob([rawPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boveda-respaldo-cifrado-${new Date().toISOString().slice(0, 10)}.vault`;
    a.click();
    URL.revokeObjectURL(url);

    onShowToast('Copia Cifrada Exportada', 'Archivo .vault descargado con éxito.', 'success');
  };

  const handleExportUnencryptedCSV = () => {
    let csvContent = 'tipo,titulo,categoria,usuario,contrasena,url,notas\n';

    items.forEach((item) => {
      const type = item.type;
      const title = `"${(item.title || '').replace(/"/g, '""')}"`;
      const cat = `"${(item.category || '').replace(/"/g, '""')}"`;
      const user = `"${(item.passwordData?.username || item.cardData?.cardNumber || '').replace(/"/g, '""')}"`;
      const pass = `"${(item.passwordData?.password || item.cardData?.cvv || '').replace(/"/g, '""')}"`;
      const url = `"${(item.passwordData?.url || '').replace(/"/g, '""')}"`;
      const notes = `"${(item.notes || item.noteData?.content || '').replace(/"/g, '""')}"`;

      csvContent += `${type},${title},${cat},${user},${pass},${url},${notes}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boveda-desencriptada-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    onShowToast('Archivo CSV Exportado', 'Conserve su archivo CSV en un lugar seguro.', 'info');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.vault') || file.name.endsWith('.json')) {
          localStorage.setItem('vaultlock_encrypted_payload_v1', text);
          onShowToast('Respaldo Restaurado', 'Recargue o desbloquee con la clave del respaldo.', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } else if (file.name.endsWith('.csv')) {
          // Basic CSV import
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          const imported: VaultItem[] = [];

          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 5) {
              imported.push({
                id: `import-${Date.now()}-${i}`,
                type: 'password',
                title: parts[1]?.replace(/"/g, '') || `Importado ${i}`,
                category: 'General',
                tags: ['importado'],
                favorite: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                passwordData: {
                  username: parts[3]?.replace(/"/g, ''),
                  password: parts[4]?.replace(/"/g, ''),
                  url: parts[5]?.replace(/"/g, ''),
                },
              });
            }
          }

          if (imported.length > 0) {
            onImportItems(imported);
            onShowToast('Importación Exitosa', `Se importaron ${imported.length} registros.`, 'success');
          }
        }
      } catch (err) {
        onShowToast('Error al Importar', 'Archivo inválido o formato no soportado.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-slate-100 shadow-2xl relative my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>Configuración de Bóveda</span>
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 my-4 text-xs font-semibold gap-2">
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2.5 px-4 rounded-xl transition-colors ${
                activeTab === 'security'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Seguridad y Acceso
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`py-2.5 px-4 rounded-xl transition-colors ${
                activeTab === 'backup'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Copia de Seguridad
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`py-2.5 px-4 rounded-xl transition-colors ${
                activeTab === 'danger'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Restablecer
            </button>
          </div>

          {/* TAB 1: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 text-xs max-h-[60vh] overflow-y-auto pr-1">
              {/* Auto-Lock timer */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Tiempo de Auto-Bloqueo por Inactividad</h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[1, 5, 15, 30, 0].map((mins) => (
                    <button
                      key={mins}
                      onClick={() =>
                        onUpdateSettings({ ...settings, autoLockMinutes: mins })
                      }
                      className={`py-2 px-3 rounded-xl font-semibold transition-colors ${
                        settings.autoLockMinutes === mins
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {mins === 0 ? 'Nunca' : `${mins} min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Biometrics Toggle */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-cyan-400" />
                    <span>Autenticación Biométrica (FaceID / Huella)</span>
                  </h3>
                  <p className="text-slate-400">
                    Permite desbloquear la bóveda escaneando su rostro o huella en este dispositivo.
                  </p>
                </div>
                <button
                  onClick={handleToggleBiometric}
                  disabled={biometricLoading}
                  className={`py-2 px-4 rounded-xl font-semibold shrink-0 transition-colors ${
                    settings.biometricEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {settings.biometricEnabled ? 'Activada' : 'Activar'}
                </button>
              </div>

              {/* Quick PIN Setup */}
              <form onSubmit={handleSetupPin} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>PIN de Acceso Rápido (4-6 dígitos)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Nuevo PIN (ej. 1234)"
                    className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none font-mono"
                  />
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Contraseña Maestra para autorizar"
                    className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl"
                >
                  Guardar PIN Rápido
                </button>
              </form>

              {/* Change Master Password */}
              <form
                onSubmit={handleChangePasswordSubmit}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Cambiar Contraseña Maestra</span>
                </h3>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Contraseña Maestra Actual"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                    required
                  />
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Nueva Contraseña Maestra (mínimo 8 caracteres)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                    required
                  />
                  <input
                    type="password"
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                    placeholder="Confirmar Nueva Contraseña Maestra"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassLoading}
                  className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl flex items-center gap-2"
                >
                  {changingPassLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Re-cifrar y Cambiar Clave Maestra</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: BACKUP & EXPORT */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Exportar Copia Cifrada (.vault)</span>
                </h3>
                <p className="text-slate-400">
                  Descargue un respaldo con cifrado AES-GCM 256 de toda su bóveda. Sólo se podrá descifrar con su clave maestra.
                </p>
                <button
                  onClick={handleExportEncryptedBackup}
                  className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Respaldo .vault</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>Exportar en Texto Plano (CSV)</span>
                </h3>
                <p className="text-slate-400">
                  Exporta sus contraseñas en formato CSV para importar en gestores como Chrome o Bitwarden.
                </p>
                <button
                  onClick={handleExportUnencryptedCSV}
                  className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl flex items-center gap-2"
                >
                  <FileCode className="w-4 h-4" />
                  <span>Exportar CSV (Desencriptado)</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Restaurar o Importar Bóveda (.vault / .csv)</span>
                </h3>
                <p className="text-slate-400">
                  Seleccione un archivo de respaldo .vault previamente guardado o un CSV para importar.
                </p>
                <label className="inline-flex py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl cursor-pointer items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Seleccionar Archivo de Respaldo</span>
                  <input
                    type="file"
                    accept=".vault,.json,.csv"
                    onChange={handleImportBackupFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-2xl space-y-3 text-xs">
              <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Restablecer Bóveda Local Completa</span>
              </h3>
              <p className="text-rose-200 leading-relaxed">
                Esta acción eliminará de forma irreversible todas las contraseñas, notas y tarjetas almacenadas localmente en este navegador.
              </p>
              <button
                onClick={onResetVault}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar Todo y Restablecer</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
