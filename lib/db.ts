import postgres from "postgres"
import * as sample from "@/lib/sample-data"

export type FXRate = {
  date: string
  currency: string
  buying_rate: number
  central_rate: number
  selling_rate: number
}

export type LatestRate = {
  currency: string
  rate: number
  date: string
}

export type AverageRate = {
  currency: string
  monthly_avg: number
  yearly_avg: number
}

export type AllTimeRecord = {
  currency: string
  rate: number
  date: string
}

const isProductionMode = typeof window === "undefined" && !!process.env.GCP_DATABASE_URL

let sql: postgres.Sql | null = null
let initError: Error | null = null

if (isProductionMode) {
  try {
    sql = postgres(process.env.GCP_DATABASE_URL!, {
      ssl: 'require',
      max: 1,
      idle_timeout: 5,
      connect_timeout: 10,
    })
    console.log("[v0] PostgreSQL client initialized")
  } catch (error) {
    console.error("[v0] Failed to initialize PostgreSQL client:", error)
    initError = error as Error
  }
}

export async function query<T = any>(sqlQuery: string, params?: any[]): Promise<T[]> {
  if (!isProductionMode || !sql || initError) {
    console.log("[v0] Using sample data")
    return handleSampleData(sqlQuery, params) as T[]
  }

  try {
    console.log("[v0] Executing query:", sqlQuery.substring(0, 60) + "...")
    const result = await sql.unsafe(sqlQuery, params || [])
    console.log("[v0] Query successful, rows:", result.length)
    return result as T[]
  } catch (error) {
    console.error("[v0] Query error:", error)
    console.log("[v0] Falling back to sample data")
    return handleSampleData(sqlQuery, params) as T[]
  }
}

function handleSampleData<T = any>(sql: string, params?: any[]): T[] {
  const queryLower = sql.toLowerCase()

  if (queryLower.includes("max(date)") && queryLower.includes("central_rate as rate")) {
    return sample.getLatestRates() as T[]
  }

  if (queryLower.includes("central_rate, buying_rate, selling_rate") && queryLower.includes("any")) {
    const days = (params?.[0] as number) || 30
    const currencies = (params?.[1] as string[]) || ["USD", "EUR", "GBP"]
    return sample.getTrends(currencies, days) as T[]
  }

  if (queryLower.includes("monthly_avg") && queryLower.includes("yearly_avg")) {
    return sample.getAverages() as T[]
  }

  if (queryLower.includes("distinct on (currency)") && queryLower.includes("asc")) {
    return sample.getRecords().lows as T[]
  }

  if (queryLower.includes("distinct on (currency)") && queryLower.includes("desc")) {
    return sample.getRecords().highs as T[]
  }

  if (queryLower.includes("distinct currency")) {
    return sample.getCurrencies().map((c) => ({ currency: c })) as T[]
  }

  if (queryLower.includes("min(date)") && queryLower.includes("max(date)")) {
    return [sample.getDateRange()] as T[]
  }

  if (queryLower.includes("date::text = $1")) {
    const date = params?.[0] as string
    const currency = params?.[1] as string | undefined
    if (date) {
      return sample.getHistorical(date, currency) as T[]
    }
    return [] as T[]
  }

  if (queryLower.includes("central_rate") && params && params.length === 2) {
    const days = (params[0] as number) || 30
    const currency = (params[1] as string) || "USD"
    return sample.getChanges(currency, days) as T[]
  }

  return [] as T[]
}
