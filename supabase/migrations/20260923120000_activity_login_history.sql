-- Activity logs and login history for admin security auditing.
-- Written server-side only via the service-role key; RLS denies anon/authenticated.

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  actor TEXT NOT NULL DEFAULT 'anonymous',
  ip_address TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs (action);
CREATE INDEX idx_activity_logs_resource ON activity_logs (resource);
CREATE INDEX idx_activity_logs_actor ON activity_logs (actor);

CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'rate_limited', 'logout')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_history_created_at ON login_history (created_at DESC);
CREATE INDEX idx_login_history_username ON login_history (username);
CREATE INDEX idx_login_history_status ON login_history (status);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
