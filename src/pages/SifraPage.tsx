import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Trophy, RotateCcw, Lock, Unlock, HelpCircle, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../lib/store';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

type Difficulty = 'beginner' | 'medium' | 'hard';

interface DifficultyConfig {
  label: string;
  codeLength: number;
  maxDigit: number;
  clueCount: number;
  description: string;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: { label: 'Pocetnik', codeLength: 4, maxDigit: 4, clueCount: 5, description: '4 broja (1-4)' },
  medium: { label: 'Srednji', codeLength: 4, maxDigit: 6, clueCount: 5, description: '4 broja (1-6)' },
  hard: { label: 'Tesko', codeLength: 5, maxDigit: 6, clueCount: 6, description: '5 brojeva (1-6)' },
};

interface Clue {
  combination: number[];
  exactMatches: number; // filled circles
  partialMatches: number; // empty circles
}

function generateCode(length: number, maxDigit: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * maxDigit) + 1);
}

function evaluateGuess(secret: number[], guess: number[]): { exact: number; partial: number } {
  const secretCopy = [...secret];
  const guessCopy = [...guess];
  let exact = 0;
  let partial = 0;

  // First pass: exact matches
  for (let i = guessCopy.length - 1; i >= 0; i--) {
    if (guessCopy[i] === secretCopy[i]) {
      exact++;
      secretCopy.splice(i, 1);
      guessCopy.splice(i, 1);
    }
  }

  // Second pass: partial matches
  for (const digit of guessCopy) {
    const idx = secretCopy.indexOf(digit);
    if (idx !== -1) {
      partial++;
      secretCopy.splice(idx, 1);
    }
  }

  return { exact, partial };
}

