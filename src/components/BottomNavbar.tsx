import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Trophy, UserPlus } from "lucide-react";

const navItems = [
  { path: "/", label: "Today", icon: Home },
  { path: "/matches", label: "Matches", icon: Trophy },
  { path: "/register", label: "Register", icon: UserPlus },
];

export default function BottomNavbar() {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border px-6 pb-6 pt-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 group"
            >
              <div className="relative p-2">
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/20 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon
                  className={`h-6 w-6 transition-colors relative z-10 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
