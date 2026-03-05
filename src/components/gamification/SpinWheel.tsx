import { useState, useEffect, useRef, useCallback } from "react";
import { X, Clock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSpinWheelConfig, useSpinWheelSlices, SpinWheelSlice } from "@/hooks/useSpinWheel";

interface SpinWheelProps {
  onClose: () => void;
}

const SpinWheel = ({ onClose }: SpinWheelProps) => {
  const { user } = useAuth();
  const { data: config } = useSpinWheelConfig();
  const { data: slices } = useSpinWheelSlices(config?.id);
  
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{
    label: string;
    prize_type: string;
    coupon_code: string | null;
    expires_at: string | null;
    min_cart_amount: number;
    discount_value: number;
    is_winner: boolean;
  } | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownRef = useRef<NodeJS.Timeout>();

  const defaultColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];

  useEffect(() => {
    if (slices && slices.length > 0) {
      drawWheel(slices);
    }
  }, [slices, config]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = (expiresAt: string) => {
    const updateCountdown = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown("Süre doldu!");
        if (countdownRef.current) clearInterval(countdownRef.current);
        return;
      }
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setCountdown(`${hours}s ${minutes}dk ${seconds}sn`);
    };
    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);
  };

  const drawWheel = (wheelSlices: SpinWheelSlice[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const sliceAngle = (2 * Math.PI) / wheelSlices.length;
    const colors = (config?.wheel_colors as string[]) || defaultColors;

    ctx.clearRect(0, 0, size, size);

    wheelSlices.forEach((slice, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice fill
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slice.color || colors[i % colors.length];
      ctx.fill();
      
      // Border
      ctx.strokeStyle = config?.border_color || "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 3;
      ctx.fillText(slice.label, radius - 18, 4);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    ctx.fillStyle = config?.center_color || "#2d4a3e";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ÇEVİR", center, center);
  };

  const spin = async () => {
    if (spinning || !slices || slices.length === 0) return;

    if (!user) {
      toast.error("Çarkı çevirebilmek için giriş yapmalısınız!");
      return;
    }

    setSpinning(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Oturum bulunamadı, lütfen tekrar giriş yapın");
        setSpinning(false);
        return;
      }

      const response = await supabase.functions.invoke("spin-wheel", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        const errorData = response.error;
        toast.error(typeof errorData === "string" ? errorData : "Bir hata oluştu");
        setSpinning(false);
        return;
      }

      const data = response.data;

      if (data.error) {
        if (data.next_spin_at) {
          toast.error(`Çarkı tekrar çevirebilmek için beklemelisiniz`);
        } else {
          toast.error(data.error);
        }
        setSpinning(false);
        return;
      }

      // Calculate rotation to land on the winning slice
      const sliceCount = slices.length;
      const sliceAngle = 360 / sliceCount;
      const targetSliceIndex = data.slice_index;
      
      // We want the pointer (top) to land on the target slice
      // Slice 0 starts at 3 o'clock, pointer is at top (12 o'clock = -90deg)
      // Target angle = -(targetSliceIndex * sliceAngle + sliceAngle/2) + 270
      const targetAngle = 360 - (targetSliceIndex * sliceAngle + sliceAngle / 2);
      
      // Add near-miss effect: slightly overshoot then settle
      const extraSpins = 6 + Math.floor(Math.random() * 3);
      const nearMissOffset = (Math.random() > 0.5 ? 1 : -1) * (sliceAngle * 0.35);
      const totalRotation = extraSpins * 360 + targetAngle + nearMissOffset;
      
      // First spin with overshoot
      setRotation(prev => prev + totalRotation);

      // Then settle to exact position after the overshoot
      setTimeout(() => {
        const finalRotation = extraSpins * 360 + targetAngle;
        setRotation(prev => prev - nearMissOffset);
      }, 4200);

      setTimeout(() => {
        setResult({
          label: data.slice.label,
          prize_type: data.slice.prize_type,
          coupon_code: data.coupon_code,
          expires_at: data.expires_at,
          min_cart_amount: data.slice.min_cart_amount,
          discount_value: data.slice.discount_value,
          is_winner: data.is_winner,
        });
        setSpinning(false);

        if (data.is_winner && data.coupon_code) {
          toast.success(`🎉 Tebrikler! ${data.slice.label} kazandınız!`);
          if (data.expires_at) {
            startCountdown(data.expires_at);
          }
        } else {
          toast.info("Maalesef bu sefer kazanamadınız. Yarın tekrar deneyin!");
        }
      }, 4800);

    } catch (err) {
      console.error("Spin error:", err);
      toast.error("Bir hata oluştu, lütfen tekrar deneyin");
      setSpinning(false);
    }
  };

  if (!config || !slices || slices.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background rounded-2xl p-6 max-w-sm w-full mx-4 relative shadow-2xl border border-border">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-center mb-1">🎰 Şans Çarkı</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {user ? "Çarkı çevirin ve sürpriz kazanın!" : "Çarkı çevirmek için giriş yapın!"}
        </p>

        <div className="relative flex justify-center mb-4">
          {/* Pointer arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-primary drop-shadow-lg" />
          </div>
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4.5s cubic-bezier(0.15, 0.7, 0.1, 1)" : "transform 0.5s ease-out",
            }}
          >
            <canvas ref={canvasRef} width={280} height={280} className="rounded-full shadow-lg" />
          </div>
        </div>

        {result && (
          <div className="text-center mb-3 p-3 rounded-lg bg-muted/50">
            {result.is_winner ? (
              <>
                <p className="font-bold text-lg text-primary">🎉 {result.label}</p>
                {result.coupon_code && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Kupon Kodu: <span className="font-mono font-bold text-primary text-base">{result.coupon_code}</span>
                    </p>
                    {result.min_cart_amount > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        Min. sepet tutarı: {result.min_cart_amount}₺
                      </p>
                    )}
                    {countdown && (
                      <p className="text-xs text-destructive flex items-center justify-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        Son kullanma: {countdown}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="font-bold text-lg text-muted-foreground">😔 Tekrar deneyin — Yarın şansınızı yeniden deneyin!</p>
            )}
          </div>
        )}

        <Button onClick={spin} disabled={spinning || !user} className="w-full" size="lg">
          {spinning ? "Çevriliyor..." : !user ? "Giriş Yaparak Çevirin" : "Çarkı Çevir!"}
        </Button>
      </div>
    </div>
  );
};

export default SpinWheel;
