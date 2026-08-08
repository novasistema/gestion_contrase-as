import {
  EncryptedVaultPayload,
  VaultItem,
  VaultSettings,
  VaultProfile,
} from '../types/vault';
import {
  createKeyVerifier,
  decryptData,
  deriveKeyFromMasterPassword,
  encryptData,
  generateRandomHex,
  verifyKey,
} from './crypto';

const LEGACY_VAULT_STORAGE_KEY = 'vaultlock_encrypted_payload_v1';
const VAULT_PROFILES_KEY = 'vaultlock_profiles_v1';
const QUICK_PIN_STORAGE_KEY = 'vaultlock_pin_data_v1';

export const DEFAULT_SETTINGS: VaultSettings = {
  autoLockMinutes: 5,
  biometricEnabled: false,
  pinUnlockEnabled: false,
  clipboardClearSeconds: 30,
  theme: 'dark',
  hidePasswordsByDefault: true,
  showPasswordStrengthInList: true,
};

/**
 * Get list of registered Vault accounts / profiles on this device
 */
export function getVaultProfiles(): VaultProfile[] {
  const raw = localStorage.getItem(VAULT_PROFILES_KEY);
  let profiles: VaultProfile[] = [];

  if (raw) {
    try {
      profiles = JSON.parse(raw) as VaultProfile[];
    } catch (err) {
      console.error('Error parsing profiles:', err);
    }
  }

  // Backwards compatibility migration check
  if (profiles.length === 0) {
    const legacyPayloadRaw = localStorage.getItem(LEGACY_VAULT_STORAGE_KEY);
    if (legacyPayloadRaw) {
      const defaultProfile: VaultProfile = {
        id: 'profile_default',
        name: 'Usuario Principal',
        createdAt: new Date().toISOString(),
      };
      // Migrate payload to profile key
      localStorage.setItem(
        `vaultlock_payload_profile_default`,
        legacyPayloadRaw
      );
      localStorage.removeItem(LEGACY_VAULT_STORAGE_KEY);
      profiles = [defaultProfile];
      saveVaultProfiles(profiles);
    }
  }

  return profiles;
}

export function saveVaultProfiles(profiles: VaultProfile[]): void {
  localStorage.setItem(VAULT_PROFILES_KEY, JSON.stringify(profiles));
}

/**
 * Get encrypted payload for a specific profile ID
 */
