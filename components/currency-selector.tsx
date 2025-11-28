"use client"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
interface CurrencySelectorProps {
  currencies: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  multiple?: boolean
}
const currencyFlags: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  CAD: "🇨🇦",
  CNY: "🇨🇳",
  JPY: "🇯🇵",
}
export function CurrencySelector({ currencies, selected, onChange, multiple = true }: CurrencySelectorProps) {
  const handleSelect = (currency: string) => {
    if (multiple) {
      if (selected.includes(currency)) {
        onChange(selected.filter((c) => c !== currency))
      } else {
        onChange([...selected, currency])
      }
    } else {
      onChange([currency])
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {currencies.map((currency) => {
        const isSelected = selected.includes(currency)
        return (
          <button
            key={currency}
            onClick={() => handleSelect(currency)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              "border",
              isSelected
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            <span>{currencyFlags[currency] || "💱"}</span>
            <span>{currency}</span>
            {isSelected && <Check className="h-3 w-3" />}
          </button>
        )
      })}
    </div>
  )
}
export default CurrencySelector
