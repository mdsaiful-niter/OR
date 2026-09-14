/**
 * Hungarian Method (Kuhn-Munkres Algorithm) Engine
 * Implements deterministic assignment solving with full educational step logging
 * According to PRD Section 6 & 6.1
 */

import {
  AssignmentCell,
  CoveringLines,
  Objective,
  ProblemContext,
  SolutionStep,
  SolverResult,
} from '../types';

/**
 * Rounds a number to avoid floating-point inaccuracies
 */
export function cleanFloat(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

/**
 * Deep clones a 2D matrix
 */
export function cloneMatrix(m: number[][]): number[][] {
  return m.map((row) => [...row]);
}

/**
 * Maximum Bipartite Matching for Zeros using Augmenting Paths (Kuhn's Algorithm)
 * Given binary adjacency of matrix[r][c] === 0, finds a maximum independent set of zeros.
 */
function findMaximumZeroMatching(matrix: number[][]): {
  matchingSize: number;
  rowToCol: number[];
  colToRow: number[];
  starredZeros: { row: number; col: number }[];
} {
  const n = matrix.length;
  const colToRow = new Array<number>(n).fill(-1);
  const rowToCol = new Array<number>(n).fill(-1);

  // Depth-first search for augmenting path
  function dfs(u: number, visited: boolean[]): boolean {
    for (let v = 0; v < n; v++) {
      if (matrix[u][v] === 0 && !visited[v]) {
        visited[v] = true;
        if (colToRow[v] === -1 || dfs(colToRow[v], visited)) {
          colToRow[v] = u;
          rowToCol[u] = v;
          return true;
        }
      }
    }
    return false;
  }

  // Find augmenting paths
  for (let u = 0; u < n; u++) {
    const visited = new Array<boolean>(n).fill(false);
    dfs(u, visited);
  }

  let matchingSize = 0;
  const starredZeros: { row: number; col: number }[] = [];
  for (let u = 0; u < n; u++) {
    if (rowToCol[u] !== -1) {
      matchingSize++;
      starredZeros.push({ row: u, col: rowToCol[u] });
    }
  }

  return { matchingSize, rowToCol, colToRow, starredZeros };
}

/**
 * Zero-Covering — Exact Marking Procedure (PRD §6.1 & König's Theorem)
 *
 * 1. Find a maximum matching of zeros (starred zeros).
 * 2. Mark every row containing NO starred zero.
 * 3. Repeat until no new rows or columns get marked:
 *    - For each marked row, mark any column containing a zero in that row.
 *    - For each marked column, mark any row containing a starred zero in that column.
 * 4. Draw a ROW line through every UNMARKED row.
 * 5. Draw a COLUMN line through every MARKED column.
 *
 * König's theorem guarantees total lines = maximum matching size = minimum lines needed.
 */
export function computeCoveringLines(matrix: number[][]): CoveringLines {
  const n = matrix.length;
  const { matchingSize, rowToCol, colToRow, starredZeros } = findMaximumZeroMatching(matrix);

  // STEP B: Mark rows and columns
  const markedRows = new Set<number>();
  const markedCols = new Set<number>();

  // Mark rows that contain NO starred zero
  for (let r = 0; r < n; r++) {
    if (rowToCol[r] === -1) {
      markedRows.add(r);
    }
  }

  // Alternating BFS/DFS expansion
  let changed = true;
  while (changed) {
    changed = false;

    // For each marked row, mark any column containing a zero in that row
    for (const r of Array.from(markedRows)) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c] === 0 && !markedCols.has(c)) {
          markedCols.add(c);
          changed = true;
        }
      }
    }

    // For each marked column, mark any row containing a starred zero in that column
    for (const c of Array.from(markedCols)) {
      const assignedRow = colToRow[c];
      if (assignedRow !== -1 && !markedRows.has(assignedRow)) {
        markedRows.add(assignedRow);
        changed = true;
      }
    }
  }

  // STEP C: Draw the lines
  // Draw a ROW line through every UNMARKED row
  const rowLines: number[] = [];
  for (let r = 0; r < n; r++) {
    if (!markedRows.has(r)) {
      rowLines.push(r);
    }
  }

  // Draw a COLUMN line through every MARKED column
  const colLines: number[] = [];
  for (let c = 0; c < n; c++) {
    if (markedCols.has(c)) {
      colLines.push(c);
    }
  }

  const totalLines = rowLines.length + colLines.length;

  return {
    rowLines,
    colLines,
    totalLines,
    isOptimal: totalLines === n,
    markedRows: Array.from(markedRows).sort((a, b) => a - b),
    markedCols: Array.from(markedCols).sort((a, b) => a - b),
    starredZeros,
  };
}