export function getStoredEncryptedPayload(
  profileId: string
): EncryptedVaultPayload | null {
  const raw = localStorage.getItem(`vaultlock_payload_${profileId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EncryptedVaultPayload;
  } catch (err) {
    console.error(`Error al leer vault storage para ${profileId}:`, err);
    return null;
  }
}

export function saveEncryptedPayload(
  profileId: string,
  payload: EncryptedVaultPayload
): void {
  localStorage.setItem(`vaultlock_payload_${profileId}`, JSON.stringify(payload));
}

export function deleteVaultProfile(profileId: string): void {
  localStorage.removeItem(`vaultlock_payload_${profileId}`);
  const profiles = getVaultProfiles().filter((p) => p.id !== profileId);
  saveVaultProfiles(profiles);
}

export function clearAllVaultsData(): void {
  const profiles = getVaultProfiles();
  profiles.forEach((p) => {
    localStorage.removeItem(`vaultlock_payload_${p.id}`);
  });
  localStorage.removeItem(VAULT_PROFILES_KEY);
  localStorage.removeItem(LEGACY_VAULT_STORAGE_KEY);
  localStorage.removeItem(QUICK_PIN_STORAGE_KEY);
}

/**
 * Initialize a brand new independent Vault profile with Master Password
 */
export async function initializeNewVault(
  accountName: string,
  masterPassword: string
): Promise<{ cryptoKey: CryptoKey; salt: string; profile: VaultProfile }> {
  const salt = generateRandomHex(16); // 32 hex chars
  const cryptoKey = await deriveKeyFromMasterPassword(masterPassword, salt);
  const verifier = await createKeyVerifier(cryptoKey);

  const cleanName = accountName.trim() || 'Nueva Bóveda';
  const profileId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const profile: VaultProfile = {
    id: profileId,
    name: cleanName,
    createdAt: new Date().toISOString(),
  };

  // Initial onboarding demo items for this user
  const initialItems: VaultItem[] = [
    {
      id: `demo-${Date.now()}-1`,
      type: 'password',
      title: 'Google / Gmail',
      category: 'Email',
      tags: ['correo', 'principal'],
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passwordData: {
        username: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        password: 'K8#mP!9$vL2xQz5',
        url: 'https://accounts.google.com',
      },
    },
    {
      id: `demo-${Date.now()}-2`,
      type: 'note',
      title: 'Notas Personales Confidenciales',
      category: 'Personal',
      tags: ['seguridad', 'privado'],
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      noteData: {
        content: `Bienvenido a tu bóveda personal e independiente, ${cleanName}.
Tus datos están cifrados con tu propia Contraseña Maestra y aislados de otros usuarios en este dispositivo.`,
        colorBadge: '#10B981',
      },
    },
  ];

  const itemsEncrypted = await encryptData(
    JSON.stringify(initialItems),
    cryptoKey
  );
  const settingsEncrypted = await encryptData(
    JSON.stringify(DEFAULT_SETTINGS),
    cryptoKey
  );

  const payload: EncryptedVaultPayload = {
    version: 1,
    salt,
    verifier,
    itemsEncrypted,
    settingsEncrypted,
  };

  saveEncryptedPayload(profileId, payload);

  const profiles = getVaultProfiles();
  profiles.push(profile);
  saveVaultProfiles(profiles);

  return { cryptoKey, salt, profile };
}

/**
 * Unlock a specific Vault profile using its Master Password
 */
export async function unlockVaultWithMasterPassword(
  profileId: string,
  masterPassword: string
): Promise<{
  success: boolean;
  cryptoKey?: CryptoKey;
  items?: VaultItem[];
  settings?: VaultSettings;
  profile?: VaultProfile;
  error?: string;
}> {
  const payload = getStoredEncryptedPayload(profileId);
  const profiles = getVaultProfiles();
  const profile = profiles.find((p) => p.id === profileId);

  if (!payload || !profile) {
    return {
      success: false,
      error: 'No se encontró la cuenta especificada.',
    };
  }

  try {
    const cryptoKey = await deriveKeyFromMasterPassword(
      masterPassword,
      payload.salt
    );
    const isValid = await verifyKey(payload.verifier, cryptoKey);

    if (!isValid) {
      return {
        success: false,
        error: `Contraseña maestra incorrecta para "${profile.name}".`,
      };
    }

    // Decrypt items and settings
    const itemsJson = await decryptData(payload.itemsEncrypted, cryptoKey);
    const settingsJson = await decryptData(payload.settingsEncrypted, cryptoKey);

    const items = JSON.parse(itemsJson) as VaultItem[];
    const settings = JSON.parse(settingsJson) as VaultSettings;

    return {
      success: true,
      cryptoKey,
      items,
      settings,
      profile,
    };
  } catch (err) {
    console.error('Error desbloqueando bóveda:', err);
    return {
      success: false,
      error: 'Error de descifrado. Datos corruptos o clave inválida.',
    };
  }
}

/**
 * Save updated items and settings for a specific profile
 */
export async function saveVaultContents(
  profileId: string,
  cryptoKey: CryptoKey,
  items: VaultItem[],
  settings: VaultSettings,
  biometricCredentialId?: string
): Promise<void> {
  const payload = getStoredEncryptedPayload(profileId);
  if (!payload) return;

  const itemsEncrypted = await encryptData(JSON.stringify(items), cryptoKey);
  const settingsEncrypted = await encryptData(
    JSON.stringify(settings),
    cryptoKey
  );

  const updatedPayload: EncryptedVaultPayload = {
    ...payload,
    itemsEncrypted,
    settingsEncrypted,
    biometricData: biometricCredentialId
      ? { credentialId: biometricCredentialId }
      : payload.biometricData,
  };

  saveEncryptedPayload(profileId, updatedPayload);
}

/**
 * Quick PIN Setup & Verification
 */
export interface PinData {
  profileId: string;
  pinHashHex: string;
  salt: string;
  encryptedMasterPass: { iv: string; ciphertext: string };
}

export async function setupQuickPin(
  profileId: string,
  pin: string,
  masterPassword: string
): Promise<void> {
  const pinSalt = generateRandomHex(16);
  const pinKey = await deriveKeyFromMasterPassword(pin, pinSalt);

  const encryptedMasterPass = await encryptData(masterPassword, pinKey);
  const pinHashHex = await hashString(pin + pinSalt);

  const pinData: PinData = {
    profileId,
    pinHashHex,
    salt: pinSalt,
    encryptedMasterPass,
  };

  localStorage.setItem(`${QUICK_PIN_STORAGE_KEY}_${profileId}`, JSON.stringify(pinData));
}

export function getQuickPinData(profileId: string): PinData | null {
  const raw = localStorage.getItem(`${QUICK_PIN_STORAGE_KEY}_${profileId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PinData;
  } catch (err) {
    return null;
  }
}

export async function unlockMasterPasswordWithPin(
  profileId: string,
  pin: string
): Promise<string | null> {
  const pinData = getQuickPinData(profileId);
  if (!pinData) return null;

  try {
    const computedHash = await hashString(pin + pinData.salt);
    if (computedHash !== pinData.pinHashHex) return null;

    const pinKey = await deriveKeyFromMasterPassword(pin, pinData.salt);
    const masterPass = await decryptData(pinData.encryptedMasterPass, pinKey);
    return masterPass;
  } catch (err) {
    return null;
  }
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
