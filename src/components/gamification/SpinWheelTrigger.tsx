import { useState, useEffect, useCallback } from "react";
import { Gift } from "lucide-react";
import SpinWheel from "./SpinWheel";
import { useAuth } from "@/contexts/AuthContext";
import { useSpinWheelConfig, useUserLastSpin } from "@/hooks/useSpinWheel";
import { Button } from "@/components/ui/button";

const SpinWheelTrigger = () => {
  const { user } = useAuth();
  const { data: config } = useSpinWheelConfig();
  const { data: lastSpin } = useUserLastSpin(user?.id);
  
  const [showWheel, setShowWheel] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Check if user can spin (cooldown elapsed)
  const canSpin = useCallback(() => {
    if (!config) return false;
    if (!user) return true; // Show for non-logged in too (they'll be prompted to login)
    if (!lastSpin) return true;
    
    const cooldownMs = config.cooldown_hours * 60 * 60 * 1000;
    const timeSince = Date.now() - new Date(lastSpin.created_at).getTime();
    return timeSince >= cooldownMs;
  }, [config, user, lastSpin]);

  // Scroll-based or exit-intent trigger for auto-popup (only once per session)
  useEffect(() => {
    if (!config || autoTriggered) return;
    if (sessionStorage.getItem("spin_dismissed")) return;
    if (!canSpin()) return;

    const triggerType = config.trigger_type;
    let triggered = false;

    // Scroll trigger
    const handleScroll = () => {
      if (triggered) return;
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= config.trigger_scroll_percent) {
        triggered = true;
        setAutoTriggered(true);
        setTimeout(() => setShowWheel(true), 500);
      }
    };

    // Exit intent trigger
    const handleMouseLeave = (e: MouseEvent) => {
      if (triggered) return;
      if (e.clientY <= 0) {
        triggered = true;
        setAutoTriggered(true);
        setShowWheel(true);
      }
    };

    // Delayed trigger
    let timer: NodeJS.Timeout | undefined;
    if (triggerType === "scroll" || triggerType === "both") {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
    if (triggerType === "exit_intent" || triggerType === "both") {
      document.addEventListener("mouseleave", handleMouseLeave);
    }
    
    // Also show after delay as fallback
    timer = setTimeout(() => {
      if (!triggered && canSpin()) {
        triggered = true;
        setAutoTriggered(true);
        setShowWheel(true);
      }
    }, (config.trigger_delay_seconds || 60) * 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (timer) clearTimeout(timer);
    };
  }, [config, autoTriggered, canSpin]);

  // Show floating button for logged-in users who can spin
  useEffect(() => {
    if (user && config && canSpin()) {
      setShowFloatingButton(true);
    } else {
      setShowFloatingButton(false);
    }
  }, [user, config, canSpin]);

  if (!config) return null;

  return (
    <>
      {/* Floating spin button for logged-in users */}
      {showFloatingButton && !showWheel && (
        <button
          onClick={() => setShowWheel(true)}
          className="fixed bottom-24 left-4 z-40 bg-primary text-primary-foreground rounded-full p-3 shadow-xl hover:scale-110 transition-transform animate-fade-in"
          title="Şans Çarkını Çevir!"
        >
          <Gift className="h-6 w-6" />
        </button>
      )}

      {showWheel && (
        <SpinWheel
          onClose={() => {
            setShowWheel(false);
            setShowFloatingButton(false);
            sessionStorage.setItem("spin_dismissed", "true");
          }}
        />
      )}
    </>
  );
};

export default SpinWheelTrigger;
