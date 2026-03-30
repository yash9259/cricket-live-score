import { motion } from "framer-motion";
import { matches } from "@/lib/mockData";

export default function DisplayPage() {
  const match = matches.find((m) => m.status === "live") || matches[0];
  const { teamA, teamB, scoreA, scoreB, overs } = match;

  const striker = teamA.players[0];
  const nonStriker = teamA.players[2];
  const bowler = teamB.players[0];
  const lastBall = match.ballByBall?.[match.ballByBall.length - 1];

  const required = scoreA && scoreB ? scoreA.runs - scoreB.runs + 1 : null;
  const ballsLeft = scoreB ? (overs * 6) - (scoreB.overs * 6 + scoreB.balls) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 select-none cursor-none">
      {/* Header */}
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-4">
          <span className="live-badge text-lg px-4 py-2">LIVE</span>
          <span className="font-display text-lg text-muted-foreground">LOHANA BOX CRICKET 2026</span>
        </div>

        {/* Main scoreboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-primary/20 bg-card p-8 md:p-12"
        >
          <div className="flex items-center justify-between gap-8">
            {/* Team A */}
            <div className="flex-1 text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-foreground uppercase tracking-wide">{teamA.name}</p>
              {scoreA && (
                <>
                  <p className="font-display text-7xl md:text-9xl font-bold text-primary neon-text-green mt-4">
                    {scoreA.runs}<span className="text-4xl md:text-5xl text-muted-foreground">/{scoreA.wickets}</span>
                  </p>
                  <p className="font-display text-2xl text-muted-foreground mt-2">({scoreA.overs}.{scoreA.balls} ov)</p>
                </>
              )}
            </div>

            <div className="font-display text-3xl text-muted-foreground/30 font-bold">VS</div>

            {/* Team B */}
            <div className="flex-1 text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-foreground uppercase tracking-wide">{teamB.name}</p>
              {scoreB && (
                <>
                  <p className="font-display text-7xl md:text-9xl font-bold text-neon-orange mt-4">
                    {scoreB.runs}<span className="text-4xl md:text-5xl text-muted-foreground">/{scoreB.wickets}</span>
                  </p>
                  <p className="font-display text-2xl text-muted-foreground mt-2">({scoreB.overs}.{scoreB.balls} ov)</p>
                </>
              )}
            </div>
          </div>

          {/* Required */}
          {required && required > 0 && ballsLeft && ballsLeft > 0 && (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center mt-8 font-display text-2xl text-neon-yellow font-bold"
            >
              {teamB.name} needs {required} runs from {ballsLeft} balls
            </motion.p>
          )}
        </motion.div>

        {/* Bottom info */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {/* Striker */}
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Striker</p>
            <p className="font-display text-xl font-bold text-foreground">{striker.name}</p>
            <p className="font-display text-3xl font-bold text-primary mt-1">{striker.runs}<span className="text-lg text-muted-foreground">({striker.balls})</span></p>
          </div>

          {/* Last Ball */}
          <div className="rounded-xl border border-border bg-card p-4 text-center flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Last Ball</p>
            {lastBall && (
              <motion.span
                key={JSON.stringify(lastBall)}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full font-display text-3xl font-bold ${
                  lastBall.type === "six" ? "bg-neon-yellow text-primary-foreground" :
                  lastBall.type === "four" ? "bg-primary text-primary-foreground" :
                  lastBall.type === "wicket" ? "bg-destructive text-destructive-foreground" :
                  "bg-muted text-foreground"
                }`}
              >
                {lastBall.type === "wicket" ? "W" : lastBall.runs}
              </motion.span>
            )}
          </div>

          {/* Bowler */}
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Bowler</p>
            <p className="font-display text-xl font-bold text-foreground">{bowler.name}</p>
            <p className="font-display text-lg text-neon-orange mt-1">{bowler.wickets}-{bowler.runsConceded}<span className="text-sm text-muted-foreground ml-1">({bowler.overs} ov)</span></p>
          </div>
        </div>

        {/* Ball-by-ball strip */}
        {match.ballByBall && (
          <div className="mt-6 flex gap-2 justify-center flex-wrap">
            {match.ballByBall.slice(-12).map((b, i) => (
              <span
                key={i}
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                  b.type === "four" ? "bg-primary/20 text-primary" :
                  b.type === "six" ? "bg-neon-yellow/20 text-neon-yellow" :
                  b.type === "wicket" ? "bg-destructive/20 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {b.type === "wicket" ? "W" : b.runs}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
