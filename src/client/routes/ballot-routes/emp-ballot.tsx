import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ballots } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PulseLoader } from "react-spinners";
import {
  CircleCheckBig,
  Pencil,
  Save,
  X,
  Loader2,
  CalendarClock,
  FileText,
} from "lucide-react";
import CandidateCard from "../../components/candidateCard";
import { getBallotResults } from "../../lib/form-actions";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import CreateCandidateCard from "../../components/createcandidateCard";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { useEditBallot } from "../../hooks/useEditBallot";
import { useBallot } from "../../hooks/useBallot";

type BallotDraft = {
  ballotName: string;
  description: string;
  startDate: string; // datetime-local string
  endDate: string; // datetime-local string
};

// ---------- helpers ----------
function toDateTimeLocal(value?: Date | string | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function toLocale(value?: Date | string | null) {
  if (!value) return "Not set";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleString();
}

function parseBallotIdFromQuery(search: string): number | undefined {
  const sp = new URLSearchParams(search);
  const raw = sp.get("b") || sp.get("ballotID") || sp.get("id");
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

export default function EmpBallot() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const ballotFromState = (location.state as any)?.ballot as ballots | undefined;

  // ✅ NEW: query param backup (?b=123)
  const ballotIdFromQuery = parseBallotIdFromQuery(location.search);

  // ✅ Source of truth for ballotID
  const ballotID = ballotIdFromQuery ?? ballotFromState?.ballotID;
  console.log("EmpBallot: ballotID =", ballotID);

  if (!ballotID) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-4">
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
    );
  }

  // ✅ Fetch ballot (refresh-safe). Seed with state when present.
  const ballotQuery = useBallot(ballotID, {
    enabled: true,
    initialData: ballotFromState,
  });

  const ballot = ballotQuery.data;

  // ✅ Results query (depends only on ballotID)
  const resultsQuery = useQuery({
    queryKey: ["ballotResults", ballotID],
    queryFn: () => getBallotResults(ballotID),
    enabled: !!ballotID,
  });

  const editBallotMutation = useEditBallot();

  // --- Edit state ---
  const [isEditing, setIsEditing] = React.useState(false);

  const initialDraft: BallotDraft | null = React.useMemo(() => {
    if (!ballot) return null;
    return {
      ballotName: ballot.ballotName ?? "",
      description: ballot.description ?? "",
      startDate: toDateTimeLocal(ballot.startDate as any),
      endDate: toDateTimeLocal(ballot.endDate as any),
    };
  }, [ballot]);

  const emptyDraft: BallotDraft = {
    ballotName: "",
    description: "",
    startDate: "",
    endDate: "",
  };

  const [draft, setDraft] = React.useState<BallotDraft | null>(initialDraft);

  React.useEffect(() => {
    setDraft(initialDraft ?? emptyDraft);
    setIsEditing(false);
  }, [initialDraft]);

  const startEdit = () => {
    if (!ballot) return;
    setDraft(initialDraft ?? emptyDraft);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (editBallotMutation.isPending) return;
    setDraft(initialDraft);
    setIsEditing(false);
  };

  const onSave = async () => {
    if (!ballot || !draft) return;

    const patch: Partial<ballots> = {};

    if ((ballot.ballotName ?? "") !== draft.ballotName) patch.ballotName = draft.ballotName;
    if ((ballot.description ?? "") !== draft.description) patch.description = draft.description;

    const start = draft.startDate ? new Date(draft.startDate) : null;
    const end = draft.endDate ? new Date(draft.endDate) : null;

    const oldStart = ballot.startDate ? new Date(ballot.startDate as any) : null;
    const oldEnd = ballot.endDate ? new Date(ballot.endDate as any) : null;

    const startChanged = (oldStart?.getTime() ?? null) !== (start?.getTime() ?? null);
    const endChanged = (oldEnd?.getTime() ?? null) !== (end?.getTime() ?? null);

    if (startChanged) patch.startDate = start as any;
    if (endChanged) patch.endDate = end as any;

    if (Object.keys(patch).length === 0) {
      toast.message("No changes to save.");
      setIsEditing(false);
      return;
    }

    try {
      await editBallotMutation.mutateAsync({ ballotID, patch });

      // ✅ immediate UI update
      queryClient.setQueryData(["ballot", ballotID], (prev: any) =>
        prev ? ({ ...prev, ...patch } as ballots) : prev
      );

      // ✅ refetch ballot + results (server truth)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ballot", ballotID] }),
        queryClient.invalidateQueries({ queryKey: ["ballotResults", ballotID] }),
      ]);

      toast.success("Ballot updated.");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update ballot.");
    }
  };

  if (ballotQuery.isLoading && !ballot) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading ballot...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (ballotQuery.isError) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Failed to load ballot</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ballot) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Ballot not found</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isComplete = ballot?.endDate && new Date(ballot.endDate as any) <= new Date();

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        {/* Header */}
        <Card className="border border-white/10 bg-slate-900/60">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-2xl text-slate-100 truncate">
                {isEditing ? (
                  <Input
                    value={draft?.ballotName ?? ""}
                    onChange={(e) => setDraft({ ...draft, ballotName: e.target.value } as any)}
                    className="border-white/10 bg-black/20 text-slate-100"
                    placeholder="Ballot name"
                  />

                ) : (
                  ballot.ballotName
                )}
              </CardTitle>

              <p className="text-sm text-slate-300 mt-1">
                {isComplete ? "Complete" : "In Progress"}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CircleCheckBig
                className={`shrink-0 ${isComplete ? "text-green-500" : "text-amber-400"}`}
              />

              {!isEditing ? (
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={startEdit}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="bg-white/10 hover:bg-white/15 text-slate-100"
                    onClick={onSave}
                    disabled={editBallotMutation.isPending}
                  >
                    {editBallotMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>

                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={cancelEdit}
                    disabled={editBallotMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-sm text-slate-300">
            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Start Date
                </p>

                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={draft?.startDate ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, startDate: e.target.value } : d))
                    }
                    className="mt-2 border-white/10 bg-black/20 text-slate-100"
                  />
                ) : (
                  <p className="text-slate-100 mt-1">{toLocale(ballot.startDate as any)}</p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  End Date
                </p>

                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={draft?.endDate ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, endDate: e.target.value } : d))
                    }
                    className="mt-2 border-white/10 bg-black/20 text-slate-100"
                  />
                ) : (
                  <p className="text-slate-100 mt-1">{toLocale(ballot.endDate as any)}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-400 flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Description
              </p>

              {isEditing ? (
                <Textarea
                  value={draft?.description ?? ""}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, description: e.target.value } : d))
                  }
                  className="min-h-[110px] border-white/10 bg-black/20 text-slate-100"
                  placeholder="Ballot description..."
                />
              ) : ballot?.description ? (
                <p className="text-slate-100">{ballot.description}</p>
              ) : (
                <p className="text-slate-500">No description.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading / Error */}
        {resultsQuery.isLoading && (
          <div className="flex items-center justify-center py-16">
            <PulseLoader color="currentColor" size={10} />
          </div>
        )}

        {resultsQuery.isError && (
          <Card className="border border-white/10 bg-slate-900/60">
            <CardContent className="py-10 text-slate-200">Error loading ballot results.</CardContent>
          </Card>
        )}

        {!resultsQuery.isLoading && !resultsQuery.isError && !resultsQuery.data?.results && (
          <Card className="border border-white/10 bg-slate-900/60">
            <CardContent className="py-10 text-slate-200">No results returned.</CardContent>
          </Card>
        )}

        {/* Content */}
        {!resultsQuery.isLoading && !resultsQuery.isError && resultsQuery.data?.results && (
          <div className="space-y-10">
            {/* Initiatives */}
            {!!resultsQuery.data.results.initiatives?.length && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-100">Initiatives</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resultsQuery.data.results.initiatives.map((initiative: any) => (
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
                          Votes: <span className="font-medium">{initiative.votes ?? 0}</span>
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Positions */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-100">Positions</h2>

              <div className="space-y-6">
                {resultsQuery.data.results.positions.map((position: any) => (
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
                        {position.candidates.map((candidate: any, index: number) => (
                          <div
                            key={candidate.candidate.candidateID}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              navigate(`/candidate/${candidate.candidate.candidateID}`, {
                                state: {
                                  candidate: candidate.candidate,
                                  votes: candidate.candidate._count?.positionVotes || 0,
                                  rank: index,
                                },
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                navigate(`/candidate/${candidate.candidate.candidateID}`, {
                                  state: {
                                    candidate: candidate.candidate,
                                    votes: candidate.candidate._count?.positionVotes || 0,
                                    rank: index,
                                  },
                                });
                              }
                            }}
                            className="cursor-pointer focus:outline-none"
                          >
                            <CandidateCard
                              candidate={candidate.candidate}
                              candidateIndex={index}
                              votes={candidate.candidate._count?.positionVotes || 0}
                            />
                          </div>
                        ))}

                        <CreateCandidateCard
                          onClick={() =>
                            navigate(`/create-candidate`, {
                              state: { positionID: position.positionID },
                            })
                          }
                        />
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
