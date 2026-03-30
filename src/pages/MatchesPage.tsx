import { useState } from "react";
import { motion } from "framer-motion";
import { matches } from "@/lib/mockData";
import MatchCard from "@/components/MatchCard";

const tabs = ["all", "live", "upcoming", "completed"] as const;

export default function MatchesPage() {
  const [tab, setTab] = useState<string>("all");

  const filtered = tab === "all" ? matches : matches.filter((m) => m.status === tab);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold text-foreground mb-8">Matches</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all whitespace-nowrap ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t === "live" && "🔴 "}
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <MatchCard match={m} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-16">No {tab} matches found.</p>
      )}
    </div>
  );
}
