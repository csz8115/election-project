import { useUserStore } from "../store/userStore";
import Navbar from "../components/navbar";
import UserDash from "../components/userDash";

export default function UserDashboard() {
    const user = useUserStore((state) => state);
    return (
        <div>
            <Navbar />
            <UserDash />
        </div>
    );
}