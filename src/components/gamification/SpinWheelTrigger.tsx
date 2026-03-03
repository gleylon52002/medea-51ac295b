import { useState, useEffect } from "react";
import SpinWheel from "./SpinWheel";

const SpinWheelTrigger = () => {
  const [showWheel, setShowWheel] = useState(false);

  useEffect(() => {
    // Check if user already played today
    const lastPlayed = localStorage.getItem("spin_played_at");
    if (lastPlayed) {
      const daysSince = (Date.now() - Number(lastPlayed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 1) return; // Already played today
    }

    // Show wheel after 2 minutes on site
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("spin_dismissed");
      if (!dismissed) {
        setShowWheel(true);
      }
    }, 120000);

    return () => clearTimeout(timer);
  }, []);

  if (!showWheel) return null;

  return (
    <SpinWheel
      onClose={() => {
        setShowWheel(false);
        sessionStorage.setItem("spin_dismissed", "true");
      }}
    />
  );
};

export default SpinWheelTrigger;
