import { useUserStore } from "../../store/userStore";
import { Navigate } from "react-router-dom";

export default function Dashboard() {
    const user = useUserStore((state) => state);
    if (user.accountType === "Employee") return <Navigate to="/employee-dashboard" />;
    if (user.accountType === "Member") return <Navigate to="/user-dashboard" />;
    if (user.accountType === "Officer") return <Navigate to="/officer-dashboard" />;
    if (user.accountType === "Admin") return <Navigate to="/admin-dashboard" />;
    return <Navigate to="/login" />;
}