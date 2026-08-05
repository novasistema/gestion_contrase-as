import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { EncryptedVaultPayload, VaultSettings } from '../types/vault';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export interface CloudVaultRecord {
  uid: string;
  email: string;
  accountName: string;
  updatedAt: string;
  salt: string;
  verifier: { iv: string; ciphertext: string };
  itemsEncrypted: { iv: string; ciphertext: string };
  settingsEncrypted: { iv: string; ciphertext: string };
}

/**
 * Register new user with Firebase Auth
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential.user;
}

/**
 * Login existing user with Firebase Auth
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen for Firebase Auth state changes
 */
export function subscribeToAuth(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save encrypted vault payload to Firestore for current user
 */
export async function saveCloudVault(
  uid: string,
  email: string,
  accountName: string,
  payload: EncryptedVaultPayload
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const data: CloudVaultRecord = {
    uid,
    email,
    accountName,
    updatedAt: new Date().toISOString(),
    salt: payload.salt,
    verifier: payload.verifier,
    itemsEncrypted: payload.itemsEncrypted,
    settingsEncrypted: payload.settingsEncrypted,
  };
  await setDoc(userRef, data, { merge: true });
}

/**
 * Fetch encrypted vault payload from Firestore
 */
export async function fetchCloudVault(
  uid: string
): Promise<CloudVaultRecord | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as CloudVaultRecord;
  }
  return null;
}

/**
 * Listen real-time for cloud vault changes
 */
export function subscribeToCloudVault(
  uid: string,
  onChange: (record: CloudVaultRecord | null) => void
) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      onChange(snap.data() as CloudVaultRecord);
    } else {
      onChange(null);
    }
  });
}
