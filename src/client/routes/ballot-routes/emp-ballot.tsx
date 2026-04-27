// EmpBallot.tsx (DROP-IN COMPLETE)
// ✅ per-position edit toggle (top-right)
// ✅ Apple-style jiggle in edit mode
// ✅ WHOLE candidate card click opens delete confirm modal (in edit mode)
// ✅ red X badge (visual only)
// ✅ Trash button in position header -> delete POSITION confirm modal
// ✅ NEW: Trash button in ballot header -> delete ELECTION/BALLOT confirm modal
// ✅ confirm modals (shadcn AlertDialog) for candidate + position + ballot
//
// NOTE: Replace the stub hooks with your real hooks/API.

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ballots } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PulseLoader } from "react-spinners";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CircleCheckBig,
  Pencil,
  Save,
  X,
  Loader2,
  CalendarClock,
  FileText,
  Check,
  Trash2,
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
import { useDeleteBallots } from "../../hooks/useDeleteBallots";
import { useDeleteCandidate } from "../../hooks/useDeleteCandidate";
import { useDeletePosition } from "../../hooks/useDeletePosition";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { PositionCard } from "../../components/emp-ballot/positionCard";

// ---------- Apple jiggle helpers ----------
const jiggleTransition = {
  duration: 0.18,
  repeat: Infinity as const,
  repeatType: "mirror" as const,
  ease: "easeInOut",
};

const cardJiggle = (index: number) => ({
  animate: { rotate: [-0.8, 0.8], x: [0, 0.6, 0] },
  transition: { ...jiggleTransition, delay: (index % 6) * 0.03 },
});

