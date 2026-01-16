"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu";
import { useUserStore } from "../../store/userStore";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { LogOut } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "framer-motion";

type NavbarProps = {
  scrollProgress: MotionValue<number>; // 0..1
};

export default function Navbar({ scrollProgress }: NavbarProps) {
  const navigate = useNavigate();
  const [, , removeCookie] = useCookies(["user_session"]);
  const clearUser = useUserStore((state) => state.clearUser);
  const user = useUserStore((state) => state);
  const MotionButton = motion(Button);

  const reduceMotion = useReducedMotion();

  // You can still do opacity/blur based on progress instead of window scroll
  const bgOpacity = useTransform(scrollProgress, [0, 0.2], [0.22, 0.45]);
  const accentOpacity = useTransform(scrollProgress, [0, 0.5], [0.35, 0.95]);

  // COLOR MORPH: blue -> pink as you scroll down
  const leftColor = useTransform(
    scrollProgress,
    [0, 1],
    ["rgba(56,189,248,0.95)", "rgba(236,72,153,0.95)"]
  );
  const midColor = useTransform(
    scrollProgress,
    [0, 1],
    ["rgba(56,189,248,0.95)", "rgba(236,72,153,0.95)"]
  );
  const rightColor = useTransform(
    scrollProgress,
    [0, 1],
    ["rgba(236,72,153,0.95)", "rgba(56,189,248,0.95)"]
  );

  // Use a motion template so the gradient string updates smoothly
  const borderGradient = useMotionTemplate`
    linear-gradient(
      90deg,
      transparent 0%,
      ${leftColor} 18%,
      ${midColor} 50%,
      ${rightColor} 82%,
      transparent 100%
    )
  `;

  const handleLogout = async () => {
    try {
      clearUser();
      removeCookie("user_session", { path: "/" });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/v1/member/logout`,
        { method: "POST", credentials: "include" }
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
        className="relative min-w-full flex items-center gap-4 px-6 py-4 backdrop-blur-xl"
        style={{
          // keep your bg but let it deepen as you scroll
          backgroundColor: useMotionTemplate`rgba(15, 23, 42, ${bgOpacity})`,
        }}
      >

        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: useTransform(scrollProgress, [0, 0.4], [0.85, 0.55]),
            backgroundImage:
              "radial-gradient(1200px 200px at 50% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)",
          }}
        />
        {/* Bottom gradient border */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
          style={{
            opacity: accentOpacity,
            backgroundImage: borderGradient,
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
                <NavigationMenuLink asChild onClick={() => navigate("/")}>
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

              {user.accountType !== "Member" && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <motion.div {...navItemMotion}>
                      <MotionButton
                        variant="ghost"
                        className="bg-transparent hover:bg-slate-800/50 hover:text-white flex items-center justify-center gap-2 transition-colors duration-200"
                        onClick={() => navigate("/create-ballot")}
                      >
                        Create Election
                      </MotionButton>
                    </motion.div>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {(user.accountType === "Member" ||
                user.accountType === "Officer") && (
                  <>
                    <span className="text-slate-600 select-none">|</span>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <motion.div {...navItemMotion}>
                          <MotionButton
                            variant="ghost"
                            className="bg-transparent hover:bg-slate-800/50 hover:text-white flex items-center justify-center gap-2 transition-colors duration-200"
                            onClick={() => navigate("/my-votes")}
                          >
                            My Votes
                          </MotionButton>
                        </motion.div>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                )}

              {(user.accountType === "Employee" ||
                user.accountType === "Admin") && (
                  <>
                    <span className="text-slate-600 select-none">|</span>
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
                      <LogOut className="text-slate-300" />
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
