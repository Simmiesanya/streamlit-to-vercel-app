import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
interface ChangeData {
  date: string
  central_rate?: number | string
  rate?: number | string
}
interface ChangeChartProps {
  data: ChangeData[]
}
export default function ChangeChart({ data }: ChangeChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sorted.map((item, index) => {
      const currentRate = parseFloat(item.central_rate as string) || parseFloat(item.rate as string) || 0
      const prevRate = index > 0 ? parseFloat(sorted[index - 1].central_rate as string) || parseFloat(sorted[index - 1].rate as string) || 0 : currentRate
      const change = prevRate === 0 ? 0 : ((currentRate - prevRate) / prevRate) * 100
      return {
        date: item.date,
        change: index === 0 ? 0 : change,
        rate: currentRate,
      }
    }).filter(entry => !isNaN(entry.change))  // Filter NaN changes
  }, [data])
  if (chartData.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No data available</p>
  }
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" tickFormatter={formatDate} stroke="#666" fontSize={12} />
        <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value.toFixed(1)}%`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value: number) => [`${value.toFixed(3)}%`, "Change"]}
          labelFormatter={(label) =>
            new Date(label).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          }
        />
        <Bar dataKey="change" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.change >= 0 ? "#22c55e" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
