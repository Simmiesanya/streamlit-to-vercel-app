"use client"

import { cn } from "@/lib/utils"

interface TimeSelectorProps {
  value: number
  onChange: (days: number) => void
}

const options = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "180D", value: 180 },
  { label: "1Y", value: 365 },
]

export function TimeSelector({ value, onChange }: TimeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
