"use client"
import React from "react"
import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
interface TrendData {
  date: string
  currency: string
  central_rate?: number | string
  rate?: number | string
  sma_10?: number
  ema_10?: number
}
interface TrendChartProps {
  data: TrendData[]
  showMA?: boolean
}
const COLORS = [
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#fbbf24", // amber
  "#f472b6", // pink
  "#34d399", // emerald
  "#fb923c", // orange
  "#818cf8", // indigo
  "#e879f9", // fuchsia
  "#facc15", // yellow
]
function calculateSMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    return sum / period
  })
}
function calculateEMA(data: number[], period: number): (number | null)[] {
  const multiplier = 2 / (period + 1)
  const ema: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null)
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0)
      ema.push(sum / period)
    } else {
      const prevEma = ema[i - 1] as number
      ema.push((data[i] - prevEma) * multiplier + prevEma)
    }
  }
  return ema
}
export default function TrendChart({ data, showMA = false }: TrendChartProps) {
  const { chartData, currencies } = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>()
    const currencySet = new Set<string>()
    data.forEach((item) => {
      const rate = parseFloat(item.central_rate as string) || parseFloat(item.rate as string) || 0
      const existing = dateMap.get(item.date) || { date: item.date }
      existing[item.currency] = rate
      currencySet.add(item.currency)
      dateMap.set(item.date, existing)
    })
    const sortedData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    const currenciesArray = Array.from(currencySet).sort()
    if (showMA && currenciesArray.length > 0) {
      // Calculate MA for each currency
      currenciesArray.forEach((currency) => {
        const rates = sortedData.map((d) => d[currency] || 0)
        const sma10 = calculateSMA(rates, 10)
        const ema10 = calculateEMA(rates, 10)
        sortedData.forEach((d, i) => {
          d[`${currency}_sma10`] = sma10[i]
          d[`${currency}_ema10`] = ema10[i]
        })
      })
    }
    return { chartData: sortedData, currencies: currenciesArray }
  }, [data, showMA])
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" tickFormatter={formatDate} stroke="#666" fontSize={12} />
        <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `₦${value.toLocaleString()}`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f1f2e",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value: number, name: string) => [
            `₦${value?.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
            name.includes("sma") ? "SMA-10" : name.includes("ema") ? "EMA-10" : name,
          ]}
          labelFormatter={(label) =>
            new Date(label).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          }
        />
        <Legend />
        {currencies.map((currency, index) => (
          <Line
            key={currency}
            type="monotone"
            dataKey={currency}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
        {showMA &&
          currencies.map((currency, index) => (
            <React.Fragment key={`ma-${currency}`}>
              <Line
                type="monotone"
                dataKey={`${currency}_sma10`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                name={`${currency} SMA-10`}
                opacity={0.7}
              />
              <Line
                type="monotone"
                dataKey={`${currency}_ema10`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                name={`${currency} EMA-10`}
                opacity={0.5}
              />
            </React.Fragment>
          ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
