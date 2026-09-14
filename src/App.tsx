import React, { useState, useEffect } from 'react';
import {
  Objective,
  ProblemContext,
  SolverResult,
  ValidationError,
} from './types';
import { ProblemSetup } from './components/ProblemSetup';
import { MatrixEditor } from './components/MatrixEditor';
import { SolutionViewer } from './components/SolutionViewer';
import { FinalResultCard } from './components/FinalResultCard';
import { AppLogo } from './components/AppLogo';
import { PRESET_PROBLEMS } from './utils/presets';
import { solveHungarian } from './utils/hungarian';
import {
  CheckCircle2,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';

export type ThemeMode = 'day' | 'night';

// Default initial state uses the 4x4 balanced context, but cells remain empty to show placeholders
const DEFAULT_PRESET = PRESET_PROBLEMS[0];

export default function App() {
  // Keep row and column headers empty by default so placeholders show without typed data
  const [context, setContext] = useState<ProblemContext>(() => ({
    ...DEFAULT_PRESET.context,
    rows: ['', '', '', ''],
    columns: ['', '', '', ''],
  }));
  // Keep cells empty by default so placeholder is displayed without filling data
  const [matrix, setMatrix] = useState<string[][]>(() =>
    DEFAULT_PRESET.matrix.map((row) => row.map(() => ''))
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  // Initially null: keep solution hidden until user explicitly clicks Solve
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // 2 Dynamic Moods: Day and Night (Both feature integrated neon light effects)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('hungarian_theme') as ThemeMode;
    return saved === 'night' ? 'night' : 'day';
  });

  useEffect(() => {
    document.body.classList.remove('theme-day', 'theme-night');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('hungarian_theme', theme);
  }, [theme]);

  // Validation according to PRD §4.3 & §9
  // Note: Row and column headers have intuitive placeholders (e.g. Worker A, Job 1) so typing is optional
  const validateMatrix = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    const n = matrix.length;

    // Check Numerical Cells
    for (let r = 0; r < n; r++) {
      const rowLabel =
        context.rows[r] && context.rows[r].trim() !== ''
          ? context.rows[r].trim()
          : (context.rowEntityName ? `${context.rowEntityName} ${String.fromCharCode(65 + r)}` : `Row ${r + 1}`);

      for (let c = 0; c < n; c++) {
        const colLabel =
          context.columns[c] && context.columns[c].trim() !== ''
            ? context.columns[c].trim()
            : (context.columnEntityName ? `${context.columnEntityName} ${c + 1}` : `Col ${c + 1}`);

        const raw = matrix[r]?.[c];

        if (raw === undefined || raw === null || raw.trim() === '') {
          errors.push({
            type: 'cell',
            row: r,
            col: c,
            message: `Enter a numerical value for ${rowLabel} → ${colLabel}.`,
          });
        } else {
          const num = Number(raw.trim());
          if (isNaN(num)) {
            errors.push({
              type: 'cell',
              row: r,
              col: c,
              message: `Cell ${rowLabel} → ${colLabel} must be a valid number (received "${raw}").`,
            });
          }
        }
      }
    }

    return errors;
  };

  const handleSolve = () => {
    const errors = validateMatrix();
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    const numericMatrix: number[][] = matrix.map((row) =>
      row.map((cell) => Number(cell.trim()))
    );

    // Resolve labels: use typed value or fallback to placeholder
    const resolvedContext: ProblemContext = {
      ...context,
      rows: Array.from({ length: matrix.length }, (_, r) => {
        const val = context.rows[r];
        if (val && val.trim() !== '') return val.trim();
        return context.rowEntityName
          ? `${context.rowEntityName} ${String.fromCharCode(65 + r)}`
          : `Row ${r + 1}`;
      }),
      columns: Array.from({ length: matrix.length }, (_, c) => {
        const val = context.columns[c];
        if (val && val.trim() !== '') return val.trim();
        return context.columnEntityName
          ? `${context.columnEntityName} ${c + 1}`
          : `Col ${c + 1}`;
      }),
    };

    const result = solveHungarian(numericMatrix, resolvedContext);
    setSolverResult(result);
    setCurrentStepIndex(0);

    // Smooth scroll down to solution viewer
    setTimeout(() => {
      const target = document.getElementById('solution-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  // Reset values only; keeps current context and size (PRD §4.7)
  const handleResetValues = () => {
    const n = matrix.length;
    const cleared = Array.from({ length: n }, () => Array(n).fill(''));
    setMatrix(cleared);
    setValidationErrors([]);
    setSolverResult(null);
  };

  // Start new problem; clears everything to initial 2x2 or fresh default (PRD §4.7)
  const handleNewProblem = () => {
    const initialContext: ProblemContext = {
      objective: 'minimize',
      rowEntityCategory: 'Machines',
      columnEntityCategory: 'Operations',
      rowEntityCustom: '',
      columnEntityCustom: '',
      rowEntityName: 'Machine',
      columnEntityName: 'Operation',
      rows: ['', ''],
      columns: ['', ''],
    };

    setContext(initialContext);
    setMatrix([
      ['', ''],
      ['', ''],
    ]);
    setValidationErrors([]);
    setSolverResult(null);
    setCurrentStepIndex(0);
  };

  const handleClearValues = () => {
    const cleared = matrix.map((row) => row.map(() => ''));
    setMatrix(cleared);
    setSolverResult(null);
  };

  const handleRandomizeValues = () => {
    const randomized = matrix.map((row) =>
      row.map(() => String(Math.floor(Math.random() * 30) + 1))
    );
    setMatrix(randomized);
    setValidationErrors([]);
    setSolverResult(null);
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-300 pb-16 theme-${theme}`}>
      {/* Dynamic Ambient Light Atmosphere (No static flat background) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="ambient-light-glow-1" />
        <div className="ambient-light-glow-2" />
      </div>

      {/* Top Application Bar */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <AppLogo className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 cursor-pointer" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  Assignment Problem Solver
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                  Hungarian Method
                </span>
              </div>
            </div>
          </div>

          {/* Header Theme & Navigation Controls */}
          <div id="app-header-controls" className="flex items-center gap-2">
            {/* 2 Modes Only: Day and Night */}
            <div
              id="theme-controls"
              className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 border border-stone-200 text-xs shadow-2xs"
              role="radiogroup"
              aria-label="Display theme mode"
            >
              <button
                type="button"
                id="btn-theme-day"
                onClick={() => setTheme('day')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  theme === 'day'
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-300'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Day Mood (High Contrast)"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Day</span>
              </button>

              <button
                type="button"
                id="btn-theme-night"
                onClick={() => setTheme('night')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  theme === 'night'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Night Mood (Cyber Neon Glow)"
              >
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Night</span>
              </button>
            </div>

            {solverResult && (
              <a
                href="#solution-section"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100/90 hover:bg-amber-200 rounded-lg transition-colors border border-amber-200 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Jump to Solution</span>
              </a>
            )}

            <button
              type="button"
              id="btn-new-problem"
              onClick={handleNewProblem}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-stone-200"
              title="Start a fresh problem"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* 1. Problem Context Setup */}
        <ProblemSetup
          context={context}
          onContextChange={setContext}
        />

        {/* Matrix Editor */}
        <MatrixEditor
          matrix={matrix}
          context={context}
          validationErrors={validationErrors}
          onMatrixChange={(newMatrix) => {
            setMatrix(newMatrix);
            if (validationErrors.length > 0) setValidationErrors([]);
          }}
          onContextChange={setContext}
          onSolve={handleSolve}
          onClearValues={handleClearValues}
          onRandomizeValues={handleRandomizeValues}
        />

        {/* 3. Solution Section (if solved) */}
        {solverResult && (
          <div id="solution-section" className="space-y-6 pt-4">
            {/* Step-by-step Solution Viewer */}
            <SolutionViewer
              steps={solverResult.steps}
              context={context}
              currentStepIndex={currentStepIndex}
              onStepChange={setCurrentStepIndex}
            />

            {/* 4. Final Result Presentation */}
            <FinalResultCard
              result={solverResult}
              onResetValues={handleResetValues}
              onNewProblem={handleNewProblem}
            />
          </div>
        )}
      </main>
    </div>
  );
}
