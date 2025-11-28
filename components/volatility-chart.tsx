"use client"
import { useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
interface VolatilityData {
  date: string
  central_rate?: number | string
  rate?: number | string
}
interface VolatilityChartProps {
  data: VolatilityData[]
  currency: string
  windowSize?: number
}
function calculateRollingStd(data: number[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null
    const slice = data.slice(i - window + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / window
    const squaredDiffs = slice.map((val) => Math.pow(val - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / window
    return Math.sqrt(avgSquaredDiff)
  })
}
export default function VolatilityChart({ data, currency, windowSize = 30 }: VolatilityChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const rates = sorted.map((d) => parseFloat(d.central_rate as string) || parseFloat(d.rate as string) || 0)
    const actualWindow = Math.min(windowSize, sorted.length)
    const volatility = calculateRollingStd(rates, actualWindow)
    return sorted.map((item, index) => ({
      date: item.date,
      volatility: volatility[index],
    }))
  }, [data, windowSize])
  if (chartData.length < windowSize) {
    return <p className="text-center text-muted-foreground py-8">Insufficient data for volatility (requires at least {windowSize} days)</p>
  }
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="volatilityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" tickFormatter={formatDate} stroke="#666" fontSize={12} />
        <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => value?.toFixed(1)} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f1f2e",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value: number) => [value?.toFixed(4), `${currency} Volatility`]}
          labelFormatter={(label) =>
            new Date(label).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          }
        />
        <Area type="monotone" dataKey="volatility" stroke="#a78bfa" strokeWidth={2} fill="url(#volatilityGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
