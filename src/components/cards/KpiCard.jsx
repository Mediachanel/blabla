export default function KpiCard({ title, value, helper, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-dinkes-50 text-dinkes-700",
    gold: "bg-govgold-50 text-govgold-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700"
  };

  return (
    <article className="surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <strong className="mt-2 block text-3xl font-bold text-slate-900">{value}</strong>
          {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
        </div>
        {Icon ? (
          <span className={`rounded-2xl p-3 ${tones[tone]}`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </article>
  );
}
