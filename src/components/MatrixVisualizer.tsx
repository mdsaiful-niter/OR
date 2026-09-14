import React from 'react';
import { CoveringLines, AssignmentCell } from '../types';
import { Check, Star } from 'lucide-react';

interface MatrixVisualizerProps {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  rowEntityName?: string;
  columnEntityName?: string;
  coveringLines?: CoveringLines;
  adjustmentMeta?: {
    smallestUncovered: number;
    uncoveredCells: { row: number; col: number; from: number; to: number }[];
    intersectionCells: { row: number; col: number; from: number; to: number }[];
  };
  assignments?: AssignmentCell[];
  rowMinimums?: number[];
  colMinimums?: number[];
  highlightZeros?: boolean;
}

export const MatrixVisualizer: React.FC<MatrixVisualizerProps> = ({
  matrix,
  rowLabels,
  colLabels,
  rowEntityName = 'Row',
  columnEntityName = 'Column',
  coveringLines,
  adjustmentMeta,
  assignments,
  rowMinimums,
  colMinimums,
  highlightZeros = false,
}) => {
  const n = matrix.length;

  const rowLineSet = new Set(coveringLines?.rowLines ?? []);
  const colLineSet = new Set(coveringLines?.colLines ?? []);

  // Map assignments for quick O(1) lookup
  const assignmentMap = new Map<string, AssignmentCell>();
  if (assignments) {
    for (const a of assignments) {
      assignmentMap.set(`${a.row}-${a.col}`, a);
    }
  }

  // Map adjustment cells for quick lookup
  const uncoveredMap = new Set<string>();
  const intersectionMap = new Set<string>();
  if (adjustmentMeta) {
    adjustmentMeta.uncoveredCells.forEach((c) => uncoveredMap.add(`${c.row}-${c.col}`));
    adjustmentMeta.intersectionCells.forEach((c) => intersectionMap.add(`${c.row}-${c.col}`));
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
      {/* Visual Legend if lines or adjustments are active */}
      {(coveringLines || adjustmentMeta || assignments) && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs border-b border-stone-100 pb-3">
          <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px]">
            Legend:
          </span>

          {coveringLines && (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-100 text-sky-900 border border-sky-300 font-semibold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                Row Line ({coveringLines.rowLines.length})
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                Column Line ({coveringLines.colLines.length})
              </span>
            </>
          )}

          {adjustmentMeta && (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-950 border border-amber-400 font-bold text-xs shadow-2xs">
                <span className="font-mono text-[11px] font-black bg-amber-800 text-white px-1 rounded">−k</span>
                Uncovered cell ({adjustmentMeta.uncoveredCells.length})
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-100 text-purple-950 border border-purple-400 font-bold text-xs shadow-2xs">
                <span className="font-mono text-[11px] font-black bg-purple-800 text-white px-1 rounded">+k</span>
                Intersection ({adjustmentMeta.intersectionCells.length})
              </span>
            </>
          )}

          {assignments && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold text-xs shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-700" />
              Optimal Assignment ({assignments.length})
            </span>
          )}
        </div>
      )}

      <div className="relative inline-block min-w-full align-middle">
        <table className="border-collapse text-left w-full">
          <thead>
            <tr>
              {/* Corner Entity Label: Diagonal split with row entity (bottom-left) and column entity (top-right) */}
              <th className="relative p-0 bg-stone-100/80 font-semibold text-xs border border-stone-200 rounded-tl-lg min-w-[140px] w-[140px] h-[52px] select-none overflow-hidden">
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none text-stone-300 corner-diagonal-line"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="100"
                    y2="100"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* Right / Top portion: Operations */}
                <div className="absolute top-1.5 right-2 text-right pointer-events-none">
                  <span className="text-[11px] font-bold text-stone-800 tracking-tight">
                    {columnEntityName === 'Operation' ? 'Operations' : columnEntityName}
                  </span>
                </div>

                {/* Left / Bottom portion: Machines */}
                <div className="absolute bottom-1.5 left-2 text-left pointer-events-none">
                  <span className="text-[11px] font-bold text-stone-700 tracking-tight">
                    {rowEntityName === 'Machine' ? 'Machines' : rowEntityName}
                  </span>
                </div>
              </th>

              {/* Column Headers */}
              {colLabels.slice(0, n).map((colLabel, cIdx) => {
                const isColCovered = colLineSet.has(cIdx);
                return (
                  <th
                    key={cIdx}
                    className={`p-3 text-center border border-stone-300 font-bold text-xs transition-colors min-w-[90px] ${
                      isColCovered
                        ? 'bg-indigo-100 text-indigo-950 border-indigo-400'
                        : 'bg-stone-100 text-stone-900'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="truncate max-w-[120px] font-bold" title={colLabel}>
                        {colLabel || `Col ${cIdx + 1}`}
                      </span>
                      {isColCovered && (
                        <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider">
                          Covered
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Optional Row Reduction Column */}
              {rowMinimums && (
                <th className="p-3 text-center bg-amber-200 text-amber-950 font-bold text-xs border border-amber-300 min-w-[90px] min-reduction-header">
                  Row Min (minᵢ)
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {matrix.map((row, rIdx) => {
              const isRowCovered = rowLineSet.has(rIdx);

              return (
                <tr
                  key={rIdx}
                  className="transition-colors"
                >
                  {/* Row Header */}
                  <th
                    className={`p-3 text-xs font-bold border border-stone-300 transition-colors ${
                      isRowCovered
                        ? 'bg-sky-100 text-sky-950 border-sky-400'
                        : 'bg-stone-100 text-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[120px] font-bold" title={rowLabels[rIdx]}>
                        {rowLabels[rIdx] || `Row ${rIdx + 1}`}
                      </span>
                      {isRowCovered && (
                        <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider">
                          Covered
                        </span>
                      )}
                    </div>
                  </th>

                  {/* Matrix Cells */}
                  {row.map((val, cIdx) => {
                    const isColCovered = colLineSet.has(cIdx);
                    const cellKey = `${rIdx}-${cIdx}`;
                    const isAssigned = assignmentMap.has(cellKey);
                    const isUncovered = uncoveredMap.has(cellKey);
                    const isIntersection = intersectionMap.has(cellKey);
                    const isZero = val === 0;

                    // Compute background and border classes with guaranteed high-contrast foreground
                    let cellState = 'normal';
                    let cellBg = 'matrix-cell-normal bg-white';
                    let borderClass = 'border-stone-300';
                    let textClass = 'text-stone-900';

                    if (isAssigned) {
                      cellState = 'assigned';
                      cellBg = 'matrix-cell-assigned bg-emerald-100 ring-2 ring-emerald-600 ring-inset';
                      borderClass = 'border-emerald-500';
                      textClass = 'text-emerald-950 font-black';
                    } else if (isIntersection) {
                      cellState = 'intersection';
                      cellBg = 'matrix-cell-intersection bg-purple-100';
                      borderClass = 'border-purple-400';
                      textClass = 'text-purple-950 font-extrabold';
                    } else if (isUncovered) {
                      cellState = 'uncovered';
                      // Solid, high-contrast warm amber - never murky gray!
                      cellBg = 'matrix-cell-uncovered bg-amber-100';
                      borderClass = 'border-amber-400';
                      textClass = 'text-amber-950 font-extrabold';
                    } else if (isRowCovered && isColCovered) {
                      cellState = 'both-covered';
                      cellBg = 'matrix-cell-both-covered bg-purple-100';
                      borderClass = 'border-purple-400';
                      textClass = 'text-purple-950 font-extrabold';
                    } else if (isRowCovered) {
                      cellState = 'row-covered';
                      cellBg = 'matrix-cell-row-covered bg-sky-100';
                      borderClass = 'border-sky-400';
                      textClass = 'text-sky-950 font-bold';
                    } else if (isColCovered) {
                      cellState = 'col-covered';
                      cellBg = 'matrix-cell-col-covered bg-indigo-100';
                      borderClass = 'border-indigo-400';
                      textClass = 'text-indigo-950 font-bold';
                    }

                    return (
                      <td
                        key={cIdx}
                        className={`relative p-3 text-center border ${borderClass} ${cellBg} font-mono text-sm transition-all select-none`}
                      >
                        {/* Visual covering lines strike overlay */}
                        {isRowCovered && (
                          <div
                            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-sky-500/60 pointer-events-none z-10 line-row-beam"
                            aria-hidden="true"
                          />
                        )}
                        {isColCovered && (
                          <div
                            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-indigo-500/60 pointer-events-none z-10 line-col-beam"
                            aria-hidden="true"
                          />
                        )}

                        {/* Intersection Dot */}
                        {isRowCovered && isColCovered && (
                          <div
                            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-600 pointer-events-none z-20"
                            title="Line Intersection (+k)"
                          />
                        )}

                        {/* Cell Value & State Chips */}
                        <div className="relative z-20 flex flex-col items-center justify-center min-h-[38px]">
                          <span
                            className={`tabular-nums cell-val cell-val-${cellState} ${textClass} ${
                              isZero ? 'cell-val-zero font-black text-base' : 'font-semibold text-sm'
                            }`}
                          >
                            {val}
                          </span>

                          {/* Zero indication badge */}
                          {highlightZeros && isZero && !isAssigned && (
                            <span className="mt-0.5 inline-block text-[9px] font-sans font-bold px-1.5 py-0.5 rounded cell-badge-zero bg-stone-900 text-white shadow-2xs">
                              zero
                            </span>
                          )}

                          {/* Assigned Zero Chip */}
                          {isAssigned && (
                            <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-sans font-black px-2 py-0.5 rounded-full cell-badge-assigned bg-emerald-700 text-white shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              Assigned
                            </span>
                          )}

                          {/* Adjustment Operation Badge: Uncovered (-k) */}
                          {adjustmentMeta && isUncovered && (
                            <span className="mt-1 inline-block text-[10px] font-mono font-black px-1.5 py-0.5 rounded cell-badge-uncovered bg-amber-900 text-white shadow-2xs">
                              −{adjustmentMeta.smallestUncovered}
                            </span>
                          )}

                          {/* Adjustment Operation Badge: Intersection (+k) */}
                          {adjustmentMeta && isIntersection && (
                            <span className="mt-1 inline-block text-[10px] font-mono font-black px-1.5 py-0.5 rounded cell-badge-intersection bg-purple-900 text-white shadow-2xs">
                              +{adjustmentMeta.smallestUncovered}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Row Minimum Value */}
                  {rowMinimums && (
                    <td className="p-3 text-center font-mono text-sm font-black bg-amber-100 text-amber-950 border border-amber-300 min-reduction-cell">
                      {rowMinimums[rIdx]}
                    </td>
                  )}
                </tr>
              );
            })}

            {/* Optional Column Reduction Row */}
            {colMinimums && (
              <tr>
                <th className="p-3 text-xs font-bold bg-amber-200 text-amber-950 border border-amber-300 min-reduction-header">
                  Col Min (minⱼ)
                </th>
                {colMinimums.slice(0, n).map((cMin, cIdx) => (
                  <td
                    key={cIdx}
                    className="p-3 text-center font-mono text-sm font-black bg-amber-100 text-amber-950 border border-amber-300 min-reduction-cell"
                  >
                    {cMin}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
