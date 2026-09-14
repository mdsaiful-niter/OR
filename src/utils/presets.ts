/**
 * Preset Assignment Problems for classroom teaching and quick testing
 */

import { ProblemContext } from '../types';

export interface PresetProblem {
  id: string;
  name: string;
  description: string;
  context: ProblemContext;
  matrix: number[][];
}

export const PRESET_PROBLEMS: PresetProblem[] = [
  {
    id: 'worked-example-3x3',
    name: 'PRD Worked Example (3 × 3 Machines)',
    description: 'Directly from PRD §15: Machine assignment to Cutting, Sewing, Finishing.',
    context: {
      objective: 'minimize',
      rowEntityCategory: 'Machines',
      columnEntityCategory: 'Operations',
      rowEntityCustom: '',
      columnEntityCustom: '',
      rowEntityName: 'Machine',
      columnEntityName: 'Operation',
      rows: ['Machine A', 'Machine B', 'Machine C'],
      columns: ['Cutting', 'Sewing', 'Finishing'],
    },
    matrix: [
      [9, 2, 7],
      [6, 4, 3],
      [5, 8, 1],
    ],
  },
  {
    id: 'textbook-adjustment-4x4',
    name: 'Textbook 4 × 4 (Requires Matrix Adjustment)',
    description: 'Demonstrates zero-covering lines < n and smallest uncovered element k adjustment.',
    context: {
      objective: 'minimize',
      rowEntityCategory: 'Workers',
      columnEntityCategory: 'Jobs',
      rowEntityCustom: '',
      columnEntityCustom: '',
      rowEntityName: 'Worker',
      columnEntityName: 'Job',
      rows: ['Worker 1', 'Worker 2', 'Worker 3', 'Worker 4'],
      columns: ['Job A', 'Job B', 'Job C', 'Job D'],
    },
    matrix: [
      [8, 2, 5, 7],
      [3, 2, 7, 4],
      [4, 1, 6, 8],
      [6, 4, 3, 2],
    ],
  },
  {
    id: 'maximization-sales-3x3',
    name: 'Profit Maximization (3 × 3 Sales Territories)',
    description: 'Demonstrates Opportunity Loss (Regret) matrix conversion C\'(i,j) = M - C(i,j).',
    context: {
      objective: 'maximize',
      rowEntityCategory: 'Salesmen',
      columnEntityCategory: 'Territories',
      rowEntityCustom: '',
      columnEntityCustom: '',
      rowEntityName: 'Salesman',
      columnEntityName: 'Territory',
      rows: ['Salesman Alpha', 'Salesman Beta', 'Salesman Gamma'],
      columns: ['Territory North', 'Territory Central', 'Territory South'],
    },
    matrix: [
      [25, 30, 18],
      [32, 28, 22],
      [20, 35, 24],
    ],
  },
  {
    id: 'elementary-2x2',
    name: 'Minimal Base Case (2 × 2)',
    description: 'Quick check of a 2x2 employee task assignment.',
    context: {
      objective: 'minimize',
      rowEntityCategory: 'Employees',
      columnEntityCategory: 'Tasks',
      rowEntityCustom: '',
      columnEntityCustom: '',
      rowEntityName: 'Employee',
      columnEntityName: 'Task',
      rows: ['Employee 1', 'Employee 2'],
      columns: ['Task 1', 'Task 2'],
    },
    matrix: [
      [12, 18],
      [15, 11],
    ],
  },
  {
    id: 'multi-iteration-4x4',
    name: 'Standard Operations Research 4 × 4',
    description: 'Classic university examination assignment problem with multiple zero chains.',
    context: {
      objective: 'minimize',
      rowEntityCategory: 'Operators',
      columnEntityCategory: 'Machines',
      rowEntityCustom: '',
      columnEntityCustom: '',
      rowEntityName: 'Operator',
      columnEntityName: 'Machine',
      rows: ['Operator 1', 'Operator 2', 'Operator 3', 'Operator 4'],
      columns: ['Machine 1', 'Machine 2', 'Machine 3', 'Machine 4'],
    },
    matrix: [
      [10, 12, 19, 11],
      [5, 10, 7, 8],
      [12, 14, 13, 11],
      [8, 15, 11, 9],
    ],
  },
];
