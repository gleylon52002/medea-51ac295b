import { supabase } from "@/integrations/supabase/client";

let sessionId: string | null = null;

const getSessionId = () => {
  if (!sessionId) {
    sessionId = sessionStorage.getItem("checkout_session") || crypto.randomUUID();
    sessionStorage.setItem("checkout_session", sessionId);
  }
  return sessionId;
};

export const trackCheckoutStep = async (step: string, metadata?: Record<string, any>) => {
  try {
    await supabase.from("checkout_events" as any).insert({
      session_id: getSessionId(),
      user_id: (await supabase.auth.getUser()).data.user?.id || null,
      step,
      metadata: metadata || {},
    } as any);
  } catch (err) {
    // Silent fail
  }
};

export const resetCheckoutSession = () => {
  sessionId = null;
  sessionStorage.removeItem("checkout_session");
};
