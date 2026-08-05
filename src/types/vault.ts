export interface VaultProfile {
  id: string;
  name: string;
  createdAt: string;
}

export type ItemType = 'password' | 'note' | 'card' | 'identity' | 'bank';

export type Category = 
  | 'General'
  | 'Social'
  | 'Trabajo'
  | 'Finanzas'
  | 'Streaming'
  | 'Email'
  | 'Compras'
  | 'Personal'
  | 'Servidores';

export interface PasswordData {
  username?: string;
  password?: string;
  url?: string;
  totpSecret?: string;
}

export interface NoteData {
  content: string;
  colorBadge?: string;
}

export interface CardData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string; // MM/YY
  cvv: string;
  pin?: string;
  bankName?: string;
  cardType?: 'visa' | 'mastercard' | 'amex' | 'other';
}

export interface IdentityData {
  fullName: string;
  idNumber: string; // DNI / Passport / SSN
  idType: string;
  issueDate?: string;
  expiryDate?: string;
  address?: string;
  phone?: string;
}

export interface BankData {
  bankName: string;
  accountNumber: string;
  accountType?: 'Ahorros' | 'Corriente' | 'Nómina';
  iban?: string;
  swift?: string;
  branchName?: string;
}

export interface VaultItem {
  id: string;
  type: ItemType;
  title: string;
  category: Category;
  tags: string[];
  favorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  
  // Specific item data (encrypted together with main item payload)
  passwordData?: PasswordData;
  noteData?: NoteData;
  cardData?: CardData;
  identityData?: IdentityData;
  bankData?: BankData;
}

export interface VaultSettings {
  autoLockMinutes: number; // 1, 5, 15, 30, 0 (Never)
  biometricEnabled: boolean;
  pinUnlockEnabled: boolean;
  clipboardClearSeconds: number; // 10, 30, 60
  theme: 'dark' | 'light' | 'system';
  hidePasswordsByDefault: boolean;
  showPasswordStrengthInList: boolean;
}

export interface EncryptedVaultPayload {
  version: number; // 1
  salt: string; // Hex or base64 PBKDF2 salt
  verifier: {
    iv: string; // Base64 12-byte IV
    ciphertext: string; // Encrypted string "VAULT_VALID_KEY_2026"
  };
  itemsEncrypted: {
    iv: string;
    ciphertext: string;
  };
  settingsEncrypted: {
    iv: string;
    ciphertext: string;
  };
  biometricData?: {
    credentialId?: string;
    encryptedPinKey?: {
      iv: string;
      ciphertext: string;
    };
  };
}

export interface PasswordAuditResult {
  score: number; // 0 to 100
  totalItems: number;
  weakCount: number;
  reusedCount: number;
  oldCount: number; // > 180 days
  strongCount: number;
  issues: {
    itemId: string;
    itemTitle: string;
    type: 'weak' | 'reused' | 'old';
    message: string;
  }[];
}
