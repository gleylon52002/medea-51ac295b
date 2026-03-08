
-- Add reply_to_id column to messages table for reply functionality
ALTER TABLE public.messages ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add typing_status table for real-time typing indicators
CREATE TABLE public.typing_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- Unique constraint so each user has one typing status per conversation
ALTER TABLE public.typing_status ADD CONSTRAINT typing_status_unique UNIQUE (conversation_id, user_id);

-- Enable RLS
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- Typing status policies - participants can see and manage
CREATE POLICY "Participants can view typing status" ON public.typing_status
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = typing_status.conversation_id 
      AND auth.uid() = ANY(c.participants)
    )
  );

CREATE POLICY "Users can manage their own typing status" ON public.typing_status
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for typing_status
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;
