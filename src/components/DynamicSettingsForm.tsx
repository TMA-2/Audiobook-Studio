import React from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { SettingFieldSchema } from '../types';

interface DynamicSettingsFormProps {
  schemas: SettingFieldSchema[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  filterCategory?: 'generation' | 'export' | 'api' | 'editor';
}

export const DynamicSettingsForm: React.FC<DynamicSettingsFormProps> = ({
  schemas,
  values,
  onChange,
  filterCategory,
}) => {
  const filteredSchemas = filterCategory
    ? schemas.filter((s) => s.category === filterCategory)
    : schemas;

  const renderField = (field: SettingFieldSchema) => {
    const value = values[field.key] ?? '';

    switch (field.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer select-none group mt-1">
            <input
              id={`setting-${field.key}`}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(field.key, e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2"
            />
            <div>
              <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                {field.label}
              </span>
              {field.description && (
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{field.description}</p>
              )}
            </div>
          </label>
        );

      case 'enum':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor={`setting-${field.key}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {field.label}
              </label>
              {field.description && (
                <div className="group relative">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-normal">
                    {field.description}
                  </div>
                </div>
              )}
            </div>
            <select
              id={`setting-${field.key}`}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-sm transition-all"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'number':
        const numValue = typeof value === 'number' ? value : parseFloat(value) || field.min || 0;
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label htmlFor={`setting-${field.key}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {field.label}
                </label>
                {field.description && (
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-normal">
                      {field.description}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                {numValue.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                id={`setting-${field.key}`}
                type="range"
                min={field.min ?? 0}
                max={field.max ?? 100}
                step={field.step ?? 1}
                value={numValue}
                onChange={(e) => onChange(field.key, parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-950 accent-indigo-500 border border-slate-800"
              />
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={numValue}
                onChange={(e) => {
                  let v = parseFloat(e.target.value);
                  if (isNaN(v)) return;
                  if (field.min !== undefined && v < field.min) v = field.min;
                  if (field.max !== undefined && v > field.max) v = field.max;
                  onChange(field.key, v);
                }}
                className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center text-xs text-slate-100 font-mono outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor={`setting-${field.key}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {field.label}
              </label>
              {field.description && (
                <div className="group relative">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-normal">
                    {field.description}
                  </div>
                </div>
              )}
            </div>
            <textarea
              id={`setting-${field.key}`}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-sm transition-all placeholder-slate-600 font-sans"
            />
          </div>
        );

      case 'string[]':
        const list: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {field.label}
              </label>
              {field.description && (
                <div className="group relative">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-normal">
                    {field.description}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-950 border border-slate-800 rounded min-h-10">
              {list.length === 0 ? (
                <span className="text-xs text-slate-600 italic px-1 py-0.5">Empty list</span>
              ) : (
                list.map((item, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => onChange(field.key, list.filter((_, i) => i !== index))}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={field.placeholder || "Add item..."}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const val = input.value.trim();
                    if (val && !list.includes(val)) {
                      onChange(field.key, [...list, val]);
                      input.value = '';
                    }
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousSibling as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && !list.includes(val)) {
                    onChange(field.key, [...list, val]);
                    input.value = '';
                  }
                }}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );

      case 'string':
      default:
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor={`setting-${field.key}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {field.label}
              </label>
              {field.description && (
                <div className="group relative">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-normal">
                    {field.description}
                  </div>
                </div>
              )}
            </div>
            <input
              id={`setting-${field.key}`}
              type="text"
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-sm transition-all placeholder-slate-600"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-5">
      {filteredSchemas.map((field) => (
        <div key={field.key} className="space-y-1" id={`form-group-${field.key}`}>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};
