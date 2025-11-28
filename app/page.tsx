"use client"
import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import RateCard from "@/components/rate-card"
import TrendChart from "@/components/trend-chart"
import ChangeChart from "@/components/change-chart"
import VolatilityChart from "@/components/volatility-chart"
import CurrencySelector from "@/components/currency-selector"
const fetcher = (url: string) => fetch(url).then((r) => r.json())
const PRIORITY_CURRENCIES = ["USD", "GBP", "EUR", "CAD", "CNY", "JPY"]
type Section = "trends" | "changes" | "averages" | "explorer" | "records"
export default function FXDashboard() {
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(new Set(["trends"]))
  const [trendCurrencies, setTrendCurrencies] = useState<string[]>(["USD", "EUR", "GBP"])
  const [trendDays, setTrendDays] = useState(30)
  const [showMA, setShowMA] = useState(false)
  const [changeCurrency, setChangeCurrency] = useState<string>("USD")
  const [changeDays, setChangeDays] = useState(30)
  const [explorerCurrency, setExplorerCurrency] = useState<string>("All")
  const [explorerDate, setExplorerDate] = useState<Date | undefined>(new Date())
  // Add the service worker registration here
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered', reg))
        .catch((err) => console.error('Service Worker registration failed', err));
    }
  }, []);
  // Batch all fetches into one SWR call
  const batchParams = new URLSearchParams()
  batchParams.append("types", "latest,trends,changes,volatility,averages,records,currencies,date-range,historical")
  batchParams.append("currencies", trendCurrencies.join(","))
  batchParams.append("trend_days", trendDays.toString());
  batchParams.append("change_days", changeDays.toString());
  batchParams.append("currency", changeCurrency)
  batchParams.append("explorer_currency", explorerCurrency)
  if (explorerDate) batchParams.append("date", format(explorerDate, "yyyy-MM-dd"))
  const { data: batchData, mutate: mutateBatch } = useSWR<Record<string, any>>(
    `/api/rates?${batchParams.toString()}`,
    fetcher,
  )
  const latestRates = batchData?.latest
  const trendData = batchData?.trends
  const changeData = batchData?.changes
  const volatilityData = batchData?.volatility
  const averages = batchData?.averages
  const historicalRates = batchData?.historical
  const records = batchData?.records
  const toggleSection = (section: Section) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }
  const displayedLatestRates = Array.isArray(latestRates)
    ? latestRates.filter((r) => PRIORITY_CURRENCIES.includes(r.currency))
    : []
  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutateBatch()
    setIsRefreshing(false)
  }
  useEffect(() => {
    let hasRefreshedToday = false
    const checkAndRefresh = () => {
      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()
      const today = now.toDateString()
      // Check if it's between 12:00 PM and 12:05 PM
      if (hour === 12 && minute >= 0 && minute <= 5) {
        const lastRefreshDate = localStorage.getItem("lastAutoRefreshDate")
        // Only refresh if we haven't refreshed today yet
        if (lastRefreshDate !== today && !hasRefreshedToday) {
          console.log("[v0] Auto-refresh triggered at 12:00 PM")
          hasRefreshedToday = true
          localStorage.setItem("lastAutoRefreshDate", today)
          handleRefresh()
        }
      } else {
        // Reset flag after the 12:00-12:05 PM window
        hasRefreshedToday = false
      }
    }
    // Check every minute
    const interval = setInterval(checkAndRefresh, 60000)
    // Check immediately on mount
    checkAndRefresh()
    return () => clearInterval(interval)
  }, [])
  const filteredAverages = Array.isArray(averages) ? averages.filter(avg => PRIORITY_CURRENCIES.includes(avg.currency)) : []
  const filteredHistoricalRates = Array.isArray(historicalRates) ? historicalRates.filter(rate => PRIORITY_CURRENCIES.includes(rate.currency)) : []
  const filteredRecords = records && typeof records === "object" && Array.isArray(records.lows) && Array.isArray(records.highs) ? {
    lows: records.lows.filter(low => PRIORITY_CURRENCIES.includes(low.currency)),
    highs: records.highs.filter(high => PRIORITY_CURRENCIES.includes(high.currency))
  } : { lows: [], highs: [] }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">NairaFX</h1>
              <p className="text-sm text-muted-foreground">Nigerian Foreign Exchange Rates</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">Current date:</span>
              <span>
                {Array.isArray(latestRates) && latestRates[0]?.date
                  ? new Date(latestRates[0].date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Loading..."}
              </span>
            </div>
            <div>Data refreshes daily at 12:00 PM</div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Latest Rates */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Latest Rates</h2>
          {displayedLatestRates.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayedLatestRates.map((rate) => (
                <RateCard
                  key={rate.currency}
                  currency={rate.currency}
                  rate={Number(rate.rate)}
                  isSelected={false}
                  onClick={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-3 text-center py-8 text-muted-foreground">
                Loading latest rates...
              </div>
            </div>
          )}
        </section>
        {/* Time Series Trends & Moving Averages */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleSection("trends")}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Time Series Trends & Moving Averages</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Select multiple currencies and date range</p>
              </div>
              {expandedSections.has("trends") ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.has("trends") && (
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-accent/20 rounded-lg">
                <div className="space-y-2">
                  <Label>Select Currencies (multiple)</Label>
                  <CurrencySelector
                    currencies={PRIORITY_CURRENCIES}
                    selected={trendCurrencies}
                    onChange={setTrendCurrencies}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Window: {trendDays} days</Label>
                  <Slider
                    value={[trendDays]}
                    onValueChange={(v) => setTrendDays(v[0])}
                    min={7}
                    max={365}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="show-ma" checked={showMA} onCheckedChange={setShowMA} />
                <Label htmlFor="show-ma">Show Moving Averages (SMA-10 & EMA-10)</Label>
              </div>
              {trendData && trendData.length > 0 ? (
                <TrendChart data={trendData} showMA={showMA} />
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          )}
        </Card>
        {/* Daily % Change & Volatility */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleSection("changes")}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily % Change & Volatility Analysis</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Select single currency and date range</p>
              </div>
              {expandedSections.has("changes") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("changes") && (
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-accent/20 rounded-lg">
                <div className="space-y-2">
                  <Label>Select Currency</Label>
                  <Select value={changeCurrency} onValueChange={setChangeCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_CURRENCIES.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Window: {changeDays} days</Label>
                  <Slider
                    value={[changeDays]}
                    onValueChange={(v) => setChangeDays(v[0])}
                    min={7}
                    max={365}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Daily Percentage Changes</h3>
                  {changeData && changeData.length > 0 ? (
                    <ChangeChart data={changeData} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No data available</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Volatility (30-Day Rolling Std Dev)</h3>
                  {volatilityData && volatilityData.length > 0 ? (
                    <VolatilityChart data={volatilityData} currency={changeCurrency} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No data available</p>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
        {/* Average Rates */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleSection("averages")}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Average Rates (Monthly & Annual)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Static summary table</p>
              </div>
              {expandedSections.has("averages") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("averages") && (
            <CardContent>
              {filteredAverages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-4">Currency</th>
                        <th className="text-right py-2 px-4">30-Day Avg</th>
                        <th className="text-right py-2 px-4">365-Day Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAverages.map((avg, idx) => {
                        const monthly = Number(avg.monthly_avg);
                        const yearly = Number(avg.yearly_avg);
                        return (
                          <tr key={avg.currency} className={idx % 2 === 0 ? "bg-accent/20" : ""}>
                            <td className="py-2 px-4 font-medium">{avg.currency}</td>
                            <td className="text-right py-2 px-4">
                              ₦{!isNaN(monthly) ? monthly.toFixed(2) : "N/A"}
                            </td>
                            <td className="text-right py-2 px-4">
                              ₦{!isNaN(yearly) ? yearly.toFixed(2) : "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          )}
        </Card>
        {/* Historical Rates Explorer */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleSection("explorer")}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historical Rates Explorer</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Time travel to any date</p>
              </div>
              {expandedSections.has("explorer") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("explorer") && (
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-accent/20 rounded-lg">
                <div className="space-y-2">
                  <Label>Select Currency</Label>
                  <Select value={explorerCurrency} onValueChange={setExplorerCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Currencies</SelectItem>
                      {PRIORITY_CURRENCIES.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !explorerDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {explorerDate ? format(explorerDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={explorerDate} onSelect={setExplorerDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {filteredHistoricalRates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-4">Currency</th>
                        <th className="text-right py-2 px-4">Central Rate</th>
                        <th className="text-center py-2 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistoricalRates.map((rate, idx) => {
                        const centralRate = Number(rate.rate);
                        return (
                          <tr key={rate.currency} className={idx % 2 === 0 ? "bg-accent/20" : ""}>
                            <td className="py-2 px-4 font-medium">{rate.currency}</td>
                            <td className="text-right py-2 px-4">₦{!isNaN(centralRate) ? centralRate.toFixed(2) : "N/A"}</td>
                            <td className="text-center py-2 px-4 text-muted-foreground">{rate.date}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data for selected date</p>
              )}
            </CardContent>
          )}
        </Card>
        {/* All-Time Records */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleSection("records")}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All-Time Records</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Historical lows and highs</p>
              </div>
              {expandedSections.has("records") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("records") && (
            <CardContent>
              {filteredRecords.lows.length > 0 || filteredRecords.highs.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* All-Time Lows */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-destructive">All-Time Lowest Rates</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-2 px-2">Currency</th>
                            <th className="text-right py-2 px-2">Rate</th>
                            <th className="text-center py-2 px-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.lows.map((low, idx) => {
                            const lowRate = Number(low.rate);
                            return (
                              <tr key={low.currency} className={idx % 2 === 0 ? "bg-accent/20" : ""}>
                                <td className="py-2 px-2 font-medium">{low.currency}</td>
                                <td className="text-right py-2 px-2">₦{!isNaN(lowRate) ? lowRate.toFixed(2) : "N/A"}</td>
                                <td className="text-center py-2 px-2 text-xs text-muted-foreground">{low.date}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* All-Time Highs */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-success">All-Time Highest Rates</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-2 px-2">Currency</th>
                            <th className="text-right py-2 px-2">Rate</th>
                            <th className="text-center py-2 px-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.highs.map((high, idx) => {
                            const highRate = Number(high.rate);
                            return (
                              <tr key={high.currency} className={idx % 2 === 0 ? "bg-accent/20" : ""}>
                                <td className="py-2 px-2 font-medium">{high.currency}</td>
                                <td className="text-right py-2 px-2">₦{!isNaN(highRate) ? highRate.toFixed(2) : "N/A"}</td>
                                <td className="text-center py-2 px-2 text-xs text-muted-foreground">{high.date}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          )}
        </Card>
        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1 py-6">
          <p className="font-semibold">Designed by: Sanya Similoluwa</p>
          <p>Data sources: CBN • fixer.io</p>
        </div>
      </main>
    </div>
  )
}
