/**
 * Client-Side End-to-End Encryption Engine using Web Crypto API
 * Zero-Knowledge Architecture: Master Password is never stored or transmitted.
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256; // AES-256
export const VERIFIER_SECRET = 'VAULT_MASTER_KEY_VALID_2026';

// Helper: Convert ArrayBuffer to Base64 String
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 String to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate random hex string for salt or IV
export function generateRandomHex(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate random Uint8Array IV (12 bytes for AES-GCM)
export function generateIV(): Uint8Array {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  return iv;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a Master Password and Salt using PBKDF2
 */
export async function deriveKeyFromMasterPassword(
  masterPassword: string,
  saltHex: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);
  const saltBytes = encoder.encode(saltHex);

  // Import raw master password as key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive AES-GCM 256-bit key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false, // key is non-extractable from memory
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypts a string payload with AES-256-GCM
 */
export async function encryptData(
  plainText: string,
  cryptoKey: CryptoKey
): Promise<{ iv: string; ciphertext: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const iv = generateIV();

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    data
  );

  return {
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(encryptedBuffer),
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext payload
 */
export async function decryptData(
  encryptedObj: { iv: string; ciphertext: string },
  cryptoKey: CryptoKey
): Promise<string> {
  const iv = base64ToBuffer(encryptedObj.iv);
  const ciphertext = base64ToBuffer(encryptedObj.ciphertext);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Create a Verifier payload to validate master password on future logins
 */
export async function createKeyVerifier(
  cryptoKey: CryptoKey
): Promise<{ iv: string; ciphertext: string }> {
  return encryptData(VERIFIER_SECRET, cryptoKey);
}

/**
 * Verify if derived key decrypts the verifier correctly
 */
export async function verifyKey(
  verifier: { iv: string; ciphertext: string },
  cryptoKey: CryptoKey
): Promise<boolean> {
  try {
    const decrypted = await decryptData(verifier, cryptoKey);
    return decrypted === VERIFIER_SECRET;
  } catch (err) {
    return false;
  }
}

/**
 * Check if WebAuthn Biometrics are supported on device
 */
export function isWebAuthnSupported(): boolean {
  return (
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * WebAuthn Register Passkey / Biometric Credential
 */
export async function registerWebAuthnBiometric(
  username: string
): Promise<PublicKeyCredential | null> {
  if (!isWebAuthnSupported()) return null;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new TextEncoder().encode(username + '_vault_user');

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Bóveda de Contraseñas',
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: username,
        displayName: `Usuario Bóveda (${username})`,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // FaceID, TouchID, Windows Hello, Android Biometrics
        userVerification: 'required',
      },
      timeout: 60000,
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    return credential;
  } catch (err) {
    console.warn('Error al registrar biometría WebAuthn:', err);
    return null;
  }
}

/**
 * WebAuthn Authenticate / Verify Biometric User
 */
export async function authenticateWebAuthnBiometric(
  credentialIdBase64?: string
): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = credentialIdBase64
      ? [
          {
            id: base64ToBuffer(credentialIdBase64),
            type: 'public-key',
          },
        ]
      : [];

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials,
      userVerification: 'required',
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    return !!assertion;
  } catch (err) {
    console.warn('Error al autenticar con biometría WebAuthn:', err);
    return false;
  }
}
