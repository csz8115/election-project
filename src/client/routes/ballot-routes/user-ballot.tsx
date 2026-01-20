import { useLocation, useNavigate } from "react-router-dom";
import type { ballots } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { PulseLoader } from "react-spinners";
import { CircleCheckBig } from "lucide-react";

import Navbar from "../../components/nav/navbar";
import CandidateCard from "../../components/candidateCard";
import { getBallotResultsMember } from "../../lib/form-actions";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function UserBallot() {
  const location = useLocation();
  const navigate = useNavigate();

  // Guard if user refreshes page (location.state is lost)
  const ballot = (location.state as any)?.ballot as ballots | undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userBallotResults", ballot?.ballotID],
    queryFn: () => getBallotResultsMember(ballot!.ballotID),
    enabled: !!ballot?.ballotID,
  });

  return (
    <div className="min-h-screen w-full bg-background text-foreground">

      {!ballot ? (
        <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center px-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>No ballot selected</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
          {/* Header */}
          <Card className="border border-white/10 bg-slate-900/60">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-2xl text-slate-100 truncate">
                  {ballot.ballotName}
                </CardTitle>
                <p className="text-sm text-slate-300 mt-1">Complete</p>
              </div>

              <CircleCheckBig className="text-green-500 shrink-0" />
            </CardHeader>
          </Card>

          {/* Loading / Error */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <PulseLoader color="currentColor" size={10} />
            </div>
          )}

          {isError && (
            <Card className="border border-white/10 bg-slate-900/60">
              <CardContent className="py-10 text-slate-200">
                Error loading ballot results.
              </CardContent>
            </Card>
          )}

          {!isLoading && !isError && !data?.results && (
            <Card className="border border-white/10 bg-slate-900/60">
              <CardContent className="py-10 text-slate-200">
                No results returned.
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {!isLoading && !isError && data?.results && (
            <div className="space-y-10">
              {/* Initiatives */}
              {!!data.results.initiatives?.length && (
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Initiatives
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.results.initiatives.map((initiative: any) => (
                      <Card
                        key={initiative.initiativeID}
                        className="border border-white/10 bg-slate-900/60"
                      >
                        <CardHeader>
                          <CardTitle className="text-base text-slate-100">
                            {initiative.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-slate-300">
                          <p>{initiative.description}</p>
                          <p className="text-slate-200">
                            Votes:{" "}
                            <span className="font-medium">
                              {initiative.votes ?? 0}
                            </span>
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Positions */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-100">
                  Positions
                </h2>

                <div className="space-y-6">
                  {data.results.positions.map((position: any) => (
                    <section
                      key={position.positionID}
                      className="rounded-2xl border border-white/10 bg-slate-900/60"
                    >
                      <div className="px-5 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-slate-100">
                          {position.positionName}
                        </h3>
                        <p className="text-sm text-slate-300">
                          Total Votes:{" "}
                          <span className="text-slate-100 font-medium">
                            {position?._count?.positionVotes ?? 0}
                          </span>
                        </p>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {position.candidates.slice(0, 1).map(
                            (candidate: any, index: number) => (
                              <CandidateCard
                                key={candidate.candidate.candidateID}
                                candidate={candidate.candidate}
                                candidateIndex={index}
                              />
                            )
                          )}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}