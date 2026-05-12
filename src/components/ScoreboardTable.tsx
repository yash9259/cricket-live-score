import { useState } from "react";
import { Users, Layout, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface BatsmanStat {
  name: string;
  runs: number;
  balls: number;
  isOut: boolean;
  dots?: number;
  points?: number;
}

interface BowlerStat {
  name: string;
  runs: number;
  wickets: number;
  balls: number;
  dots?: number;
  maidens?: number;
  extras?: number;
  points?: number;
}

interface ScoreboardTableProps {
  matchId?: Id<"matches">;
  data?: any;
}

export function ScoreboardTable({ matchId, data }: ScoreboardTableProps) {
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const live = useQuery(api.liveScore.getCurrent);
  const matchSpecificLive = useQuery(api.liveScore.getByMatchId, matchId ? { matchId: matchId as any } : "skip");
  const scoreData = data || matchSpecificLive || (matchId ? null : live);

  const match = useQuery(api.matches.getById, matchId ? { id: matchId as any } : (scoreData?.matchId ? { id: scoreData.matchId } : "skip"));
  
  // Fetch team registrations to know the full squad
  const teamA = useQuery(api.registrations.getById, match?.teamAId ? { id: match.teamAId } : "skip");
  const teamB = useQuery(api.registrations.getById, match?.teamBId ? { id: match.teamBId } : "skip");

  const formatOvers = (totalBalls: number) => {
    const ov = Math.floor(totalBalls / 6);
    const bl = totalBalls % 6;
    return `${ov}.${bl}`;
  };

  if (scoreData === undefined) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading scoreboard...</div>;
  if (!scoreData) return <div className="p-8 text-center text-muted-foreground italic">No scoreboard data available for this match.</div>;

  const currentInning = activeTab === 1 ? 1 : 2;
  const isSecondInningAvailable = scoreData.inning === 2 || scoreData.firstInningScore;

  // Determine which team is batting in the selected tab
  // Inning 1 batting team
  const inning1BattingTeam = scoreData.inning === 1 ? scoreData.battingTeam : scoreData.bowlingTeam;
  // Inning 2 batting team
  const inning2BattingTeam = scoreData.inning === 2 ? scoreData.battingTeam : scoreData.bowlingTeam;

  const displayedTeamName = activeTab === 1 ? inning1BattingTeam : inning2BattingTeam;
  const displayedRuns = activeTab === 1 
    ? (scoreData.inning === 1 ? scoreData.runs : (scoreData.firstInningScore?.runs || 0))
    : (scoreData.inning === 2 ? scoreData.runs : 0);
  const displayedWickets = activeTab === 1
    ? (scoreData.inning === 1 ? scoreData.wickets : (scoreData.firstInningScore?.wickets || 0))
    : (scoreData.inning === 2 ? scoreData.wickets : 0);
  const displayedOvers = activeTab === 1
    ? (scoreData.inning === 1 ? scoreData.overs : (scoreData.firstInningScore?.overs || 0))
    : (scoreData.inning === 2 ? scoreData.overs : 0);
  const displayedBalls = activeTab === 1
    ? (scoreData.inning === 1 ? scoreData.balls : (scoreData.firstInningScore?.balls || 0))
    : (scoreData.inning === 2 ? scoreData.balls : 0);

  const batsmen = activeTab === 1 ? scoreData.batsmenInning1 : scoreData.batsmenInning2;
  const bowlers = activeTab === 1 ? scoreData.bowlersInning1 : scoreData.bowlersInning2;

  // Get full squad for "Did not bat" with safety guards
  const battingTeamReg = teamA?.teamName === displayedTeamName ? teamA : (teamB?.teamName === displayedTeamName ? teamB : null);

  
  const squad = (battingTeamReg && battingTeamReg.players) 
    ? [battingTeamReg.captainName, ...battingTeamReg.players.map((p: any) => p.name)] 
    : [];
  const battedNames = batsmen?.map(b => b.name.trim()) || [];
  const didNotBat = squad.filter(name => {
    const trimmedName = name?.trim();
    return trimmedName && !battedNames.includes(trimmedName);
  });


  return (
    <div className="space-y-6">
      {/* Inning Selection Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab(1)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 1 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {inning1BattingTeam} (Inns 1)
        </button>
        {isSecondInningAvailable && (
          <button
            onClick={() => setActiveTab(2)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 2 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {inning2BattingTeam} (Inns 2)
          </button>
        )}
      </div>

      {/* Main Scorecard Card */}
      <div className="bg-card/30 rounded-2xl border border-border/50 overflow-hidden backdrop-blur-md">
        {/* Header Bar */}
        <div className="bg-primary/10 px-6 py-4 flex justify-between items-center border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl uppercase tracking-tighter">{displayedTeamName}</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Batting Card</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-black text-3xl text-primary leading-none">
              {displayedRuns}<span className="text-xl text-primary/60">/{displayedWickets}</span>
            </p>
            <p className="text-xs text-muted-foreground font-bold mt-1">({displayedOvers}.{displayedBalls} OVERS)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Batsmen Table */}
          <table className="w-full text-left min-w-[500px] md:min-w-0">
            <thead>
              <tr className="bg-muted/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground border-y border-border">
                <th className="px-6 py-3">Batter</th>
                <th className="px-4 py-3 text-right">R</th>
                <th className="px-4 py-3 text-right">B</th>
                <th className="px-4 py-3 text-right">4s</th>
                <th className="px-4 py-3 text-right">6s</th>
                <th className="px-6 py-3 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batsmen && batsmen.length > 0 ? batsmen.map((b: any, i: number) => {
                const isStriker = activeTab === scoreData.inning && scoreData.striker === b.name;
                const isNonStriker = activeTab === scoreData.inning && scoreData.nonStriker === b.name;

                return (
                  <tr key={i} className={`group transition-colors ${b.isOut ? 'bg-muted/5' : 'hover:bg-muted/20'}`}>
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${b.isOut ? 'text-muted-foreground' : 'text-primary'}`}>
                            {b.name}
                            {isStriker && <span className="ml-1 text-primary">*</span>}
                          </span>
                          {(isStriker || isNonStriker) && (
                            <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                              {isStriker ? "Batting" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {b.isOut ? "out" : "not out"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{b.runs}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">{b.balls}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">{b.fours || 0}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">{b.sixes || 0}</td>
                    <td className="px-6 py-3 text-right font-mono text-xs text-muted-foreground">
                      {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0"}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic text-sm">No batting data recorded yet.</td>
                </tr>
              )}
            </tbody>
            {/* Did Not Bat Footer */}
            {didNotBat.length > 0 && (
              <tfoot className="border-t border-white/5 bg-white/[0.01]">
                <tr>
                  <td colSpan={6} className="px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center shrink-0">
                        <Activity className="h-3 w-3 text-primary/60 mr-2" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Did Not Bat</span>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        {didNotBat.map((name, idx) => (
                          <span key={idx} className="text-[11px] font-medium text-foreground/70">
                            {name}{idx < didNotBat.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>

        <div className="mt-8">
          <div className="bg-orange-500/10 px-6 py-3 flex items-center justify-between border-y border-orange-500/20">
             <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-orange-400" />
                <h4 className="font-display font-black text-sm uppercase tracking-wider text-orange-400">Bowling Attack</h4>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px] md:min-w-0">
             <thead>
              <tr className="bg-muted/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground border-y border-border">
                <th className="px-6 py-3">Bowler</th>
                <th className="px-4 py-3 text-right">O</th>
                <th className="px-4 py-3 text-right">M</th>
                <th className="px-4 py-3 text-right">R</th>
                <th className="px-4 py-3 text-right">W</th>
                <th className="px-6 py-3 text-right">ECO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bowlers && bowlers.length > 0 ? bowlers.map((b: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 font-bold text-sm text-foreground">{b.name}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-foreground">{formatOvers(b.balls)}</td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">{b.maidens || 0}</td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">{b.runs}</td>
                  <td className="px-4 py-3 text-right font-bold text-sm text-primary">{b.wickets}</td>
                  <td className="px-6 py-3 text-right font-mono text-xs text-muted-foreground">
                    {b.balls > 0 ? ((b.runs / (b.balls / 6))).toFixed(1) : "0.0"}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic text-sm">Waiting for bowlers to start...</td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

