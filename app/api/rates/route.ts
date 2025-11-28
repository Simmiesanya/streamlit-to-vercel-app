import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const typesParam = searchParams.get("types")
  const types = typesParam ? typesParam.split(",") : [searchParams.get("type") || "latest"]
  const currencies = searchParams.get("currencies")?.split(",") || ["USD", "EUR", "GBP"]
  const trendDays = Number.parseInt(searchParams.get("trend_days") || searchParams.get("days") || "30")
  const changeDays = Number.parseInt(searchParams.get("change_days") || searchParams.get("days") || "30")
  const currency = searchParams.get("currency") || "USD"
  const explorerCurrency = searchParams.get("explorer_currency") || "All"
  const date = searchParams.get("date")

  console.log("[v0] API Request - types:", types, "currencies:", currencies, "trendDays:", trendDays, "changeDays:", changeDays)

  const responseData: Record<string, any> = {}

  try {
    const promises: Promise<void>[] = [];

    if (types.includes("latest")) {
      console.log("[v0] Executing latest rates query...")
      promises.push(
        query(
          `SELECT date::text, currency, central_rate AS rate
           FROM vault.fx_rates_daily
           WHERE date = (SELECT MAX(date) FROM vault.fx_rates_daily)
           ORDER BY currency`,
        ).then((result) => {
          console.log("[v0] Latest rates fetched:", result.length, "rows")
          responseData.latest = result
        })
      )
    }

    if (types.includes("trends")) {
      console.log("[v0] Executing trends query...")
      promises.push(
        query(
          `SELECT date::text, currency, central_rate, buying_rate, selling_rate
           FROM vault.fx_rates_daily
           WHERE date >= (SELECT MAX(date) FROM vault.fx_rates_daily) - (INTERVAL '1 day' * $1::integer)
             AND currency = ANY($2::text[])
           ORDER BY currency, date`,
          [trendDays, currencies as unknown as string],
        ).then((result) => {
          responseData.trends = result
        })
      )
    }

    if (types.includes("changes")) {
      console.log("[v0] Executing changes query...")
      promises.push(
        query(
          `SELECT date::text, currency, central_rate
           FROM vault.fx_rates_daily
           WHERE date >= (SELECT MAX(date) FROM vault.fx_rates_daily) - (INTERVAL '1 day' * $1::integer)
             AND currency = $2
           ORDER BY date`,
          [changeDays, currency],
        ).then((result) => {
          responseData.changes = result
        })
      )
    }

    if (types.includes("averages")) {
      console.log("[v0] Executing averages query...")
      promises.push(
        query(
          `WITH latest AS (SELECT MAX(date) as max_date FROM vault.fx_rates_daily),
           currencies AS (SELECT DISTINCT currency FROM vault.fx_rates_daily),
           data AS (
             SELECT c.currency, f.central_rate, f.date
             FROM currencies c
             LEFT JOIN vault.fx_rates_daily f ON c.currency = f.currency AND f.date >= (SELECT max_date FROM latest) - INTERVAL '365 days'
           )
           SELECT d.currency,
             AVG(CASE WHEN d.date >= (SELECT max_date FROM latest) - INTERVAL '30 days' THEN d.central_rate ELSE NULL END) as monthly_avg,
             AVG(d.central_rate) as yearly_avg
           FROM data d
           GROUP BY d.currency
           ORDER BY d.currency`,
        ).then((result) => {
          responseData.averages = result
        })
      )
    }

    if (types.includes("volatility")) {
      console.log("[v0] Executing volatility query...")
      promises.push(
        query(
          `SELECT date::text, currency, central_rate
           FROM vault.fx_rates_daily
           WHERE date >= (SELECT MAX(date) FROM vault.fx_rates_daily) - (INTERVAL '1 day' * $1::integer)
             AND currency = $2
           ORDER BY date`,
          [changeDays, currency],
        ).then((result) => {
          responseData.volatility = result
        })
      )
    }

    if (types.includes("historical") && date) {
      console.log("[v0] Executing historical query...")
      const historicalCurrency = explorerCurrency === "All" ? undefined : explorerCurrency
      promises.push(
        query(
          `SELECT date::text, currency, central_rate AS rate, buying_rate, selling_rate
           FROM vault.fx_rates_daily
           WHERE date::text = $1 ${historicalCurrency ? "AND currency = $2" : ""}
           ORDER BY currency`,
          historicalCurrency ? [date, historicalCurrency] : [date],
        ).then((result) => {
          responseData.historical = result
        })
      )
    } else if (types.includes("historical")) {
      responseData.historical = []
    }

    if (types.includes("records")) {
      console.log("[v0] Executing records query...")
      const lowsPromise = query(
        `SELECT DISTINCT ON (currency) currency, date::text, central_rate as rate
         FROM vault.fx_rates_daily
         ORDER BY currency, central_rate ASC, date DESC`,
      ).then((lows) => {
        responseData.records = { ...responseData.records, lows }
      })
      const highsPromise = query(
        `SELECT DISTINCT ON (currency) currency, date::text, central_rate as rate
         FROM vault.fx_rates_daily
         ORDER BY currency, central_rate DESC, date DESC`,
      ).then((highs) => {
        responseData.records = { ...responseData.records, highs }
      })
      promises.push(lowsPromise, highsPromise)
    }

    if (types.includes("currencies")) {
      console.log("[v0] Executing currencies query...")
      promises.push(
        query<{ currency: string }>(
          `SELECT DISTINCT currency FROM vault.fx_rates_daily ORDER BY currency`,
        ).then((result) => {
          responseData.currencies = result.map((r) => r.currency)
        })
      )
    }

    if (types.includes("date-range")) {
      console.log("[v0] Executing date-range query...")
      promises.push(
        query<{ min_date: string; max_date: string }>(
          `SELECT MIN(date)::text as min_date, MAX(date)::text as max_date
           FROM vault.fx_rates_daily`,
        ).then((result) => {
          responseData["date-range"] = result[0] || { min_date: null, max_date: null }
        })
      )
    }

    await Promise.all(promises)

    return NextResponse.json(types.length === 1 ? responseData[types[0]] : responseData)
  } catch (error) {
    console.error("[v0] Database error:", error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      {
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : "Unknown error",
        hint: "Make sure GCP_DATABASE_URL is set correctly in the Vars section",
      },
      { status: 500 },
    )
  }
}
