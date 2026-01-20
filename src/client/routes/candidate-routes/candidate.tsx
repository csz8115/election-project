import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import type { candidate } from "@prisma/client";
import { Button } from "../../components/ui/button";
import {
  Crown,
  ArrowLeft,
  User,
  Briefcase,
  Vote,
  Image as ImageIcon,
  Pencil,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useScrollContainerToTop } from "../../hooks/useScrollContainer";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { useUserStore } from "../../store/userStore";
import { useEditCandidate } from "../../hooks/useEditCandidate";

type LocationState = {
  candidate?: candidate;
  votes?: number;
  rank?: number; // 0-based rank, optional
};

const MotionDiv = motion.div;

type CandidateDraft = {
  fName: string;
  lName: string;
  titles: string;
  description: string;
  picture: string;
};

export default function CandidatePage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { candidateId } = useParams();

  useScrollContainerToTop([candidateId], {
    behavior: reduceMotion ? "auto" : "smooth",
  });

  const { state } = useLocation() as { state?: LocationState };

  const cand = state?.candidate;
  const votes = state?.votes;
  const rank = state?.rank;

  const user = useUserStore((s) => s);
  const canEdit = user.accountType === "Admin" || user.accountType === "Employee";

  const editCandidate = useEditCandidate();

  const [isEditing, setIsEditing] = useState(false);
  const [localCandidate, setLocalCandidate] = useState<candidate | undefined>(cand);

  useEffect(() => {
    setLocalCandidate(cand);
    setIsEditing(false);
  }, [cand, candidateId]);

  const activeCandidate = localCandidate;

  const initialDraft: CandidateDraft | null = useMemo(() => {
    if (!activeCandidate) return null;
    return {
      fName: activeCandidate.fName ?? "",
      lName: activeCandidate.lName ?? "",
      titles: activeCandidate.titles ?? "",
      description: activeCandidate.description ?? "",
      picture: activeCandidate.picture ?? "",
    };
  }, [activeCandidate]);

  const [draft, setDraft] = useState<CandidateDraft | null>(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  if (!activeCandidate) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Button
            variant="outline"
            className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/20">
            <CardHeader>
              <CardTitle>Candidate not found</CardTitle>
              <CardDescription className="text-slate-400">
                I didn&apos;t receive candidate details for ID:{" "}
                <span className="text-slate-200">{candidateId ?? "(unknown)"}</span>.
                <br />
                Navigate here from a candidate list and pass the candidate in route state,
                or add a fetch by ID on this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const fullName =
    `${activeCandidate.fName ?? ""} ${activeCandidate.lName ?? ""}`.trim() || "Candidate";
  const title = activeCandidate.titles?.trim() || "Candidate";
  const description = activeCandidate.description?.trim() || "No description provided.";
  const picture = activeCandidate.picture?.trim() || "/default-picture.jpg";

  const isWinner = rank === 0;

  const startEdit = () => {
    if (!canEdit) return;
    setDraft(initialDraft);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (editCandidate.isPending) return;
    setDraft(initialDraft);
    setIsEditing(false);
  };

  const onSave = async () => {
    if (!canEdit || !draft) return;

    const candidateID = (activeCandidate as any).candidateID as number | undefined;
    if (!candidateID) {
      toast.error("Missing candidateID - cannot save.");
      return;
    }

    const patch: Partial<candidate> = {};
    if ((activeCandidate.fName ?? "") !== draft.fName) patch.fName = draft.fName;
    if ((activeCandidate.lName ?? "") !== draft.lName) patch.lName = draft.lName;
    if ((activeCandidate.titles ?? "") !== draft.titles) patch.titles = draft.titles;
    if ((activeCandidate.description ?? "") !== draft.description) patch.description = draft.description;
    if ((activeCandidate.picture ?? "") !== draft.picture) patch.picture = draft.picture;

    if (Object.keys(patch).length === 0) {
      toast.message("No changes to save.");
      setIsEditing(false);
      return;
    }

    try {
      await editCandidate.mutateAsync({ candidateID, patch });

      // Keep this page in sync even if you didn’t fetch via React Query here
      setLocalCandidate((prev) => (prev ? ({ ...prev, ...patch } as candidate) : prev));

      toast.success("Candidate updated.");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update candidate.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {typeof votes === "number" && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-100">
                <Vote className="h-4 w-4 text-slate-300" />
                {votes.toLocaleString()} <span className="text-slate-400">votes</span>
              </div>
            )}

            {typeof rank === "number" && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-100">
                {isWinner ? (
                  <>
                    <Crown className="h-4 w-4 text-yellow-300" />
                    Winner
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-slate-300" />
                    Rank #{rank + 1}
                  </>
                )}
              </div>
            )}

            {canEdit && !isEditing && (
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                onClick={startEdit}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}

            {canEdit && isEditing && (
              <>
                <Button
                  className="bg-white/10 hover:bg-white/15 text-slate-100"
                  onClick={onSave}
                  disabled={editCandidate.isPending}
                >
                  {editCandidate.isPending ? (
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
                  disabled={editCandidate.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        <MotionDiv
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-5"
        >
          {/* Left: Image */}
          <Card className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur shadow-sm lg:col-span-2">
            <div className="relative">
              <img
                src={isEditing ? draft?.picture?.trim() || picture : picture}
                alt={fullName}
                className="h-[340px] w-full object-cover"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent" />

              {isWinner && (
                <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/60 px-3 py-1 text-xs text-slate-100 backdrop-blur">
                  <Crown className="h-4 w-4 text-yellow-300" />
                  Winner
                </div>
              )}
            </div>

            <CardContent className="space-y-3 p-4">
              <div className="text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                  Photo
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Image URL
                </div>

                {isEditing && canEdit ? (
                  <Input
                    value={draft?.picture ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, picture: e.target.value } : d))
                    }
                    placeholder="https://..."
                    className="mt-2 border-white/10 bg-black/20"
                  />
                ) : (
                  <div className="mt-1 break-all text-sm text-slate-200">
                    {activeCandidate.picture || "(default)"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Details */}
          <Card className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur shadow-sm lg:col-span-3">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-slate-100">
                    {isEditing ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          value={draft?.fName ?? ""}
                          onChange={(e) =>
                            setDraft((d) => (d ? { ...d, fName: e.target.value } : d))
                          }
                          placeholder="First name"
                          className="border-white/10 bg-black/20"
                        />
                        <Input
                          value={draft?.lName ?? ""}
                          onChange={(e) =>
                            setDraft((d) => (d ? { ...d, lName: e.target.value } : d))
                          }
                          placeholder="Last name"
                          className="border-white/10 bg-black/20"
                        />
                      </div>
                    ) : (
                      fullName
                    )}
                  </CardTitle>

                  <CardDescription className="mt-1 text-slate-300">
                    {isEditing ? (
                      <Input
                        value={draft?.titles ?? ""}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, titles: e.target.value } : d))
                        }
                        placeholder="Titles"
                        className="mt-2 border-white/10 bg-black/20"
                      />
                    ) : (
                      title
                    )}
                  </CardDescription>
                </div>

                {typeof votes === "number" && (
                  <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100">
                    {votes.toLocaleString()} <span className="text-slate-400">votes</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  About
                </div>

                {isEditing && canEdit ? (
                  <Textarea
                    value={draft?.description ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, description: e.target.value } : d))
                    }
                    placeholder="Candidate description..."
                    className="min-h-[140px] border-white/10 bg-black/20"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200/90">
                    {description}
                  </p>
                )}
              </div>

              {!isEditing && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <User className="h-4 w-4" />
                      First name
                    </div>
                    <div className="mt-2 text-sm text-slate-100">{activeCandidate.fName || "-"}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <User className="h-4 w-4" />
                      Last name
                    </div>
                    <div className="mt-2 text-sm text-slate-100">{activeCandidate.lName || "-"}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Briefcase className="h-4 w-4" />
                      Titles
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-100">
                      {activeCandidate.titles?.trim() || "-"}
                    </div>
                  </div>
                </div>
              )}

              {"candidateID" in activeCandidate && (
                <div className="text-xs text-slate-500">
                  Candidate ID:{" "}
                  <span className="text-slate-300">{(activeCandidate as any).candidateID}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>
      </div>
    </div>
  );
}
