import { PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function DonutChart({ pct, color, size = 120, label }) {
  const data = [
    { value: pct },
    { value: 100 - pct },
  ]
  const colors = [color, '#F0F0EE']

  return (
    <div className="relative inline-flex items-center justify-center">
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2 - 1}
          cy={size / 2 - 1}
          innerRadius={size * 0.35}
          outerRadius={size * 0.48}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold" style={{ fontSize: size * 0.18, color }}>{pct}%</span>
        {label && <span className="text-text2" style={{ fontSize: size * 0.1 }}>{label}</span>}
      </div>
    </div>
  )
}
