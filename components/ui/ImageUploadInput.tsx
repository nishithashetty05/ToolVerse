"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { UploadCloud, X, ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadInputProps {
  /** Current image URL (from DB or a previous upload) */
  value: string;
  onChange: (url: string) => void;
  /** Optional label override */
  label?: string;
}

export default function ImageUploadInput({
  value,
  onChange,
  label = "Tool Image",
}: ImageUploadInputProps) {
  const inputRef          = useRef<HTMLInputElement>(null);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");

  // ── Upload helper ──────────────────────────────────────────────
  const uploadFile = async (file: File) => {
    setError("");
    setUploading(true);
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append("file", file);

      // Fake smooth progress while waiting (real progress needs XHR)
      const fakeProgress = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 200);

      const res = await fetch("/api/upload", { method: "POST", body: fd });

      clearInterval(fakeProgress);
      setProgress(100);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onChange(data.url);
    } catch (e) {
      setError((e as Error).message);
      setProgress(0);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  // ── Event handlers ─────────────────────────────────────────────
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleRemove = () => {
    onChange("");
    setError("");
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        /* ── Preview ── */
        <div className="relative rounded-xl overflow-hidden border border-card-border group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Tool preview"
            className="w-full h-48 object-cover"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 rounded-lg text-xs font-semibold text-gray-800 hover:bg-white transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/90 rounded-lg text-xs font-semibold text-white hover:bg-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop Zone ── */
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative flex flex-col items-center justify-center gap-3
            h-48 rounded-xl border-2 border-dashed cursor-pointer
            transition-all duration-200 select-none
            ${dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-card-border hover:border-primary/50 hover:bg-primary/5 bg-card-muted"
            }
            ${uploading ? "pointer-events-none" : ""}
          `}
        >
          {uploading ? (
            /* Upload progress */
            <div className="flex flex-col items-center gap-3 w-full px-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="w-full bg-card-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">Uploading… {progress}%</p>
            </div>
          ) : (
            /* Idle state */
            <>
              <div className={`p-3 rounded-xl ${dragging ? "bg-primary/15" : "bg-card-bg"} transition-colors`}>
                {dragging
                  ? <UploadCloud className="h-8 w-8 text-primary" />
                  : <ImageIcon   className="h-8 w-8 text-gray-400" />
                }
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {dragging ? "Drop to upload" : "Click or drag & drop"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  JPEG, PNG, WebP, GIF · max 5 MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
