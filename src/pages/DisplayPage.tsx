import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function DisplayPage() {
  const live = useQuery(api.liveScore.getCurrent);

  if (!live) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <p className="font-display text-3xl text-muted-foreground">No live score yet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 select-none cursor-none">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-4">
          <span className="live-badge text-lg px-4 py-2">LIVE</span>
          <span className="font-display text-lg text-muted-foreground">VRP BOX CRICKET 2026</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-primary/20 bg-card p-8 md:p-12"
        >
          <div className="text-center">
            <p className="font-display text-2xl md:text-3xl font-bold text-foreground uppercase tracking-wide">
              {live.battingTeam} vs {live.bowlingTeam}
            </p>
            <p className="font-display text-7xl md:text-9xl font-bold text-primary neon-text-green mt-4">
              {live.runs}<span className="text-4xl md:text-5xl text-muted-foreground">/{live.wickets}</span>
            </p>
            <p className="font-display text-2xl text-muted-foreground mt-2">({live.overs}.{live.balls} ov)</p>
            <p className="text-lg mt-5 text-neon-yellow font-semibold">Last Event: {live.lastEvent || "-"}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
