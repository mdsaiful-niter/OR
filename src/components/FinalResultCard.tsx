import React, { useState } from 'react';
import { SolverResult } from '../types';
import {
  CheckCircle2,
  Printer,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Layers,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface FinalResultCardProps {
  result: SolverResult;
  onResetValues: () => void;
  onNewProblem: () => void;
}

export const FinalResultCard: React.FC<FinalResultCardProps> = ({
  result,
  onResetValues,
  onNewProblem,
}) => {
  const {
    assignments,
    totalValue,
    equationString,
    objective,
    iterationCount,
    problemContext,
    n,
    hasMultipleSolutions,
    totalSolutionsCount,
    allSolutions,
    isRestrictedProblem,
    isInfeasible,
  } = result;

  const [selectedSolutionIdx, setSelectedSolutionIdx] = useState<number>(0);

  const isMax = objective === 'maximize';
  const metricLabel = isMax ? 'Maximum Profit' : 'Minimum Cost';

  // Current active solution for display
  const activeSolution =
    allSolutions && allSolutions[selectedSolutionIdx]
      ? allSolutions[selectedSolutionIdx]
      : {
          solutionIndex: 1,
          assignments,
          equationString,
          totalValue,
        };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      aria-labelledby="final-result-heading"
      className="bg-white border border-stone-200 rounded-xl p-3.5 sm:p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5 sm:pb-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="final-result-heading" className="text-base sm:text-lg font-bold text-stone-900">
                  Final Optimal Assignment
                </h2>
                {hasMultipleSolutions ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Multiple Solutions ({totalSolutionsCount})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    Unique Solution
                  </span>
                )}
                {isRestrictedProblem && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                    Restricted Problem (00)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Determined via exact Hungarian Method (Kuhn-Munkres algorithm)
              </p>
            </div>
          </div>
        </div>

        {/* Print / Export Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-print-solution"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            Print Solution
          </button>
        </div>
      </div>

      {/* MULTIPLE OPTIMAL SOLUTIONS CALLOUT BANNER */}
      {hasMultipleSolutions && (
        <div className="mb-4 sm:mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-200 text-stone-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-indigo-950 flex flex-wrap items-center gap-1.5">
                  <span>Multiple Optimal Solutions Exist!</span>
                  <span className="text-xs font-normal text-indigo-800">
                    ({totalSolutionsCount} alternate assignment configurations yield the exact same optimum)
                  </span>
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Because multiple independent zero combinations exist in the optimal reduced matrix, this problem has <strong>{totalSolutionsCount} alternate assignments</strong> that each achieve the identical {metricLabel.toLowerCase()} of <strong>{totalValue} units</strong>.
                </p>
              </div>
            </div>

            {/* Interactive Solution Selector Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
              <span className="text-xs font-bold text-stone-600 mr-1 hidden md:inline">Select Solution:</span>
              {allSolutions.map((sol, idx) => (
                <button
                  key={sol.solutionIndex}
                  type="button"
                  id={`btn-select-solution-${sol.solutionIndex}`}
                  onClick={() => setSelectedSolutionIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSolutionIdx === idx
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                  title={`View alternative assignment #${sol.solutionIndex}`}
                >
                  Solution #{sol.solutionIndex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESTRICTED PROBLEM BANNER */}
      {isRestrictedProblem && (
        <div className="mb-4 sm:mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5">
          <span className="p-1 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div className="text-xs">
            <span className="font-bold block text-rose-900">
              Restricted Assignment Problem Handled
            </span>
            <p className="text-rose-700 mt-0.5">
              Input cells with <strong>"00"</strong> were designated as prohibited routes. The solver assigned penalty cost <em>M = ∞</em> to guarantee that restricted pairings were strictly eliminated from the optimal solution.
            </p>
          </div>
        </div>
      )}

      {/* INFEASIBLE WARNING (if constraints prevent valid solution) */}
      {isInfeasible && (
        <div className="mb-4 sm:mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-amber-900">
              Warning: Severely Constrained / Infeasible Problem
            </span>
            <p className="text-amber-800 mt-0.5">
              The number of restrictions ("00") makes it mathematically impossible to assign every {problemContext.rowEntityName} to an unrestricted {problemContext.columnEntityName}.
            </p>
          </div>
        </div>
      )}

      {/* Mandatory Explicit Equation Banner */}
      <div className="mb-4 sm:mb-6 rounded-xl bg-stone-900 text-stone-100 p-3.5 sm:p-5 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Explicit Final Equation {hasMultipleSolutions ? `(Solution #${activeSolution.solutionIndex})` : ''}
          </div>
          {hasMultipleSolutions && (
            <div className="text-[11px] font-bold text-amber-400">
              Showing Alternative Solution {activeSolution.solutionIndex} of {totalSolutionsCount}
            </div>
          )}
        </div>
        <div className="text-lg sm:text-2xl font-mono font-bold text-amber-300 tracking-tight break-all">
          {activeSolution.equationString}
        </div>
        <div className="mt-2 text-xs text-stone-400 flex flex-wrap items-center gap-1.5">
          <span>Formula:</span>
          <span className="font-mono">
            {isMax ? 'Σ Profit(Assigned Pairs)' : 'Σ Cost(Assigned Pairs)'}
          </span>
          <span className="text-stone-500 hidden sm:inline">• Computed strictly from original values</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Assignment Table (2 Cols) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <span>
                Optimal Pairings {hasMultipleSolutions ? `(Solution #${activeSolution.solutionIndex})` : ''} ({activeSolution.assignments.length})
              </span>
            </h3>
            {hasMultipleSolutions && (
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Alternative {activeSolution.solutionIndex} of {totalSolutionsCount}
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left border-collapse final-result-table">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-xs text-stone-800 font-bold">
                  <th className="py-2.5 px-3 font-bold">#</th>
                  <th className="py-2.5 px-3 font-bold">
                    {problemContext.rowEntityName} (Assignee)
                  </th>
                  <th className="py-2.5 px-3 font-bold text-center w-8">→</th>
                  <th className="py-2.5 px-3 font-bold">
                    Assigned {problemContext.columnEntityName} (Task)
                  </th>
                  <th className="py-2.5 px-3 font-bold text-right">
                    Original {isMax ? 'Profit' : 'Cost'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {activeSolution.assignments.map((assignment, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-stone-500 font-mono font-bold text-sm">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">
                      {assignment.rowLabel}
                    </td>
                    <td className="py-2.5 px-3 text-center text-stone-400">
                      <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-800">
                      {assignment.colLabel}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-base sm:text-lg final-cost-cell">
                      {assignment.isRestricted ? (
                        <span className="text-rose-600 dark:text-rose-400 text-xs font-black">
                          M (Restricted)
                        </span>
                      ) : (
                        <>
                          <span className="final-cost-val font-black">{assignment.originalCost}</span>{' '}
                          <span className="text-xs font-semibold final-cost-unit">units</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="final-result-tfoot bg-black text-white border-t-2 border-stone-800 text-sm font-bold">
                  <td colSpan={4} className="py-3 px-3 text-right font-bold text-sm sm:text-base text-white final-total-label">
                    Total {metricLabel}:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-lg sm:text-xl font-black text-white">
                    <span className="final-total-cost font-black text-white">{activeSolution.totalValue}</span>{' '}
                    <span className="text-xs font-bold text-white final-total-unit">units</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Solution Summary Block */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
            Solution Summary Block
          </h3>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-3 font-mono text-xs text-stone-800">
            <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
              <span className="text-stone-500 font-sans font-medium">Problem:</span>
              <span className="font-semibold text-stone-900">
                {problemContext.rowEntityName} → {problemContext.columnEntityName}
              </span>
            </div>

            <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
              <span className="text-stone-500 font-sans font-medium">Objective:</span>
              <span className="font-semibold capitalize text-stone-900">{objective}</span>
            </div>

            <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
              <span className="text-stone-500 font-sans font-medium">Matrix Size:</span>
              <span className="font-semibold text-stone-900">{n} × {n}</span>
            </div>

            <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
              <span className="text-stone-500 font-sans font-medium">Method:</span>
              <span className="font-semibold text-stone-900">Hungarian Method</span>
            </div>

            <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
              <span className="text-stone-500 font-sans font-medium">Multiple Solutions:</span>
              <span className={`font-bold ${hasMultipleSolutions ? 'text-indigo-700' : 'text-stone-900'}`}>
                {hasMultipleSolutions ? `Yes (${totalSolutionsCount} alternate sets)` : 'No (Unique)'}
              </span>
            </div>

            {isRestrictedProblem && (
              <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                <span className="text-stone-500 font-sans font-medium">Restricted (00):</span>
                <span className="font-bold text-rose-700">Active (Big-M)</span>
              </div>
            )}

            <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
              <span className="text-stone-500 font-sans font-medium">Adjustment Iterations:</span>
              <span className="font-semibold text-stone-900">{iterationCount - 1}</span>
            </div>

            <div className="pt-1">
              <span className="text-stone-500 font-sans font-medium block mb-1">
                Active Equation:
              </span>
              <div className="p-2 rounded bg-white border border-stone-200 font-bold text-stone-900 break-all text-[11px]">
                {activeSolution.equationString}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALL ALTERNATIVE SOLUTIONS BREAKDOWN (shown when multiple solutions exist) */}
      {hasMultipleSolutions && allSolutions.length > 1 && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-indigo-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              Side-by-Side Comparison of All {totalSolutionsCount} Alternate Optimal Solutions
            </h3>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            Every alternative below achieves the exact same optimal value of <strong>{totalValue} units</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allSolutions.map((sol) => (
              <div
                key={sol.solutionIndex}
                onClick={() => setSelectedSolutionIdx(sol.solutionIndex - 1)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSolutionIdx === sol.solutionIndex - 1
                    ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-400/40'
                    : 'bg-white/80 border-stone-200 hover:bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <span>Solution #{sol.solutionIndex}</span>
                    {selectedSolutionIdx === sol.solutionIndex - 1 && (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                        Active
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    Total: {sol.totalValue} units
                  </span>
                </div>

                <ul className="text-xs space-y-1 divide-y divide-stone-100">
                  {sol.assignments.map((a, aIdx) => (
                    <li key={aIdx} className="pt-1 flex items-center justify-between text-stone-700">
                      <span className="font-medium">
                        {a.rowLabel} → <span className="font-bold text-stone-900">{a.colLabel}</span>
                      </span>
                      <span className="font-mono font-bold text-amber-950">
                        {a.isRestricted ? 'M' : a.originalCost}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset / New Problem Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-stone-100">
        <div className="text-xs text-stone-500">
          Want to test another configuration?
        </div>

        <div className="flex items-center gap-2">
          {/* Reset: Clears matrix values only; keeps current context */}
          <button
            type="button"
            id="btn-reset-values"
            onClick={onResetValues}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Clears matrix values only; keeps entity names, objective, and matrix size"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Matrix Values
          </button>

          {/* New Problem: Clears everything; returns to initial setup screen */}
          <button
            type="button"
            id="btn-new-problem"
            onClick={onNewProblem}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Clears everything and returns to default initial setup"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Start New Problem
          </button>
        </div>
      </div>
    </section>
  );
};
