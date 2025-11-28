"use client"

import { Home, TrendingUp, History, Award } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "home" | "trends" | "history" | "records"

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs = [
  { id: "home" as const, label: "Rates", icon: Home },
  { id: "trends" as const, label: "Trends", icon: TrendingUp },
  { id: "history" as const, label: "History", icon: History },
  { id: "records" as const, label: "Records", icon: Award },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200",
                "min-w-[64px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "stroke-[2.5]")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
