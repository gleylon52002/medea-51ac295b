import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface ViewerCountProps {
  productId: string;
}

const ViewerCount = ({ productId }: ViewerCountProps) => {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    // Generate a realistic viewer count based on product ID
    // This creates a consistent number for each product
    const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseCount = (hash % 15) + 3; // 3-17 viewers
    
    // Add some randomness that changes over time
    const randomOffset = Math.floor(Math.random() * 5) - 2;
    setViewerCount(Math.max(2, baseCount + randomOffset));

    // Update periodically to simulate real-time
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(2, Math.min(25, prev + change));
      });
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [productId]);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="relative">
        <Eye className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
      <span>
        <span className="font-medium text-foreground">{viewerCount}</span> kişi şu an bu ürüne bakıyor
      </span>
    </div>
  );
};

export default ViewerCount;
