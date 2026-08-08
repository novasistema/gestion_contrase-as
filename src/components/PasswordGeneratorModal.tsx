import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Copy,
  RefreshCw,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  calculatePasswordEntropy,
  generatePassword,
  GeneratorOptions,
} from '../utils/passwordGenerator';

interface PasswordGeneratorModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCopyPassword?: (password: string) => void;
  isStandaloneView?: boolean;
}

export const PasswordGeneratorView: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onCopyPassword,
  isStandaloneView = false,
}) => {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 18,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    avoidAmbiguous: true,
    type: 'random',
    wordCount: 4,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const pass = generatePassword(options);
    setGeneratedPassword(pass);
    setCopied(false);
  };

  useEffect(() => {
    handleGenerate();
  }, [options]);

  const entropy = calculatePasswordEntropy(generatedPassword);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    if (onCopyPassword) {
      onCopyPassword(generatedPassword);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/30 rounded-2xl text-cyan-400">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Generador de Claves Seguras</h2>
            <p className="text-xs text-slate-400">
              Cree contraseñas de alta entropía resistentes a ataques de fuerza bruta.
            </p>
          </div>
        </div>
        {onClose && !isStandaloneView && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Generated Password Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-inner space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-base md:text-lg text-cyan-300 break-all select-all font-semibold tracking-wide">
            {generatedPassword}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleGenerate}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Regenerar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Entropy meter */}
        <div className="pt-2 border-t border-slate-900 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Entropía:</span>
            <span className={`font-semibold ${entropy.color.split(' ')[0]}`}>
              {entropy.label} ({entropy.entropy} bits)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${entropy.color.split(' ')[1]}`}
              style={{ width: `${entropy.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOptions({ ...options, type: 'random' })}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
            options.type === 'random'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Aleatoria Compleja
        </button>
        <button
          type="button"
          onClick={() => setOptions({ ...options, type: 'passphrase' })}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
            options.type === 'passphrase'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Frase Memorable (Passphrase)
        </button>
      </div>

      {/* Customization Options */}
      {options.type === 'random' ? (
        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>Longitud de Caracteres:</span>
              <span className="font-mono text-cyan-400 text-sm">{options.length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={options.uppercase}
                onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
                className="rounded accent-cyan-500 w-4 h-4"
              />
              <span className="text-slate-200">Mayúsculas (A-Z)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={options.lowercase}
                onChange={(e) => setOptions({ ...options, lowercase: e.target.checked })}
                className="rounded accent-cyan-500 w-4 h-4"
              />
              <span className="text-slate-200">Minúsculas (a-z)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={options.numbers}
                onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
                className="rounded accent-cyan-500 w-4 h-4"
              />
              <span className="text-slate-200">Números (0-9)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={options.symbols}
                onChange={(e) => setOptions({ ...options, symbols: e.target.checked })}
                className="rounded accent-cyan-500 w-4 h-4"
              />
              <span className="text-slate-200">Símbolos (!@#$%)</span>
            </label>
          </div>

          <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={options.avoidAmbiguous}
              onChange={(e) => setOptions({ ...options, avoidAmbiguous: e.target.checked })}
              className="rounded accent-cyan-500 w-4 h-4"
            />
            <span className="text-slate-200">Evitar caracteres ambiguos (1, l, I, 0, O)</span>
          </label>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>Cantidad de Palabras:</span>
              <span className="font-mono text-cyan-400 text-sm">{options.wordCount || 4}</span>
            </div>
            <input
              type="range"
              min={3}
              max={8}
              value={options.wordCount || 4}
              onChange={(e) => setOptions({ ...options, wordCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={options.numbers}
                onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
                className="rounded accent-cyan-500 w-4 h-4"
              />
              <span className="text-slate-200">Agregar Número</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={options.symbols}
                onChange={(e) => setOptions({ ...options, symbols: e.target.checked })}
                className="rounded accent-cyan-500 w-4 h-4"
              />
              <span className="text-slate-200">Agregar Símbolo</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );

  if (isStandaloneView) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl my-8"
        >
          {content}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
