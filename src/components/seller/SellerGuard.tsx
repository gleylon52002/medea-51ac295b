import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerStatus } from "@/hooks/useSeller";

interface SellerGuardProps {
  children: ReactNode;
}

const SellerGuard = ({ children }: SellerGuardProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: sellerStatus, isLoading: sellerLoading } = useSellerStatus();

  if (authLoading || sellerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  if (sellerStatus?.type !== "seller" || sellerStatus.data.status !== "active") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default SellerGuard;
