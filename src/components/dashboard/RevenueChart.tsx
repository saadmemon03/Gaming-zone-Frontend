interface RevenuePoint {
  label: string;
  value: number;
}

interface RevenueChartProps {
  data: RevenuePoint[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-2xl border border-[#273449] bg-[#151C2C] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
      </div>

      <div className="flex h-52 items-end gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-xl bg-gradient-to-t from-[#7C3AED] to-[#A78BFA]"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
            <span className="text-xs text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
