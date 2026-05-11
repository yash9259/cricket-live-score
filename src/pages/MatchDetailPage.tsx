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
          className="rounded-[2rem] border border-border bg-card shadow-2xl overflow-hidden relative"
        >
          {/* Subtle patterns/gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5 pointer-events-none" />
          
          <div className="relative z-10">
            {/* Top Status Bar */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                  {match.categoryLabel}
                </span>
              </div>
              {match.status === "live" ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive text-white text-[10px] font-black animate-pulse shadow-lg shadow-destructive/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                </div>
              ) : match.status === "completed" ? (
                <div className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-lg shadow-emerald-500/20">
                  RESULT
                </div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black">
                  UPCOMING
                </div>
              )}
            </div>

            {/* Main Score Area */}
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-stretch justify-between gap-8 md:gap-4 relative">
                {/* Team A */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl md:text-4xl font-black text-foreground tracking-tighter leading-none">
                      {match.teamAName}
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Captain: {match.captainAName}</p>
                  </div>
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
                      <div className="space-y-1">
                        <div className="font-display text-5xl md:text-6xl font-black text-primary tabular-nums tracking-tighter">
                          {score.runs}<span className="text-2xl md:text-3xl text-muted-foreground font-medium opacity-40">/{score.wickets}</span>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{score.overs}.{score.balls} Overs</p>
                      </div>
                    ) : (
                      <div className="h-20 flex items-center justify-center opacity-10">
                        <Trophy className="h-12 w-12" />
                      </div>
                    );
                  })()}
                </div>

                {/* VS Divider */}
                <div className="flex flex-row md:flex-col items-center justify-center gap-4">
                  <div className="h-[1px] md:w-[1px] flex-1 bg-border" />
                  <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-inner">
                    <span className="font-display font-black text-sm text-muted-foreground/30 italic">VS</span>
                  </div>
                  <div className="h-[1px] md:w-[1px] flex-1 bg-border" />
                </div>

                {/* Team B */}
                <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl md:text-4xl font-black text-foreground tracking-tighter leading-none">
                      {match.teamBName}
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Captain: {match.captainBName}</p>
                  </div>
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
                      <div className="space-y-1">
                        <div className="font-display text-5xl md:text-6xl font-black text-orange-500 tabular-nums tracking-tighter">
                          {score.runs}<span className="text-2xl md:text-3xl text-muted-foreground font-medium opacity-40">/{score.wickets}</span>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{score.overs}.{score.balls} Overs</p>
                      </div>
                    ) : (
                      <div className="h-20 flex items-center justify-center opacity-10">
                        <Trophy className="h-12 w-12" />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Toss & Bottom Message Area */}
              <div className="mt-12 flex flex-col items-center space-y-6">
                <div className="flex flex-col items-center gap-4 w-full">
                  {/* Result/Status Badge */}
                  <div className="inline-flex items-center gap-3 px-10 py-5 rounded-[1.5rem] bg-primary/5 border border-primary/10 shadow-lg shadow-primary/5 relative group transition-all hover:bg-primary/10">
                    <Trophy className={`h-7 w-7 text-yellow-500 ${match.status === 'live' ? 'animate-bounce' : ''}`} />
                    <p className="font-display text-xl md:text-2xl font-black uppercase tracking-tighter text-primary">
                      {getResult()}
                    </p>
                  </div>

                  {/* Toss Info */}
                  {(match.tossWinner || scoreData?.tossWinner) && (
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>
                        <span className="font-bold text-foreground">Toss:</span> {(match.tossWinner || scoreData?.tossWinner)} won and chose to {(match.tossDecision || scoreData?.tossDecision)}
                      </span>
                    </div>
                  )}
                  
                  {/* Target Info */}
                  {scoreData && scoreData.target && scoreData.inning === 2 && scoreData.runs < scoreData.target && (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Target: {scoreData.target}</p>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        Need {scoreData.target - scoreData.runs} runs from {36 - (scoreData.overs * 6 + scoreData.balls)} balls
                      </p>
                    </div>
                  )}
                </div>
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
  );
}
