import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function RoleBasedRedirect() {
  const navigate = useNavigate();
  const accountType = useSelector((state) => state.accountType);

  useEffect(() => {
    console.log("using default redirect");
    if (accountType === "Admin" || accountType === "Moderator") {
      navigate("/empDashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [accountType, navigate]);

  return null;
}