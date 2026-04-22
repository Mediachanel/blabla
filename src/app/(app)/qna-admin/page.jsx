"use client";

import { useState } from "react";
import { Bot, SendHorizontal } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

export default function QnaAdminPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([
    { q: "Berapa total PNS aktif?", a: "Gunakan dashboard agregat atau endpoint /api/dashboard untuk data sesuai role." }
  ]);

  function submit(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setHistory((current) => [{ q: question, a: "Jawaban simulasi MVP: integrasikan modul ini dengan knowledge base, audit log, dan data warehouse internal Dinkes." }, ...current]);
    setQuestion("");
  }

  return (
    <>
      <PageHeader title="QnA Admin Dinas" description="Ruang kerja internal Super Admin untuk pertanyaan operasional dan analitik SDM." breadcrumbs={[{ label: "QnA Admin" }]} />
      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <article className="surface p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-dinkes-50 p-3 text-dinkes-700"><Bot className="h-6 w-6" /></span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Asisten Internal Admin</h2>
              <p className="text-sm text-slate-500">MVP UI untuk pengembangan fitur tanya jawab berbasis data.</p>
            </div>
          </div>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
            <input className="input flex-1" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Tulis pertanyaan admin dinas" />
            <button className="btn-primary"><SendHorizontal className="h-4 w-4" /> Kirim</button>
          </form>
        </article>
        <aside className="surface p-5">
          <h2 className="text-base font-semibold text-slate-900">Riwayat Pertanyaan</h2>
          <div className="mt-4 space-y-3">
            {history.map((item, index) => (
              <article key={index} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{item.q}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}
