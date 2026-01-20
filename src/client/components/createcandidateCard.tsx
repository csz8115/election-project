import { Card } from "../components/ui/card";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type CreateCandidateCardProps = {
  onClick?: () => void;
};

const MotionDiv = motion.div;

export default function CreateCandidateCard({
  onClick,
}: CreateCandidateCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <MotionDiv
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        className="
          group
          flex h-full min-h-[18rem] items-center justify-center
          rounded-2xl
          border border-dashed border-white/15
          bg-zinc-900/40
          backdrop-blur
          text-slate-300
          transition-all
          hover:border-white/30
          hover:bg-slate-900/70
          hover:text-slate-100
          hover:shadow-lg
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-indigo-500/60
          cursor-pointer
        "
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className="
              flex h-14 w-14 items-center justify-center
              rounded-full
              border border-white/15
              bg-white/5
              transition-colors
              group-hover:bg-white/10
            "
          >
            <Plus className="h-7 w-7" />
          </div>

          <span className="text-sm font-medium">
            Add Candidate
          </span>
        </div>
      </Card>
    </MotionDiv>
  );
}
