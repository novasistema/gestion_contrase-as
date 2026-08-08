import { PasswordAuditResult, VaultItem } from '../types/vault';

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean; // 1, l, I, 0, O
  type: 'random' | 'passphrase';
  wordCount?: number; // For passphrase
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = /[1lI0O]/g;

const WORD_BANK = [
  'aurora', 'bisonte', 'cascada', 'diamante', 'esmeralda', 'fortaleza',
  'galaxia', 'horizonte', 'impulso', 'jardín', 'kilo', 'laberinto',
  'montaña', 'nebula', 'órbita', 'pirámide', 'quásar', 'refugio',
  'sinfonía', 'tormenta', 'universo', 'volcán', 'whisky', 'xenón',
  'yacimiento', 'zafiro', 'atlántico', 'bosque', 'cometa', 'dragón',
  'eclipse', 'fuego', 'glaciar', 'halcón', 'isla', 'jaguar', 'karate',
  'leyenda', 'magma', 'náutico', 'oasis', 'prisma', 'quimera', 'rayo',
  'solsticio', 'tinta', 'ultramar', 'vórtice', 'wind', 'zenit'
];

/**
 * Generate secure random password or passphrase based on options
 */
export function generatePassword(options: GeneratorOptions): string {
  if (options.type === 'passphrase') {
    const count = options.wordCount || 4;
    const selectedWords: string[] = [];
    const array = new Uint32Array(count);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < count; i++) {
      const wordIndex = array[i] % WORD_BANK.length;
      let word = WORD_BANK[wordIndex];
      if (options.uppercase && i % 2 === 0) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      selectedWords.push(word);
    }

    let result = selectedWords.join('-');
    if (options.numbers) {
      const numArr = new Uint32Array(1);
      window.crypto.getRandomValues(numArr);
      result += `-${(numArr[0] % 90) + 10}`;
    }
    if (options.symbols) {
      const symArr = new Uint32Array(1);
      window.crypto.getRandomValues(symArr);
      result += SYMBOLS[symArr[0] % SYMBOLS.length];
    }
    return result;
  }

  // Random character password
  let charSet = '';
  if (options.uppercase) charSet += UPPER;
  if (options.lowercase) charSet += LOWER;
  if (options.numbers) charSet += NUMS;
  if (options.symbols) charSet += SYMBOLS;

  if (options.avoidAmbiguous) {
    charSet = charSet.replace(AMBIGUOUS, '');
  }

  if (!charSet) charSet = LOWER + NUMS; // fallback

  const length = Math.max(6, Math.min(64, options.length));
  let result = '';

  // Ensure at least 1 character from each enabled set
  const requiredChars: string[] = [];
  if (options.uppercase) {
    let pool = options.avoidAmbiguous ? UPPER.replace(AMBIGUOUS, '') : UPPER;
    requiredChars.push(getRandomChar(pool));
  }
  if (options.lowercase) {
    let pool = options.avoidAmbiguous ? LOWER.replace(AMBIGUOUS, '') : LOWER;
    requiredChars.push(getRandomChar(pool));
  }
  if (options.numbers) {
    let pool = options.avoidAmbiguous ? NUMS.replace(AMBIGUOUS, '') : NUMS;
    requiredChars.push(getRandomChar(pool));
  }
  if (options.symbols) {
    requiredChars.push(getRandomChar(SYMBOLS));
  }

  // Fill remaining length
  const remainingLength = Math.max(0, length - requiredChars.length);
  const randomIndices = new Uint32Array(remainingLength);
  window.crypto.getRandomValues(randomIndices);

  for (let i = 0; i < remainingLength; i++) {
    result += charSet[randomIndices[i] % charSet.length];
  }

  // Insert required characters at random positions
  const finalChars = (result + requiredChars.join('')).split('');
  for (let i = finalChars.length - 1; i > 0; i--) {
    const randArr = new Uint32Array(1);
    window.crypto.getRandomValues(randArr);
    const j = randArr[0] % (i + 1);
    [finalChars[i], finalChars[j]] = [finalChars[j], finalChars[i]];
  }

  return finalChars.join('');
}

