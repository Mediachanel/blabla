import Link from "next/link";

export default function PageHeader({ title, description, breadcrumbs = [], action }) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <nav className="mb-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link className="hover:text-dinkes-700" href="/dashboard">Dashboard</Link></li>
            {breadcrumbs.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span>/</span>
                {item.href ? <Link className="hover:text-dinkes-700" href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}
