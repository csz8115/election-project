import { useUserStore } from "../store/userStore";
import Navbar from "../components/navbar";
import UserDash from "../components/userDash";
import { User } from "lucide-react";

export default function Dashboard() {
    const user = useUserStore((state) => state);
    return (
        <div>
            <Navbar />
            <UserDash />
        </div>
    );
}