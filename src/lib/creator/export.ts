import * as XLSX from "xlsx";

export type Row = Record<string, string | number | boolean | null | undefined>;

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function downloadBlob(blob: Blob, name: string) {
  save(blob, name);
}

export function downloadText(text: string, name: string, type = "text/plain") {
  save(new Blob([text], { type: `${type};charset=utf-8` }), name);
}

export function toCSV(rows: Row[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadCSV(rows: Row[], name: string) {
  downloadText("\ufeff" + toCSV(rows), name.endsWith(".csv") ? name : `${name}.csv`, "text/csv");
}

export function downloadXLSX(rows: Row[], name: string, sheet = "Data") {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheet.slice(0, 31));
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  save(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name.endsWith(".xlsx") ? name : `${name}.xlsx`);
}

export function safeName(s: string) {
  return (s || "file").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "file";
}
