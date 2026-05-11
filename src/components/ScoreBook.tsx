import { motion } from "framer-motion";
import { History, ChevronDown, ChevronUp, Users, Trophy, Activity } from "lucide-react";
import { useState } from "react";

interface DetailedBall {
  over: number;
  ball: number;
  runs: number;
  extraRuns?: number;
  isWicket: boolean;
  bowler: string;
  batsman: string;
  event: string;
  inning: number;
  timestamp: number;
}

interface ScoreBookProps {
  history: DetailedBall[];
  inning1Team?: string;
  inning2Team?: string;
  batsmenInning1?: any[];
  bowlersInning1?: any[];
  batsmenInning2?: any[];
  bowlersInning2?: any[];
}

export function ScoreBook({ 
  history, 
  inning1Team, 
  inning2Team,
  batsmenInning1 = [],
  bowlersInning1 = [],
  batsmenInning2 = [],
  bowlersInning2 = []
}: ScoreBookProps) {
  const [expandedInnings, setExpandedInnings] = useState<number[]>([1, 2]);

  const toggleInning = (inn: number) => {
    setExpandedInnings(prev => 
      prev.includes(inn) ? prev.filter(i => i !== inn) : [...prev, inn]
    );
  };

  const groupBallsByOverForBowler = (balls: DetailedBall[], bowlerName: string) => {
    const bowlerBalls = balls.filter(b => b.bowler === bowlerName);
    const overs: DetailedBall[][] = [];
    let currentOver: DetailedBall[] = [];
    
    // Sort balls by timestamp to ensure chronological order
    const sortedBalls = [...bowlerBalls].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedBalls.forEach((ball, idx) => {
        currentOver.push(ball);
        // In box cricket, we consider 6 legal balls an over or whatever logic is used.
        // But here we can just group by the 'over' index stored in the ball.
    });

    const grouped: Record<number, DetailedBall[]> = {};
    sortedBalls.forEach(b => {
        if (!grouped[b.over]) grouped[b.over] = [];
        grouped[b.over].push(b);
    });

    return Object.values(grouped);
  };

  const getFallOfWickets = (balls: DetailedBall[]) => {
    const fows: { wkt: number, score: number, over: number, ball: number, batsman: string }[] = [];
    let currentScore = 0;
    let wktCount = 0;
    
    balls.sort((a, b) => a.timestamp - b.timestamp).forEach(ball => {
      currentScore += ball.runs;
      if (ball.isWicket) {
        wktCount++;
        fows.push({
          wkt: wktCount,
          score: currentScore,
          over: ball.over,
          ball: ball.ball,
          batsman: ball.batsman
        });
      }
    });
    return fows;
  };

  const getExtras = (balls: DetailedBall[]) => {
    let wide = 0, noball = 0, others = 0;
    balls.forEach(b => {
        if (b.event.includes("WIDE")) wide += (b.extraRuns || 0);
        else if (b.event.includes("NB") || b.event.includes("NO BALL")) noball += (b.extraRuns || 0);
        else if (b.extraRuns) others += b.extraRuns;
    });
    return { wide, noball, others };
  };

  const InningView = ({ 
    innNumber, 
    teamName, 
    balls, 
    batsmen, 
    bowlers 
  }: { 
    innNumber: number, 
    teamName?: string, 
    balls: DetailedBall[],
    batsmen: any[],
    bowlers: any[]
  }) => {
    const isExpanded = expandedInnings.includes(innNumber);
    const fows = getFallOfWickets(balls);
    const extras = getExtras(balls);
    const totalRuns = balls.reduce((acc, b) => acc + b.runs, 0);
    const totalWickets = balls.filter(b => b.isWicket).length;

    if (balls.length === 0 && batsmen.length === 0) return null;

    return (
      <div className="space-y-4 border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
        <button 
          onClick={() => toggleInning(innNumber)}
          className={`w-full flex items-center justify-between p-4 transition-colors ${innNumber === 1 ? 'bg-primary/5' : 'bg-secondary/5'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black ${innNumber === 1 ? 'bg-primary' : 'bg-secondary'}`}>
              {innNumber}
            </div>
            <div className="text-left">
              <h3 className="font-display font-black uppercase tracking-tight text-lg">{teamName || `Inning ${innNumber}`}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Match Scorecard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <span className="text-2xl font-display font-black">{totalRuns}/{totalWickets}</span>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </button>

        {isExpanded && (
          <div className="p-2 sm:p-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* BATSMEN TABLE */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                 <Users className="w-4 h-4" />
                 <h4 className="text-xs font-black uppercase tracking-widest">Batsmen</h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="px-4 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3">Batsman</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center w-16">Runs</th>
                      <th className="px-4 py-3 text-center w-16">Balls</th>
                      <th className="px-4 py-3 text-center w-12 text-primary">4s</th>
                      <th className="px-4 py-3 text-center w-12 text-primary">6s</th>
                      <th className="px-4 py-3 text-center w-16 bg-primary/10 text-primary">Points</th>
                    </tr>
                  </thead>

                  <tbody className="text-sm">
                    {batsmen.map((b, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 font-bold">{b.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                            {b.isOut ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                    b {balls.find(bl => bl.batsman === b.name && bl.isWicket)?.bowler || "Bowler"}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-green-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Not Out
                                </span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-center font-display font-black text-lg">{b.runs}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{b.balls}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{balls.filter(bl => bl.batsman === b.name && bl.event.includes("4")).length}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{balls.filter(bl => bl.batsman === b.name && bl.event.includes("6")).length}</td>
                        <td className="px-4 py-3 text-center font-black text-primary bg-primary/5">
                          {b.runs + 
                           (balls.filter(bl => bl.batsman === b.name && bl.event.includes("4")).length * 2) + 
                           (balls.filter(bl => bl.batsman === b.name && bl.event.includes("6")).length * 4)}
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            </div>

            {/* FALL OF WICKETS & EXTRAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-destructive">
                    <Activity className="w-4 h-4" />
                    <h4 className="text-xs font-black uppercase tracking-widest">Fall of Wickets</h4>
                 </div>
                 <div className="p-4 rounded-xl border border-border bg-muted/10 grid grid-cols-2 gap-4">
                    {fows.map((f, i) => (
                        <div key={i} className="flex flex-col border-l-2 border-destructive/30 pl-3">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Wkt {f.wkt}</span>
                            <span className="font-bold text-sm">{f.score}-{f.wkt} <span className="text-[10px] text-muted-foreground font-normal">({f.over}.{f.ball})</span></span>
                            <span className="text-[9px] text-muted-foreground truncate">{f.batsman}</span>
                        </div>
                    ))}
                    {fows.length === 0 && <p className="col-span-2 text-xs text-muted-foreground italic text-center py-2">No wickets fallen yet</p>}
                 </div>
               </div>

               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-yellow-500">
                    <Trophy className="w-4 h-4" />
                    <h4 className="text-xs font-black uppercase tracking-widest">Extras & Totals</h4>
                 </div>
                 <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold">Wides</span>
                        <span className="font-mono font-black">{extras.wide}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold">No Balls</span>
                        <span className="font-mono font-black">{extras.noball}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold">Others</span>
                        <span className="font-mono font-black">{extras.others}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">Total Score</span>
                        <span className="text-xl font-display font-black">{totalRuns}/{totalWickets}</span>
                    </div>
                 </div>
               </div>
            </div>

            {/* BOWLER ANALYSIS TABLE */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-neon-orange">
                 <Activity className="w-4 h-4" />
                 <h4 className="text-xs font-black uppercase tracking-widest">Bowler Analysis</h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="px-4 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3">Bowler</th>
                      <th className="px-4 py-3">Over Analysis</th>
                      <th className="px-4 py-3 text-center w-12">O</th>
                      <th className="px-4 py-3 text-center w-12">M</th>
                      <th className="px-4 py-3 text-center w-12">R</th>
                      <th className="px-4 py-3 text-center w-12 text-destructive">W</th>
                      <th className="px-4 py-3 text-center w-16 bg-primary/10 text-primary">Points</th>
                    </tr>
                  </thead>

                  <tbody className="text-sm">
                    {bowlers.map((bw, i) => {
                      const bowlerOvers = groupBallsByOverForBowler(balls, bw.name);
                      return (
                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-3 font-bold text-neon-orange">{bw.name}</td>
                          <td className="px-4 py-3">
                             <div className="flex flex-wrap gap-1">
                                {bowlerOvers.map((ov, oidx) => (
                                    <div key={oidx} className="flex gap-0.5 border border-border/50 rounded p-0.5 bg-muted/10">
                                        {ov.map((bl, bidx) => (
                                            <div 
                                                key={bidx} 
                                                className={`w-5 h-5 rounded-sm flex items-center justify-center text-[8px] font-black
                                                    ${bl.isWicket ? 'bg-destructive text-white' : 
                                                      bl.event.includes('4') || bl.event.includes('6') ? 'bg-primary text-white' : 
                                                      'bg-background border border-border text-foreground'}
                                                `}
                                            >
                                                {bl.event.replace('+', '').replace('⚡', '').substring(0, 2)}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                             </div>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-xs">{Math.floor(bw.balls / 6)}.{bw.balls % 6}</td>
                          <td className="px-4 py-3 text-center font-mono text-xs">{bw.maidens || 0}</td>
                          <td className="px-4 py-3 text-center font-display font-bold">{bw.runs}</td>
                          <td className="px-4 py-3 text-center font-display font-black text-destructive">{bw.wickets}</td>
                          <td className="px-4 py-3 text-center font-black text-primary bg-primary/5">
                            {(bw.wickets * 20) + ((bw.maidens || 0) * 15)}
                          </td>
                        </tr>
                      );

                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const inning1Balls = history.filter(b => b.inning === 1);
  const inning2Balls = history.filter(b => b.inning === 2);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <History className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-black uppercase italic tracking-tight">Match Score Book</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Detailed Match Analysis</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <InningView 
            innNumber={1} 
            teamName={inning1Team} 
            balls={inning1Balls} 
            batsmen={batsmenInning1} 
            bowlers={bowlersInning1} 
        />
        <InningView 
            innNumber={2} 
            teamName={inning2Team} 
            balls={inning2Balls} 
            batsmen={batsmenInning2} 
            bowlers={bowlersInning2} 
        />
        
        {history.length === 0 && batsmenInning1.length === 0 && (
          <div className="text-center py-20 rounded-[2.5rem] border-2 border-dashed border-border bg-muted/10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                <History className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">No match data recorded yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start scoring to see the detailed score book</p>
          </div>
        )}
      </div>
    </div>
  );
}
