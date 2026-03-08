
-- Customer segments table
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  segment_type text NOT NULL DEFAULT 'manual',
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage segments" ON public.customer_segments FOR ALL USING (is_admin());

-- Email automation flows table
CREATE TABLE IF NOT EXISTS public.email_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL,
  delay_minutes integer NOT NULL DEFAULT 0,
  email_subject text NOT NULL,
  email_body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email automations" ON public.email_automations FOR ALL USING (is_admin());

-- Campaign calendar events table
CREATE TABLE IF NOT EXISTS public.campaign_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_type text NOT NULL DEFAULT 'campaign',
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  color text DEFAULT '#8B7355',
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign calendar" ON public.campaign_calendar FOR ALL USING (is_admin());
