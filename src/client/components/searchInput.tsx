import { motion, useReducedMotion } from "framer-motion";
import { Input } from "../components/ui/input";
import { Search } from "lucide-react";

type SearchInputProps = React.ComponentProps<typeof Input>;

export default function SearchInput(props: SearchInputProps) {
  const reduceMotion = useReducedMotion();

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
      transition: { opacity: { duration: 0.12 } },
    },
    active: reduceMotion
      ? { opacity: 1 }
      : {
          opacity: 1,
          backgroundPosition: ["50% 0%", "50% 200%"],
          transition: {
            opacity: { duration: 0.18 },
            backgroundPosition: {
              duration: 2.2,
              ease: "linear",
              repeat: Infinity,
            },
          },
        },
  } as const;

  return (
    <motion.div
      className="relative w-full"
      initial="rest"
      animate="rest"
      whileHover="active"
      whileFocusWithin="active"
    >
      {/* OUTER animated border */}
      <motion.div
        className="pointer-events-none absolute -inset-[2px] rounded-xl"
        variants={shimmer}
        style={{
          backgroundImage: shimmerBg,
          backgroundSize: "100% 200%",
        }}
      />

      {/* INNER mask (cuts out center) */}
    <div className="relative rounded-[10px] bg-slate-900">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
      <Input
        {...props}
        className={[
        "relative z-10 w-full pl-9",
        "bg-slate-900/50 border border-transparent",
        "text-slate-200 placeholder:text-slate-500",
        "focus-visible:outline-none focus-visible:ring-0",
        props.className ?? "",
        ].join(" ")}
      />
    </div>
    </motion.div>
  );
}
