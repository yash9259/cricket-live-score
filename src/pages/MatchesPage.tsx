import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Calendar,
  MapPin,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  Trophy,
  Activity,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import MatchCard from "@/components/MatchCard";

const tabs = ["all", "live", "scheduled", "completed"] as const;

export default function MatchesPage() {
  const [tab, setTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const matches = useQuery(api.matches.list) ?? [];

  const filtered = matches.filter((m) => {
    if (tab === "all") return true;
    return m.status === tab;
  });

  return (
    <div className="container mx-auto px-4 py-12 pb-32">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-foreground mb-2">
          Match <span className="text-primary">Center</span>
        </h1>
        <p className="text-muted-foreground">Follow live scores and upcoming fixtures across all categories.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((m, i) => (
          <motion.div
            key={m._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <MatchCard match={m} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border mt-8">
          <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-muted-foreground opacity-20" />
          </div>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">No {tab} matches found at the moment.</p>
        </div>
      )}
    </div>
  );
}
