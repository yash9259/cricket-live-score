import { Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface BatsmanStat {
  name: string;
  runs: number;
  balls: number;
  isOut: boolean;
}

interface BowlerStat {
  name: string;
  runs: number;
  wickets: number;
  balls: number;
}

interface ScoreboardTableProps {
  matchId?: Id<"matches">;
  data?: any;
}

export function ScoreboardTable({ matchId, data }: ScoreboardTableProps) {
  const fetchedData = useQuery(api.liveScore.getByMatchId, matchId ? { matchId } : "skip");
  const match = useQuery(api.matches.getById, matchId ? { id: matchId as any } : "skip");
  const scoreData = data || fetchedData;

  const formatOvers = (totalBalls: number) => {
    const ov = Math.floor(totalBalls / 6);
    const bl = totalBalls % 6;
    return `${ov}.${bl}`;
  };

  if (scoreData === undefined) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading scoreboard...</div>;
  if (!scoreData) return <div className="p-8 text-center text-muted-foreground italic">No scoreboard data available for this match.</div>;

  const InningSection = ({ 
    teamName, 
    runs, 
    wickets, 
    overs, 
    balls, 
    batsmen, 
    bowlers, 
    isActive 
  }: { 
    teamName: string, 
    runs: number, 
    wickets: number, 
    overs: number, 
    balls: number, 
    batsmen?: BatsmanStat[], 
    bowlers?: BowlerStat[],
    isActive: boolean
  }) => (
    <div className={`space-y-3 rounded-xl overflow-hidden border ${isActive ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/50'}`}>
      <div className={`px-4 py-2 flex justify-between items-center ${isActive ? 'bg-primary/10' : 'bg-muted/50'}`}>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm uppercase tracking-wider">{teamName || "TBD"}</h3>
        </div>
        <div className="text-right">
          <span className="font-display font-black text-lg text-primary">{runs}-{wickets}</span>
          <span className="text-xs text-muted-foreground ml-2">({overs}.{balls} Overs)</span>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Batsmen Table */}
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border/50 pb-1">
            <span>Batsman</span>
            <div className="flex gap-4">
              <span className="w-8 text-right">R</span>
              <span className="w-8 text-right">B</span>
              <span className="w-8 text-right hidden sm:block">SR</span>
            </div>
          </div>
          <div className="space-y-1">
            {batsmen && batsmen.length > 0 ? batsmen.map((b, i) => (
              <div key={i} className="flex justify-between text-xs items-center py-1 border-b border-border/20 last:border-0">
                <span className={`font-medium ${b.isOut ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {b.name}
                </span>
                <div className="flex gap-4 font-mono">
                  <span className="w-8 text-right font-bold">{b.runs}</span>
                  <span className="w-8 text-right text-muted-foreground">{b.balls}</span>
                  <span className="w-8 text-right text-muted-foreground hidden sm:block">
                    {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : "0"}
                  </span>
                </div>
              </div>
            )) : <p className="text-[10px] text-muted-foreground italic">No batting data</p>}
          </div>
        </div>

        {/* Bowlers Table */}
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border/50 pb-1">
            <span>Bowler</span>
            <div className="flex gap-4">
              <span className="w-10 text-right">W-R</span>
              <span className="w-8 text-right">O</span>
              <span className="w-8 text-right hidden sm:block">Eco</span>
            </div>
          </div>
          <div className="space-y-1">
            {bowlers && bowlers.length > 0 ? bowlers.map((b, i) => (
              <div key={i} className="flex justify-between text-xs items-center py-1 border-b border-border/20 last:border-0">
                <span className="font-medium">{b.name}</span>
                <div className="flex gap-4 font-mono">
                  <span className="w-10 text-right font-bold text-orange-400">{b.wickets}-{b.runs}</span>
                  <span className="w-8 text-right text-muted-foreground">{formatOvers(b.balls)}</span>
                  <span className="w-8 text-right text-muted-foreground hidden sm:block">
                    {b.balls > 0 ? ((b.runs / (b.balls / 6))).toFixed(1) : "0.0"}
                  </span>
                </div>
              </div>
            )) : <p className="text-[10px] text-muted-foreground italic">No bowling data</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-2 bg-slate-950/50 rounded-xl border border-border/50">
      {/* Inning 1 Section */}
      <InningSection 
        teamName={scoreData.inning === 1 ? scoreData.battingTeam : scoreData.bowlingTeam}
        runs={scoreData.inning === 1 ? scoreData.runs : (scoreData.firstInningScore?.runs || 0)}
        wickets={scoreData.inning === 1 ? scoreData.wickets : (scoreData.firstInningScore?.wickets || 0)}
        overs={scoreData.inning === 1 ? scoreData.overs : (scoreData.firstInningScore?.overs || 0)}
        balls={scoreData.inning === 1 ? scoreData.balls : (scoreData.firstInningScore?.balls || 0)}
        batsmen={scoreData.batsmenInning1}
        bowlers={scoreData.bowlersInning1}
        isActive={scoreData.inning === 1}
      />

      {/* Inning 2 Section (if applicable) */}
      {(scoreData.inning === 2 || scoreData.firstInningScore) && (
        <InningSection 
          teamName={scoreData.inning === 2 ? scoreData.battingTeam : scoreData.bowlingTeam}
          runs={scoreData.inning === 2 ? scoreData.runs : 0}
          wickets={scoreData.inning === 2 ? scoreData.wickets : 0}
          overs={scoreData.inning === 2 ? scoreData.overs : 0}
          balls={scoreData.inning === 2 ? scoreData.balls : 0}
          batsmen={scoreData.batsmenInning2}
          bowlers={scoreData.bowlersInning2}
          isActive={scoreData.inning === 2}
        />
      )}


    </div>
  );
}
