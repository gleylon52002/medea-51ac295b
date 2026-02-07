-- Migration: Messaging RLS Fixes
-- Description: Adds missing INSERT and UPDATE policies for messaging persistence.

-- 1. Conversation Policies
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
CREATE POLICY "Users can insert their own conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = ANY(participants));

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" 
ON public.conversations FOR UPDATE
USING (auth.uid() = ANY(participants) OR is_admin());

-- 2. Message Policies
DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
CREATE POLICY "Users can insert messages into their conversations" 
ON public.messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (auth.uid() = ANY(participants) OR is_admin())
    )
);

-- 3. Message Attachments Policies
DROP POLICY IF EXISTS "Users can insert attachments for their messages" ON public.message_attachments;
CREATE POLICY "Users can insert attachments for their messages" 
ON public.message_attachments FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON m.conversation_id = c.id
        WHERE m.id = message_attachments.message_id
        AND (auth.uid() = ANY(c.participants) OR is_admin())
    )
);

-- 4. User Roles Visibility (Required for starting conversations)
-- Ensure authenticated users can see other users' basic attributes needed for chat initiation
DROP POLICY IF EXISTS "Users can view all roles for messaging" ON public.user_roles;
CREATE POLICY "Users can view all roles for messaging" 
ON public.user_roles FOR SELECT 
USING (true);

-- 5. Chat Storage Bucket and Policies
-- Ensure the bucket exists and users can only access their own files
-- Note: Bucket creation via SQL requires the storage extension to be enabled
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_attachments', 'chat_attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'chat_attachments' 
    AND (auth.role() = 'authenticated')
);

DROP POLICY IF EXISTS "Users can view their own chat attachments" ON storage.objects;
CREATE POLICY "Users can view their own chat attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'chat_attachments'
    AND (auth.role() = 'authenticated')
);
