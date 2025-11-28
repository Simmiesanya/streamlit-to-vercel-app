"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface RateCardProps {
  currency: string
  rate: number
  change?: number
  isSelected?: boolean
  onClick?: () => void
}

const currencyNames: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  DKK: "Danish Krone",
  JPY: "Japanese Yen",
  ZAR: "South African Rand",
}

const RateCard = ({ currency, rate, change = 0, isSelected, onClick }: RateCardProps) => {
  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all duration-200",
        "bg-card border border-border hover:border-primary/50",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        isSelected && "border-primary bg-primary/10",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-2xl text-foreground">{currency}</p>
          <p className="text-sm text-muted-foreground">{currencyNames[currency] || currency}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-semibold text-foreground">
            ₦{rate.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {change !== 0 && (
            <div
              className={cn(
                "flex items-center justify-end gap-1 text-xs font-medium",
                isPositive && "text-destructive",
                isNegative && "text-success",
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : isNegative ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{Math.abs(change).toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default RateCard
