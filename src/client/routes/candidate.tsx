import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import type { candidate } from "@prisma/client";
import { Button } from "../components/ui/button";
import { Crown, ArrowLeft, User, Briefcase, Vote, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useScrollContainerToTop } from "../hooks/useScrollContainer";
import { useReducedMotion } from "framer-motion";

type LocationState = {
    candidate?: candidate;
    votes?: number;
    rank?: number; // 0-based rank, optional
};

const MotionDiv = motion.div;

export default function CandidatePage() {
    const reduceMotion = useReducedMotion();
    const navigate = useNavigate();
    const { candidateId } = useParams();

    useScrollContainerToTop([candidateId], {
        behavior: reduceMotion ? "auto" : "smooth",
    });

    // If you navigate to this page from the list, pass candidate in location.state
    const { state } = useLocation() as { state?: LocationState };

    const cand = state?.candidate;
    const votes = state?.votes;
    const rank = state?.rank;

    // If you don't have candidate in state, show a helpful fallback.
    // (You can replace this with a fetch by candidateId if you want.)
    if (!cand) {
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

    const fullName = `${cand.fName ?? ""} ${cand.lName ?? ""}`.trim() || "Candidate";
    const title = cand.titles?.trim() || "Candidate";
    const description = cand.description?.trim() || "No description provided.";
    const picture = cand.picture?.trim() || "/default-picture.jpg";

    const isWinner = rank === 0;

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

                    {/* Optional pills */}
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
                    </div>
                </div>

                <MotionDiv
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-5"
                >
                    {/* Left: Image card */}
                    <Card className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur shadow-sm lg:col-span-2">
                        <div className="relative">
                            <img
                                src={picture}
                                alt={fullName}
                                className="h-[340px] w-full object-cover"
                                loading="lazy"
                            />

                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent" />

                            {/* Winner badge */}
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
                                <div className="mt-1 break-all text-sm text-slate-200">{cand.picture || "(default)"}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Details */}
                    <Card className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur shadow-sm lg:col-span-3">
                        <CardHeader className="space-y-2">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <CardTitle className="text-slate-100">{fullName}</CardTitle>
                                    <CardDescription className="mt-1 text-slate-300">
                                        {title}
                                    </CardDescription>
                                </div>

                                {typeof votes === "number" && (
                                    <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100">
                                        {votes.toLocaleString()}{" "}
                                        <span className="text-slate-400">votes</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* About */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    About
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200/90">
                                    {description}
                                </p>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        <User className="h-4 w-4" />
                                        First name
                                    </div>
                                    <div className="mt-2 text-sm text-slate-100">{cand.fName || "-"}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        <User className="h-4 w-4" />
                                        Last name
                                    </div>
                                    <div className="mt-2 text-sm text-slate-100">{cand.lName || "-"}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        <Briefcase className="h-4 w-4" />
                                        Titles
                                    </div>
                                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-100">
                                        {cand.titles?.trim() || "-"}
                                    </div>
                                </div>
                            </div>

                            {/* Raw candidate ID (useful for debugging) */}
                            {"candidateID" in cand && (
                                <div className="text-xs text-slate-500">
                                    Candidate ID: <span className="text-slate-300">{(cand as any).candidateID}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </MotionDiv>
            </div>
        </div>
    );
}

/**
 * ✅ How to navigate to this page from CandidateCard / list:
 *
 * navigate(`/candidate/${candidate.candidateID}`, {
 *   state: { candidate, votes, rank: candidateIndex }
 * });
 */
