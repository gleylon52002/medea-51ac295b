import { supabase } from "@/integrations/supabase/client";

// OneSignal App ID - this is a public/publishable key
const ONESIGNAL_APP_ID = "YOUR_ONESIGNAL_APP_ID"; // Will be replaced after setup

/**
 * Initialize OneSignal for push notifications in Capacitor app.
 * Call this after user login.
 */
export const initOneSignalPush = async () => {
  try {
    // Dynamic import for Capacitor environments only
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    // OneSignal Capacitor SDK
    const OneSignal = (await import("onesignal-cordova-plugin")).default;

    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Request notification permission
    OneSignal.Notifications.requestPermission(true);

    // Listen for subscription changes and save player_id
    OneSignal.User.pushSubscription.addEventListener("change", async (event: any) => {
      const playerId = event.current?.id;
      if (playerId) {
        await saveDeviceToken(playerId);
      }
    });

    // Get current subscription ID
    const currentId = OneSignal.User.pushSubscription.id;
    if (currentId) {
      await saveDeviceToken(currentId);
    }
  } catch (error) {
    console.warn("OneSignal init skipped (not native):", error);
  }
};

/**
 * Save device token to database
 */
const saveDeviceToken = async (playerId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("push_device_tokens" as any)
    .upsert(
      {
        user_id: user.id,
        player_id: playerId,
        device_type: getDeviceType(),
        is_active: true,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "user_id,player_id" }
    );
};

/**
 * Remove device token on logout
 */
export const removeDeviceToken = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("push_device_tokens" as any)
      .update({ is_active: false } as any)
      .eq("user_id", user.id);
  } catch (error) {
    console.warn("Failed to deactivate device token:", error);
  }
};

const getDeviceType = (): string => {
  try {
    const { Capacitor } = require("@capacitor/core");
    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
};
