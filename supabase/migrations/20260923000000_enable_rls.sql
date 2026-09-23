-- Enable Row Level Security on all application tables.
--
-- The Supabase anon key is public (NEXT_PUBLIC_*, shipped in the client
-- bundle). Without RLS, anyone holding that key could read or write every
-- row directly through the PostgREST API, bypassing the app's admin auth.
--
-- No policies are defined: anon/authenticated roles are denied by default.
-- The application only accesses data server-side with the service-role key,
-- which bypasses RLS, so app behavior is unchanged.

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_team ENABLE ROW LEVEL SECURITY;
