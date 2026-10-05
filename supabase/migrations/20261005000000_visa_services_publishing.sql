-- Publishing controls for visa services.
-- Mirrors team_members: inactive rows are hidden from the public site and
-- display_order controls the presentation order.
-- Idempotent so it is safe on deployments that already applied it.

ALTER TABLE visa_services ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE visa_services ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_visa_services_is_active ON visa_services (is_active);
CREATE INDEX IF NOT EXISTS idx_visa_services_display_order ON visa_services (display_order);
