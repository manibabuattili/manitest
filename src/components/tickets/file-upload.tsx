"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadFileItem = {
  name: string;
  size: number;
  file: File;
};

export function FileUploadZone({
  className,
  files,
  onFiles,
}: {
  className?: string;
  files?: UploadFileItem[];
  onFiles?: (files: UploadFileItem[]) => void;
}) {
  function addFiles(list: FileList | null) {
    if (!list || !onFiles) return;
    const incoming = Array.from(list).map((f) => ({ name: f.name, size: f.size, file: f }));
    const byName = new Map((files ?? []).map((f) => [f.name, f]));
    for (const item of incoming) byName.set(item.name, item);
    onFiles(Array.from(byName.values()));
  }

  function removeFile(name: string) {
    if (!onFiles) return;
    onFiles((files ?? []).filter((f) => f.name !== name));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-500">
            <path d="M12 16V8M12 8l-3 3M12 8l3 3" />
            <path d="M20 16.5a3.5 3.5 0 0 0-2.1-6.4A5 5 0 0 0 8.2 8a4 4 0 0 0 .3 8H18" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-400">SVG, PNG, JPG or GIF (max. 800KB each)</p>
        <input
          type="file"
          className="hidden"
          accept="image/*,.svg,.gif"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {files && files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-50 text-[10px] font-bold uppercase text-brand-700">
                {f.name.split(".").pop()?.slice(0, 3) || "FILE"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{f.name}</p>
                <p className="text-xs text-gray-500">{Math.max(1, Math.round(f.size / 1024))} KB</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-full rounded-full bg-brand-500" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(f.name)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
