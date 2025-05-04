import { useEffect, useRef } from "react";

export function useHeartbeat(username, intervalMs = 30000) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!username) return;

    const ping = () => {
      fetch(`http://localhost:3000/api/v1/member/ping?username=${username}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).catch(console.error);
    };

    ping(); // initial heartbeat right away
    intervalRef.current = setInterval(ping, intervalMs);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [username, intervalMs]);
}
export default useHeartbeat;
