export default function KpiCard({ title, value, helper, percentage, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-dinkes-50 text-dinkes-700",
    gold: "bg-govgold-50 text-govgold-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700"
  };

  return (
    <article className="surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <strong className="mt-1.5 block text-2xl font-bold tabular-nums text-slate-900">{value}</strong>
          {percentage ? (
            <span className="mt-1.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              {percentage} dari total
            </span>
          ) : null}
          {helper ? <p className="mt-1.5 text-xs text-slate-500">{helper}</p> : null}
        </div>
        {Icon ? (
          <span className={`rounded-xl p-2 ${tones[tone]}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </article>
  );
}
