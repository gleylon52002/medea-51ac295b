-- Maintenance Tasks table for scheduled AI operations
CREATE TABLE maintenance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  schedule text, -- cron expression like "0 9 * * *"
  task_type text NOT NULL DEFAULT 'manual', -- manual, scheduled, recurring
  action_type text NOT NULL, -- check_stock, update_seo, send_report, custom
  action_params jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_result jsonb,
  run_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage tasks
CREATE POLICY "Admins can manage maintenance tasks" ON maintenance_tasks 
  FOR ALL USING (public.is_admin());

-- Update trigger
CREATE TRIGGER update_maintenance_tasks_updated_at
  BEFORE UPDATE ON maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- AI Action Logs for auditing
CREATE TABLE ai_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  action_params jsonb DEFAULT '{}',
  result jsonb,
  executed_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending', -- pending, success, failed
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai action logs" ON ai_action_logs 
  FOR ALL USING (public.is_admin());