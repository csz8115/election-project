import Navbar from "../components/navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { useQuery } from "@tanstack/react-query";


export default function SystemStats() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['activeUserBallots'],
        queryFn: () => getActiveUserBallots(user.userID),
    });

    return (
        <div>
            <Navbar />
            <h1 className="text-2xl font-bold mb-4">System Statistics</h1>
            <p className="text-gray-700">This page will display system statistics.</p>
            {/* Add your system stats components here */}
        </div>
    );
}