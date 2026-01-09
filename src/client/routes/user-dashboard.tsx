import { useUserStore } from "../store/userStore";
import Navbar from "../components/nav/navbar";
import UserDash from "../components/dashboard/userDash";

export default function UserDashboard() {
    const user = useUserStore((state) => state);
    return (
        <div>
            <UserDash />
        </div>
    );
}