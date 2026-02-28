import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

const getSessionId = () => {
  let sessionId = sessionStorage.getItem("activity_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("activity_session_id", sessionId);
  }
  return sessionId;
};

export const useActivityLogger = () => {
  const location = useLocation();
  const { user } = useAuth();
  const lastPath = useRef("");

  const logActivity = useCallback(async (
    actionType: string,
    pagePath: string,
    detail?: Record<string, any>
  ) => {
    try {
      await supabase.from("site_activity_logs").insert({
        user_id: user?.id || null,
        session_id: getSessionId(),
        page_path: pagePath,
        action_type: actionType,
        action_detail: detail || {},
        referrer: document.referrer || null,
        device_type: getDeviceType(),
        user_agent: navigator.userAgent,
      });
    } catch (e) {
      // Silent fail - don't break the app for logging
    }
  }, [user?.id]);

  // Auto-log page views
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      logActivity("page_view", location.pathname);
    }
  }, [location.pathname, logActivity]);

  return { logActivity };
};

export const logProductView = async (productId: string, productName: string, userId?: string) => {
  try {
    await supabase.from("site_activity_logs").insert({
      user_id: userId || null,
      session_id: getSessionId(),
      page_path: `/urun/${productId}`,
      action_type: "product_view",
      action_detail: { product_id: productId, product_name: productName },
      device_type: getDeviceType(),
      user_agent: navigator.userAgent,
    });
  } catch (e) {}
};

export const logAddToCart = async (productId: string, productName: string, userId?: string) => {
  try {
    await supabase.from("site_activity_logs").insert({
      user_id: userId || null,
      session_id: getSessionId(),
      page_path: window.location.pathname,
      action_type: "add_to_cart",
      action_detail: { product_id: productId, product_name: productName },
      device_type: getDeviceType(),
      user_agent: navigator.userAgent,
    });
  } catch (e) {}
};

export const logPurchase = async (orderId: string, total: number, userId?: string) => {
  try {
    await supabase.from("site_activity_logs").insert({
      user_id: userId || null,
      session_id: getSessionId(),
      page_path: "/odeme",
      action_type: "purchase",
      action_detail: { order_id: orderId, total },
      device_type: getDeviceType(),
      user_agent: navigator.userAgent,
    });
  } catch (e) {}
};

export const logSellerLogin = async (sellerId: string, userId?: string) => {
  try {
    await supabase.from("site_activity_logs").insert({
      user_id: userId || null,
      session_id: getSessionId(),
      page_path: "/satici",
      action_type: "seller_login",
      action_detail: { seller_id: sellerId },
      device_type: getDeviceType(),
      user_agent: navigator.userAgent,
    });
  } catch (e) {}
};
