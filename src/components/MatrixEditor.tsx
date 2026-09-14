import React, { useState } from 'react';
import { ProblemContext, ValidationError } from '../types';
import {
  Plus,
  Minus,
  RotateCcw,
  Dice5,
  Play,
  AlertCircle,
} from 'lucide-react';

interface MatrixEditorProps {
  matrix: string[][]; // using string representation for exact user inputs (empty, decimals, negatives)
  context: ProblemContext;
  validationErrors: ValidationError[];
  onMatrixChange: (newMatrix: string[][]) => void;
  onContextChange: (newContext: ProblemContext) => void;
  onSolve: () => void;
  onClearValues: () => void;
  onRandomizeValues: () => void;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  matrix,
  context,
  validationErrors,
  onMatrixChange,
  onContextChange,
  onSolve,
  onClearValues,
  onRandomizeValues,
}) => {
  const n = matrix.length;

  // Single control to grow: "＋ Add Row & Column" (PRD §4.2)
  const handleAddRowAndColumn = () => {
    const newN = n + 1;

    // Keep newly added row & column as empty string so placeholder is shown without typed data
    const newRows = [...context.rows, ''];
    const newCols = [...context.columns, ''];

    // Expand matrix: add empty column to existing rows, then append new row
    const newMatrix: string[][] = matrix.map((row) => [...row, '']);
    const newLastRow: string[] = new Array(newN).fill('');
    newMatrix.push(newLastRow);

    onContextChange({
      ...context,
      rows: newRows,
      columns: newCols,
    });
    onMatrixChange(newMatrix);
  };

  // Shrink control: Remove last row and column (only allowed if n > 2)
  const handleRemoveRowAndColumn = () => {
    if (n <= 2) return;
    const newRows = context.rows.slice(0, n - 1);
    const newCols = context.columns.slice(0, n - 1);
    const newMatrix = matrix.slice(0, n - 1).map((row) => row.slice(0, n - 1));

    onContextChange({
      ...context,
      rows: newRows,
      columns: newCols,
    });
    onMatrixChange(newMatrix);
  };

  const handleCellChange = (r: number, c: number, value: string) => {
    const updated = matrix.map((row, rIdx) => {
      if (rIdx !== r) return row;
      return row.map((cellVal, cIdx) => (cIdx === c ? value : cellVal));
    });
    onMatrixChange(updated);
  };

  const handleRowLabelChange = (r: number, value: string) => {
    const updatedRows = [...context.rows];
    updatedRows[r] = value;
    onContextChange({ ...context, rows: updatedRows });
  };

  const handleColLabelChange = (c: number, value: string) => {
    const updatedCols = [...context.columns];
    updatedCols[c] = value;
    onContextChange({ ...context, columns: updatedCols });
  };

  // Keyboard navigation across cells and labels via arrow keys
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    r: number,
    c: number
  ) => {
    const input = e.currentTarget;
    const len = input.value.length;
    const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const isAtEnd = input.selectionStart === len && input.selectionEnd === len;
    const isAllSelected = input.selectionStart === 0 && input.selectionEnd === len;

    let targetId: string | null = null;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (r > 0) {
        targetId = `cell-${r - 1}-${c}`;
      } else {
        targetId = `col-label-${c}`;
      }
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (r < n - 1) {
        targetId = `cell-${r + 1}-${c}`;
      } else if (e.key === 'Enter' && c < n - 1) {
        targetId = `cell-0-${c + 1}`;
      }
    } else if (e.key === 'ArrowLeft') {
      if (isAtStart || isAllSelected || len === 0) {
        e.preventDefault();
        if (c > 0) {
          targetId = `cell-${r}-${c - 1}`;
        } else {
          targetId = `row-label-${r}`;
        }
      }
    } else if (e.key === 'ArrowRight') {
      if (isAtEnd || isAllSelected || len === 0) {
        e.preventDefault();
        if (c < n - 1) {
          targetId = `cell-${r}-${c + 1}`;
        }
      }
    }

    if (targetId) {
      const el = document.getElementById(targetId) as HTMLInputElement | null;
      if (el) {
        el.focus();
        el.select();
      }
    }
  };

  const handleColLabelKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    c: number
  ) => {
    let targetId: string | null = null;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      targetId = `cell-0-${c}`;
    } else if (e.key === 'ArrowLeft' && c > 0) {
      const isAtStart = e.currentTarget.selectionStart === 0;
      if (isAtStart) {
        e.preventDefault();
        targetId = `col-label-${c - 1}`;
      }
    } else if (e.key === 'ArrowRight' && c < n - 1) {
      const isAtEnd = e.currentTarget.selectionEnd === e.currentTarget.value.length;
      if (isAtEnd) {
        e.preventDefault();
        targetId = `col-label-${c + 1}`;
      }
    }

    if (targetId) {
      const el = document.getElementById(targetId) as HTMLInputElement | null;
      if (el) {
        el.focus();
        el.select();
      }
    }
  };

  const handleRowLabelKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    r: number
  ) => {
    let targetId: string | null = null;
    if (e.key === 'ArrowRight') {
      const isAtEnd = e.currentTarget.selectionEnd === e.currentTarget.value.length;
      if (isAtEnd) {
        e.preventDefault();
        targetId = `cell-${r}-0`;
      }
    } else if (e.key === 'ArrowUp' && r > 0) {
      e.preventDefault();
      targetId = `row-label-${r - 1}`;
    } else if (e.key === 'ArrowDown' && r < n - 1) {
      e.preventDefault();
      targetId = `row-label-${r + 1}`;
    }

    if (targetId) {
      const el = document.getElementById(targetId) as HTMLInputElement | null;
      if (el) {
        el.focus();
        el.select();
      }
    }
  };

  // Check if a specific cell has an error
  const getCellError = (r: number, c: number) => {
    return validationErrors.find(
      (err) => err.type === 'cell' && err.row === r && err.col === c
    );
  };

  return (
    <section aria-label="Matrix Editor" className="bg-white border border-stone-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
      {/* Matrix Dimension & Utility Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Growth (+) and Shrink (-) Stepper Controls */}
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              id="btn-add-dimension"
              onClick={handleAddRowAndColumn}
              disabled={n >= 8}
              className={`w-8 h-8 inline-flex items-center justify-center rounded-lg font-bold shadow-xs transition-colors cursor-pointer ${
                n >= 8
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}
              title={n >= 8 ? 'Maximum matrix size is 8×8' : 'Add row and column (+)'}
              aria-label="Add row and column"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-remove-dimension"
              onClick={handleRemoveRowAndColumn}
              disabled={n <= 2}
              className={`w-8 h-8 inline-flex items-center justify-center rounded-lg font-bold border transition-colors ${
                n <= 2
                  ? 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700 cursor-pointer'
              }`}
              title={n <= 2 ? 'Minimum matrix size is 2×2' : 'Remove row and column (-)'}
              aria-label="Remove row and column"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            id="btn-randomize"
            onClick={onRandomizeValues}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 transition-colors"
            title="Fill cells with sample numbers"
          >
            <Dice5 className="w-3.5 h-3.5 text-stone-500" />
            Randomize
          </button>

          <button
            type="button"
            id="btn-clear-values"
            onClick={onClearValues}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 transition-colors"
            title="Reset matrix cell inputs to empty"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            Clear
          </button>
        </div>
      </div>

      {/* Inline Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-1">
              Please resolve the following before solving:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-red-700">
              {validationErrors.slice(0, 5).map((err, idx) => (
                <li key={idx}>{err.message}</li>
              ))}
              {validationErrors.length > 5 && (
                <li className="font-medium text-red-600">
                  ...and {validationErrors.length - 5} more issues.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Editable Matrix Grid with Horizontal Scroll */}
      <div className="w-full overflow-x-auto rounded-lg border border-stone-200">
        <table className="border-collapse w-full text-left">
          <thead>
            <tr>
              {/* Corner Entity Header: Diagonal split with Machines (bottom-left) and Operations (top-right) */}
              <th className="relative p-0 bg-stone-100/90 font-semibold text-xs border border-stone-200 min-w-[95px] sm:min-w-[135px] w-[95px] sm:w-[135px] h-[46px] sm:h-[52px] select-none overflow-hidden">
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

                {/* Right (upper-right) portion: Operations */}
                <div className="absolute top-1 right-1.5 sm:top-1.5 sm:right-2 text-right pointer-events-none">
                  <span className="text-[10px] sm:text-[11px] font-bold text-stone-800 tracking-tight">
                    {context.columnEntityCategory === 'Operations' || context.columnEntityName === 'Operation'
                      ? 'Operations'
                      : (context.columnEntityName || 'Operations')}
                  </span>
                </div>

                {/* Left (lower-left) portion: Machines */}
                <div className="absolute bottom-1 left-1.5 sm:bottom-1.5 sm:left-2 text-left pointer-events-none">
                  <span className="text-[10px] sm:text-[11px] font-bold text-stone-700 tracking-tight">
                    {context.rowEntityCategory === 'Machines' || context.rowEntityName === 'Machine'
                      ? 'Machines'
                      : (context.rowEntityName || 'Machines')}
                  </span>
                </div>
              </th>

              {/* Editable Column Headers */}
              {context.columns.slice(0, n).map((colLabel, cIdx) => (
                <th
                  key={cIdx}
                  className="p-1 sm:p-2 text-center bg-stone-50 border border-stone-200 min-w-[62px] sm:min-w-[90px]"
                >
                  <input
                    type="text"
                    id={`col-label-${cIdx}`}
                    value={colLabel || ''}
                    onChange={(e) => handleColLabelChange(cIdx, e.target.value)}
                    onKeyDown={(e) => handleColLabelKeyDown(e, cIdx)}
                    placeholder={context.columnEntityName ? `${context.columnEntityName} ${cIdx + 1}` : `Col ${cIdx + 1}`}
                    className="w-full text-center text-xs font-semibold text-stone-800 bg-transparent px-1 py-1 rounded hover:bg-stone-200/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 truncate"
                    title="Rename column"
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {matrix.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-stone-50/50">
                {/* Editable Row Header */}
                <th className="p-1 sm:p-2 bg-stone-50 border border-stone-200 min-w-[95px] sm:min-w-[135px] w-[95px] sm:w-[135px]">
                  <input
                    type="text"
                    id={`row-label-${rIdx}`}
                    value={context.rows[rIdx] || ''}
                    onChange={(e) => handleRowLabelChange(rIdx, e.target.value)}
                    onKeyDown={(e) => handleRowLabelKeyDown(e, rIdx)}
                    placeholder={context.rowEntityName ? `${context.rowEntityName} ${String.fromCharCode(65 + rIdx)}` : `Row ${rIdx + 1}`}
                    className="w-full text-xs font-semibold text-stone-800 bg-transparent px-1 py-1 rounded hover:bg-stone-200/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 truncate"
                    title="Rename row"
                  />
                </th>

                {/* Editable Matrix Cells */}
                {row.map((val, cIdx) => {
                  const error = getCellError(rIdx, cIdx);
                  return (
                    <td
                      key={cIdx}
                      className={`p-0.5 sm:p-1.5 text-center border border-stone-200 ${
                        error ? 'bg-red-50/70 ring-1 ring-red-400' : 'bg-white'
                      }`}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        id={`cell-${rIdx}-${cIdx}`}
                        value={val}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rIdx, cIdx)}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="0"
                        className={`w-full text-center font-mono text-base sm:text-lg font-bold py-1.5 sm:py-2.5 px-1 sm:px-1.5 rounded transition-colors duration-150 focus:outline-none ${
                          error
                            ? 'text-red-700 font-black focus:ring-2 focus:ring-red-500'
                            : 'text-stone-900 hover:bg-stone-50 focus:bg-amber-50/50 focus:ring-2 focus:ring-amber-500 font-bold'
                        }`}
                        title={`${context.rows[rIdx] || `Row ${rIdx + 1}`} → ${
                          context.columns[cIdx] || `Col ${cIdx + 1}`
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Run Solver CTA */}
      <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
        <button
          type="button"
          id="btn-solve-hungarian"
          onClick={onSolve}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          Solve Problem Step-by-Step
        </button>
      </div>
    </section>
  );
};