/**
 * Main Solver Function executing the Hungarian Method
 */
export function solveHungarian(
  originalMatrixInput: number[][],
  context: ProblemContext
): SolverResult {
  const n = originalMatrixInput.length;
  const originalMatrix = cloneMatrix(originalMatrixInput);
  const steps: SolutionStep[] = [];
  let stepCounter = 1;

  let workingMatrix = cloneMatrix(originalMatrix);

  // STEP 1: Original Matrix & Maximization Conversion if needed
  const isMax = context.objective === 'maximize';
  const headingType = isMax ? 'Profit Matrix' : 'Cost Matrix';

  steps.push({
    stepNumber: stepCounter++,
    type: 'original',
    title: `Initial ${headingType}`,
    subtitle: `Input order ${n} × ${n}`,
    explanation: `Here is the original ${headingType.toLowerCase()} specified for this assignment problem. Each entry represents the ${
      isMax ? 'profit generated' : 'cost incurred'
    } when assigning a ${context.rowEntityName} to a ${context.columnEntityName}.`,
    rationale:
      'We start with the baseline data without modification. The Hungarian Method relies on relative differentials across rows and columns to find the global optimum.',
    matrixAfter: cloneMatrix(workingMatrix),
  });

  if (isMax) {
    // Find maximum element M in original matrix
    let maxVal = -Infinity;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (workingMatrix[r][c] > maxVal) maxVal = workingMatrix[r][c];
      }
    }

    const converted = cloneMatrix(workingMatrix);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        converted[r][c] = cleanFloat(maxVal - workingMatrix[r][c]);
      }
    }

    steps.push({
      stepNumber: stepCounter++,
      type: 'maximization-conversion',
      title: 'Maximization Conversion (Opportunity Loss / Regret Matrix)',
      subtitle: `Formula: C'(i, j) = M - C(i, j) where M = ${maxVal}`,
      explanation: `This is a maximization problem. The profit matrix is converted into an equivalent minimization matrix before applying the Hungarian Method. We find the largest value in the matrix (M = ${maxVal}) and subtract each cell's profit from M.`,
      rationale:
        'Minimizing opportunity loss (regret) is mathematically equivalent to maximizing total profit. The final profit is always computed from the original matrix values.',
      matrixBefore: cloneMatrix(workingMatrix),
      matrixAfter: cloneMatrix(converted),
      meta: {
        maxOriginalValue: maxVal,
      },
    });

    workingMatrix = converted;
  }

  // STEP 2: Row Reduction
  const matrixBeforeRowRed = cloneMatrix(workingMatrix);
  const rowMinimums: number[] = [];
  const rowSubtractions: { row: number; min: number; calculations: string[] }[] = [];

  for (let r = 0; r < n; r++) {
    let min = Infinity;
    for (let c = 0; c < n; c++) {
      if (workingMatrix[r][c] < min) min = workingMatrix[r][c];
    }
    rowMinimums.push(min);

    const calculations: string[] = [];
    for (let c = 0; c < n; c++) {
      const beforeVal = workingMatrix[r][c];
      const afterVal = cleanFloat(beforeVal - min);
      calculations.push(`${beforeVal} − ${min} = ${afterVal}`);
      workingMatrix[r][c] = afterVal;
    }
    rowSubtractions.push({ row: r, min, calculations });
  }

  steps.push({
    stepNumber: stepCounter++,
    type: 'row-reduction',
    title: 'Row Reduction',
    subtitle: 'Subtract row minimum from each row',
    explanation:
      'We identify the minimum element in each row and subtract it from all elements in that respective row.',
    rationale:
      "Subtracting each row's minimum creates at least one zero per row without changing the optimal assignment, as every valid assignment must choose exactly one element from each row.",
    matrixBefore: matrixBeforeRowRed,
    matrixAfter: cloneMatrix(workingMatrix),
    meta: {
      rowMinimums,
      rowSubtractions,
    },
  });

  // STEP 3: Column Reduction
  const matrixBeforeColRed = cloneMatrix(workingMatrix);
  const columnMinimums: number[] = [];
  const colSubtractions: { col: number; min: number; calculations: string[] }[] = [];

  for (let c = 0; c < n; c++) {
    let min = Infinity;
    for (let r = 0; r < n; r++) {
      if (workingMatrix[r][c] < min) min = workingMatrix[r][c];
    }
    columnMinimums.push(min);

    const calculations: string[] = [];
    for (let r = 0; r < n; r++) {
      const beforeVal = workingMatrix[r][c];
      const afterVal = cleanFloat(beforeVal - min);
      calculations.push(`${beforeVal} − ${min} = ${afterVal}`);
      workingMatrix[r][c] = afterVal;
    }
    colSubtractions.push({ col: c, min, calculations });
  }

  steps.push({
    stepNumber: stepCounter++,
    type: 'column-reduction',
    title: 'Column Reduction',
    subtitle: 'Subtract column minimum from each column',
    explanation:
      'We examine each column of the row-reduced matrix, determine its minimum element, and subtract it from all entries in that column.',
    rationale:
      "Subtracting each column's minimum creates at least one zero in every column while preserving the optimal assignment, as each column must also receive exactly one assignment.",
    matrixBefore: matrixBeforeColRed,
    matrixAfter: cloneMatrix(workingMatrix),
    meta: {
      columnMinimums,
      colSubtractions,
    },
  });

  // Iterative Zero Covering & Matrix Adjustment
  let iteration = 1;
  let isOptimal = false;
  let finalCovering: CoveringLines | null = null;
  const maxIterations = 30; // safety bound

  while (!isOptimal && iteration <= maxIterations) {
    // STEP 4: Zero Covering
    const covering = computeCoveringLines(workingMatrix);
    finalCovering = covering;

    steps.push({
      stepNumber: stepCounter++,
      type: 'zero-covering',
      title: iteration === 1 ? 'Zero Covering' : `Zero Covering (Iteration ${iteration})`,
      subtitle: `${covering.totalLines} lines drawn to cover all zeros`,
      explanation: `We determine the minimum number of straight horizontal and vertical lines needed to cover all zero entries. Using König's theorem, ${covering.totalLines} line(s) (${covering.rowLines.length} horizontal, ${covering.colLines.length} vertical) cover every zero in the matrix.`,
      rationale:
        "König's theorem states that in any bipartite graph, the maximum matching size equals the minimum vertex cover size. Finding minimum covering lines guarantees we test if n independent zeros exist.",
      matrixAfter: cloneMatrix(workingMatrix),
      meta: {
        coveringLines: covering,
      },
    });

    // STEP 5: Optimality Check
    if (covering.isOptimal) {
      isOptimal = true;
      steps.push({
        stepNumber: stepCounter++,
        type: 'optimality-check',
        title: 'Optimality Test Satisfied',
        subtitle: `Minimum lines (${covering.totalLines}) == Matrix order (${n})`,
        explanation: `✅ Optimality condition satisfied! The minimum number of lines required to cover all zeros (${covering.totalLines}) equals the dimension of the matrix (${n}). An optimal, complete set of independent zeros is available.`,
        rationale:
          'When n lines are required, we can select n zeros such that no two share the same row or column. We can now assign each entity to a zero-cost cell.',
        matrixAfter: cloneMatrix(workingMatrix),
        meta: {
          coveringLines: covering,
        },
      });
      break;
    } else {
      steps.push({
        stepNumber: stepCounter++,
        type: 'optimality-check',
        title: `Optimality Test (Iteration ${iteration})`,
        subtitle: `Lines (${covering.totalLines}) < Matrix order (${n}) — Adjustment Required`,
        explanation: `⚠️ Optimality condition not satisfied. Only ${covering.totalLines} line(s) were required to cover all zeros, which is strictly less than the matrix dimension (${n}). A complete assignment using current zeros is impossible; matrix adjustment is required to reveal new zeros.`,
        rationale:
          'Fewer than n lines means the maximum independent set of zeros has size less than n. We must redistribute values to create additional independent zeros.',
        matrixAfter: cloneMatrix(workingMatrix),
        meta: {
          coveringLines: covering,
        },
      });

      // STEP 6: Matrix Adjustment
      // Find smallest uncovered value k
      let k = Infinity;
      const rowLineSet = new Set(covering.rowLines);
      const colLineSet = new Set(covering.colLines);

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (!rowLineSet.has(r) && !colLineSet.has(c)) {
            if (workingMatrix[r][c] < k) {
              k = workingMatrix[r][c];
            }
          }
        }
      }

      // If k is still Infinity or <= 0 (edge case safeguard)
      if (k === Infinity || k <= 0) {
        k = 1;
      }

      const matrixBeforeAdj = cloneMatrix(workingMatrix);
      const uncoveredCells: { row: number; col: number; from: number; to: number }[] = [];
      const intersectionCells: { row: number; col: number; from: number; to: number }[] = [];
      let unchangedCount = 0;

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const isRowCovered = rowLineSet.has(r);
          const isColCovered = colLineSet.has(c);

          if (!isRowCovered && !isColCovered) {
            // Uncovered: subtract k
            const from = workingMatrix[r][c];
            const to = cleanFloat(from - k);
            workingMatrix[r][c] = to;
            uncoveredCells.push({ row: r, col: c, from, to });
          } else if (isRowCovered && isColCovered) {
            // Intersection: add k
            const from = workingMatrix[r][c];
            const to = cleanFloat(from + k);
            workingMatrix[r][c] = to;
            intersectionCells.push({ row: r, col: c, from, to });
          } else {
            // Covered by single line: unchanged
            unchangedCount++;
          }
        }
      }

      steps.push({
        stepNumber: stepCounter++,
        type: 'matrix-adjustment',
        title: `Matrix Adjustment ${iteration}`,
        subtitle: `Smallest uncovered value k = ${k}`,
        explanation: `Smallest uncovered value k = ${k}. We subtract ${k} from every uncovered cell, add ${k} to every cell at the intersection of two covering lines, and leave cells covered by exactly one line unchanged.`,
        rationale:
          'Subtracting k from uncovered elements exposes at least one new zero. Adding k to double-covered cells compensates for the subtraction effect on those lines, keeping the relative differential valid.',
        matrixBefore: matrixBeforeAdj,
        matrixAfter: cloneMatrix(workingMatrix),
        meta: {
          adjustment: {
            smallestUncovered: k,
            uncoveredCells,
            intersectionCells,
            unchangedCount,
          },
          coveringLines: covering,
        },
      });

      iteration++;
    }
  }

  // STEP 7 / FINAL: Assignment Selection
  // Extract independent zeros from the matching
  const matching = findMaximumZeroMatching(workingMatrix);
  const assignments: AssignmentCell[] = [];
  let totalValue = 0;

  for (let r = 0; r < n; r++) {
    const c = matching.rowToCol[r];
    const origCost = originalMatrix[r][c];
    totalValue = cleanFloat(totalValue + origCost);
    assignments.push({
      row: r,
      col: c,
      rowLabel: context.rows[r] || `${context.rowEntityName} ${r + 1}`,
      colLabel: context.columns[c] || `${context.columnEntityName} ${c + 1}`,
      originalCost: origCost,
    });
  }

  const calculationTerms = assignments.map((a) => `${a.originalCost}`).join(' + ');
  const metricLabel = isMax ? 'Maximum Profit' : 'Minimum Cost';
  const equationString = `${metricLabel} = (${calculationTerms}) = ${totalValue} units`;

  steps.push({
    stepNumber: stepCounter++,
    type: 'final-assignment',
    title: 'Optimal Assignment Selection',
    subtitle: `${assignments.length} independent zero assignments`,
    explanation: `We select independent zeros such that exactly one zero is assigned per row and per column. Highlighting these independent zeros identifies the optimal assignment.`,
    rationale:
      'Because all selected cells have a reduced value of 0, the sum of reduced costs is 0 (the absolute theoretical minimum of the reduced system). This guarantees the corresponding assignment in the original matrix is globally optimal.',
    matrixAfter: cloneMatrix(workingMatrix),
    meta: {
      assignment: assignments,
      totalCost: totalValue,
      coveringLines: finalCovering || undefined,
    },
  });

  return {
    success: true,
    steps,
    assignments,
    totalValue,
    iterationCount: iteration,
    originalMatrix,
    problemContext: context,
    equationString,
    objective: context.objective,
    n,
  };
}
