import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "../ui/button";

type SubHeaderProps = { label?: string, onTop?: () => void };

function isDashboardPath(pathname: string) {
  if (pathname === "/" || pathname === "/login") return true;
  return false;
}

export default function SubHeader({ label = "Back", onTop }: SubHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const shouldShow = !isDashboardPath(location.pathname);
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease }}
        className="sticky top-[72px] z-40 w-full"
      >
        <div className="relative w-full px-4">
        {/* subtle seam shadow under the navbar */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-4 w-[360px] -translate-x-1/2 bg-gradient-to-b from-black/30 to-transparent blur-lg opacity-60" />

        {/* centered tab */}
        <div className="relative mx-auto w-fit">
          {/* connector notch */}
          <div className="pointer-events-none absolute left-1/2 -top-[8px] h-[10px] w-[92%] -translate-x-1/2 rounded-t-[10px] border border-white/10 border-b-0 bg-slate-900/55 backdrop-blur-xl" />

          <motion.div
          whileHover={reduceMotion ? undefined : { y: -1 }}
          transition={{ duration: 0.18, ease }}
          className="
            relative overflow-hidden rounded-[12px]
            border border-white/10 bg-slate-900/55 backdrop-blur-xl
            shadow-[0_10px_30px_rgba(0,0,0,0.22)]
          "
          >
          {/* accent line to match navbar */}
          <div className="pointer-events-none absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

          <div className="flex items-center gap-1 px-1">
            <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="
              h-9 bg-transparent px-3
              text-slate-200 hover:bg-white/10 hover:text-white
            "
            >
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            {label}
            </Button>
            
            <Button
            variant="ghost"
            size="sm"
            onClick={onTop}
            className="
              h-9 bg-transparent px-3
              text-slate-200 hover:bg-white/10 hover:text-white
            "
            >
            Back to Top 
            <ChevronLeft className="ml-1.5 h-4 w-4 rotate-90" />
            </Button>
          </div>
          
          </motion.div>
        </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
