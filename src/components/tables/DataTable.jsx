import EmptyState from "@/components/ui/EmptyState";

export default function DataTable({ columns, data, rowKey = "id", actions, startNumber = 1, showNumber = false }) {
  if (!data?.length) return <EmptyState />;

  return (
    <section className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {showNumber ? <th className="table-th sticky left-0 z-20 w-16 bg-[#f3f3f3] text-center" scope="col">No</th> : null}
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`table-th ${index === 0 ? `sticky ${showNumber ? "left-16" : "left-0"} z-20 bg-[#f3f3f3]` : ""}`}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
              {actions ? <th className="table-th sticky right-0 z-20 bg-[#f3f3f3]" scope="col">Aksi</th> : null}
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((item, index) => (
              <tr key={item[rowKey]} className="group hover:bg-dinkes-50/50">
                {showNumber ? <td className="table-td sticky left-0 z-10 bg-white text-center group-hover:bg-dinkes-50/50">{startNumber + index}</td> : null}
                {columns.map((column, columnIndex) => (
                  <td
                    key={column.key}
                    className={`table-td ${columnIndex === 0 ? `sticky ${showNumber ? "left-16" : "left-0"} z-10 bg-white font-medium text-slate-900 group-hover:bg-dinkes-50/50` : ""}`}
                  >
                    {column.render ? column.render(item, index) : item[column.key]}
                  </td>
                ))}
                {actions ? <td className="table-td sticky right-0 z-10 bg-white group-hover:bg-dinkes-50/50">{actions(item)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
