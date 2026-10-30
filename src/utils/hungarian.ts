/**
 * Hungarian Method (Kuhn-Munkres Algorithm) Engine
 * Implements deterministic assignment solving with full educational step logging
 * According to PRD Section 6 & 6.1
 * Supports Multiple Optimal Solutions Detection and Restricted Assignment Problems ("00" / Big-M)
 */

import {
  AlternativeSolution,
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
 * Given binary adjacency of matrix[r][c] === 0 (excluding restricted cells),
 * finds a maximum independent set of zeros.
 */
export function findMaximumZeroMatching(
  matrix: number[][],
  restrictedCells?: boolean[][]
): {
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
      const isRestricted = Boolean(restrictedCells?.[u]?.[v]);
      if (matrix[u][v] === 0 && !isRestricted && !visited[v]) {
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
export function computeCoveringLines(
  matrix: number[][],
  restrictedCells?: boolean[][]
): CoveringLines {
  const n = matrix.length;
  const { rowToCol, colToRow, starredZeros } = findMaximumZeroMatching(matrix, restrictedCells);

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

    // For each marked row, mark any column containing an unrestricted zero in that row
    for (const r of Array.from(markedRows)) {
      for (let c = 0; c < n; c++) {
        const isRestricted = Boolean(restrictedCells?.[r]?.[c]);
        if (matrix[r][c] === 0 && !isRestricted && !markedCols.has(c)) {
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
 * Searches for all alternative optimal assignments using zero-cost cells in the reduced matrix.
 * In the Hungarian Method, any perfect matching of zeros in the optimal reduced matrix
 * yields the exact same minimum cost (or maximum profit).
 */
export function findAllOptimalZeroAssignments(
  reducedMatrix: number[][],
  restrictedCells: boolean[][],
  originalMatrix: number[][],
  context: ProblemContext,
  objective: Objective
): AlternativeSolution[] {
  const n = reducedMatrix.length;
  const solutions: AlternativeSolution[] = [];
  const usedCols = new Array<boolean>(n).fill(false);
  const currentAssignment = new Array<number>(n).fill(-1);

  // Depth-first backtracking to find all zero matchings of size n
  function backtrack(row: number) {
    if (solutions.length >= 20) return; // Safeguard against combinatorial explosions

    if (row === n) {
      const assignments: AssignmentCell[] = [];
      let total = 0;

      for (let r = 0; r < n; r++) {
        const c = currentAssignment[r];
        const isRestr = Boolean(restrictedCells[r]?.[c]);
        const cost = isRestr ? 0 : originalMatrix[r][c];
        if (!isRestr) {
          total = cleanFloat(total + cost);
        }

        assignments.push({
          row: r,
          col: c,
          rowLabel: context.rows[r] || `${context.rowEntityName} ${r + 1}`,
          colLabel: context.columns[c] || `${context.columnEntityName} ${c + 1}`,
          originalCost: isRestr ? 0 : originalMatrix[r][c],
          isRestricted: isRestr,
        });
      }

      const metricLabel = objective === 'maximize' ? 'Maximum Profit' : 'Minimum Cost';
      const terms = assignments
        .map((a) => (a.isRestricted ? 'M (Restricted)' : `${a.originalCost}`))
        .join(' + ');
      const eq = `${metricLabel} = (${terms}) = ${total} units`;

      solutions.push({
        solutionIndex: solutions.length + 1,
        assignments,
        equationString: eq,
        totalValue: total,
      });
      return;
    }

    // Try each candidate column that has reduced value 0 and is not restricted
    for (let c = 0; c < n; c++) {
      if (reducedMatrix[row][c] === 0 && !usedCols[c] && !restrictedCells[row]?.[c]) {
        usedCols[c] = true;
        currentAssignment[row] = c;
        backtrack(row + 1);
        usedCols[c] = false;
        currentAssignment[row] = -1;
      }
    }
  }

  backtrack(0);

  // If no feasible solution exists without using restricted cells (infeasible problem):
  // perform a fallback search so the user can inspect the closest solution and see the violation
  if (solutions.length === 0) {
    function backtrackFallback(row: number) {
      if (solutions.length >= 1) return;
      if (row === n) {
        const assignments: AssignmentCell[] = [];
        let total = 0;
        for (let r = 0; r < n; r++) {
          const c = currentAssignment[r];
          const isRestr = Boolean(restrictedCells[r]?.[c]);
          const cost = isRestr ? 0 : originalMatrix[r][c];
          if (!isRestr) total = cleanFloat(total + cost);
          assignments.push({
            row: r,
            col: c,
            rowLabel: context.rows[r] || `${context.rowEntityName} ${r + 1}`,
            colLabel: context.columns[c] || `${context.columnEntityName} ${c + 1}`,
            originalCost: cost,
            isRestricted: isRestr,
          });
        }
        const metricLabel = objective === 'maximize' ? 'Maximum Profit' : 'Minimum Cost';
        const terms = assignments
          .map((a) => (a.isRestricted ? 'M (Restricted)' : `${a.originalCost}`))
          .join(' + ');
        solutions.push({
          solutionIndex: 1,
          assignments,
          equationString: `${metricLabel} = (${terms}) [Infeasible: Restricted Cell Chosen]`,
          totalValue: total,
        });
        return;
      }
      for (let c = 0; c < n; c++) {
        if (reducedMatrix[row][c] === 0 && !usedCols[c]) {
          usedCols[c] = true;
          currentAssignment[row] = c;
          backtrackFallback(row + 1);
          usedCols[c] = false;
          currentAssignment[row] = -1;
        }
      }
    }
    backtrackFallback(0);
  }

  return solutions;
}

/**
 * Main Solver Function executing the Hungarian Method
 * Supports both standard assignment problems and Restricted Assignment problems ("00" / Big-M)
 * Detects whether multiple optimal solutions exist and details all alternate assignments.
 */
export function solveHungarian(
  originalMatrixInput: number[][],
  context: ProblemContext,
  restrictedCellsInput?: boolean[][]
): SolverResult {
  const n = originalMatrixInput.length;
  const originalMatrix = cloneMatrix(originalMatrixInput);

  const restrictedCells =
    restrictedCellsInput && restrictedCellsInput.length === n
      ? restrictedCellsInput.map((row) => [...row])
      : Array.from({ length: n }, () => Array(n).fill(false));

  const isRestrictedProblem = restrictedCells.some((row) => row.some(Boolean));

  // Determine Big-M penalty for restricted assignments
  let maxUnrestrictedVal = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!restrictedCells[r][c]) {
        maxUnrestrictedVal = Math.max(maxUnrestrictedVal, Math.abs(originalMatrixInput[r][c]));
      }
    }
  }
  const BIG_M = Math.max(1000000, maxUnrestrictedVal * 10000 + 100000);

  const steps: SolutionStep[] = [];
  let stepCounter = 1;

  // Initialize working matrix: replace restricted cells with Big-M penalty
  let workingMatrix = cloneMatrix(originalMatrix);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (restrictedCells[r][c]) {
        workingMatrix[r][c] = context.objective === 'maximize' ? -BIG_M : BIG_M;
      }
    }
  }

  // STEP 1: Original Matrix & Maximization Conversion if needed
  const isMax = context.objective === 'maximize';
  const headingType = isMax ? 'Profit Matrix' : 'Cost Matrix';

  const restrictionNotice = isRestrictedProblem
    ? " Cell(s) marked with '00' represent restricted/prohibited assignments and are assigned an infinite penalty cost M (Big-M method) so they are excluded from the optimal assignment."
    : '';

  steps.push({
    stepNumber: stepCounter++,
    type: 'original',
    title: `Initial ${headingType}${isRestrictedProblem ? ' (Restricted Problem)' : ''}`,
    subtitle: `Input order ${n} × ${n}${isRestrictedProblem ? ' • Contains Restricted (00) Cells' : ''}`,
    explanation: `Here is the original ${headingType.toLowerCase()} specified for this assignment problem.${restrictionNotice} Each entry represents the ${
      isMax ? 'profit generated' : 'cost incurred'
    } when assigning a ${context.rowEntityName} to a ${context.columnEntityName}.`,
    rationale:
      'We establish baseline values. In restricted assignment problems, assigning a large penalty M prevents forbidden pairings from entering the basis without altering relative trade-offs among feasible pairs.',
    matrixAfter: cloneMatrix(workingMatrix),
    meta: {
      isRestrictedProblem,
      restrictedCells,
    },
  });

  if (isMax) {
    // Find maximum element M in original matrix among unrestricted cells
    let maxVal = -Infinity;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!restrictedCells[r][c] && workingMatrix[r][c] > maxVal) {
          maxVal = workingMatrix[r][c];
        }
      }
    }
    if (maxVal === -Infinity) maxVal = 0;

    const converted = cloneMatrix(workingMatrix);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (restrictedCells[r][c]) {
          converted[r][c] = BIG_M;
        } else {
          converted[r][c] = cleanFloat(maxVal - workingMatrix[r][c]);
        }
      }
    }

    steps.push({
      stepNumber: stepCounter++,
      type: 'maximization-conversion',
      title: 'Maximization Conversion (Opportunity Loss / Regret Matrix)',
      subtitle: `Formula: C'(i, j) = M - C(i, j) where M = ${maxVal}`,
      explanation: `This is a maximization problem. The profit matrix is converted into an equivalent minimization matrix before applying the Hungarian Method. We find the largest profit among feasible cells (M = ${maxVal}) and subtract each cell's profit from M. Restricted cells retain the large penalty cost M.${restrictionNotice}`,
      rationale:
        'Minimizing opportunity loss (regret) is mathematically equivalent to maximizing total profit. Final profit calculations will strictly use original values.',
      matrixBefore: cloneMatrix(workingMatrix),
      matrixAfter: cloneMatrix(converted),
      meta: {
        maxOriginalValue: maxVal,
        isRestrictedProblem,
        restrictedCells,
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
      if (!restrictedCells[r][c] && workingMatrix[r][c] < min) {
        min = workingMatrix[r][c];
      }
    }
    if (min === Infinity) min = 0;
    rowMinimums.push(min);

    const calculations: string[] = [];
    for (let c = 0; c < n; c++) {
      if (restrictedCells[r][c]) {
        calculations.push(`M − ${min} = M (Restricted)`);
        workingMatrix[r][c] = BIG_M;
      } else {
        const beforeVal = workingMatrix[r][c];
        const afterVal = cleanFloat(beforeVal - min);
        calculations.push(`${beforeVal} − ${min} = ${afterVal}`);
        workingMatrix[r][c] = afterVal;
      }
    }
    rowSubtractions.push({ row: r, min, calculations });
  }

  steps.push({
    stepNumber: stepCounter++,
    type: 'row-reduction',
    title: 'Row Reduction',
    subtitle: 'Subtract row minimum from each row',
    explanation:
      'We identify the minimum element among feasible cells in each row and subtract it from all elements in that respective row. Restricted cells (00) retain their high penalty cost M.',
    rationale:
      "Subtracting each row's minimum creates at least one zero per row without changing the optimal assignment, as every valid assignment must choose exactly one element from each row.",
    matrixBefore: matrixBeforeRowRed,
    matrixAfter: cloneMatrix(workingMatrix),
    meta: {
      rowMinimums,
      rowSubtractions,
      isRestrictedProblem,
      restrictedCells,
    },
  });

  // STEP 3: Column Reduction
  const matrixBeforeColRed = cloneMatrix(workingMatrix);
  const columnMinimums: number[] = [];
  const colSubtractions: { col: number; min: number; calculations: string[] }[] = [];

  for (let c = 0; c < n; c++) {
    let min = Infinity;
    for (let r = 0; r < n; r++) {
      if (!restrictedCells[r][c] && workingMatrix[r][c] < min) {
        min = workingMatrix[r][c];
      }
    }
    if (min === Infinity) min = 0;
    columnMinimums.push(min);

    const calculations: string[] = [];
    for (let r = 0; r < n; r++) {
      if (restrictedCells[r][c]) {
        calculations.push(`M − ${min} = M (Restricted)`);
        workingMatrix[r][c] = BIG_M;
      } else {
        const beforeVal = workingMatrix[r][c];
        const afterVal = cleanFloat(beforeVal - min);
        calculations.push(`${beforeVal} − ${min} = ${afterVal}`);
        workingMatrix[r][c] = afterVal;
      }
    }
    colSubtractions.push({ col: c, min, calculations });
  }

  steps.push({
    stepNumber: stepCounter++,
    type: 'column-reduction',
    title: 'Column Reduction',
    subtitle: 'Subtract column minimum from each column',
    explanation:
      'We examine each column of the row-reduced matrix, determine its minimum element among feasible entries, and subtract it from all entries in that column.',
    rationale:
      "Subtracting each column's minimum creates at least one zero in every column while preserving the optimal assignment, as each column must also receive exactly one assignment.",
    matrixBefore: matrixBeforeColRed,
    matrixAfter: cloneMatrix(workingMatrix),
    meta: {
      columnMinimums,
      colSubtractions,
      isRestrictedProblem,
      restrictedCells,
    },
  });

  // Iterative Zero Covering & Matrix Adjustment
  let iteration = 1;
  let isOptimal = false;
  let finalCovering: CoveringLines | null = null;
  const maxIterations = 30; // Safety bound

  while (!isOptimal && iteration <= maxIterations) {
    // STEP 4: Zero Covering
    const covering = computeCoveringLines(workingMatrix, restrictedCells);
    finalCovering = covering;

    steps.push({
      stepNumber: stepCounter++,
      type: 'zero-covering',
      title: iteration === 1 ? 'Zero Covering' : `Zero Covering (Iteration ${iteration})`,
      subtitle: `${covering.totalLines} lines drawn to cover all zeros`,
      explanation: `We determine the minimum number of straight horizontal and vertical lines needed to cover all zero entries (excluding restricted cells). Using König's theorem, ${covering.totalLines} line(s) (${covering.rowLines.length} horizontal, ${covering.colLines.length} vertical) cover every zero in the matrix.`,
      rationale:
        "König's theorem states that in any bipartite graph, the maximum matching size equals the minimum vertex cover size. Finding minimum covering lines guarantees we test if n independent zeros exist.",
      matrixAfter: cloneMatrix(workingMatrix),
      meta: {
        coveringLines: covering,
        isRestrictedProblem,
        restrictedCells,
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
          isRestrictedProblem,
          restrictedCells,
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
          isRestrictedProblem,
          restrictedCells,
        },
      });

      // STEP 6: Matrix Adjustment
      // Find smallest uncovered value k strictly among UNRESTRICTED cells
      let k = Infinity;
      const rowLineSet = new Set(covering.rowLines);
      const colLineSet = new Set(covering.colLines);

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (!rowLineSet.has(r) && !colLineSet.has(c) && !restrictedCells[r][c]) {
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
          if (restrictedCells[r][c]) {
            workingMatrix[r][c] = BIG_M;
            continue;
          }

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
        explanation: `Smallest uncovered value k = ${k}. We subtract ${k} from every uncovered cell, add ${k} to every cell at the intersection of two covering lines, and leave cells covered by exactly one line unchanged. Restricted cells (00) retain penalty M.`,
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
          isRestrictedProblem,
          restrictedCells,
        },
      });

      iteration++;
    }
  }

  // STEP 7 / FINAL: Assignment Selection & Alternative Solutions Detection
  const allSolutions = findAllOptimalZeroAssignments(
    workingMatrix,
    restrictedCells,
    originalMatrix,
    context,
    context.objective
  );

  const hasMultipleSolutions = allSolutions.length > 1;
  const totalSolutionsCount = allSolutions.length;
  const primarySolution = allSolutions[0] || {
    solutionIndex: 1,
    assignments: [],
    equationString: '',
    totalValue: 0,
  };

  const assignments = primarySolution.assignments;
  const totalValue = primarySolution.totalValue;
  const equationString = primarySolution.equationString;
  const isInfeasible = assignments.some((a) => a.isRestricted);

  let finalExplanation =
    'We select independent zeros such that exactly one zero is assigned per row and per column.';

  if (hasMultipleSolutions) {
    finalExplanation += `\n\n📢 Multiple Optimal Solutions Detected! This problem has ${totalSolutionsCount} alternate optimal assignments that all yield the exact same ${
      isMax ? 'maximum profit' : 'minimum cost'
    } of ${totalValue} units. You can review all alternative solutions in the results card below.`;
  } else {
    finalExplanation +=
      '\n\n✨ Unique Optimal Solution: Exactly one unique set of independent zeros achieves the global optimum.';
  }

  if (isRestrictedProblem) {
    finalExplanation += isInfeasible
      ? "\n\n⚠️ Warning: Due to severe constraints, at least one restricted assignment ('00') had to be assigned. This problem is infeasible under current constraints."
      : "\n\n🔒 Restricted Assignment Successful: All cells marked with '00' were successfully excluded from the optimal assignment.";
  }

  steps.push({
    stepNumber: stepCounter++,
    type: 'final-assignment',
    title: hasMultipleSolutions
      ? `Optimal Assignment Selection (${totalSolutionsCount} Multiple Solutions Found)`
      : 'Optimal Assignment Selection (Unique Optimal Solution)',
    subtitle: `${assignments.length} independent zero assignments${
      hasMultipleSolutions ? ` • ${totalSolutionsCount} Alternate Solutions Available` : ''
    }`,
    explanation: finalExplanation,
    rationale:
      'Because all selected cells have a reduced value of 0, the sum of reduced costs is 0 (the absolute theoretical minimum of the reduced system). This guarantees the corresponding assignment in the original matrix is globally optimal.',
    matrixAfter: cloneMatrix(workingMatrix),
    meta: {
      assignment: assignments,
      totalCost: totalValue,
      coveringLines: finalCovering || undefined,
      hasMultipleSolutions,
      totalSolutionsCount,
      allSolutions,
      isRestrictedProblem,
      restrictedCells,
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
    hasMultipleSolutions,
    totalSolutionsCount,
    allSolutions,
    isRestrictedProblem,
    restrictedCells,
    isInfeasible,
  };
}
