"use client";

export default function Stepper({ steps, activeStep, onStepChange }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-dinkes-50 via-white to-sky-50 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-dinkes-700">Progress Pengisian</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Step {activeStep + 1} dari {steps.length}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-dinkes-700">{Math.round(((activeStep + 1) / steps.length) * 100)}%</p>
            <p className="text-sm text-slate-500">{steps[activeStep]?.title}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-dinkes-600 to-sky-500 transition-all duration-300"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="grid gap-3 px-5 py-5 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => {
          const status = index < activeStep ? "done" : index === activeStep ? "active" : "upcoming";
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onStepChange(index)}
                className={[
                  "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  status === "active" ? "border-dinkes-300 bg-dinkes-50 shadow-sm" : "",
                  status === "done" ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300" : "",
                  status === "upcoming" ? "border-slate-200 bg-white hover:border-slate-300" : ""
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    status === "active" ? "bg-dinkes-700 text-white" : "",
                    status === "done" ? "bg-emerald-600 text-white" : "",
                    status === "upcoming" ? "bg-slate-100 text-slate-500" : ""
                  ].join(" ")}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{step.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
