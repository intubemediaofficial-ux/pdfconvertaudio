"use client";

import { useState, type ReactNode } from "react";
import { downloadCSV, downloadXLSX, downloadText, type Row } from "@/lib/creator/export";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function Spinner({ label = "Working…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-gray-500" role="status">
      <span className="w-6 h-6 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      <span className="font-medium">{label}</span>
    </div>
  );
}

export function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">{error}</div>;
}

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const t = document.createElement("textarea");
          t.value = text;
          document.body.appendChild(t);
          t.select();
          document.execCommand("copy");
          t.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 ${className}`}
    >
      {done ? "✓ Copied" : `📋 ${label}`}
    </button>
  );
}

export function SearchForm({
  placeholder,
  button = "Go",
  onSubmit,
  loading,
  defaultValue = "",
  multiline = false,
  children,
}: {
  placeholder: string;
  button?: string;
  onSubmit: (v: string) => void;
  loading?: boolean;
  defaultValue?: string;
  multiline?: boolean;
  children?: ReactNode;
}) {
  const [v, setV] = useState(defaultValue);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() && !loading) onSubmit(v.trim());
      }}
      className="space-y-3"
    >
      <div className={`flex ${multiline ? "flex-col" : "flex-col sm:flex-row"} gap-3`}>
        {multiline ? (
          <textarea value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} rows={5} className="input-field flex-1 min-w-0" />
        ) : (
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className="input-field flex-1 min-w-0" />
        )}
        <button type="submit" disabled={loading || !v.trim()} className="btn-primary !px-8 !py-3 !text-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
          {loading ? "Please wait…" : button}
        </button>
      </div>
      {children}
    </form>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="setting-label block mb-1">{label}</span>
      {children}
    </label>
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field w-full">
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 min-w-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl sm:text-2xl font-extrabold text-gray-900 break-words">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export function Chips({ items, onRemove, prefix = "" }: { items: string[]; onRemove?: (i: number) => void; prefix?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span key={`${t}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-sm text-gray-800 max-w-full break-all">
          {prefix}
          {t}
          {onRemove && (
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onRemove(i)} className="ml-1 text-gray-400 hover:text-red-600">
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export function CopyBox({ title, text, rows = 4 }: { title: string; text: string; rows?: number }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <CopyButton text={text} />
      </div>
      <textarea readOnly value={text} rows={rows} className="input-field w-full font-mono text-sm" />
    </div>
  );
}

export function ExportButtons({ rows, name, txt }: { rows: Row[]; name: string; txt?: string }) {
  if (!rows.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => downloadCSV(rows, name)} className="btn-secondary !px-4 !py-2 !text-sm">
        ⬇ CSV
      </button>
      <button type="button" onClick={() => downloadXLSX(rows, name)} className="btn-success !px-4 !py-2 !text-sm">
        ⬇ Excel
      </button>
      {txt !== undefined && (
        <button type="button" onClick={() => downloadText(txt, `${name}.txt`)} className="rounded-lg bg-gray-700 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800">
          ⬇ TXT
        </button>
      )}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-red-500" />
      {label}
    </label>
  );
}

export function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
        <span>{label}</span>
        <span className="text-red-600">
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-red-500" />
    </label>
  );
}

export function useAsync<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async (fn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const d = await fn();
      setData(d);
      return d;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return { data, setData, error, setError, loading, run };
}