type BallotDraft = {
  ballotName: string;
  description: string;
  startDate: string;
  endDate: string;
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

type PendingCandidateDelete = {
  positionID: number;
  positionName: string;
  candidateID: number;
  candidateLabel: string;
};

type PendingPositionDelete = {
  positionID: number;
  positionName: string;
};

export default function EmpBallot() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const ballotFromState = (location.state as any)?.ballot as ballots | undefined;

  const ballotIdFromQuery = parseBallotIdFromQuery(location.search);
  const ballotID = ballotIdFromQuery ?? ballotFromState?.ballotID;
  const backToDashboardUrl = React.useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const from = sp.get("from");
    const companyIdRaw = Number(sp.get("companyId"));
    const companyId = Number.isFinite(companyIdRaw) && companyIdRaw > 0 ? companyIdRaw : undefined;

    if (from === "company-stats" && companyId) {
      return `/company-stats?companyId=${companyId}`;
    }

    return "/dashboard";
  }, [location.search]);

  // ✅ per-position edit toggle map
  const [editByPosition, setEditByPosition] = React.useState<Record<number, boolean>>({});
  const togglePositionEdit = (positionID: number) => {
    setEditByPosition((prev) => ({ ...prev, [positionID]: !prev[positionID] }));
  };

  // ✅ candidate delete modal state
  const [candidateConfirmOpen, setCandidateConfirmOpen] = React.useState(false);
  const [pendingCandidateDelete, setPendingCandidateDelete] =
    React.useState<PendingCandidateDelete | null>(null);

  // ✅ position delete modal state
  const [positionConfirmOpen, setPositionConfirmOpen] = React.useState(false);
  const [pendingPositionDelete, setPendingPositionDelete] =
    React.useState<PendingPositionDelete | null>(null);

  // ✅ ballot delete modal state
  const [ballotConfirmOpen, setBallotConfirmOpen] = React.useState(false);

  const removeCandidateMutation = useDeleteCandidate();
  const deletePositionMutation = useDeletePosition();
  const deleteBallotMutation = useDeleteBallots();

  const requestCandidateDelete = (payload: PendingCandidateDelete) => {
    if (isStructureLocked) {
      toast.error("This election has ended. Structure edits are disabled.");
      return;
    }
    setPendingCandidateDelete(payload);
    setCandidateConfirmOpen(true);
  };

  const requestPositionDelete = (payload: PendingPositionDelete) => {
    if (isStructureLocked) {
      toast.error("This election has ended. Structure edits are disabled.");
      return;
    }
    setPendingPositionDelete(payload);
    setPositionConfirmOpen(true);
  };

  const requestBallotDelete = () => setBallotConfirmOpen(true);

  const confirmCandidateDelete = async () => {
    if (!pendingCandidateDelete || !ballotID) return;

    try {
      await removeCandidateMutation.mutateAsync({
        ballotID,
        positionID: pendingCandidateDelete.positionID,
        candidateID: pendingCandidateDelete.candidateID,
      });

      await queryClient.invalidateQueries({ queryKey: ["ballotResults", ballotID] });
      toast.success("Candidate removed.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove candidate.");
    } finally {
      setCandidateConfirmOpen(false);
      setPendingCandidateDelete(null);
    }
  };

  const confirmPositionDelete = async () => {
    if (!pendingPositionDelete || !ballotID) return;

    try {
      await deletePositionMutation.mutateAsync({
        ballotID,
        positionID: pendingPositionDelete.positionID,
      });

      setEditByPosition((prev) => {
        const next = { ...prev };
        delete next[pendingPositionDelete.positionID];
        return next;
      });

      await queryClient.invalidateQueries({ queryKey: ["ballotResults", ballotID] });
      toast.success("Position deleted.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete position.");
    } finally {
      setPositionConfirmOpen(false);
      setPendingPositionDelete(null);
    }
  };

  const confirmBallotDelete = async () => {
    if (!ballotID) return;

    try {
      await deleteBallotMutation.mutateAsync({ ballotID });

      // clean caches
      await Promise.all([
        queryClient.removeQueries({ queryKey: ["ballot", ballotID] }),
        queryClient.removeQueries({ queryKey: ["ballotResults", ballotID] }),
      ]);

      toast.success("Election deleted.");
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete election.");
    } finally {
      setBallotConfirmOpen(false);
    }
  };

  if (!ballotID) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>No ballot selected</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(backToDashboardUrl)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ballotQuery = useBallot(ballotID, { enabled: true, initialData: ballotFromState });
  const ballot = ballotQuery.data;

  const resultsQuery = useQuery({
    queryKey: ["ballotResults", ballotID],
    queryFn: () => getBallotResults(ballotID),
    enabled: !!ballotID,
  });

  const editBallotMutation = useEditBallot();
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

  const emptyDraft: BallotDraft = { ballotName: "", description: "", startDate: "", endDate: "" };
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

    if ((oldStart?.getTime() ?? null) !== (start?.getTime() ?? null)) patch.startDate = start as any;
    if ((oldEnd?.getTime() ?? null) !== (end?.getTime() ?? null)) patch.endDate = end as any;

    if (Object.keys(patch).length === 0) {
      toast.message("No changes to save.");
      setIsEditing(false);
      return;
    }

    try {
      await editBallotMutation.mutateAsync({ ballotID, patch });

      queryClient.setQueryData(["ballot", ballotID], (prev: any) =>
        prev ? ({ ...prev, ...patch } as ballots) : prev
      );

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

  if (ballotQuery.isError || !ballot) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Failed to load ballot</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(backToDashboardUrl)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isStructureLocked = Boolean(
    ballot?.endDate && new Date().getTime() > new Date(ballot.endDate as any).getTime(),
  );
  const isComplete = isStructureLocked;

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
              <p className="text-sm text-slate-300 mt-1">{isComplete ? "Complete" : "In Progress"}</p>
            </div>

            <div className="flex items-start gap-3">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => navigate(backToDashboardUrl)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>

              <CircleCheckBig
                className={`shrink-0 ${isComplete ? "text-green-500" : "text-amber-400"}`}
              />

              {/* ✅ NEW: delete election button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={requestBallotDelete}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/15"
                aria-label="Delete election"
              >
                <Trash2 className="h-5 w-5 text-red-300" />
              </Button>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" /> Start Date
                </p>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={draft?.startDate ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, startDate: e.target.value } : d))}
                    className="mt-2 border-white/10 bg-black/20 text-slate-100"
                  />
                ) : (
                  <p className="text-slate-100 mt-1">{toLocale(ballot.startDate as any)}</p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" /> End Date
                </p>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={draft?.endDate ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, endDate: e.target.value } : d))}
                    className="mt-2 border-white/10 bg-black/20 text-slate-100"
                  />
                ) : (
                  <p className="text-slate-100 mt-1">{toLocale(ballot.endDate as any)}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-400 flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" /> Description
              </p>
              {isEditing ? (
                <Textarea
                  value={draft?.description ?? ""}
                  onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
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

        {isStructureLocked && (
          <Card className="border border-amber-500/40 bg-amber-950/20">
            <CardContent className="py-4 text-amber-200">
              This election has ended. Structure edits are disabled.
            </CardContent>
          </Card>
        )}

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

        {!resultsQuery.isLoading && !resultsQuery.isError && resultsQuery.data?.results && (
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-slate-100">Positions</h2>
                <Button
                  className="bg-white/10 text-slate-100 hover:bg-white/20"
                  onClick={() => navigate(`/create-position`, { state: { ballotID: ballot.ballotID } })}
                  disabled={isStructureLocked}
                >
                  Add Position
                </Button>
              </div>

              <div className="space-y-6">
                {resultsQuery.data.results.positions.map((position: any) => {
                  const isPosEdit = !!editByPosition[position.positionID];

                  return (
                    <section
                      key={position.positionID}
                      className="rounded-2xl border border-white/10 bg-slate-900/60"
                    >
                      <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-100">{position.positionName}</h3>
                          <p className="text-sm text-slate-300">
                            Total Votes:{" "}
                            <span className="text-slate-100 font-medium">
                              {position?._count?.positionVotes ?? 0}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              requestPositionDelete({
                                positionID: position.positionID,
                                positionName: position.positionName,
                              })
                            }
                            className="rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/15"
                            aria-label="Delete position"
                            disabled={isStructureLocked}
                          >
                            <Trash2 className="h-5 w-5 text-red-300" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (isStructureLocked) return;
                              togglePositionEdit(position.positionID);
                            }}
                            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                            aria-label={isPosEdit ? "Exit position edit mode" : "Edit candidates"}
                            disabled={isStructureLocked}
                          >
                            {isPosEdit ? (
                              <Check className="h-5 w-5 text-emerald-300" />
                            ) : (
                              <Pencil className="h-5 w-5 text-slate-200" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {position.candidates.map((candidate: any, index: number) => {
                            const cand = candidate.candidate;
                            const votes = cand._count?.positionVotes || 0;

                            const label =
                              cand?.candidateName ??
                              [cand?.firstName, cand?.lastName].filter(Boolean).join(" ") ??
                              "Candidate";

                            return (
                              <motion.div
                                key={cand.candidateID}
                                className="relative group"
                                animate={isPosEdit ? cardJiggle(index).animate : undefined}
                                transition={isPosEdit ? cardJiggle(index).transition : undefined}
                              >
                                {isPosEdit && (
                                  <div className="absolute -top-2 -right-2 z-10 rounded-full bg-red-600 shadow-lg border border-white/20 p-1">
                                    <X className="h-4 w-4 text-white" />
                                  </div>
                                )}

                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    if (isPosEdit && !isStructureLocked) {
                                      requestCandidateDelete({
                                        positionID: position.positionID,
                                        positionName: position.positionName,
                                        candidateID: cand.candidateID,
                                        candidateLabel: label,
                                      });
                                      return;
                                    }

                                    navigate(`/candidate/${cand.candidateID}`, {
                                      state: {
                                        candidate: cand,
                                        votes,
                                        rank: index,
                                        ballotID: ballot.ballotID,
                                        ballotEnded: isStructureLocked,
                                      },
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key !== "Enter" && e.key !== " ") return;

                                    if (isPosEdit && !isStructureLocked) {
                                      requestCandidateDelete({
                                        positionID: position.positionID,
                                        positionName: position.positionName,
                                        candidateID: cand.candidateID,
                                        candidateLabel: label,
                                      });
                                    } else {
                                      navigate(`/candidate/${cand.candidateID}`, {
                                        state: {
                                          candidate: cand,
                                          votes,
                                          rank: index,
                                          ballotID: ballot.ballotID,
                                          ballotEnded: isStructureLocked,
                                        },
                                      });
                                    }
                                  }}
                                  className={[
                                    "focus:outline-none",
                                    isPosEdit && !isStructureLocked
                                      ? "cursor-pointer rounded-2xl ring-2 ring-red-500/40 hover:ring-red-500/60"
                                      : "cursor-pointer",
                                  ].join(" ")}
                                >
                                  <CandidateCard candidate={cand} candidateIndex={index} votes={votes} />
                                </div>
                              </motion.div>
                            );
                          })}

                          <div className={isPosEdit || isStructureLocked ? "opacity-60 pointer-events-none" : ""}>
                            <CreateCandidateCard
                              onClick={() =>
                                navigate(`/create-candidate`, {
                                  state: { positionID: position.positionID, ballotID: ballot.ballotID },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <h2 className="text-xl font-semibold text-slate-100">Initiatives</h2>
              {/* Option to add initiatives */}
              <Button
                className="bg-white/10 text-slate-100 hover:bg-white/20"
                onClick={() =>
                  navigate(`/create-initiative?ballotID=${ballot.ballotID}`, { state: { ballotID: ballot.ballotID } })
                }
                disabled={isStructureLocked}
              >
                Add Initiative
              </Button>
            </div>

            {/* Initiatives section could go here if needed in the future */}
            {!resultsQuery.isLoading && !resultsQuery.isError && resultsQuery.data.results.initiatives && (
              <section className="w-full sm:max-w-xl space-y-4">
                <div className="space-y-6">
                  {resultsQuery.data.results.initiatives.map((initiative: any) => (
                    <Card
                      key={initiative.initiativeID}
                      className="border border-white/10 bg-slate-900/60"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg text-slate-100">{initiative.initiativeName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-300">{initiative.description}</p>
                        <p className="text-sm text-slate-300 mt-2">
                          Total Votes:{" "}
                          <span className="text-slate-100 font-medium">
                            {initiative?._count?.initiativeVotes ?? 0}
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

        )}


        {/* Candidate confirm modal */}
        <AlertDialog open={candidateConfirmOpen} onOpenChange={setCandidateConfirmOpen}>
          <AlertDialogContent className="border border-white/10 bg-slate-950 text-slate-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove candidate?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                This will remove{" "}
                <span className="text-slate-100 font-medium">
                  {pendingCandidateDelete?.candidateLabel ?? "this candidate"}
                </span>{" "}
                from{" "}
                <span className="text-slate-100 font-medium">
                  {pendingCandidateDelete?.positionName ?? "this position"}
                </span>
                . This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border border-white/10 bg-white/5 hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCandidateDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={removeCandidateMutation.isPending}
              >
                {removeCandidateMutation.isPending ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Position confirm modal */}
        <AlertDialog open={positionConfirmOpen} onOpenChange={setPositionConfirmOpen}>
          <AlertDialogContent className="border border-white/10 bg-slate-950 text-slate-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete position?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                This will delete{" "}
                <span className="text-slate-100 font-medium">
                  {pendingPositionDelete?.positionName ?? "this position"}
                </span>
                . This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border border-white/10 bg-white/5 hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmPositionDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deletePositionMutation.isPending}
              >
                {deletePositionMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ✅ NEW: Ballot/Election confirm modal */}
        <AlertDialog open={ballotConfirmOpen} onOpenChange={setBallotConfirmOpen}>
          <AlertDialogContent className="border border-white/10 bg-slate-950 text-slate-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete election?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                This will delete{" "}
                <span className="text-slate-100 font-medium">{ballot.ballotName}</span>{" "}
                and all related positions/candidates/votes.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border border-white/10 bg-white/5 hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBallotDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteBallotMutation.isPending}
              >
                {deleteBallotMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
