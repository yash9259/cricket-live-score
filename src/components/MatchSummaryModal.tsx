import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Trophy, Users, Edit2 } from "lucide-react";

interface BatsmanStat {
  name: string;
  runs: number;
  balls: number;
  isOut: boolean;
  fours?: number;
  sixes?: number;
  points?: number;
}

interface BowlerStat {
  name: string;
  runs: number;
  wickets: number;
  balls: number;
  maidens?: number;
  points?: number;
}

interface MatchSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenamePlayer?: (name: string) => void;
  data: {
    battingTeam: string;
    bowlingTeam: string;
    inning: number;
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    target?: number;
    firstInningScore?: { runs: number; wickets: number; overs: number; balls: number };
    batsmenInning1: BatsmanStat[];
    bowlersInning1: BowlerStat[];
    batsmenInning2: BatsmanStat[];
    bowlersInning2: BowlerStat[];
  };
}

export function MatchSummaryModal({ isOpen, onClose, data, onRenamePlayer }: MatchSummaryModalProps) {
  const formatOvers = (totalBalls: number) => {
    const ov = Math.floor(totalBalls / 6);
    const bl = totalBalls % 6;
    return `${ov}.${bl}`;
  };

  const getResult = () => {
    if (data.inning === 1) return "1st Inning in progress...";
    if (data.runs >= (data.target || 0)) {
      return `${data.battingTeam} WON BY ${6 - data.wickets} WICKETS`;
    }
    const target = data.target || 0;
    const isMatchOver = data.overs === 6 || data.wickets === 6;
    
    if (isMatchOver) {
        if (data.runs < target - 1) {
            return `${data.bowlingTeam} WON BY ${target - data.runs - 1} RUNS`;
        }
        if (data.runs === target - 1) return "MATCH TIED!";
    }
    
    return "2nd Inning in progress...";
  };

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
    batsmen: BatsmanStat[], 
    bowlers: BowlerStat[],
    isActive: boolean
  }) => (
    <div className={`space-y-3 rounded-xl overflow-hidden border ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
      <div className={`px-4 py-2 flex justify-between items-center ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg uppercase tracking-wider">{teamName || "TBD"}</h3>
        </div>
        <div className="text-right">
          <span className="font-display font-black text-xl text-primary">{runs}-{wickets}</span>
          <span className="text-sm text-muted-foreground ml-2">({overs}.{balls} Overs)</span>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Batsmen Table */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1">
            <span>Batsman</span>
            <div className="flex gap-4">
              <span className="w-8 text-right">R</span>
              <span className="w-8 text-right">B</span>
              <span className="w-8 text-right">Pts</span>
            </div>
          </div>
          <div className="space-y-1">
            {batsmen && batsmen.length > 0 ? batsmen.map((b, i) => (
              <div key={i} className="flex justify-between text-sm items-center py-1 border-b border-border/30 last:border-0">
                <span className={`font-medium flex items-center gap-2 ${b.isOut ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {b.name}
                    {onRenamePlayer && (
                      <button 
                        onClick={() => onRenamePlayer(b.name)}
                        className="p-1 hover:bg-primary/20 rounded transition-colors no-underline"
                        title="Rename Player"
                      >
                        <Edit2 className="h-3 w-3 text-primary" />
                      </button>
                    )}
                </span>
                <div className="flex gap-4 font-mono">
                  <span className="w-8 text-right font-bold">{b.runs}</span>
                  <span className="w-8 text-right text-muted-foreground">{b.balls}</span>
                  <span className="w-8 text-right text-primary">
                    {b.runs + ((b.fours || 0) * 2) + ((b.sixes || 0) * 4)}
                  </span>
                </div>
              </div>
            )) : <p className="text-xs text-muted-foreground italic">No batting data yet</p>}
          </div>
        </div>

        {/* Bowlers Table */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-1">
            <span>Bowler</span>
            <div className="flex gap-4">
              <span className="w-12 text-right">W-R</span>
              <span className="w-8 text-right">O</span>
              <span className="w-8 text-right">Pts</span>
            </div>
          </div>
          <div className="space-y-1">
            {bowlers && bowlers.length > 0 ? bowlers.map((b, i) => (
              <div key={i} className="flex justify-between text-sm items-center py-1 border-b border-border/30 last:border-0">
                <span className="font-medium flex items-center gap-2">
                  {b.name}
                  {onRenamePlayer && (
                    <button 
                      onClick={() => onRenamePlayer(b.name)}
                      className="p-1 hover:bg-primary/20 rounded transition-colors"
                      title="Rename Player"
                    >
                      <Edit2 className="h-3 w-3 text-primary" />
                    </button>
                  )}
                </span>
                <div className="flex gap-4 font-mono">
                  <span className="w-12 text-right font-bold text-neon-orange">{b.wickets}-{b.runs}</span>
                  <span className="w-8 text-right text-muted-foreground">{formatOvers(b.balls)}</span>
                  <span className="w-8 text-right text-primary">
                    {(b.wickets * 20) + ((b.maidens || 0) * 15)}
                  </span>
                </div>
              </div>
            )) : <p className="text-xs text-muted-foreground italic">No bowling data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 text-slate-50 border-primary/30 shadow-[0_0_50px_rgba(var(--primary),0.2)]">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl font-black italic tracking-tighter uppercase border-b border-primary/20 pb-4">
            Match Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Inning 1 Section */}
          <InningSection 
            teamName={data.inning === 1 ? data.battingTeam : data.bowlingTeam}
            runs={data.inning === 1 ? data.runs : (data.firstInningScore?.runs || 0)}
            wickets={data.inning === 1 ? data.wickets : (data.firstInningScore?.wickets || 0)}
            overs={data.inning === 1 ? data.overs : (data.firstInningScore?.overs || 0)}
            balls={data.inning === 1 ? data.balls : (data.firstInningScore?.balls || 0)}
            batsmen={data.batsmenInning1}
            bowlers={data.bowlersInning1}
            isActive={data.inning === 1}
          />

          {/* Inning 2 Section (if applicable) */}
          {(data.inning === 2 || data.firstInningScore) && (
            <InningSection 
              teamName={data.inning === 2 ? data.battingTeam : data.bowlingTeam}
              runs={data.inning === 2 ? data.runs : 0}
              wickets={data.inning === 2 ? data.wickets : 0}
              overs={data.inning === 2 ? data.overs : 0}
              balls={data.inning === 2 ? data.balls : 0}
              batsmen={data.batsmenInning2}
              bowlers={data.bowlersInning2}
              isActive={data.inning === 2}
            />
          )}

          {/* Match Result Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 p-4 rounded-xl text-center border border-primary/30"
          >
            <div className="flex items-center justify-center gap-3 mb-1">
              <Trophy className="w-6 h-6 text-neon-yellow animate-pulse" />
              <p className="text-xl font-display font-black tracking-widest uppercase italic text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                {getResult()}
              </p>
            </div>
            {data.target && data.inning === 2 && data.runs < data.target && (
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
                    NEED {data.target - data.runs} RUNS FROM {36 - (data.overs * 6 + data.balls)} BALLS
                </p>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
