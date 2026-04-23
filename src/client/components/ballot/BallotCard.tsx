import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export type BallotCardData = {
  ballotID: number;
  ballotName: string;
  description?: string;
  companyName?: string;
  startDate: string | Date;
  endDate: string | Date;
  voteCount?: number;
  status?: "active" | "closed";
};

type BallotCardProps = {
  ballot: BallotCardData;
  to?: string;
  includeCompany?: boolean;
  selected?: boolean;
  onActivate?: () => void;
};

const formatDateTime = (value: string | Date): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleString();
};

const formatMetric = (value: unknown): string => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "N/A";
  return numberValue.toLocaleString(undefined, {
    maximumFractionDigits: Number.isInteger(numberValue) ? 0 : 2,
  });
};

export default function BallotCard({
  ballot,
  to,
  includeCompany = true,
  selected = false,
  onActivate,
}: BallotCardProps) {
  const navigate = useNavigate();
  const endDate = new Date(ballot.endDate);
  const isClosed =
    ballot.status === "closed" || (Number.isFinite(endDate.getTime()) && endDate < new Date());
  const statusLabel = isClosed ? "Closed" : "Active";

  const handleActivate = () => {
    if (onActivate) {
      onActivate();
      return;
    }

    navigate(to ?? `/ballot?b=${ballot.ballotID}`);
  };

  return (
    <Card
      className={[
        "relative border border-white/10 bg-slate-900/60 cursor-pointer hover:bg-slate-900/80 transition-colors",
        selected ? "ring-2 ring-sky-400/70" : "",
      ].join(" ")}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
    >
      <CardHeader className="flex flex-col gap-x-3 gap-y-1 pr-20">
        <span
          className={[
            "absolute right-4 top-4 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            isClosed ? "bg-slate-700 text-slate-100" : "bg-emerald-700 text-emerald-100",
          ].join(" ")}
        >
          {statusLabel}
        </span>
        <div className="flex items-start gap-3">
          <CardTitle className="text-base text-slate-100 leading-snug">{ballot.ballotName}</CardTitle>
        </div>
        {includeCompany && ballot.companyName ? (
          <p className="text-slate-400 text-sm">
            {ballot.companyName}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="text-slate-300">
          Start: <span className="text-slate-100">{formatDateTime(ballot.startDate)}</span>
        </p>
        <p className="text-slate-300">
          End: <span className="text-slate-100">{formatDateTime(ballot.endDate)}</span>
        </p>
        {ballot.voteCount !== undefined && (
          <p className="text-slate-300">
            Votes: <span className="text-slate-100">{formatMetric(ballot.voteCount ?? 0)}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
