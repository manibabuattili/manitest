"use client";

import { FileSpreadsheet, RotateCcw, Upload } from "lucide-react";
import { downloadSampleExcel } from "@/lib/excel/downloadSample";

export function UploadPanel({
  sourceName,
  onUpload,
  onLoadSample,
  parseError,
}: {
  sourceName: string;
  onUpload: (file: File) => void;
  onLoadSample: () => void;
  parseError: string | null;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-ink-850 p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Test suite
        </h2>
        <button
          type="button"
          onClick={downloadSampleExcel}
          className="text-[11px] text-accent hover:underline"
        >
          Download template
        </button>
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-ink-900/60 px-3 py-5 text-center hover:border-accent/40">
        <Upload size={18} className="mb-2 text-slate-400" />
        <div className="text-sm text-slate-200">Drop Excel or click to upload</div>
        <div className="mt-1 text-[11px] text-slate-500">.xlsx · .xls · .csv</div>
        <input
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.currentTarget.value = "";
          }}
        />
      </label>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
          <FileSpreadsheet size={14} className="shrink-0 text-accent" />
          <span className="truncate font-mono">{sourceName}</span>
        </div>
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/5"
        >
          <RotateCcw size={11} />
          Sample
        </button>
      </div>
      {parseError ? (
        <p className="mt-2 text-xs text-rose-400">{parseError}</p>
      ) : null}
    </section>
  );
}
