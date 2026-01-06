import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import type { candidate } from "@prisma/client";
import { Crown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type CandidateCardProps = {
  candidate: candidate;
  candidateIndex: number;
  votes: number;
};

const MotionDiv = motion.div;

export default function CandidateCard({
  candidate,
  candidateIndex,
  votes,
}: CandidateCardProps) {
  const reduceMotion = useReducedMotion();
  const isLeader = candidateIndex === 0;

  return (
    <MotionDiv
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <Card
        className="
          overflow-hidden rounded-2xl
          border border-white/10
          bg-zinc-900/60
          backdrop-blur
          shadow-sm
          transition-all
          hover:bg-slate-900/75
          hover:shadow-lg
        "
      >
        {/* Image */}
        <div className="relative">
          <img
            src={candidate.picture || "/default-picture.jpg"}
            alt={`${candidate.fName} ${candidate.lName}`}
            className="h-48 w-full object-cover"
            loading="lazy"
          />

          {/* Gradient overlay for readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

          {/* Leader badge */}
          {isLeader && (
            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-100 backdrop-blur">
              <Crown className="h-3.5 w-3.5 text-yellow-300" />
              Winner
            </div>
          )}
        </div>

        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate text-slate-100">
                {candidate.fName} {candidate.lName}
              </CardTitle>
              <CardDescription className="truncate text-slate-300">
                {candidate.titles || "Candidate"}
              </CardDescription>
            </div>

            {/* Votes pill */}
            <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-slate-100">
              {votes.toLocaleString()}{" "}
              <span className="text-slate-400">votes</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed text-slate-200/90">
            {candidate.description?.trim()
              ? candidate.description
              : "No description provided."}
          </p>
        </CardContent>
      </Card>
    </MotionDiv>
  );
}
