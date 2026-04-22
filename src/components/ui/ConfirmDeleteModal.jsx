"use client";

import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDeleteModal({ open, title, description, onCancel, onConfirm, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4" role="dialog" aria-modal="true" aria-label="Konfirmasi hapus data">
      <article className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
          <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 focus-ring" onClick={onCancel} aria-label="Tutup modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
        <footer className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel}>Batal</button>
          <button className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 focus-ring disabled:opacity-60" onClick={onConfirm} disabled={loading}>
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </footer>
      </article>
    </div>
  );
}
