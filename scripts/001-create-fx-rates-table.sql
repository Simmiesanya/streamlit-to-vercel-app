-- Create the vault schema and fx_rates_daily table for Neon
-- This mirrors your GCP Cloud SQL structure

CREATE SCHEMA IF NOT EXISTS vault;

CREATE TABLE IF NOT EXISTS vault.fx_rates_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    currency VARCHAR(10) NOT NULL,
    buying_rate DECIMAL(12, 4),
    central_rate DECIMAL(12, 4),
    selling_rate DECIMAL(12, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, currency)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fx_rates_date ON vault.fx_rates_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_fx_rates_currency ON vault.fx_rates_daily(currency);
CREATE INDEX IF NOT EXISTS idx_fx_rates_date_currency ON vault.fx_rates_daily(date DESC, currency);

-- Add comment for documentation
COMMENT ON TABLE vault.fx_rates_daily IS 'Daily FX rates for currencies against Naira';
