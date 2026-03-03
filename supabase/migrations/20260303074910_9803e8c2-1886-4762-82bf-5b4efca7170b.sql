
-- Fix overly permissive INSERT on ai_chat_sessions
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.ai_chat_sessions;
CREATE POLICY "Authenticated or anonymous can create sessions" ON public.ai_chat_sessions FOR INSERT WITH CHECK (
  (user_id IS NULL) OR (user_id = auth.uid())
);
