import { Outlet } from "react-router-dom";
import Navbar from "../components/nav/navbar";
import SubHeader from "../components/nav/subNavbar";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useRef, useState } from "react";

export default function AppLayout() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollY } = useScroll({ container: scrollRef });

  const [isSubnavVisible, setIsSubnavVisible] = useState(false);

  // NEW: MotionValue progress 0..1 for the scroll container
  const scrollProgress = useMotionValue(0);

  useMotionValueEvent(scrollY, "change", () => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      scrollProgress.set(0);
      setIsSubnavVisible(false);
      return;
    }

    const progress = el.scrollTop / maxScroll; // 0..1
    scrollProgress.set(progress);
    setIsSubnavVisible(progress >= 0.4);
  });

  const scrolltoTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  };

  const ease = [0.16, 1, 0.3, 1] as const;
  const SUBNAV_H = 48;

  return (
    <div className="h-full bg-slate-950 text-slate-300 flex flex-col">
      {/* pass scrollProgress down */}
      <Navbar scrollProgress={scrollProgress} />

      <div className="relative">
        <AnimatePresence>
          {isSubnavVisible && (
            <motion.div
              key="subnav"
              initial={reduceMotion ? false : { opacity: 0, y: -16 }}
              animate={reduceMotion ? false : { opacity: 1, y: 0 }}
              exit={reduceMotion ? false : { opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease }}
              className="absolute inset-x-0 top-0 z-40"
            >
              <SubHeader onTop={scrolltoTop} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: isSubnavVisible ? SUBNAV_H : 0 }}
      >
        <main className="min-h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
