"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "../ui/navigation-menu";
import { useUserStore } from "../../store/userStore";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { LogOut } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export default function Navbar() {
  const navigate = useNavigate();
  const [, , removeCookie] = useCookies(["user_session"]);
  const clearUser = useUserStore((state) => state.clearUser);
  const user = useUserStore((state) => state);
  const MotionButton = motion(Button);

  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Scroll-reactive header opacity + blur feel
  const bgOpacity = useTransform(scrollY, [0, 30], [0.22, 0.45]);
  const shadowOpacity = useTransform(scrollY, [0, 30], [0, 0.25]);
  const accentOpacity = useTransform(scrollY, [0, 50], [0.45, 0.95]);

  const handleLogout = async () => {
    try {
      clearUser();
      removeCookie("user_session", { path: "/" });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/v1/member/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error("Logout failed");
        return;
      }

      navigate("/login");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const ease = [0.16, 1, 0.3, 1] as const;

  const navItemMotion = reduceMotion
    ? {}
    : {
      whileHover: { y: -1 },
      whileTap: { scale: 0.98 },
      transition: { duration: 0.16, ease },
    };

  return (
    <motion.header
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease }}
      className="sticky top-0 z-50 min-w-full"
    >
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl relative min-w-full flex items-center gap-4 px-6 py-4 backdrop-blur-xl"
      >
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
          style={{
            opacity: accentOpacity,
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(236,72,153,0.75) 18%, rgba(56,189,248,0.9) 50%, rgba(236,72,153,0.75) 82%, transparent 100%)",
          }}
        />

        {/* Left brand */}
        <motion.div {...navItemMotion}>
          <Button
            variant="ghost"
            className="bg-transparent text-slate-100 text-xl hover:bg-slate-800/50 hover:text-white p-2 gap-2 transition-colors duration-200"
            onClick={() => navigate("/")}
          >
            {user.companyName || "Election System"}
          </Button>
        </motion.div>

        {/* Center nav */}
        <div className="flex-1 flex justify-center">
          <NavigationMenu>
            <NavigationMenuList className="flex items-center gap-2">
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  onClick={() => navigate("/")}
                >
                  <motion.div {...navItemMotion}>
                    <MotionButton
                      variant="ghost"
                      className="bg-transparent hover:bg-slate-800/50 hover:text-white flex items-center justify-center gap-2 transition-colors duration-200"
                    >
                      View Elections
                    </MotionButton>
                  </motion.div>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <span className="text-slate-600 select-none">|</span>

              {(user.accountType === "Employee" || user.accountType === "Admin") && (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <motion.div {...navItemMotion}>
                        <MotionButton
                          variant="ghost"
                          className="bg-transparent hover:bg-slate-800/50 hover:text-white flex items-center justify-center gap-2 transition-colors duration-200"
                          onClick={() => navigate("/company-stats")}
                        >
                          Company Stats
                        </MotionButton>
                      </motion.div>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <span className="text-slate-600 select-none">|</span>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <motion.div {...navItemMotion}>
                        <MotionButton
                          variant="ghost"
                          className="bg-transparent hover:bg-slate-800/50 hover:text-white flex items-center justify-center gap-2 transition-colors duration-200"
                          onClick={() => navigate("/users-page")}
                        >
                          Edit Users
                        </MotionButton>
                      </motion.div>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <span className="text-slate-600 select-none">|</span>
                </>
              )}

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <motion.div {...navItemMotion}>
                    <MotionButton
                      variant="ghost"
                      className="bg-transparent hover:bg-slate-800/50 flex items-center justify-center gap-2 transition-colors duration-200"
                      onClick={handleLogout}
                      aria-label="Log out"
                    >
                      <motion.span
                        whileHover={reduceMotion ? {} : { rotate: -8 }}
                        transition={{ duration: 0.18, ease }}
                        className="inline-flex"
                      >
                        <LogOut className="text-slate-300" />
                      </motion.span>
                    </MotionButton>
                  </motion.div>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </motion.div>
    </motion.header>
  );
}
