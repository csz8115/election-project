import { useUserStore } from "../store/userStore";
import { useLocation } from "react-router-dom";
import { Navigate } from "react-router-dom";
import type { ballots } from "@prisma/client";

export default function Ballot() {
    const user = useUserStore((state) => state);
    const location = useLocation();
    const ballot = (location.state as any)?.ballot as ballots | undefined;

    if (user.accountType === "Employee") return <Navigate to="/employee-ballot" state={{ ballot }} />;
    if (user.accountType === "Member") return <Navigate to="/user-ballot" state={{ ballot }} />;
    if (user.accountType === "Officer") return <Navigate to="/employee-ballot" state={{ ballot }} />;
    if (user.accountType === "Admin") return <Navigate to="/employee-ballot" state={{ ballot }} />;
    return <Navigate to="/login" />;
}