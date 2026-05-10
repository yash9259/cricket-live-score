import { motion } from "framer-motion";
import { Trophy, Target, Star } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function LeaderboardPage() {
  const seriesLeaderboard = useQuery(api.matches.getSeriesLeaderboard);

  const mvp = seriesLeaderboard?.[0];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Tournament Leaderboard</h1>
          <p className="text-muted-foreground">Tournament statistics and top performers based on the points system</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-xs text-primary font-medium">
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Man of the Series / MVP */}
      {mvp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-neon-orange/10 p-8 mb-12 text-center relative overflow-hidden group shadow-[0_0_30px_rgba(var(--primary),0.1)]"
        >
          <div className="absolute -top-12 -right-12 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <Trophy size={240} />
          </div>
          
          <div className="relative z-10">
            <p className="text-sm text-primary font-bold uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-primary/40"></span>
              <Star className="h-4 w-4 fill-primary" /> Man of the Series <Star className="h-4 w-4 fill-primary" />
              <span className="h-px w-8 bg-primary/40"></span>
            </p>
            <h2 className="font-display text-6xl font-black text-foreground mb-2 tracking-tight group-hover:scale-105 transition-transform duration-500">
              {mvp.playerName}
            </h2>
            <p className="text-2xl text-muted-foreground mb-8 font-medium">{mvp.teamName}</p>
            
            <div className="flex flex-wrap justify-center gap-12">
              <div className="text-center p-4 rounded-xl bg-background/50 border border-border backdrop-blur-sm min-w-[140px]">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Points</p>
                <p className="text-4xl font-display font-black text-primary">{mvp.total}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-background/50 border border-border backdrop-blur-sm min-w-[140px]">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Matches</p>
                <p className="text-4xl font-display font-black text-foreground">{mvp.matches}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-background/50 border border-border backdrop-blur-sm min-w-[140px]">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Avg Points</p>
                <p className="text-4xl font-display font-black text-foreground">{(mvp.total / mvp.matches).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            Player Standings
          </h2>
          
          <div className="grid gap-4">
            {seriesLeaderboard?.map((p, i) => (
              <motion.div
                key={p.playerName + p.teamName}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 transition-all group relative overflow-hidden"
              >
                {i === 0 && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                )}
                
                <div className="flex items-center gap-6 mb-4 sm:mb-0">
                  <div className={`font-display text-xl font-black w-12 h-12 flex items-center justify-center rounded-xl shadow-inner ${
                    i === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : 
                    i === 1 ? "bg-slate-400/20 text-slate-400 border border-slate-400/30" : 
                    i === 2 ? "bg-orange-600/20 text-orange-600 border border-orange-600/30" : 
                    "bg-muted/50 text-muted-foreground/60 border border-border"
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{p.playerName}</h3>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      {p.teamName} <span className="w-1 h-1 rounded-full bg-border"></span> {p.matches} matches
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 md:gap-12 justify-between sm:justify-end border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0">
                  <div className="text-center sm:text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Batting</p>
                    <p className="font-display font-bold text-foreground">{p.batting}</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Bowling</p>
                    <p className="font-display font-bold text-foreground">{p.bowling}</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">MoM</p>
                    <p className="font-display font-bold text-foreground">{p.momCount || 0}</p>
                  </div>
                  <div className="text-center sm:text-right px-4 py-2 bg-primary/5 rounded-lg border border-primary/10 min-w-[100px]">
                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-0.5">Total</p>
                    <p className="font-display text-2xl font-black text-primary">{p.total}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {seriesLeaderboard && seriesLeaderboard.length === 0 && (
              <div className="py-24 text-center text-muted-foreground bg-muted/5 rounded-3xl border-2 border-dashed border-border/50">
                <Trophy className="h-16 w-16 mx-auto mb-6 opacity-10" />
                <h3 className="text-xl font-bold text-foreground/50 mb-2">No Standings Yet</h3>
                <p className="max-w-xs mx-auto">Tournament statistics will appear here once matches are completed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
