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
    if (match.status === "completed") {
      return match.winnerName ? `${match.winnerName.toUpperCase()} WON!` : "MATCH TIED!";
    }
    if (!scoreData) return "Scoreboard not available";
    if (scoreData.inning === 1) return "1st Inning in progress...";
    
    const target = scoreData.target || 0;
    if (scoreData.runs >= target) {
      return `${scoreData.battingTeam.toUpperCase()} WON BY ${6 - scoreData.wickets} WICKETS`;
    }
    
    const isMatchOver = scoreData.overs === 6 || scoreData.wickets === 6;
    if (isMatchOver) {
        if (scoreData.runs < target - 1) {
            return `${scoreData.bowlingTeam.toUpperCase()} WON BY ${target - scoreData.runs - 1} RUNS`;
        }
        if (scoreData.runs === target - 1) return "MATCH TIED!";
    }
    
    return `NEED ${target - scoreData.runs} RUNS TO WIN`;
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link to="/matches" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Match Center
        </Link>

        {/* Professional Cricbuzz-style Header Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden relative"
        >
          <div className="relative z-10">
            {/* Top Status Bar */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-border bg-muted/30">
              <div className="flex flex-col">
                <h1 className="text-xs font-bold text-foreground uppercase tracking-widest">
                  {match.teamAName} vs {match.teamBName}, {match.categoryLabel}
                </h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">VRP Box Cricket 2026 • Bhuj</p>
              </div>
              <div className="flex items-center gap-2">
                {match.status === "live" && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-white" /> LIVE
                  </div>
                )}
                {match.status === "completed" && (
                  <div className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold">
                    RESULT
                  </div>
                )}
              </div>
            </div>

            {/* Main Score Area */}
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
                {/* Team A */}
                <div className="flex-1 w-full flex items-center justify-between md:justify-start gap-4">
                  <h2 className="font-display text-xl md:text-3xl font-black text-foreground">
                    {match.teamAName}
                  </h2>
                  {(() => {
                    const score = match.status === "completed" 
                      ? match.finalScoreA 
                      : (scoreData ? (
                          (scoreData.inning === 1 && scoreData.battingTeam === match.teamAName) || (scoreData.inning === 2 && scoreData.battingTeam === match.teamAName)
                            ? { runs: scoreData.runs, wickets: scoreData.wickets, overs: scoreData.overs, balls: scoreData.balls }
                            : (scoreData.inning === 2 && scoreData.bowlingTeam === match.teamAName)
                              ? scoreData.firstInningScore
                              : null
                        ) : null);
                    return score ? (
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-3xl md:text-4xl font-black text-foreground tabular-nums">
                          {score.runs}/{score.wickets}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          ({score.overs}.{score.balls})
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Team B */}
                <div className="flex-1 w-full flex items-center justify-between md:justify-end gap-4">
                  {(() => {
                    const score = match.status === "completed" 
                      ? match.finalScoreB 
                      : (scoreData ? (
                          (scoreData.inning === 1 && scoreData.battingTeam === match.teamBName) || (scoreData.inning === 2 && scoreData.battingTeam === match.teamBName)
                            ? { runs: scoreData.runs, wickets: scoreData.wickets, overs: scoreData.overs, balls: scoreData.balls }
                            : (scoreData.inning === 2 && scoreData.bowlingTeam === match.teamBName)
                              ? scoreData.firstInningScore
                              : null
                        ) : null);
                    return score ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground font-medium order-2 md:order-1">
                          ({score.overs}.{score.balls})
                        </span>
                        <span className="font-display text-3xl md:text-4xl font-black text-foreground tabular-nums order-1 md:order-2">
                          {score.runs}/{score.wickets}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  <h2 className="font-display text-xl md:text-3xl font-black text-foreground">
                    {match.teamBName}
                  </h2>
                </div>
              </div>

              {/* Status Message */}
              <div className="mt-8 pt-4 border-t border-border/50">
                <p className="text-sm font-bold text-primary uppercase tracking-tight">
                  {getResult()}
                </p>
                {(match.tossWinner || scoreData?.tossWinner) && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Toss: {(match.tossWinner || scoreData?.tossWinner)} won and chose to {(match.tossDecision || scoreData?.tossDecision)}
                  </p>
                )}
              </div>
            </div>
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
  </div>
);
}


