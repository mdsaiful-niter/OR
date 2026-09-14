import React from 'react';
import { SolverResult } from '../types';
import {
  CheckCircle2,
  Printer,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
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
  } = result;

  const isMax = objective === 'maximize';
  const metricLabel = isMax ? 'Maximum Profit' : 'Minimum Cost';

  const handlePrint = () => {
    window.print();
  };

  return (
    <section aria-labelledby="final-result-heading" className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h2 id="final-result-heading" className="text-lg font-bold text-stone-900">
                Final Optimal Assignment
              </h2>
              <p className="text-xs text-stone-500">
                Determined via exact Hungarian Method algorithm
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

      {/* Mandatory Explicit Equation Banner (PRD §8) */}
      <div className="mb-6 rounded-xl bg-stone-900 text-stone-100 p-5 shadow-inner">
        <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
          Explicit Final Equation
        </div>
        <div className="text-xl sm:text-2xl font-mono font-bold text-amber-300 tracking-tight break-all">
          {equationString}
        </div>
        <div className="mt-2 text-xs text-stone-400 flex items-center gap-1.5">
          <span>Formula:</span>
          <span className="font-mono">
            {isMax ? 'Σ Profit(Assigned Pairs)' : 'Σ Cost(Assigned Pairs)'}
          </span>
          <span className="text-stone-500">• Computed strictly from original values</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Assignment Table (2 Cols) */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
            Optimal Pairings ({assignments.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left border-collapse">
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
              <tbody className="divide-y divide-stone-100 text-xs">
                {assignments.map((assignment, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-stone-500 font-mono font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">
                      {assignment.rowLabel}
                    </td>
                    <td className="py-2.5 px-3 text-center text-stone-400">
                      <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-800">
                      {assignment.colLabel}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-amber-950 bg-amber-50/80">
                      {assignment.originalCost} units
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-100 border-t-2 border-amber-300 text-xs font-bold">
                  <td colSpan={4} className="py-3 px-3 text-stone-900 text-right">
                    Total {metricLabel}:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-base font-extrabold text-amber-950">
                    {totalValue} units
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Solution Summary Block (PRD §8) */}
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
              <span className="text-stone-500 font-sans font-medium">Adjustment Iterations:</span>
              <span className="font-semibold text-stone-900">{iterationCount - 1}</span>
            </div>

            <div className="pt-1">
              <span className="text-stone-500 font-sans font-medium block mb-1">
                Final Result:
              </span>
              <div className="p-2 rounded bg-white border border-stone-200 font-bold text-stone-900 break-all text-[11px]">
                {equationString}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset / New Problem Actions (PRD §4.7) */}
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
