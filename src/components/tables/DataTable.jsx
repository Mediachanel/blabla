import EmptyState from "@/components/ui/EmptyState";

export default function DataTable({ columns, data, rowKey = "id", actions, startNumber = 1, showNumber = false }) {
  if (!data?.length) return <EmptyState />;

  const numberWidth = 64;
  const actionWidth = 260;
  const columnWidths = columns.map((column, index) => column.width || (index === 0 ? 220 : 170));
  const firstColumnLeft = showNumber ? numberWidth : 0;
  const tableMinWidth = columnWidths.reduce((total, width) => total + width, 0)
    + (showNumber ? numberWidth : 0)
    + (actions ? actionWidth : 0);

  return (
    <section className="space-y-3 md:space-y-0">
      <div className="grid gap-3 md:hidden">
        {data.map((item, index) => (
          <article key={item[rowKey]} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-etpp">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {showNumber ? <p className="mb-1 text-xs font-semibold text-slate-400">#{startNumber + index}</p> : null}
                <h3 className="truncate text-base font-bold text-slate-950">
                  {columns[0]?.render ? columns[0].render(item, index) : item[columns[0]?.key]}
                </h3>
              </div>
              {actions ? <div className="shrink-0">{actions(item)}</div> : null}
            </div>
            <dl className="mt-3 grid gap-2 text-sm">
              {columns.slice(1).map((column) => (
                <div key={column.key} className="grid grid-cols-[104px_1fr] gap-3 border-t border-slate-100 pt-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{column.header}</dt>
                  <dd className="min-w-0 text-right font-medium text-slate-700">
                    <div className={column.wrap ? "break-words leading-5" : "truncate"}>
                      {column.render ? column.render(item, index) : (item[column.key] || "-")}
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="surface hidden overflow-hidden md:block">
      <div className="table-scroll">
        <table className="w-full min-w-[var(--table-min-width)] table-fixed border-collapse" style={{ "--table-min-width": `${tableMinWidth}px` }}>
          <colgroup>
            {showNumber ? <col style={{ width: numberWidth }} /> : null}
            {columnWidths.map((width, index) => <col key={columns[index].key} style={{ width }} />)}
            {actions ? <col style={{ width: actionWidth }} /> : null}
          </colgroup>
          <thead>
            <tr>
              {showNumber ? <th className="table-th sticky left-0 z-20 bg-[#f3f4f6] text-center" scope="col">No</th> : null}
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`table-th ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""} ${index === 0 ? "sticky z-20 bg-[#f3f4f6]" : ""}`}
                  style={index === 0 ? { left: firstColumnLeft } : undefined}
                  scope="col"
                >
                  <span className="block truncate" title={typeof column.header === "string" ? column.header : undefined}>{column.header}</span>
                </th>
              ))}
              {actions ? <th className="table-th sticky right-0 z-20 bg-[#f3f4f6] text-center" scope="col">Aksi</th> : null}
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((item, index) => (
              <tr key={item[rowKey]} className="group hover:bg-dinkes-50/50">
                {showNumber ? <td className="table-td sticky left-0 z-10 bg-white text-center group-hover:bg-dinkes-50/50">{startNumber + index}</td> : null}
                {columns.map((column, columnIndex) => (
                  <td
                    key={column.key}
                    className={`table-td ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""} ${columnIndex === 0 ? "sticky z-10 bg-white font-medium text-slate-900 group-hover:bg-dinkes-50/50" : ""}`}
                    style={columnIndex === 0 ? { left: firstColumnLeft } : undefined}
                  >
                    <div className={column.wrap ? "whitespace-normal break-words leading-5" : "min-w-0 truncate"}>
                      {column.render ? column.render(item, index) : item[column.key]}
                    </div>
                  </td>
                ))}
                {actions ? <td className="table-td sticky right-0 z-10 bg-white text-center group-hover:bg-dinkes-50/50">{actions(item)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </section>
  );
}
