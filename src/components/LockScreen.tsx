import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Fingerprint,
  AlertTriangle,
  RefreshCw,
  User,
  UserPlus,
  Mail,
  Cloud,
  Check,
  ShieldCheck,
  Globe,
  LogIn,
} from 'lucide-react';
import { motion } from 'motion/react';
import { calculatePasswordEntropy } from '../utils/passwordGenerator';
import { VaultProfile } from '../types/vault';

interface LockScreenProps {
  profiles: VaultProfile[];
  cloudUserEmail?: string | null;
  onEmailRegister: (
    email: string,
    accountPass: string,
    displayName: string,
    masterPass: string
  ) => Promise<void>;
  onEmailLogin: (email: string, accountPass: string) => Promise<boolean>;
  onUnlockCloudVault: (masterPass: string) => Promise<boolean>;
  onInitializeLocalVault: (accountName: string, masterPass: string) => Promise<void>;
  onUnlockLocalVault: (profileId: string, masterPass: string) => Promise<boolean>;
  onUnlockWithBiometric: () => void;
  onResetAllVaults: () => void;
  onDeleteProfile: (profileId: string) => void;
  onLogoutCloud: () => Promise<void>;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  profiles,
  cloudUserEmail,
  onEmailRegister,
  onEmailLogin,
  onUnlockCloudVault,
  onInitializeLocalVault,
  onUnlockLocalVault,
  onUnlockWithBiometric,
  onResetAllVaults,
  onLogoutCloud,
}) => {
  // Tab state: 'login' | 'register' | 'local'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'local'>(
    cloudUserEmail ? 'login' : 'login'
  );

  // Form input fields
  const [email, setEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  
  const [useSamePasswordForMaster, setUseSamePasswordForMaster] = useState(true);

  // Local profile unlock selection
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    profiles.length > 0 ? profiles[0].id : ''
  );

  // General state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const entropy = calculatePasswordEntropy(masterPassword || accountPassword);

  // Handle Cloud Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor ingrese un correo electrónico válido.');
      return;
    }
    if (accountPassword.length < 6) {
      setErrorMsg('La contraseña de la cuenta debe tener al menos 6 caracteres.');
      return;
    }

    const effectiveMasterPass = useSamePasswordForMaster
      ? accountPassword
      : masterPassword;

    if (effectiveMasterPass.length < 8) {
      setErrorMsg('La contraseña maestra de cifrado debe tener al menos 8 caracteres.');
      return;
    }

    if (!useSamePasswordForMaster && masterPassword !== confirmMasterPassword) {
      setErrorMsg('Las contraseñas maestras no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await onEmailRegister(
        email.trim(),
        accountPassword,
        displayName.trim() || email.split('@')[0],
        effectiveMasterPass
      );
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado. Por favor inicie sesión.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('El registro con Email/Contraseña debe ser activado en Firebase Console > Authentication > Sign-in method > Correo electrónico / Contraseña.');
      } else {
        setErrorMsg(err.message || 'Error al registrar la cuenta en la nube.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Cloud Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Ingrese su correo electrónico.');
      return;
    }
    if (!accountPassword) {
      setErrorMsg('Ingrese la contraseña de su cuenta.');
      return;
    }

    setLoading(true);
    try {
      const success = await onEmailLogin(email.trim(), accountPassword);
      if (!success) {
        setErrorMsg('Credenciales incorrectas o error de inicio de sesión.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('El proveedor Correo/Contraseña está desactivado en Firebase Console > Authentication > Sign-in method.');
      } else {
        setErrorMsg(err.message || 'Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Unlock Cloud Vault with Master Password (if authenticated)
  const handleUnlockCloudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!masterPassword) {
      setErrorMsg('Ingrese su Contraseña Maestra de Cifrado.');
      return;
    }

    setLoading(true);
    try {
      const success = await onUnlockCloudVault(masterPassword);
      if (!success) {
        setErrorMsg('Contraseña maestra incorrecta para descifrar la bóveda.');
      }
    } catch (err) {
      setErrorMsg('Error descifrando la bóveda desde la nube.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Local Unlock
  const handleLocalUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedProfileId) {
      setErrorMsg('Seleccione un usuario local.');
      return;
    }

    setLoading(true);
    try {
      const success = await onUnlockLocalVault(selectedProfileId, masterPassword);
      if (!success) {
        setErrorMsg('Contraseña maestra local incorrecta.');
      }
    } catch (err) {
      setErrorMsg('Error al desbloquear bóveda local.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Local Create
  const handleLocalCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Ingrese un nombre de usuario.');
      return;
    }
    if (masterPassword.length < 8) {
      setErrorMsg('La clave maestra debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await onInitializeLocalVault(displayName.trim(), masterPassword);
    } catch (err) {
      setErrorMsg('Error al crear bóveda local.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow graphics */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative z-10"
      >
        {/* Top Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl text-cyan-400 mb-3 shadow-inner">
            <Shield className="w-9 h-9" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>VaultLock Cloud</span>
            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] rounded-full font-mono uppercase tracking-wider">
              E2EE
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">
            Guarde y sincronice sus contraseñas en cualquier dispositivo con cifrado AES-256 de extremo a extremo.
          </p>
        </div>

        {/* If user is already authenticated with Firebase Auth but needs Master Password */}
        {cloudUserEmail ? (
          <form onSubmit={handleUnlockCloudSubmit} className="space-y-4">
            <div className="p-3.5 bg-cyan-950/40 border border-cyan-800/60 rounded-2xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-slate-400 text-[10px]">Sesión Activa en la Nube:</p>
                  <p className="font-semibold text-white truncate">{cloudUserEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogoutCloud}
                className="text-[11px] text-slate-400 hover:text-rose-400 underline underline-offset-2 shrink-0 ml-2"
              >
                Cerrar Sesión
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Contraseña Maestra de Cifrado</span>
                <span className="text-[10px] text-cyan-400">Zero-Knowledge</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Ingrese su contraseña maestra para descifrar..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Descifrar Bóveda Multidispositivo</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Normal Authentication Tabs */
          <div>
            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-2xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrarse</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('local');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'local'
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modo Local</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: LOGIN WITH EMAIL */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Inicie sesión para acceder a sus datos desde cualquier dispositivo.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contraseña de la Cuenta / Maestra
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión en la Nube</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER WITH EMAIL */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Cree una cuenta para respaldar sus contraseñas en la nube.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre o Nombre de Usuario
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contraseña de la Cuenta
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Option to use separate Master Password or same */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useSamePasswordForMaster}
                      onChange={(e) => setUseSamePasswordForMaster(e.target.checked)}
                      className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500 bg-slate-950"
                    />
                    <span>Usar esta misma contraseña como Contraseña Maestra de cifrado</span>
                  </label>
                </div>

                {!useSamePasswordForMaster && (
                  <div className="space-y-3 pt-1 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Contraseña Maestra Diferente
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres para cifrar datos"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-sm text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirmar Contraseña Maestra
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmMasterPassword}
                        onChange={(e) => setConfirmMasterPassword(e.target.value)}
                        placeholder="Repita la clave maestra"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-sm text-white font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Password meter */}
                {accountPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Fortaleza de Clave:</span>
                      <span className={`font-semibold ${entropy.color.split(' ')[0]}`}>
                        {entropy.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${entropy.color.split(' ')[1]}`}
                        style={{ width: `${entropy.score}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Crear Cuenta en la Nube</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: LOCAL MODE */}
            {activeTab === 'local' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p>
                    El Modo Local guarda sus datos exclusivamente en este navegador (sin sincronización entre dispositivos).
                  </p>
                </div>

                {profiles.length > 0 ? (
                  <form onSubmit={handleLocalUnlockSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Seleccionar Bóveda Local
                      </label>
                      <select
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-sm text-white"
                      >
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Creado {new Date(p.createdAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Contraseña Maestra Local
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder="Contraseña de la bóveda local..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-sm text-white font-mono"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm border border-slate-700 flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Desbloquear Bóveda Local'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLocalCreateSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nombre de Usuario Local
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ej. Bóveda Personal"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Contraseña Maestra
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white font-mono"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm border border-slate-700 flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Crear Bóveda Local'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Biometric option if enabled */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={onUnlockWithBiometric}
            className="text-xs text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
          >
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span>Usar Desbloqueo Biométrico (Huella/Rostro)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
