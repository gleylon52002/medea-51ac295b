import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SpinWheelProps {
  onClose: () => void;
}

const PRIZES = [
  { label: "%5 İndirim", code: "SPIN5", color: "hsl(var(--primary))" },
  { label: "Ücretsiz Kargo", code: "FREESHIP", color: "hsl(var(--accent))" },
  { label: "%10 İndirim", code: "SPIN10", color: "hsl(var(--secondary))" },
  { label: "Tekrar Dene", code: "", color: "hsl(var(--muted))" },
  { label: "%15 İndirim", code: "SPIN15", color: "hsl(var(--primary))" },
  { label: "Sürpriz Hediye", code: "SURPRISE", color: "hsl(var(--accent))" },
  { label: "%3 İndirim", code: "SPIN3", color: "hsl(var(--secondary))" },
  { label: "Tekrar Dene", code: "", color: "hsl(var(--muted))" },
];

const SpinWheel = ({ onClose }: SpinWheelProps) => {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, []);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const sliceAngle = (2 * Math.PI) / PRIZES.length;

    PRIZES.forEach((prize, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#f0f0f0" : "#e0e0e0";
      ctx.fill();
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#333";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(prize.label, radius - 15, 4);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.fill();
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const extraSpins = 5;
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = rotation + extraSpins * 360 + randomAngle;
    setRotation(totalRotation);

    setTimeout(() => {
      const normalizedAngle = (360 - (totalRotation % 360)) % 360;
      const sliceSize = 360 / PRIZES.length;
      const winIndex = Math.floor(normalizedAngle / sliceSize);
      const prize = PRIZES[winIndex];
      setResult(prize);
      setSpinning(false);

      if (prize.code) {
        toast.success(`Tebrikler! ${prize.label} kazandınız! Kupon kodu: ${prize.code}`);
        localStorage.setItem("spin_prize_code", prize.code);
        localStorage.setItem("spin_played_at", Date.now().toString());
      } else {
        toast.info("Maalesef bu sefer kazanamadınız. Tekrar deneyin!");
      }
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl p-6 max-w-sm w-full mx-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-center mb-1">🎰 Şans Çarkı</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">Çarkı çevirin ve sürpriz kazanın!</p>

        <div className="relative flex justify-center mb-4">
          {/* Arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-primary text-2xl">▼</div>
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
          >
            <canvas ref={canvasRef} width={280} height={280} className="rounded-full" />
          </div>
        </div>

        {result ? (
          <div className="text-center mb-3">
            <p className="font-bold text-lg">{result.code ? `🎉 ${result.label}` : "😔 Tekrar deneyin"}</p>
            {result.code && <p className="text-sm text-muted-foreground">Kupon: <span className="font-mono font-bold text-primary">{result.code}</span></p>}
          </div>
        ) : null}

        <Button onClick={spin} disabled={spinning} className="w-full">
          {spinning ? "Çevriliyor..." : "Çarkı Çevir!"}
        </Button>
      </div>
    </div>
  );
};

export default SpinWheel;
