"use client";

export default function FormSection({ title, description, children, tone = "default" }) {
  const toneClass = tone === "soft"
    ? "border-dinkes-100 bg-gradient-to-br from-white via-dinkes-50/40 to-sky-50/50"
    : "border-slate-200 bg-white";

  return (
    <section className={`surface border ${toneClass} p-5 lg:p-6`}>
      <div className="mb-5 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
