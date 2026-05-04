import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

function AnimationOverlay({ type, id, lastEvent }: { type: string, id: number, lastEvent?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (type && id) {
      setVisible(true);
      // Super ball stays a bit longer
      const duration = type.startsWith("super-ball") ? 4000 : 3000;
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [type, id]);

  // Parse the lastEvent to extract doubled run value for display
  // Format: "⚡3×2=6" → show "⚡6"
  const superBallRunMatch = lastEvent?.match(/⚡(\d+)×2=(\d+)/);
  const superBallDoubled = superBallRunMatch ? superBallRunMatch[2] : null;
  const superBallOriginal = superBallRunMatch ? superBallRunMatch[1] : null;

  const config: Record<string, { text: string, color: string, sub: string, glow?: string }> = {
    "no-ball": { text: "NO BALL", color: "bg-neon-yellow text-slate-900", sub: "+2 RUNS & FREE HIT" },
    "wicket": { text: "OUT!", color: "bg-destructive text-white", sub: "BATSMAN IS GONE" },
    "six": { text: "6", color: "bg-primary text-white", sub: "MAXIMUM!" },
    "four": { text: "4", color: "bg-emerald-500 text-white", sub: "BOUNDARY!" },
    "super-ball": {
      text: superBallDoubled ? `⚡${superBallDoubled}` : "⚡",
      color: "bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900",
      sub: superBallDoubled ? `${superBallOriginal}×2 = ${superBallDoubled} — SUPER BALL!` : "SUPER BALL!",
      glow: "shadow-[0_0_80px_20px_rgba(234,179,8,0.6)]",
    },
    "super-ball-wicket": {
      text: "💀×2",
      color: "bg-gradient-to-br from-yellow-400 to-red-600 text-white",
      sub: "SUPER BALL WICKET — 2 WICKETS!",
      glow: "shadow-[0_0_80px_20px_rgba(234,179,8,0.5)]",
    },
  };

  const current = config[type];
  if (!current) return null;

  const isSuperBall = type.startsWith("super-ball");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          {/* Pulsing glow ring behind card for super ball */}
          {isSuperBall && (
            <motion.div
              className="absolute rounded-full bg-yellow-400/20"
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{ width: 700, height: 700, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className={`${current.color} ${current.glow ?? "shadow-[0_0_50px_rgba(0,0,0,0.5)]"} p-12 rounded-2xl border-4 border-white/20 text-center min-w-[400px] relative overflow-hidden`}
          >
            {/* Super ball shimmer bar */}
            {isSuperBall && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%", skewX: -20 }}
                animate={{ x: "200%" }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            )}
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-8xl font-black italic tracking-tighter"
            >
              {current.text}
            </motion.h2>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold mt-2 opacity-90"
            >
              {current.sub}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 select-none cursor-none relative overflow-hidden">
      
      {/* Animation Overlay */}
      {live.showAnimation && live.animationId && (
        <AnimationOverlay type={live.showAnimation} id={live.animationId} lastEvent={live.lastEvent} />
      )}

      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-4">
          <span className="live-badge text-lg px-4 py-2">LIVE</span>
          <span className="font-display text-lg text-muted-foreground">VRP BOX CRICKET 2026</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-primary/20 bg-card p-8 md:p-12 relative overflow-hidden"
        >
          {live.inning === 2 && live.target && (
            <div className="absolute top-0 right-0 bg-neon-yellow text-slate-900 px-6 py-1 font-bold text-sm transform translate-x-[25%] translate-y-[50%] rotate-45 shadow-lg">
              TARGET: {live.target}
            </div>
          )}

          <div className="text-center pb-8 border-b border-border/50">
            <motion.div className="text-center space-y-6">
              <div className="flex flex-col items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold border border-primary/30 uppercase tracking-widest">
                  {live.inning === 2 ? "2nd Inning - The Chase" : "1st Inning"}
                </span>
                {live.inning === 2 && live.firstInningScore && (
                  <p className="text-muted-foreground text-sm font-medium">
                    1st Inn: {live.firstInningScore.runs}/{live.firstInningScore.wickets} ({live.firstInningScore.overs}.{live.firstInningScore.balls})
                  </p>
                )}
              </div>
              
              {live.target && (
                <div className="bg-neon-yellow/10 border border-neon-yellow/30 px-6 py-2 rounded-lg inline-block">
                  <p className="text-neon-yellow font-bold text-lg tracking-widest uppercase">Target: {live.target}</p>
                </div>
              )}
            </motion.div>
            
            <p className="font-display text-2xl md:text-4xl font-bold text-foreground uppercase tracking-wide mt-4">
              {live.battingTeam} vs {live.bowlingTeam}
            </p>
            <p className="font-display text-7xl md:text-9xl font-bold text-primary neon-text-green mt-6">
              {live.runs}<span className="text-4xl md:text-6xl text-muted-foreground">/{live.wickets}</span>
            </p>
            <p className="font-display text-2xl md:text-3xl text-muted-foreground mt-4">({live.overs}.{live.balls} ov)</p>
            
            <div className="flex flex-col items-center gap-3 mt-6">
              <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">This Over</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {live.ballHistory && live.ballHistory.slice(-6).length > 0 ? (
                  live.ballHistory.slice(-6).map((event, index) => (
                    <span
                      key={`${event}-${index}`}
                      className="rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-sm font-semibold text-foreground"
                    >
                      {event}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-border bg-background/60 px-4 py-1 text-sm font-semibold text-muted-foreground">
                    START
                  </span>
                )}
              </div>
              {live.inning === 2 && live.target && (
                <p className="text-2xl font-bold text-foreground animate-pulse">
                  Need {Math.max(0, live.target - live.runs)} runs to win
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left">
            <div className="space-y-4">
              <h3 className="font-display text-xl text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2 inline-block">Batting</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <p className="text-2xl font-bold text-primary">
                    {live.striker || "Striker"}*
                  </p>
                  <p className="text-xl font-bold text-foreground bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
                    {live.strikerRuns || 0} <span className="text-sm font-medium text-muted-foreground">({live.strikerBalls || 0})</span>
                  </p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <p className="text-xl font-medium text-muted-foreground">
                    {live.nonStriker || "Non-Striker"}
                  </p>
                  <p className="text-lg font-bold text-muted-foreground">
                    {live.nonStrikerRuns || 0} <span className="text-sm font-medium opacity-70">({live.nonStrikerBalls || 0})</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 text-center md:text-right">
              <h3 className="font-display text-xl text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2 inline-block">Bowling</h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-neon-orange">
                  {live.bowler || "Bowler"}
                </p>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">W-R:</span>
                  <p className="text-2xl font-bold text-foreground">
                    {live.bowlerWickets || 0}-{live.bowlerRuns || 0}
                  </p>
                  <p className="text-lg font-medium text-muted-foreground ml-2">
                    ({Math.floor((live.bowlerBalls || 0) / 6)}.{ (live.bowlerBalls || 0) % 6 })
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
