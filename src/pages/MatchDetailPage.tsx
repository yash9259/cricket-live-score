import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import { Id } from "../../convex/_generated/dataModel";

export default function MatchDetailPage() {
  const { id } = useParams();
  const matchId = id as Id<"matches">;
  const matches = useQuery(api.matches.list) ?? [];
  const match = matches.find((m) => m._id === matchId);
  const scoreData = useQuery(api.liveScore.getByMatchId, { matchId });

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground italic">Match details not found.</p>
        <Link to="/matches" className="text-primary hover:underline mt-6 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Matches
        </Link>
      </div>
    );
  }

  const getResult = () => {
    if (!scoreData) return "Scoreboard not available";
    if (scoreData.inning === 1) return "1st Inning in progress...";
    if (scoreData.runs >= (scoreData.target || 0)) {
      return `${scoreData.battingTeam} WON BY ${6 - scoreData.wickets} WICKETS`;
    }
    const target = scoreData.target || 0;
    const isMatchOver = scoreData.overs === 6 || scoreData.wickets === 6;
    
    if (isMatchOver) {
        if (scoreData.runs < target - 1) {
            return `${scoreData.bowlingTeam} WON BY ${target - scoreData.runs - 1} RUNS`;
        }
        if (scoreData.runs === target - 1) return "MATCH TIED!";
    }
    
    return "2nd Inning in progress...";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/matches" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Matches
      </Link>

      {/* Match Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-8 md:p-12 mb-10 shadow-2xl relative overflow-hidden"
      >
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <span className="px-4 py-1 rounded-full bg-muted text-[10px] font-black uppercase tracking-[0.3em] mb-4 border border-border">
              {match.categoryLabel}
            </span>
            {match.status === "live" && (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold animate-pulse mb-4 border border-destructive/20">
                <span className="w-2 h-2 rounded-full bg-current" /> LIVE MATCH
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-4xl mx-auto">
            <div className="flex-1 text-center">
              <h2 className="font-display text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground mb-2">{match.teamAName}</h2>
              {scoreData && scoreData.inning === 1 && (
                <p className="font-display text-5xl font-black text-primary">
                  {scoreData.runs}<span className="text-2xl text-muted-foreground">/{scoreData.wickets}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center border border-border">
                <span className="font-display font-black text-xl text-muted-foreground/50">VS</span>
              </div>
            </div>

            <div className="flex-1 text-center">
              <h2 className="font-display text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground mb-2">{match.teamBName}</h2>
              {scoreData && scoreData.inning === 2 && (
                <p className="font-display text-5xl font-black text-orange-500">
                  {scoreData.runs}<span className="text-2xl text-muted-foreground">/{scoreData.wickets}</span>
                </p>
              )}
            </div>
          </div>

          {scoreData && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary/10 border border-primary/20">
                <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />
                <p className="font-display text-xl font-bold uppercase tracking-widest text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                  {getResult()}
                </p>
              </div>
              
              {scoreData.target && scoreData.inning === 2 && scoreData.runs < scoreData.target && (
                <p className="mt-4 text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  Need {scoreData.target - scoreData.runs} runs from {36 - (scoreData.overs * 6 + scoreData.balls)} balls
                </p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Scoreboard Table Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <h3 className="font-display text-2xl font-black uppercase tracking-tighter shrink-0">Detailed <span className="text-primary">Scorecard</span></h3>
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        
        <ScoreboardTable matchId={matchId} />
      </div>
    </div>
  );
}
