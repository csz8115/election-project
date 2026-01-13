import { Outlet } from "react-router-dom";
import Navbar from "../components/nav/navbar";
import SubHeader from "../components/nav/subNavbar";
import {
  AnimatePresence,
  motion,
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

  useMotionValueEvent(scrollY, "change", () => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    const progress = el.scrollTop / maxScroll;
    setIsSubnavVisible(progress >= 0.4);
  });

  const scrolltoTop = () => {
    if (scrollRef.current) {
          const scrollOptions: ScrollToOptions = {
            top: 0,
            behavior: reduceMotion ? "auto" : "smooth",
          };
          scrollRef.current.scrollTo(scrollOptions);
    }
  };

  const ease = [0.16, 1, 0.3, 1] as const;

  // Set this to your SubHeader height (px). If yours is 48px, keep 48.
  const SUBNAV_H = 48;

  return (
    <div className="h-full bg-slate-950 text-slate-300 flex flex-col">
      <Navbar />

      {/* Subnav overlay layer: does NOT take up layout space */}
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
              <SubHeader
              onTop={scrolltoTop}
               />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll container: add padding-top only when subnav is visible */}
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
