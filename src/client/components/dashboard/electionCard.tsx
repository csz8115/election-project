import type { ballots } from "@prisma/client";
import { useBallotStore } from "../../store/ballotStore";
import BallotCard from "../ballot/BallotCard";

type ElectionCardProps = {
  ballot: ballots;
};

export default function ElectionCard({ ballot }: ElectionCardProps) {
  const isManageMode = useBallotStore((s) => s.isManageMode);
  const selectedIds = useBallotStore((s) => s.selectedIds);
  const toggleId = useBallotStore((s) => s.toggleId);

  const ballotId = ballot.ballotID;
  const isSelected = selectedIds.includes(ballotId);

  const handleCardClick = () => {
    toggleId(ballotId);
  };

  const voteCount = Number((ballot as { voteCount?: number; votes?: number }).voteCount);
  const fallbackVotes = Number((ballot as { voteCount?: number; votes?: number }).votes);
  const normalizedVoteCount = Number.isFinite(voteCount)
    ? voteCount
    : Number.isFinite(fallbackVotes)
    ? fallbackVotes
    : undefined;

  return (
    <BallotCard
      ballot={{
        ballotID: ballot.ballotID,
        ballotName: ballot.ballotName,
        description: (ballot as { description?: string }).description,
        companyName: (ballot as { companyName?: string }).companyName,
        startDate: ballot.startDate,
        endDate: ballot.endDate,
        voteCount: normalizedVoteCount,
      }}
      to={`/ballot/?b=${ballotId}`}
      onActivate={isManageMode ? handleCardClick : undefined}
      selected={isManageMode && isSelected}
      includeCompany
    />
  );
}
