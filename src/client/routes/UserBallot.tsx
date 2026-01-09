import { useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { getActiveUserBallots, getBallotResults, getBallotResultsMember } from "../lib/form-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "../components/ui/accordion"
import type { ballotPositions, ballots } from "@prisma/client";
import Navbar from "../components/nav/navbar";
import { useQuery } from "@tanstack/react-query";
import { PulseLoader } from "react-spinners";
import { CircleCheckBig, Crown } from "lucide-react";

export default function UserBallot() {
    const navigate = useNavigate();
    const location = useLocation();
    const ballot = location.state.ballot as ballots;
    const { data, isLoading, isError } = useQuery({
        queryKey: ['activeUserBallots'],
        queryFn: () => getBallotResultsMember(ballot.ballotID),
    });

    return (
        <div>
            <Navbar />
            <div className="flex items-center justify-center h-screen w-full">
                {ballot ? (
                    <Card className="w-full max-w-6xl shadow-lg">
                        <CardHeader>
                            <CardTitle>{ballot.ballotName}</CardTitle>
                            <CardDescription
                                className="text-sm flex gap-1 text-green-500"
                            >
                                <CircleCheckBig />
                                Complete
                            </CardDescription>
                        </CardHeader>
                        <CardContent>

                            {isLoading || !data.results ? (
                                <div className="flex items-center justify-center p-8">
                                    <PulseLoader color="#000" size={15} />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-semibold mb-4">Initiatives</h2>
                                    <div className="space-y-4">
                                        {data?.results?.initiatives.map((initiative: any) => (
                                            <div key={initiative.initiativeID} className="p-4 border rounded-lg">
                                                <h3 className="text-lg font-bold">{initiative.title}</h3>
                                                <p>{initiative.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <h2 className="text-xl font-semibold mt-6 mb-4">Positions</h2>
                                    <div className="space-y-4">
                                        {data?.results?.positions.map((position: any) => (
                                            <Accordion type="single" collapsible key={position.positionID}>
                                                <AccordionItem value={`position-${position.positionID}`}>
                                                    <AccordionTrigger className="p-4 border rounded-lg">
                                                        <div className="text-left">
                                                            <h3 className="text-lg font-bold">{position.positionName}</h3>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-4">
                                                        <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                                            {position.candidates.map((candidate: any, index: number) => {
                                                                const isWinner = index === 0; // Assuming candidates are sorted by vote count
                                                                return (
                                                                    <div key={candidate.candidateID} className="p-4 border rounded-lg bg-gray-50">
                                                                        <div className="mb-3">
                                                                            <div className="flex items-center gap-1">
                                                                                {isWinner && <Crown className="text-yellow-500 w-4 h-4" />}
                                                                                <h4 className="text-lg font-semibold">{candidate.candidate.fName} {candidate.candidate.lName}</h4>
                                                                            </div>
                                                                            <p className="text-sm italic text-gray-600">{candidate.candidate.titles}</p>
                                                                        </div>
                                                                        <img src={candidate.candidate.picture} alt="" className="w-full h-48 object-cover rounded-md mb-3" />
                                                                        <div>
                                                                            <p className="text-sm">{candidate.candidate.description ? candidate.candidate.description : `No description provided`}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        ))}
                                    </div>
                                </>
                            )}

                        </CardContent>
                    </Card>
                ) : (
                    <p>No ballot selected.</p>
                )}
            </div>
        </div>
    );
}