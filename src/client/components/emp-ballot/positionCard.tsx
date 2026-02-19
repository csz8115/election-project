import { Button } from "../ui/button";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import CandidateCard from "../candidateCard";
import { useNavigate } from "react-router-dom";
import CreateCandidateCard from "../createcandidateCard";


type PositionCardProps = {
    position: any;
    ballot: any;
    isPosEdit: boolean;
    togglePositionEdit: (positionID: number) => void;
    requestCandidateDelete: (payload: any) => void;
    requestPositionDelete: (payload: any) => void;
};

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

export const PositionCard: React.FC<PositionCardProps> = ({
    position,
    ballot,
    isPosEdit,
    togglePositionEdit,
    requestCandidateDelete,
    requestPositionDelete,
}) => {

    const navigate = useNavigate();

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
                    >
                        <Trash2 className="h-5 w-5 text-red-300" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePositionEdit(position.positionID)}
                        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                        aria-label={isPosEdit ? "Exit position edit mode" : "Edit candidates"}
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
                                        if (isPosEdit) {
                                            requestCandidateDelete({
                                                positionID: position.positionID,
                                                positionName: position.positionName,
                                                candidateID: cand.candidateID,
                                                candidateLabel: label,
                                            });
                                            return;
                                        }

                                        navigate(`/candidate/${cand.candidateID}`, {
                                            state: { candidate: cand, votes, rank: index },
                                        });
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key !== "Enter" && e.key !== " ") return;

                                        if (isPosEdit) {
                                            requestCandidateDelete({
                                                positionID: position.positionID,
                                                positionName: position.positionName,
                                                candidateID: cand.candidateID,
                                                candidateLabel: label,
                                            });
                                        } else {
                                            navigate(`/candidate/${cand.candidateID}`, {
                                                state: { candidate: cand, votes, rank: index },
                                            });
                                        }
                                    }}
                                    className={[
                                        "focus:outline-none",
                                        isPosEdit
                                            ? "cursor-pointer rounded-2xl ring-2 ring-red-500/40 hover:ring-red-500/60"
                                            : "cursor-pointer",
                                    ].join(" ")}
                                >
                                    <CandidateCard candidate={cand} candidateIndex={index} votes={votes} />
                                </div>
                            </motion.div>
                        );
                    })}

                    <div className={isPosEdit ? "opacity-60 pointer-events-none" : ""}>
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
};