function getRandomChar(pool: string): string {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return pool[arr[0] % pool.length];
}

/**
 * Calculate entropy bits & strength category
 */
export function calculatePasswordEntropy(password: string): {
  entropy: number;
  score: number; // 0 to 100
  label: string;
  color: string; // Tailwind color
} {
  if (!password) {
    return { entropy: 0, score: 0, label: 'Vacía', color: 'text-gray-400 bg-gray-500' };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) poolSize = 10;

  const entropy = Math.round(password.length * Math.log2(poolSize));

  if (entropy < 28) {
    return { entropy, score: 20, label: 'Muy Débil', color: 'text-red-500 bg-red-500' };
  } else if (entropy < 45) {
    return { entropy, score: 40, label: 'Débil', color: 'text-orange-500 bg-orange-500' };
  } else if (entropy < 60) {
    return { entropy, score: 65, label: 'Aceptable', color: 'text-yellow-500 bg-yellow-500' };
  } else if (entropy < 80) {
    return { entropy, score: 85, label: 'Fuerte', color: 'text-emerald-500 bg-emerald-500' };
  } else {
    return { entropy, score: 100, label: 'Inviolable', color: 'text-cyan-400 bg-cyan-400' };
  }
}

/**
 * Perform Vault Security Audit
 */
export function auditVaultPasswords(items: VaultItem[]): PasswordAuditResult {
  const passwordItems = items.filter(
    (i) => i.type === 'password' && i.passwordData?.password
  );

  let weakCount = 0;
  let reusedCount = 0;
  let oldCount = 0;
  let strongCount = 0;

  const passwordCounts: Record<string, string[]> = {}; // password -> list of itemTitles
  const issues: PasswordAuditResult['issues'] = [];

  const now = new Date();
  const halfYearAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  passwordItems.forEach((item) => {
    const pass = item.passwordData!.password!;
    const { entropy } = calculatePasswordEntropy(pass);

    // Track reuse
    if (!passwordCounts[pass]) {
      passwordCounts[pass] = [];
    }
    passwordCounts[pass].push(item.title);

    // Weak check
    if (entropy < 45 || pass.length < 9) {
      weakCount++;
      issues.push({
        itemId: item.id,
        itemTitle: item.title,
        type: 'weak',
        message: 'Contraseña corta o de baja complejidad',
      });
    } else {
      strongCount++;
    }

    // Old check
    const updatedAt = new Date(item.updatedAt);
    if (updatedAt < halfYearAgo) {
      oldCount++;
      issues.push({
        itemId: item.id,
        itemTitle: item.title,
        type: 'old',
        message: 'No se ha actualizado en más de 6 meses',
      });
    }
  });

  // Reused check
  Object.entries(passwordCounts).forEach(([pass, itemTitles]) => {
    if (itemTitles.length > 1) {
      reusedCount += itemTitles.length;
      passwordItems
        .filter((item) => item.passwordData?.password === pass)
        .forEach((item) => {
          issues.push({
            itemId: item.id,
            itemTitle: item.title,
            type: 'reused',
            message: `Contraseña repetida en ${itemTitles.length} cuentas`,
          });
        });
    }
  });

  const total = passwordItems.length;
  let score = 100;

  if (total > 0) {
    const weakPenalty = (weakCount / total) * 40;
    const reusedPenalty = (reusedCount / total) * 35;
    const oldPenalty = (oldCount / total) * 15;
    score = Math.max(0, Math.round(100 - weakPenalty - reusedPenalty - oldPenalty));
  }

  return {
    score,
    totalItems: total,
    weakCount,
    reusedCount,
    oldCount,
    strongCount,
    issues,
  };
}
