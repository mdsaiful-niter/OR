import React, { useState } from 'react';
import { ProblemContext, SolutionStep } from '../types';
import { MatrixVisualizer } from './MatrixVisualizer';
import {
  ChevronDown,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
} from 'lucide-react';

interface SolutionViewerProps {
  steps: SolutionStep[];
  context: ProblemContext;
  currentStepIndex?: number;
  onStepChange?: (index: number) => void;
}

export const SolutionViewer: React.FC<SolutionViewerProps> = ({
  steps,
  context,
}) => {
  // Explanations are collapsed by default; revealed via down arrow button
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  const toggleExplanation = (stepNumber: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  if (!steps || steps.length === 0) return null;

  // Render content of a single step
  const renderStepCard = (step: SolutionStep, index: number) => {
    const isRowReduction = step.type === 'row-reduction';
    const isColReduction = step.type === 'column-reduction';
    const isZeroCovering = step.type === 'zero-covering';
    const isOptimality = step.type === 'optimality-check';
    const isAdjustment = step.type === 'matrix-adjustment';
    const isFinalAssignment = step.type === 'final-assignment';
    const isMaxConversion = step.type === 'maximization-conversion';

    return (
      <div
        key={step.stepNumber}
        id={`step-card-${step.stepNumber}`}
        className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs transition-all"
      >
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs font-bold shrink-0">
              {step.stepNumber}
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                {step.title}
                {isOptimality && (
                  step.meta?.coveringLines?.isOptimal ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Optimal (lines = n)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      Requires Adjustment
                    </span>
                  )
                )}
              </h3>
              {step.subtitle && (
                <p className="text-xs text-stone-500 font-medium mt-0.5">{step.subtitle}</p>
              )}
            </div>
          </div>

          <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md self-start sm:self-auto uppercase tracking-wider">
            {step.type.replace('-', ' ')}
          </span>
        </div>

        {/* Tutor Explanation Accordion Toggle (Down Arrow Button) */}
        {step.explanation && (
          <div className="mb-5">
            <button
              type="button"
              id={`btn-toggle-explain-step-${step.stepNumber}`}
              onClick={() => toggleExplanation(step.stepNumber)}
              className="tutor-explanation-btn w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer group shadow-2xs"
              aria-expanded={Boolean(expandedExplanations[step.stepNumber])}
              title={
                expandedExplanations[step.stepNumber]
                  ? 'Click to hide explanation'
                  : 'Click to show explanation'
              }
            >
              <div className="flex items-center gap-2 font-bold">
                <GraduationCap className="w-4 h-4 text-amber-500 dark:text-cyan-400 shrink-0" />
                <span className="tutor-btn-title">Tutor Explanation</span>
              </div>
              <div className="flex items-center gap-1.5 transition-colors">
                <span className="tutor-btn-status text-[11px] font-semibold">
                  {expandedExplanations[step.stepNumber] ? 'Hide' : 'Show Explanation'}
                </span>
                <div
                  className={`p-1 rounded transition-transform duration-200 ${
                    expandedExplanations[step.stepNumber]
                      ? 'rotate-180 tutor-arrow-expanded'
                      : 'tutor-arrow-collapsed'
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>

            {expandedExplanations[step.stepNumber] && (
              <div className="tutor-explanation-box p-4 mt-2 rounded-lg border text-sm leading-relaxed transition-all shadow-sm">
                <p className="tutor-explanation-text font-normal">{step.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Detailed Per-Step Explicit Calculation Breakdown */}
        {/* Row Reduction Explicit Subtraction List (Vertical) */}
        {isRowReduction && step.meta?.rowSubtractions && (
          <div className="mb-5 p-3.5 rounded-lg bg-stone-50 border border-stone-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Row Subtraction Details
            </h4>
            <div className="flex flex-col gap-2 text-xs sm:text-sm">
              {step.meta.rowSubtractions.map((rowSub) => (
                <div
                  key={rowSub.row}
                  className="p-2.5 bg-white rounded border border-stone-200/80 shadow-2xs"
                >
                  <div className="font-semibold text-stone-800 mb-1 text-sm">
                    {context.rows[rowSub.row] || `Row ${rowSub.row + 1}`}:{' '}
                    <span className="text-amber-800 font-mono text-base font-black">min = {rowSub.min}</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-stone-700">
                    {rowSub.calculations.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Column Reduction Explicit Subtraction List (Vertical) */}
        {isColReduction && step.meta?.colSubtractions && (
          <div className="mb-5 p-3.5 rounded-lg bg-stone-50 border border-stone-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Column Subtraction Details
            </h4>
            <div className="flex flex-col gap-2 text-xs sm:text-sm">
              {step.meta.colSubtractions.map((colSub) => (
                <div
                  key={colSub.col}
                  className="p-2.5 bg-white rounded border border-stone-200/80 shadow-2xs"
                >
                  <div className="font-semibold text-stone-800 mb-1 text-sm">
                    {context.columns[colSub.col] || `Col ${colSub.col + 1}`}:{' '}
                    <span className="text-indigo-800 font-mono text-base font-black">min = {colSub.min}</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-stone-700">
                    {colSub.calculations.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matrix Adjustment Details (Vertical) */}
        {isAdjustment && step.meta?.adjustment && (
          <div className="mb-5 p-3.5 rounded-lg bg-purple-50/50 border border-purple-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-2">
              Adjustment Breakdown (<span className="font-mono text-sm sm:text-base font-black">k = {step.meta.adjustment.smallestUncovered}</span>)
            </h4>
            <div className="flex flex-col gap-2 text-xs sm:text-sm">
              <div className="p-2.5 bg-white rounded border border-purple-200/80 shadow-2xs">
                <span className="text-amber-900 font-bold text-sm block">
                  <span className="font-mono text-base font-black">−{step.meta.adjustment.smallestUncovered}</span> (Uncovered cells)
                </span>
                <span className="text-stone-600 text-xs font-medium">
                  Applied to {step.meta.adjustment.uncoveredCells.length} cells
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-purple-200/80 shadow-2xs">
                <span className="text-purple-900 font-bold text-sm block">
                  <span className="font-mono text-base font-black">+{step.meta.adjustment.smallestUncovered}</span> (Line intersection cells)
                </span>
                <span className="text-stone-600 text-xs font-medium">
                  Applied to {step.meta.adjustment.intersectionCells.length} cells
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-purple-200/80 shadow-2xs">
                <span className="text-stone-800 font-bold text-sm block">Unchanged</span>
                <span className="text-stone-600 text-xs font-medium">
                  {step.meta.adjustment.unchangedCount} single-covered cells
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Zero-Covering Marking Summary (Vertical) */}
        {isZeroCovering && step.meta?.coveringLines && (
          <div className="mb-5 p-3.5 rounded-lg bg-blue-50/50 border border-blue-200 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-blue-900 mb-1.5">
              König's Theorem Line Derivation
            </h4>
            <div className="flex flex-col gap-2 text-stone-700">
              <div className="p-2.5 bg-white rounded border border-blue-200/80 shadow-2xs">
                <span className="font-semibold text-stone-800">Horizontal Lines (Unmarked Rows):</span>{' '}
                <span className="font-mono font-bold text-blue-700">
                  {step.meta.coveringLines.rowLines.length === 0
                    ? 'None'
                    : step.meta.coveringLines.rowLines
                        .map((r) => context.rows[r] || `Row ${r + 1}`)
                        .join(', ')}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-blue-200/80 shadow-2xs">
                <span className="font-semibold text-stone-800">Vertical Lines (Marked Columns):</span>{' '}
                <span className="font-mono font-bold text-indigo-700">
                  {step.meta.coveringLines.colLines.length === 0
                    ? 'None'
                    : step.meta.coveringLines.colLines
                        .map((c) => context.columns[c] || `Col ${c + 1}`)
                        .join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Matrix Visualization for Current Step */}
        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center justify-between">
            <span>Resulting Matrix After This Step</span>
            {step.matrixBefore && (
              <span className="text-[11px] font-normal text-stone-400 lowercase">
                Transformed from step {step.stepNumber - 1}
              </span>
            )}
          </h4>

          <MatrixVisualizer
            matrix={step.matrixAfter}
            rowLabels={context.rows}
            colLabels={context.columns}
            rowEntityName={context.rowEntityName}
            columnEntityName={context.columnEntityName}
            coveringLines={step.meta?.coveringLines}
            adjustmentMeta={step.meta?.adjustment}
            assignments={step.meta?.assignment}
            rowMinimums={isRowReduction ? step.meta?.rowMinimums : undefined}
            colMinimums={isColReduction ? step.meta?.columnMinimums : undefined}
            highlightZeros={isZeroCovering || isOptimality || isFinalAssignment}
          />
        </div>
      </div>
    );
  };

  return (
    <section aria-labelledby="solution-viewer-heading" className="space-y-4">
      {/* Top Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 id="solution-viewer-heading" className="text-base font-bold text-stone-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600" />
            Step-by-Step Solution
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Follow every matrix transformation with formal mathematical reasoning.
          </p>
        </div>
        <div className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 self-start sm:self-auto">
          {steps.length} Steps Total
        </div>
      </div>

      {/* Render Steps Vertically in Sequential Order */}
      <div className="flex flex-col space-y-5">
        {steps.map((step, idx) => (
          <React.Fragment key={step.stepNumber}>
            {renderStepCard(step, idx)}
            {idx < steps.length - 1 && (
              <div className="flex justify-center -my-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-300 text-stone-600 text-xs font-bold shadow-2xs">
                  <ArrowDown className="w-3.5 h-3.5 text-stone-500" />
                  <span>Next: Step {idx + 2}</span>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};
