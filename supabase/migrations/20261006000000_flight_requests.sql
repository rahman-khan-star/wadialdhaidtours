-- Flight search inquiries.
--
-- Wadi Zaid is a flight SEARCH + INQUIRY business: customers never buy
-- tickets on the site, so this table stores the request the team follows up
-- on manually. It intentionally has no price/fare/amount column — provider
-- pricing must not exist anywhere in the customer request flow.
--
-- Idempotent so it is safe on deployments that already applied it.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flight_request_status') THEN
    CREATE TYPE flight_request_status AS ENUM
      ('New', 'Contacted', 'In Progress', 'Completed', 'Cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS flight_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  origin_code TEXT NOT NULL,
  origin_name TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  passengers INTEGER NOT NULL DEFAULT 1
    CHECK (passengers >= 1 AND passengers <= 9),
  cabin TEXT NOT NULL,
  airline TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status flight_request_status NOT NULL DEFAULT 'New',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flight_requests_status ON flight_requests (status);
CREATE INDEX IF NOT EXISTS idx_flight_requests_created_at ON flight_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flight_requests_departure_date ON flight_requests (departure_date DESC);
CREATE INDEX IF NOT EXISTS idx_flight_requests_name ON flight_requests (name);

-- Deny anon/authenticated access: the app reads and writes with the
-- service-role key, which bypasses RLS.
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trigger_flight_requests_updated ON flight_requests;
CREATE TRIGGER trigger_flight_requests_updated
  BEFORE UPDATE ON flight_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
