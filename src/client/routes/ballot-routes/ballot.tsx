import { useUserStore } from "../../store/userStore";
import { useLocation, Navigate } from "react-router-dom";
import type { ballots } from "@prisma/client";

export default function Ballot() {
  const user = useUserStore((s) => s);
  const location = useLocation();

  const ballotFromState = (location.state as any)?.ballot as ballots | undefined;

  // ✅ read ID from query param (refresh + second open safe)
  const sp = new URLSearchParams(location.search);
  const b = sp.get("b");
  const from = sp.get("from");
  const companyId = sp.get("companyId");
  const ballotID = b ? Number(b) : ballotFromState?.ballotID;

  if (!Number.isFinite(ballotID) || (ballotID as number) <= 0) {
    return <Navigate to="/" replace />;
  }

  // pass state only if we have it (optional optimization)
  const nextState = ballotFromState ? { ballot: ballotFromState } : undefined;
  const nextParams = new URLSearchParams();
  nextParams.set("b", String(ballotID));
  if (from) nextParams.set("from", from);
  if (companyId) nextParams.set("companyId", companyId);
  const nextQuery = nextParams.toString();

  // ✅ KEEP the query param when redirecting
  if (user.accountType === "Member") {
    return <Navigate to={`/user-ballot?${nextQuery}`} replace state={nextState} />;
  }

  if (
    user.accountType === "Employee" ||
    user.accountType === "Officer" ||
    user.accountType === "Admin"
  ) {
    return <Navigate to={`/employee-ballot?${nextQuery}`} replace state={nextState} />;
  }

  return <Navigate to="/login" replace />;
}
