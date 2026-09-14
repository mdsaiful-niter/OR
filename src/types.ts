/**
 * Data Model Contract for Hungarian Method Assignment Solver
 * Specified in PRD Section 5
 */

export type Objective = 'minimize' | 'maximize';

export type StandardRowEntity =
  | 'Workers'
  | 'Machines'
  | 'Employees'
  | 'Operators'
  | 'Students'
  | 'Salesmen'
  | 'Factories'
  | 'Custom';

export type StandardColumnEntity =
  | 'Jobs'
  | 'Operations'
  | 'Tasks'
  | 'Projects'
  | 'Machines'
  | 'Territories'
  | 'Customers'
  | 'Courses'
  | 'Custom';

export interface ProblemContext {
  objective: Objective;
  rowEntityCategory: StandardRowEntity;
  columnEntityCategory: StandardColumnEntity;
  rowEntityCustom: string;
  columnEntityCustom: string;
  rowEntityName: string;
  columnEntityName: string;
  rows: string[];
  columns: string[];
}

export interface AssignmentCell {
  row: number;
  col: number;
  rowLabel: string;
  colLabel: string;
  originalCost: number;
}

export type StepType =
  | 'original'
  | 'maximization-conversion'
  | 'row-reduction'
  | 'column-reduction'
  | 'zero-covering'
  | 'optimality-check'
  | 'matrix-adjustment'
  | 'final-assignment';

export interface CoveringLines {
  rowLines: number[];       // Row indices with lines drawn through them
  colLines: number[];       // Column indices with lines drawn through them
  totalLines: number;
  isOptimal: boolean;
  markedRows: number[];     // Rows marked in König's theorem step
  markedCols: number[];     // Columns marked in König's theorem step
  starredZeros: { row: number; col: number }[]; // Starred (matched) zeros
}

export interface AdjustmentMeta {
  smallestUncovered: number;
  uncoveredCells: { row: number; col: number; from: number; to: number }[];
  intersectionCells: { row: number; col: number; from: number; to: number }[];
  unchangedCount: number;
}

export interface SolutionStep {
  stepNumber: number;
  type: StepType;
  title: string;
  subtitle?: string;
  explanation: string;
  rationale: string;
  matrixBefore?: number[][];
  matrixAfter: number[][];
  meta?: {
    maxOriginalValue?: number;
    rowMinimums?: number[];
    columnMinimums?: number[];
    rowSubtractions?: { row: number; min: number; calculations: string[] }[];
    colSubtractions?: { col: number; min: number; calculations: string[] }[];
    coveringLines?: CoveringLines;
    adjustment?: AdjustmentMeta;
    assignment?: AssignmentCell[];
    totalCost?: number;
  };
}

export interface SolverResult {
  success: boolean;
  steps: SolutionStep[];
  assignments: AssignmentCell[];
  totalValue: number;
  iterationCount: number;
  originalMatrix: number[][];
  problemContext: ProblemContext;
  equationString: string;
  objective: Objective;
  n: number;
}

export interface ValidationError {
  type: 'cell' | 'rowLabel' | 'colLabel';
  row?: number;
  col?: number;
  message: string;
}
