import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "../store/userStore";
import { getActiveUserBallots, getBallotResults } from "../lib/form-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { get } from "http";
import type { ballots } from "@prisma/client";
import { PulseLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

export default function UserDash() {
    const user = useUserStore((state) => state);
    const navigate = useNavigate();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['activeUserBallots'],
        queryFn: () => getActiveUserBallots(user.userID),
    });
    const handleCardClick = async (ballot: ballots) => {
        navigate(`/ballot`, { state: { ballot }, });
    };

    return (
        <div className="flex flex-col items-center justify-center mt-16">
            <h1 className="text-2xl font-bold">My Elections</h1>
            <div className="space-y-6 p-4">
            {(isLoading || !data?.ballots) && <div className="flex justify-center mt-16"><PulseLoader color="#000" size={20} /></div>}
                {isError && <p>Error loading ballots</p>}
                {data?.ballots && (
                    <>
                        {data.ballots.some((ballot: ballots) => new Date(ballot.endDate) >= new Date()) && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Open Elections</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {data.ballots
                                        .filter((ballot: ballots) => new Date(ballot.endDate) >= new Date())
                                        .map((ballot: ballots) => (
                                            <Card key={ballot.ballotName} className="w-full cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => handleCardClick(ballot)}>
                                                <CardHeader>
                                                    <CardTitle>{ballot.ballotName}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p>Start Date: {new Date(ballot.startDate).toLocaleDateString()}</p>
                                                    <p>Deadline: {new Date(ballot.startDate).toLocaleDateString()}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        )}
                        {data.ballots.some((ballot: ballots) => new Date(ballot.endDate) < new Date()) && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Closed Elections</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {data.ballots
                                        .filter((ballot: ballots) => new Date(ballot.endDate) < new Date())
                                        .map((ballot: ballots) => (
                                            <Card key={ballot.ballotName} className="w-full cursor-pointer hover:scale-105 transition-transform duration-200 disabled:opacity-50" onClick={() => handleCardClick(ballot)}>
                                                <CardHeader>
                                                    <CardTitle>{ballot.ballotName}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p>Completed: {new Date(ballot.startDate).toLocaleDateString()}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}