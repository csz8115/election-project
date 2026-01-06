import type { ballots } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

type ElectionCardProps = {
  ballot: ballots;
};

export default function ElectionCard({ ballot }: ElectionCardProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const handleCardClick = () => {
    navigate(`/ballot`, { state: { ballot } });
  };

  const shimmerBg =
    "linear-gradient(to bottom," +
    " rgba(255,255,255,0.04) 20%," +
    " rgba(255,255,255,0.04) 40%," +
    " rgba(236,72,153,0.95) 50%," +
    " rgba(56,189,248,0.95) 56%," +
    " rgba(255,255,255,0.04) 70%," +
    " rgba(255,255,255,0.04) 100%)";

  const shimmer = {
    rest: {
      opacity: 0,
      backgroundPosition: "50% 0%",
      transition: {
        opacity: { duration: 0.1, ease: "easeOut" }, // 👈 smooth fade-out
      },
    },
    hover: reduceMotion
      ? { opacity: 1 }
      : {
          opacity: 1,
          backgroundPosition: ["50% 0%", "50% 200%"],
          transition: {
            opacity: { duration: 0.18 },
            backgroundPosition: {
              duration: 2.2,
              ease: "linear",
            },
          },
        },
  };

  return (
    <motion.div
      className="w-full"
      initial="rest"
      whileHover="hover"
      onClick={handleCardClick}
    >
      <motion.div
        className="relative w-full overflow-hidden rounded-xl p-[2px]"
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Shimmer layer */}
        <motion.div
          className="pointer-events-none absolute"
          variants={shimmer}
          style={{
            inset: "-50%",
            backgroundImage: shimmerBg,
            backgroundSize: "100% 200%",
            backgroundPosition: "50% 0%",
          }}
        />

        {/* Card */}
        <Card className="relative z-10 w-full cursor-pointer rounded-[11px] bg-background border border-transparent">
          <CardHeader>
            <CardTitle>{ballot.ballotName}</CardTitle>
          </CardHeader>

          <CardContent>
            <p>Start Date: {new Date(ballot.startDate).toLocaleDateString()}</p>
            {new Date() >= new Date(ballot.endDate) && (
              <p>End Date: {new Date(ballot.endDate).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
