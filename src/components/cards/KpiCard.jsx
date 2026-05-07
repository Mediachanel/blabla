export default function KpiCard({ title, value, helper, percentage, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-dinkes-50 text-dinkes-700",
    gold: "bg-govgold-50 text-govgold-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700"
  };

  return (
    <article className="surface p-2 transition hover:-translate-y-0.5 hover:shadow-soft sm:p-4">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[10px] font-semibold leading-4 text-slate-600 sm:text-sm">{title}</p>
          <strong className="mt-1 block text-lg font-bold tabular-nums text-slate-950 sm:text-2xl">{value}</strong>
          {percentage ? (
            <span className="mt-1 hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 sm:inline-flex">
              {percentage} dari total
            </span>
          ) : null}
          {helper ? <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{helper}</p> : null}
        </div>
        {Icon ? (
          <span className={`hidden rounded-xl p-2 sm:inline-flex ${tones[tone]}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </article>
  );
}
