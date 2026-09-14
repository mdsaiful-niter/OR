import React from 'react';
import {
  Objective,
  ProblemContext,
  StandardColumnEntity,
  StandardRowEntity,
} from '../types';
import { BookOpen, TrendingDown, TrendingUp } from 'lucide-react';

interface ProblemSetupProps {
  context: ProblemContext;
  onContextChange: (ctx: ProblemContext) => void;
}

const ROW_ENTITIES: StandardRowEntity[] = [
  'Machines',
  'Workers',
  'Employees',
  'Operators',
  'Students',
  'Salesmen',
  'Factories',
  'Custom',
];

const COLUMN_ENTITIES: StandardColumnEntity[] = [
  'Operations',
  'Jobs',
  'Tasks',
  'Projects',
  'Machines',
  'Territories',
  'Customers',
  'Courses',
  'Custom',
];

export const ProblemSetup: React.FC<ProblemSetupProps> = ({
  context,
  onContextChange,
}) => {
  const handleObjectiveChange = (objective: Objective) => {
    onContextChange({ ...context, objective });
  };

  const handleRowEntityChange = (category: StandardRowEntity) => {
    let resolvedName: string = category;
    if (category === 'Custom') {
      resolvedName = context.rowEntityCustom.trim() || 'Entity';
    } else {
      // Singularize standard entity name if plural
      resolvedName = category.endsWith('s') ? category.slice(0, -1) : category;
    }

    // Preserve typed custom labels or keep empty to show updated placeholder
    const updatedRows = context.rows.map((existing, i) =>
      existing && existing.trim() !== '' ? `${resolvedName} ${String.fromCharCode(65 + i)}` : ''
    );

    onContextChange({
      ...context,
      rowEntityCategory: category,
      rowEntityName: resolvedName,
      rows: updatedRows,
    });
  };

  const handleCustomRowNameChange = (val: string) => {
    const trimmed = val.trim();
    const resolvedName = trimmed || 'Entity';
    const updatedRows = context.rows.map((existing, i) =>
      existing && existing.trim() !== '' ? `${resolvedName} ${String.fromCharCode(65 + i)}` : ''
    );

    onContextChange({
      ...context,
      rowEntityCustom: val,
      rowEntityName: resolvedName,
      rows: updatedRows,
    });
  };

  const handleColEntityChange = (category: StandardColumnEntity) => {
    let resolvedName: string = category;
    if (category === 'Custom') {
      resolvedName = context.columnEntityCustom.trim() || 'Target';
    } else {
      resolvedName = category.endsWith('s') ? category.slice(0, -1) : category;
    }

    const updatedCols = context.columns.map((existing, i) =>
      existing && existing.trim() !== '' ? `${resolvedName} ${i + 1}` : ''
    );

    onContextChange({
      ...context,
      columnEntityCategory: category,
      columnEntityName: resolvedName,
      columns: updatedCols,
    });
  };

  const handleCustomColNameChange = (val: string) => {
    const trimmed = val.trim();
    const resolvedName = trimmed || 'Target';
    const updatedCols = context.columns.map((existing, i) =>
      existing && existing.trim() !== '' ? `${resolvedName} ${i + 1}` : ''
    );

    onContextChange({
      ...context,
      columnEntityCustom: val,
      columnEntityName: resolvedName,
      columns: updatedCols,
    });
  };

  return (
    <section aria-labelledby="problem-setup-heading" className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
      <div className="border-b border-stone-100 pb-4 mb-5">
        <h2 id="problem-setup-heading" className="text-base font-bold text-stone-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-stone-700" />
          1. Problem Context Setup
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Objective Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Objective
          </label>
          <div className="inline-flex rounded-lg p-1 bg-stone-100 border border-stone-200">
            <button
              type="button"
              id="btn-objective-minimize"
              onClick={() => handleObjectiveChange('minimize')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                context.objective === 'minimize'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              Minimize (Cost / Time)
            </button>
            <button
              type="button"
              id="btn-objective-maximize"
              onClick={() => handleObjectiveChange('maximize')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                context.objective === 'maximize'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              Maximize (Profit)
            </button>
          </div>
        </div>

        {/* Row Entity (Source) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="row-entity-select" className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Row Entity (Assignees)
          </label>
          <select
            id="row-entity-select"
            value={context.rowEntityCategory}
            onChange={(e) => handleRowEntityChange(e.target.value as StandardRowEntity)}
            className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {ROW_ENTITIES.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
          {context.rowEntityCategory === 'Custom' && (
            <input
              type="text"
              id="row-entity-custom-input"
              value={context.rowEntityCustom}
              onChange={(e) => handleCustomRowNameChange(e.target.value)}
              placeholder="e.g. Subcontractors, Drivers"
              className="mt-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          )}
          <span className="text-[11px] text-stone-500">
            Active label: <span className="font-semibold text-stone-700">{context.rowEntityName}</span>
          </span>
        </div>

        {/* Column Entity (Destination) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="col-entity-select" className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Column Entity (Tasks / Targets)
          </label>
          <select
            id="col-entity-select"
            value={context.columnEntityCategory}
            onChange={(e) => handleColEntityChange(e.target.value as StandardColumnEntity)}
            className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {COLUMN_ENTITIES.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
          {context.columnEntityCategory === 'Custom' && (
            <input
              type="text"
              id="col-entity-custom-input"
              value={context.columnEntityCustom}
              onChange={(e) => handleCustomColNameChange(e.target.value)}
              placeholder="e.g. Routes, Deliveries"
              className="mt-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          )}
          <span className="text-[11px] text-stone-500">
            Active label: <span className="font-semibold text-stone-700">{context.columnEntityName}</span>
          </span>
        </div>
      </div>
    </section>
  );
};
