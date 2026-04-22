import EmptyState from "@/components/ui/EmptyState";

export default function DataTable({ columns, data, rowKey = "id", actions }) {
  if (!data?.length) return <EmptyState />;

  return (
    <section className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="table-th" scope="col">{column.header}</th>
              ))}
              {actions ? <th className="table-th" scope="col">Aksi</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((item) => (
              <tr key={item[rowKey]} className="hover:bg-dinkes-50/40">
                {columns.map((column) => (
                  <td key={column.key} className="table-td">{column.render ? column.render(item) : item[column.key]}</td>
                ))}
                {actions ? <td className="table-td">{actions(item)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
