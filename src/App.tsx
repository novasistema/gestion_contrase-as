import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Category,
  ItemType,
  VaultItem,
  VaultSettings,
  VaultProfile,
  EncryptedVaultPayload,
} from './types/vault';
import {
  getVaultProfiles,
  initializeNewVault,
  unlockVaultWithMasterPassword,
  saveVaultContents,
  DEFAULT_SETTINGS,
  deleteVaultProfile,
  clearAllVaultsData,
  saveEncryptedPayload,
} from './utils/storage';
import {
  auth,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  subscribeToAuth,
  saveCloudVault,
  fetchCloudVault,
  subscribeToCloudVault,
  CloudVaultRecord,
} from './lib/firebase';
import {
  deriveKeyFromMasterPassword,
  verifyKey,
  decryptData,
  encryptData,
} from './utils/crypto';
import { LockScreen } from './components/LockScreen';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ItemCard } from './components/ItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { PasswordGeneratorView } from './components/PasswordGeneratorModal';
import { SecurityAuditView } from './components/SecurityAuditView';
import { SettingsModal } from './components/SettingsModal';
import { BiometricModal } from './components/BiometricModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  FolderOpen,
  Plus,
} from 'lucide-react';

export default function App() {
  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [cloudRecord, setCloudRecord] = useState<CloudVaultRecord | null>(null);

  // Vault Auth & Crypto State
  const [isLocked, setIsLocked] = useState(true);
  const [profiles, setProfiles] = useState<VaultProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<VaultProfile | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [masterPasswordText, setMasterPasswordText] = useState<string>('');

  // Data & Settings
  const [items, setItems] = useState<VaultItem[]>([]);
  const [settings, setSettings] = useState<VaultSettings>(DEFAULT_SETTINGS);

  // Filters & Views
  const [selectedType, setSelectedType] = useState<
    ItemType | 'all' | 'favorites' | 'audit' | 'generator'
  >('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load local profiles on mount and subscribe to Firebase Auth
  useEffect(() => {
    const loadedProfiles = getVaultProfiles();
    setProfiles(loadedProfiles);

    const unsubscribe = subscribeToAuth((user) => {
      setFirebaseUser(user);
      if (user) {
        fetchCloudVault(user.uid).then((record) => {
          if (record) {
            setCloudRecord(record);
          }
        });
      } else {
        setCloudRecord(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfiles = useCallback(() => {
    const loaded = getVaultProfiles();
    setProfiles(loaded);
  }, []);

  const addToast = useCallback(
    (
      title: string,
      message?: string,
      type: 'success' | 'error' | 'info' | 'copy' = 'info',
      countdown?: number
    ) => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random()}`,
        type,
        title,
        message,
        countdown,
      };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Inactivity Auto-Lock Timer
  useEffect(() => {
    if (isLocked || !settings.autoLockMinutes || settings.autoLockMinutes === 0)
      return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLockVault();
        addToast(
          'Bóveda Bloqueada por Inactividad',
          'Se ha bloqueado la sesión por seguridad.',
          'info'
        );
      }, settings.autoLockMinutes * 60 * 1000);
    };

    resetTimer();

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [isLocked, settings.autoLockMinutes, addToast]);

  // Subscribe to real-time Firestore changes when logged in & unlocked
  useEffect(() => {
    if (!firebaseUser || isLocked || !cryptoKey) return;

    const unsubscribe = subscribeToCloudVault(firebaseUser.uid, async (record) => {
      if (!record) return;
      setCloudRecord(record);

      try {
        const itemsJson = await decryptData(record.itemsEncrypted, cryptoKey);
        const settingsJson = await decryptData(record.settingsEncrypted, cryptoKey);
        const cloudItems = JSON.parse(itemsJson) as VaultItem[];
        const cloudSettings = JSON.parse(settingsJson) as VaultSettings;

        setItems(cloudItems);
        setSettings(cloudSettings);
      } catch (err) {
        console.warn('Realtime cloud decrypt sync warning:', err);
      }
    });

    return () => unsubscribe();
  }, [firebaseUser, isLocked, cryptoKey]);

  // Handle Cloud Registration
  const handleEmailRegister = async (
    email: string,
    accountPass: string,
    displayName: string,
    masterPass: string
  ) => {
    // 1. Create Firebase Auth user
    const user = await registerWithEmail(email, accountPass, displayName);

    // 2. Initialize new vault payload
    const { cryptoKey, profile } = await initializeNewVault(
      displayName || user.email || 'Mi Bóveda',
      masterPass
    );

    // 3. Get encrypted payload from local storage
    const unlockRes = await unlockVaultWithMasterPassword(profile.id, masterPass);
    if (unlockRes.success && unlockRes.cryptoKey) {
      setCryptoKey(unlockRes.cryptoKey);
      setMasterPasswordText(masterPass);
      setActiveProfile(profile);
      setItems(unlockRes.items || []);
      setSettings(unlockRes.settings || DEFAULT_SETTINGS);

      // 4. Push payload to Firestore
      const localPayloadRaw = localStorage.getItem(`vaultlock_payload_${profile.id}`);
      if (localPayloadRaw) {
        const payload = JSON.parse(localPayloadRaw) as EncryptedVaultPayload;
        await saveCloudVault(user.uid, user.email || email, displayName, payload);
      }

      setIsLocked(false);
      refreshProfiles();
      addToast(
        `¡Cuenta de Nube Creada!`,
        `Bóveda de ${user.email} respaldada y sincronizada en la nube.`,
        'success'
      );
    }
  };

  // Handle Cloud Login
  const handleEmailLogin = async (
    email: string,
    accountPass: string
  ): Promise<boolean> => {
    const user = await loginWithEmail(email, accountPass);
    if (!user) return false;

    // Fetch cloud vault document
    const record = await fetchCloudVault(user.uid);
    if (record) {
      setCloudRecord(record);

      // Try unlocking automatically if accountPass matches masterPass
      try {
        const derivedKey = await deriveKeyFromMasterPassword(accountPass, record.salt);
        const isValid = await verifyKey(record.verifier, derivedKey);

        if (isValid) {
          const itemsJson = await decryptData(record.itemsEncrypted, derivedKey);
          const settingsJson = await decryptData(record.settingsEncrypted, derivedKey);

          const decryptedItems = JSON.parse(itemsJson) as VaultItem[];
          const decryptedSettings = JSON.parse(settingsJson) as VaultSettings;

          setCryptoKey(derivedKey);
          setMasterPasswordText(accountPass);
          setActiveProfile({
            id: user.uid,
            name: record.accountName || user.displayName || user.email || 'Bóveda Nube',
            createdAt: record.updatedAt || new Date().toISOString(),
          });
          setItems(decryptedItems);
          setSettings(decryptedSettings);
          setIsLocked(false);

          addToast(
            `Bienvenido, ${user.displayName || user.email}`,
            'Sincronizado y descifrado correctamente.',
            'success'
          );
          return true;
        }
      } catch (err) {
        console.log('Account pass differs from Master Pass, prompt for Master Pass');
      }
    }

    addToast('Sesión Iniciada', 'Ingrese su Contraseña Maestra de cifrado para descifrar.', 'info');
    return true;
  };

  // Unlock Cloud Vault with Master Password (when authenticated with Firebase Auth)
  const handleUnlockCloudVault = async (masterPass: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    let record = cloudRecord;

    if (!record) {
      record = await fetchCloudVault(firebaseUser.uid);
      if (record) setCloudRecord(record);
    }

    if (!record) {
      // If user has no record in cloud yet, initialize one
      const { cryptoKey, profile } = await initializeNewVault(
        firebaseUser.displayName || firebaseUser.email || 'Bóveda Nube',
        masterPass
      );
      const unlockRes = await unlockVaultWithMasterPassword(profile.id, masterPass);
      if (unlockRes.success && unlockRes.cryptoKey) {
        setCryptoKey(unlockRes.cryptoKey);
        setMasterPasswordText(masterPass);
        setActiveProfile(profile);
        setItems(unlockRes.items || []);
        setSettings(unlockRes.settings || DEFAULT_SETTINGS);

        const localPayloadRaw = localStorage.getItem(`vaultlock_payload_${profile.id}`);
        if (localPayloadRaw) {
          const payload = JSON.parse(localPayloadRaw) as EncryptedVaultPayload;
          await saveCloudVault(
            firebaseUser.uid,
            firebaseUser.email || '',
            firebaseUser.displayName || 'Bóveda',
            payload
          );
        }

        setIsLocked(false);
        addToast('Bóveda Nube Creada', 'Datos respaldados.', 'success');
        return true;
      }
      return false;
    }

    try {
      const derivedKey = await deriveKeyFromMasterPassword(masterPass, record.salt);
      const isValid = await verifyKey(record.verifier, derivedKey);

      if (!isValid) return false;

      const itemsJson = await decryptData(record.itemsEncrypted, derivedKey);
      const settingsJson = await decryptData(record.settingsEncrypted, derivedKey);

      const decryptedItems = JSON.parse(itemsJson) as VaultItem[];
      const decryptedSettings = JSON.parse(settingsJson) as VaultSettings;

      setCryptoKey(derivedKey);
      setMasterPasswordText(masterPass);
      setActiveProfile({
        id: firebaseUser.uid,
        name: record.accountName || firebaseUser.displayName || firebaseUser.email || 'Bóveda Nube',
        createdAt: record.updatedAt || new Date().toISOString(),
      });
      setItems(decryptedItems);
      setSettings(decryptedSettings);
      setIsLocked(false);

      addToast('Bóveda Descifrada', 'Sincronización multidispositivo activa.', 'success');
      return true;
    } catch (err) {
      console.error('Error unlocking cloud vault:', err);
      return false;
    }
  };

  // Handle Local Vault Initialize (Offline mode)
  const handleInitializeLocalVault = async (accountName: string, masterPass: string) => {
    const { cryptoKey, profile } = await initializeNewVault(accountName, masterPass);
    const unlockRes = await unlockVaultWithMasterPassword(profile.id, masterPass);

    if (unlockRes.success && unlockRes.cryptoKey) {
      setCryptoKey(unlockRes.cryptoKey);
      setMasterPasswordText(masterPass);
      setActiveProfile(profile);
      setItems(unlockRes.items || []);
      setSettings(unlockRes.settings || DEFAULT_SETTINGS);
      setIsLocked(false);
      refreshProfiles();
      addToast(
        `¡Bóveda Local Creada!`,
        'Guardada en este dispositivo.',
        'success'
      );
    }
  };

  // Handle Local Vault Unlock
  const handleUnlockLocalVault = async (
    profileId: string,
    masterPass: string
  ): Promise<boolean> => {
    const res = await unlockVaultWithMasterPassword(profileId, masterPass);
    if (res.success && res.cryptoKey && res.profile) {
      setCryptoKey(res.cryptoKey);
      setMasterPasswordText(masterPass);
      setActiveProfile(res.profile);
      setItems(res.items || []);
      setSettings(res.settings || DEFAULT_SETTINGS);
      setIsLocked(false);
      addToast(
        `Bienvenido, ${res.profile.name}`,
        'Bóveda local descifrada.',
        'success'
      );
      return true;
    }
    return false;
  };

  // Lock Vault
  const handleLockVault = () => {
    setCryptoKey(null);
    setMasterPasswordText('');
    setActiveProfile(null);
    setIsLocked(true);
    setIsDetailOpen(false);
    setIsFormOpen(false);
    setIsSettingsOpen(false);
    refreshProfiles();
  };

  // Logout from Firebase Cloud
  const handleLogoutCloud = async () => {
    await logoutUser();
    setFirebaseUser(null);
    setCloudRecord(null);
    handleLockVault();
    addToast('Sesión de Nube Cerrada', '', 'info');
  };

  // Save vault changes (Persists to both Local Cache + Firestore if logged in)
  const persistVaultChanges = async (
    updatedItems: VaultItem[],
    updatedSettings: VaultSettings
  ) => {
    if (!cryptoKey || !activeProfile) return;

    setItems(updatedItems);
    setSettings(updatedSettings);

    // Save local cache
    await saveVaultContents(
      activeProfile.id,
      cryptoKey,
      updatedItems,
      updatedSettings
    );

    // If logged in via Firebase Auth, sync encrypted payload to Firestore
    if (firebaseUser) {
      const itemsEncrypted = await encryptData(JSON.stringify(updatedItems), cryptoKey);
      const settingsEncrypted = await encryptData(JSON.stringify(updatedSettings), cryptoKey);

      const salt = cloudRecord?.salt || localStorage.getItem(`vaultlock_salt_${activeProfile.id}`) || '';
      const verifierRaw = localStorage.getItem(`vaultlock_payload_${activeProfile.id}`);
      let verifier = cloudRecord?.verifier;

      if (verifierRaw) {
        try {
          verifier = (JSON.parse(verifierRaw) as EncryptedVaultPayload).verifier;
        } catch (e) {}
      }

      if (salt && verifier) {
        const payload: EncryptedVaultPayload = {
          version: 1,
          salt,
          verifier,
          itemsEncrypted,
          settingsEncrypted,
        };

        await saveCloudVault(
          firebaseUser.uid,
          firebaseUser.email || '',
          activeProfile.name,
          payload
        );
      }
    }
  };

  // Add / Edit Item
  const handleSaveItem = async (itemData: Partial<VaultItem>) => {
    let updated: VaultItem[];
    const now = new Date().toISOString();

    if (itemData.id) {
      updated = items.map((i) =>
        i.id === itemData.id
          ? ({
              ...i,
              ...itemData,
              updatedAt: now,
            } as VaultItem)
          : i
      );
      addToast('Elemento Actualizado', 'Cifrado y re-sincronizado.', 'success');
    } else {
      const newItem: VaultItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: itemData.type || 'password',
        title: itemData.title || 'Sin Título',
        category: itemData.category || 'General',
        tags: itemData.tags || [],
        favorite: false,
        createdAt: now,
        updatedAt: now,
        notes: itemData.notes,
        passwordData: itemData.passwordData,
        noteData: itemData.noteData,
        cardData: itemData.cardData,
        identityData: itemData.identityData,
        bankData: itemData.bankData,
      };
      updated = [newItem, ...items];
      addToast('Nuevo Elemento Guardado', 'Sincronizado en su bóveda cifrada.', 'success');
    }

    await persistVaultChanges(updated, settings);
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    await persistVaultChanges(updated, settings);
    addToast('Elemento Eliminado', '', 'info');
  };

  // Toggle Favorite
  const handleToggleFavorite = async (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = items.map((i) =>
      i.id === itemId ? { ...i, favorite: !i.favorite } : i
    );
    await persistVaultChanges(updated, settings);
  };

  // Copy to Clipboard with auto-clear countdown
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    const seconds = settings.clipboardClearSeconds || 30;

    addToast(
      `¡${label} Copiado!`,
      `Se borrará del portapapeles en ${seconds}s por seguridad.`,
      'copy',
      seconds
    );

    setTimeout(() => {
      navigator.clipboard.readText().then((clipText) => {
        if (clipText === text) {
          navigator.clipboard.writeText('');
        }
      });
    }, seconds * 1000);
  };

  // Change Master Password for active profile
  const handleChangeMasterPassword = async (
    currentPass: string,
    newPass: string
  ): Promise<boolean> => {
    if (!activeProfile || !cryptoKey) return false;

    // Verify current password
    const verifyRes = await unlockVaultWithMasterPassword(activeProfile.id, currentPass);
    if (!verifyRes.success) return false;

    // Re-encrypt whole vault with new master key
    setMasterPasswordText(newPass);
    await persistVaultChanges(items, settings);
    return true;
  };

  // Delete specific profile
  const handleDeleteProfile = (profileId: string) => {
    deleteVaultProfile(profileId);
    refreshProfiles();
    addToast('Cuenta Eliminada', 'Se borraron los datos de esa cuenta local.', 'info');
  };

  // Reset All Vaults
  const handleResetAllVaults = () => {
    clearAllVaultsData();
    setIsLocked(true);
    setCryptoKey(null);
    setActiveProfile(null);
    setItems([]);
    refreshProfiles();
    addToast('Aplicación Restablecida', 'Se han borrado las cuentas locales.', 'info');
  };

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedType === 'favorites') {
        if (!item.favorite) return false;
      } else if (
        selectedType !== 'all' &&
        selectedType !== 'audit' &&
        selectedType !== 'generator'
      ) {
        if (item.type !== selectedType) return false;
      }

      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesUser = item.passwordData?.username
          ?.toLowerCase()
          .includes(q);
        const matchesUrl = item.passwordData?.url?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesNoteContent = item.noteData?.content
          ?.toLowerCase()
          .includes(q);

        return (
          matchesTitle ||
          matchesCategory ||
          matchesUser ||
          matchesUrl ||
          matchesNotes ||
          matchesNoteContent
        );
      }

      return true;
    });
  }, [items, selectedType, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return counts;
  }, [items]);

  const favoriteCount = useMemo(
    () => items.filter((i) => i.favorite).length,
    [items]
  );

  // Render LockScreen if app is locked
  if (isLocked) {
    return (
      <>
        <LockScreen
          profiles={profiles}
          cloudUserEmail={firebaseUser?.email}
          onEmailRegister={handleEmailRegister}
          onEmailLogin={handleEmailLogin}
          onUnlockCloudVault={handleUnlockCloudVault}
          onInitializeLocalVault={handleInitializeLocalVault}
          onUnlockLocalVault={handleUnlockLocalVault}
          onUnlockWithBiometric={() => setIsBiometricOpen(true)}
          onResetAllVaults={handleResetAllVaults}
          onDeleteProfile={handleDeleteProfile}
          onLogoutCloud={handleLogoutCloud}
        />

        <BiometricModal
          isOpen={isBiometricOpen}
          onClose={() => setIsBiometricOpen(false)}
          onSuccess={async () => {
            if (profiles.length > 0 && masterPasswordText) {
              await handleUnlockLocalVault(profiles[0].id, masterPasswordText);
            } else {
              setIsLocked(false);
              addToast(
                'Desbloqueo Biométrico Exitoso',
                'Acceso concedido.',
                'success'
              );
            }
          }}
        />

        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top sticky header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewItemModal={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onLockVault={handleLockVault}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        autoLockMinutes={settings.autoLockMinutes}
        totalItems={items.length}
        activeProfileName={activeProfile?.name || firebaseUser?.email || 'Bóveda'}
        isCloudSynced={!!firebaseUser}
      />

      {/* Main body with Responsive Sidebar and Content Grid */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          typeCounts={typeCounts}
          favoriteCount={favoriteCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content View */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
          {selectedType === 'audit' ? (
            <SecurityAuditView
              items={items}
              onFixItem={(item) => {
                setEditingItem(item);
                setIsFormOpen(true);
              }}
            />
          ) : selectedType === 'generator' ? (
            <div className="py-4">
              <PasswordGeneratorView isStandaloneView />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category title & count header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                    <span>
                      {selectedType === 'all'
                        ? 'Todos los Elementos'
                        : selectedType === 'favorites'
                        ? 'Favoritos'
                        : selectedType === 'password'
                        ? 'Contraseñas'
                        : selectedType === 'note'
                        ? 'Notas Secretas'
                        : selectedType === 'card'
                        ? 'Tarjetas'
                        : selectedType === 'identity'
                        ? 'Documentos e ID'
                        : 'Cuentas Bancarias'}
                    </span>
                    {selectedCategory !== 'all' && (
                      <span className="text-xs font-normal px-2.5 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-full">
                        {selectedCategory}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bóveda de <strong className="text-cyan-300">{activeProfile?.name || firebaseUser?.email}</strong> • Mostrando {filteredItems.length} de {items.length} elementos
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsFormOpen(true);
                  }}
                  className="hidden md:flex py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl text-xs items-center gap-1.5 border border-slate-700/60 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Items Grid */}
              {filteredItems.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-12 text-center my-8 max-w-md mx-auto space-y-3">
                  <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No se encontraron elementos</h3>
                  <p className="text-xs text-slate-400">
                    {searchQuery
                      ? 'No hay registros que coincidan con el término de búsqueda.'
                      : 'Esta categoría está vacía. Agregue su primera contraseña o nota.'}
                  </p>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setIsFormOpen(true);
                    }}
                    className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-2 mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Nuevo Registro</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onSelect={(item) => {
                        setSelectedItem(item);
                        setIsDetailOpen(true);
                      }}
                      onToggleFavorite={handleToggleFavorite}
                      onCopyPassword={(pass, title, e) => {
                        e.stopPropagation();
                        handleCopyText(pass, `Clave de ${title}`);
                      }}
                      onCopyUsername={(user, title, e) => {
                        e.stopPropagation();
                        handleCopyText(user, `Usuario de ${title}`);
                      }}
                      showPasswordStrength={settings.showPasswordStrengthInList}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        className="md:hidden fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center border border-cyan-400/30 cursor-pointer"
        aria-label="Agregar elemento"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedItem(null);
        }}
        onEdit={(item) => {
          setEditingItem(item);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteItem}
        onToggleFavorite={handleToggleFavorite}
        onCopyText={handleCopyText}
      />

      <ItemFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSaveItem={handleSaveItem}
        editingItem={editingItem}
        defaultType={
          selectedType !== 'all' &&
          selectedType !== 'favorites' &&
          selectedType !== 'audit' &&
          selectedType !== 'generator'
            ? selectedType
            : 'password'
        }
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          persistVaultChanges(items, newSettings)
        }
        masterPasswordKey={cryptoKey}
        items={items}
        onImportItems={async (imported) => {
          const merged = [...imported, ...items];
          await persistVaultChanges(merged, settings);
        }}
        onChangeMasterPassword={handleChangeMasterPassword}
        onResetVault={handleResetAllVaults}
        onShowToast={addToast}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
