import Link from "next/link";

export default function PageHeader({ title, description, breadcrumbs = [], action }) {
  return (
    <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <nav className="mb-2 text-sm font-medium text-slate-500 md:hidden" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link className="text-dinkes-600 hover:text-dinkes-700" href="/dashboard">Beranda</Link></li>
            {breadcrumbs.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span className="text-slate-300">/</span>
                {item.href ? <Link className="hover:text-dinkes-700" href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="w-full lg:w-auto">{action}</div> : null}
    </header>
  );
}
