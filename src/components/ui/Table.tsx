import type {
  ReactNode,
  TableHTMLAttributes,
} from "react";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T>
  extends Omit<
    TableHTMLAttributes<HTMLTableElement>,
    "children"
  > {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (item: T) => string;
  emptyMessage?: string;
}

export default function Table<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "No data found.",
  className = "",
  ...props
}: TableProps<T>) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-[#273449]">
      <table
        className={`w-full min-w-[700px] text-left ${className}`}
        {...props}
      >
        {/* Table Header */}
        <thead>
          <tr className="border-b border-[#273449] bg-[#1f2335]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  whitespace-nowrap
                  px-5 py-4
                  text-xs font-semibold
                  uppercase tracking-wider
                  text-slate-500
                  ${column.className ?? ""}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data.length > 0 ? (
            data.map((item) => (
              <tr
                key={rowKey(item)}
                className="
                  border-b border-[#273449]
                  last:border-b-0
                  transition
                  hover:bg-[#1A2233]
                "
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="
                      whitespace-nowrap
                      px-5 py-4
                      text-sm text-slate-300
                    "
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="
                  px-5 py-12
                  text-center
                  text-sm text-slate-500
                "
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}