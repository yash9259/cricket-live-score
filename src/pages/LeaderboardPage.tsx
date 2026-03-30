import { motion } from "framer-motion";
import { Trophy, Target } from "lucide-react";
import { topBatsmen, topBowlers } from "@/lib/mockData";

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold text-foreground mb-2">Leaderboard</h1>
      <p className="text-muted-foreground mb-10">Tournament statistics and top performers</p>

      {/* MVP */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border-2 border-neon-yellow/30 bg-gradient-to-r from-neon-yellow/5 to-neon-orange/5 p-8 mb-12 text-center"
      >
        <p className="text-sm text-neon-yellow font-semibold uppercase tracking-widest mb-2">🏅 Tournament MVP</p>
        <p className="font-display text-4xl font-bold text-foreground">{topBatsmen[0].name}</p>
        <p className="text-muted-foreground">{topBatsmen[0].team}</p>
        <p className="mt-2 text-neon-yellow font-display text-2xl font-bold">{topBatsmen[0].runs} runs • SR {topBatsmen[0].sr}</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Batsmen */}
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-neon-yellow" /> Top Batsmen
          </h2>
          <div className="space-y-3">
            {topBatsmen.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-4">
                  <span className={`font-display text-2xl font-bold ${i === 0 ? "text-neon-yellow" : i === 1 ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.team} • {b.matches} matches</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-neon-yellow">{b.runs}</p>
                  <p className="text-xs text-muted-foreground">SR: {b.sr}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bowlers */}
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Target className="h-6 w-6 text-neon-orange" /> Top Bowlers
          </h2>
          <div className="space-y-3">
            {topBowlers.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-4">
                  <span className={`font-display text-2xl font-bold ${i === 0 ? "text-neon-orange" : "text-muted-foreground/60"}`}>
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.team} • {b.matches} matches</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-neon-orange">{b.wickets}</p>
                  <p className="text-xs text-muted-foreground">Eco: {b.economy}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