function generateClues(secret: number[], config: DifficultyConfig): Clue[] {
  const clues: Clue[] = [];
  for (let i = 0; i < config.clueCount; i++) {
    const combination = generateCode(config.codeLength, config.maxDigit);
    const { exact, partial } = evaluateGuess(secret, combination);
    clues.push({ combination, exactMatches: exact, partialMatches: partial });
  }
  return clues;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function SifraPage() {
  const { theme } = useAppStore();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [secret, setSecret] = useState<number[]>(() => generateCode(4, 6));
  const [clues, setClues] = useState<Clue[]>(() => generateClues(secret, DIFFICULTIES.medium));
  const [guess, setGuess] = useState<number[]>(() => Array(4).fill(0));
  const [solved, setSolved] = useState(false);
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [revealSecret, setRevealSecret] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const config = DIFFICULTIES[difficulty];

  const startNewGame = useCallback((diff?: Difficulty) => {
    const d = diff || difficulty;
    const cfg = DIFFICULTIES[d];
    const newSecret = generateCode(cfg.codeLength, cfg.maxDigit);
    const newClues = generateClues(newSecret, cfg);
    setSecret(newSecret);
    setClues(newClues);
    setGuess(Array(cfg.codeLength).fill(0));
    setSolved(false);
    setWrongAttempt(false);
    setRevealSecret(false);
  }, [difficulty]);

  const handleDifficultyChange = (diff: Difficulty) => {
    setDifficulty(diff);
    startNewGame(diff);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (solved) return;
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > config.maxDigit) {
      if (value === '') {
        const newGuess = [...guess];
        newGuess[index] = 0;
        setGuess(newGuess);
      }
      return;
    }
    const newGuess = [...guess];
    newGuess[index] = num;
    setGuess(newGuess);
    setWrongAttempt(false);

    // Auto-focus next input
    if (index < config.codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && guess[index] === 0 && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < config.codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = () => {
    if (solved) return;
    if (guess.some((d) => d === 0)) {
      toast.error('Popuni sva polja!');
      return;
    }

    const isCorrect = guess.every((d, i) => d === secret[i]);
    if (isCorrect) {
      setSolved(true);
      toast.success('Bravo! Pogodio si sifru!');
    } else {
      setWrongAttempt(true);
      toast.error('Netacna kombinacija. Pokusaj ponovo!');
    }
  };

  // Update refs array size when codeLength changes
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, config.codeLength);
  }, [config.codeLength]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Lock size={24} className="text-primary-500 shrink-0" />
            Sifra
          </h1>
          <p className="text-sm opacity-60 mt-1">Pogodi tajnu kombinaciju na osnovu tragova</p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <Button variant="ghost" size="sm" onClick={() => setShowRules(true)} className="w-full sm:w-auto">
            <HelpCircle size={18} />
            Pravila
          </Button>
          <Button variant="secondary" size="sm" onClick={() => startNewGame()} className="w-full sm:w-auto">
            <Shuffle size={18} />
            Nova igra
          </Button>
        </div>
      </motion.div>

      {/* Difficulty selector */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <span className="text-sm font-medium opacity-70">Tezina:</span>
            <div className="grid grid-cols-1 gap-2 w-full sm:flex sm:flex-1">
              {(Object.entries(DIFFICULTIES) as [Difficulty, DifficultyConfig][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleDifficultyChange(key)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-all sm:flex-1',
                    difficulty === key
                      ? 'gradient-primary text-white shadow-lg shadow-primary-500/20'
                      : theme === 'dark'
                        ? 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                        : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                  )}
                >
                  <span className="block">{cfg.label}</span>
                  <span className="block text-xs opacity-70 mt-0.5">{cfg.description}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Clues */}
      <motion.div variants={itemVariants}>
        <Card>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Unlock size={18} className="text-primary-400" />
            Tragovi
          </h2>
          <div className="space-y-3">
            {clues.map((clue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'flex flex-wrap items-center gap-2 sm:gap-4 p-3 rounded-xl',
                  theme === 'dark' ? 'bg-dark-800/60' : 'bg-dark-50'
                )}
              >
                <span className={cn(
                  'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  theme === 'dark' ? 'bg-dark-700 text-dark-300' : 'bg-dark-200 text-dark-600'
                )}>
                  {i + 1}
                </span>

                {/* Combination digits */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-0">
                  {clue.combination.map((digit, j) => (
                    <span
                      key={j}
                      className={cn(
                        'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold shrink-0',
                        theme === 'dark'
                          ? 'bg-dark-700 text-dark-100'
                          : 'bg-white text-dark-800 border border-dark-200'
                      )}
                    >
                      {digit}
                    </span>
                  ))}
                </div>

                {/* Feedback circles */}
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto sm:ml-auto sm:justify-end">
                  {Array.from({ length: clue.exactMatches }).map((_, k) => (
                    <div
                      key={`exact-${k}`}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-accent-500 shadow-sm shadow-accent-500/30"
                      title="Tacan broj na tacnom mjestu"
                    />
                  ))}
                  {Array.from({ length: clue.partialMatches }).map((_, k) => (
                    <div
                      key={`partial-${k}`}
                      className={cn(
                        'w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2',
                        theme === 'dark'
                          ? 'border-warning-400'
                          : 'border-warning-500'
                      )}
                      title="Tacan broj na pogresnom mjestu"
                    />
                  ))}
                  {Array.from({ length: config.codeLength - clue.exactMatches - clue.partialMatches }).map((_, k) => (
                    <div
                      key={`miss-${k}`}
                      className={cn(
                        'w-4 h-4 sm:w-5 sm:h-5 rounded-full',
                        theme === 'dark' ? 'bg-dark-700' : 'bg-dark-200'
                      )}
                      title="Broj ne postoji"
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className={cn(
            'mt-4 pt-3 border-t flex flex-wrap gap-x-5 gap-y-1.5 text-xs opacity-60',
            theme === 'dark' ? 'border-dark-700' : 'border-dark-200'
          )}>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-accent-500" />
              <span>Tacan broj, tacno mjesto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn('w-3.5 h-3.5 rounded-full border-2', theme === 'dark' ? 'border-warning-400' : 'border-warning-500')} />
              <span>Tacan broj, pogresno mjesto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn('w-3.5 h-3.5 rounded-full', theme === 'dark' ? 'bg-dark-700' : 'bg-dark-200')} />
              <span>Broj ne postoji</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Answer input */}
      <motion.div variants={itemVariants}>
        <Card className={cn(
          solved && 'ring-2 ring-accent-500/50',
          wrongAttempt && !solved && 'ring-2 ring-danger-500/50'
        )}>
          {solved ? (
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Trophy size={48} className="mx-auto text-warning-400 mb-3" />
              </motion.div>
              <h3 className="text-lg font-bold text-accent-400">Bravo! Pogodio si!</h3>
              <p className="text-sm opacity-60 mt-1">
                Tajna sifra: {secret.join(' ')}
              </p>
              <Button className="mt-4" onClick={() => startNewGame()}>
                <RotateCcw size={18} />
                Nova igra
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold mb-4">Tvoj odgovor</h2>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 w-full sm:w-auto">
                  {Array.from({ length: config.codeLength }).map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={guess[i] || ''}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className={cn(
                        'w-12 h-12 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl outline-none transition-all shrink-0',
                        'focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500',
                        theme === 'dark'
                          ? 'bg-dark-800 border border-dark-600 text-dark-100'
                          : 'bg-dark-50 border border-dark-200 text-dark-900',
                        wrongAttempt && 'border-danger-500 animate-pulse'
                      )}
                      placeholder={(i + 1).toString()}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
                  <Button onClick={handleSubmit} className="w-full sm:w-auto">
                    Provjeri
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevealSecret(!revealSecret)}
                    className="w-full sm:w-auto text-xs"
                  >
                    {revealSecret ? 'Sakrij' : 'Otkrij'}
                  </Button>
                </div>
              </div>

              {wrongAttempt && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-danger-400 mt-3 font-medium"
                >
                  Netacna kombinacija! Analiziraj tragove i pokusaj ponovo.
                </motion.p>
              )}

              {revealSecret && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center"
                >
                  <span className="text-xs opacity-50">Tajna sifra:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {secret.map((d, i) => (
                      <span
                        key={i}
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                          theme === 'dark' ? 'bg-warning-500/20 text-warning-300' : 'bg-warning-100 text-warning-700'
                        )}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </Card>
      </motion.div>

      {/* Rules modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRules(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative z-10 w-full max-w-md rounded-2xl p-5 sm:p-6 max-h-[85dvh] overflow-y-auto',
              theme === 'dark' ? 'bg-dark-900 border border-dark-700' : 'bg-white border border-dark-200'
            )}
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={() => setShowRules(false)}
              className={cn(
                'absolute top-4 right-4 p-1 rounded-lg',
                theme === 'dark' ? 'hover:bg-dark-800' : 'hover:bg-dark-100'
              )}
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <HelpCircle size={20} className="text-primary-400" />
              Pravila igre
            </h3>
            <div className="space-y-3 text-sm opacity-80">
              <p>Cilj igre je pogoditi tajnu kombinaciju brojeva na osnovu tragova.</p>
              <div>
                <p className="font-semibold mb-1">Tragovi:</p>
                <p>Svaki trag sadrzi kombinaciju brojeva i povratnu informaciju:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent-500 shrink-0" />
                    Popunjeni krug = broj postoji i na tacnom je mjestu
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full border-2 shrink-0', theme === 'dark' ? 'border-warning-400' : 'border-warning-500')} />
                    Prazan krug = broj postoji ali je na pogresnom mjestu
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full shrink-0', theme === 'dark' ? 'bg-dark-700' : 'bg-dark-200')} />
                    Sivi krug = broj ne postoji u kombinaciji
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Nivoi tezine:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Pocetnik:</strong> 4 broja (1-4), 5 tragova</li>
                  <li><strong>Srednji:</strong> 4 broja (1-6), 5 tragova</li>
                  <li><strong>Tesko:</strong> 5 brojeva (1-6), 6 tragova</li>
                </ul>
              </div>
              <p>Brojevi se mogu ponavljati u kombinaciji!</p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
