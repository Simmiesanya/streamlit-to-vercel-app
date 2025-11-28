// Sample data for v0 preview mode
// This data is used when the app runs in development/preview environment
// Production deployment will use real GCP database connection

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "CAD", "CHF", "AUD"]

// Generate 365 days of sample data
function generateSampleData() {
  const data: any[] = []
  const today = new Date("2024-11-27")

  // Base rates (Naira per unit)
  const baseRates: Record<string, number> = {
    USD: 1650,
    EUR: 1800,
    GBP: 2100,
    JPY: 11,
    CNY: 230,
    CAD: 1200,
    CHF: 1850,
    AUD: 1100,
  }

  for (let i = 365; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    for (const currency of CURRENCIES) {
      const baseRate = baseRates[currency]
      // Add some realistic variation
      const variation = (Math.sin(i / 10) * 0.02 + Math.random() * 0.04 - 0.02) * baseRate
      const centralRate = baseRate + variation
      const buyingRate = centralRate * 0.98
      const sellingRate = centralRate * 1.02

      data.push({
        date: dateStr,
        currency,
        buying_rate: Number(buyingRate.toFixed(2)),
        central_rate: Number(centralRate.toFixed(2)),
        selling_rate: Number(sellingRate.toFixed(2)),
      })
    }
  }

  return data
}

const sampleData = generateSampleData()

export function getLatestRates() {
  const latestDate = sampleData[sampleData.length - 1].date
  return sampleData
    .filter((d) => d.date === latestDate)
    .map((d) => ({
      date: d.date,
      currency: d.currency,
      rate: d.central_rate,
    }))
}

export function getTrends(currencies: string[], days: number) {
  const latest = sampleData[sampleData.length - 1].date
  const cutoff = new Date(latest)
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split("T")[0]

  return sampleData.filter((d) => d.date >= cutoffStr && currencies.includes(d.currency))
}

export function getChanges(currency: string, days: number) {
  const latest = sampleData[sampleData.length - 1].date
  const cutoff = new Date(latest)
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split("T")[0]

  return sampleData.filter((d) => d.date >= cutoffStr && d.currency === currency)
}

export function getAverages() {
  const latest = sampleData[sampleData.length - 1].date
  const monthly = new Date(latest)
  monthly.setDate(monthly.getDate() - 30)
  const monthlyStr = monthly.toISOString().split("T")[0]

  const yearly = new Date(latest)
  yearly.setDate(yearly.getDate() - 365)
  const yearlyStr = yearly.toISOString().split("T")[0]

  return CURRENCIES.map((currency) => {
    const monthlyData = sampleData.filter((d) => d.date >= monthlyStr && d.currency === currency)
    const yearlyData = sampleData.filter((d) => d.date >= yearlyStr && d.currency === currency)

    const monthlyAvg = monthlyData.reduce((sum, d) => sum + d.central_rate, 0) / monthlyData.length
    const yearlyAvg = yearlyData.reduce((sum, d) => sum + d.central_rate, 0) / yearlyData.length

    return {
      currency,
      monthly_avg: Number(monthlyAvg.toFixed(2)),
      yearly_avg: Number(yearlyAvg.toFixed(2)),
    }
  })
}

export function getRecords() {
  const lows = CURRENCIES.map((currency) => {
    const currencyData = sampleData.filter((d) => d.currency === currency)
    const lowest = currencyData.reduce((min, d) => (d.central_rate < min.central_rate ? d : min))
    return {
      currency,
      rate: lowest.central_rate,
      date: lowest.date,
    }
  })

  const highs = CURRENCIES.map((currency) => {
    const currencyData = sampleData.filter((d) => d.currency === currency)
    const highest = currencyData.reduce((max, d) => (d.central_rate > max.central_rate ? d : max))
    return {
      currency,
      rate: highest.central_rate,
      date: highest.date,
    }
  })

  return { lows, highs }
}

export function getCurrencies() {
  return CURRENCIES
}

export function getDateRange() {
  return {
    min_date: sampleData[0].date,
    max_date: sampleData[sampleData.length - 1].date,
  }
}

export function getHistorical(date: string, currency?: string) {
  if (currency) {
    return sampleData
      .filter((d) => d.date === date && d.currency === currency)
      .map((d) => ({
        date: d.date,
        currency: d.currency,
        rate: d.central_rate,
        buying_rate: d.buying_rate,
        selling_rate: d.selling_rate,
      }))
  }
  return sampleData
    .filter((d) => d.date === date)
    .map((d) => ({
      date: d.date,
      currency: d.currency,
      rate: d.central_rate,
      buying_rate: d.buying_rate,
      selling_rate: d.selling_rate,
    }))
}
