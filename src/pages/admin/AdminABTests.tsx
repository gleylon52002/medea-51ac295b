import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

// A/B Test module removed - redirecting to dashboard
const AdminABTests = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/admin", { replace: true });
  }, [navigate]);
  return null;
};

export default AdminABTests;
