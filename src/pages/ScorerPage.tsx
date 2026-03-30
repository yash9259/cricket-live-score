import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, ArrowRight, HeartCrack, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teams } from "@/lib/mockData";

interface BallLog {
  runs: number;
  type: "normal" | "wide" | "noball" | "wicket" | "four" | "six";
  striker: string;
  bowler: string;
}

interface BatsmanStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

interface BowlerStats {
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
}

const battingTeam = teams[0];
const bowlingTeam = teams[1];
const battingPlayers = battingTeam.players.map((p) => p.name);
const bowlingPlayers = bowlingTeam.players.map((p) => p.name);

type PlayerStatus = "available" | "out" | "retired" | "batting";

export default function ScorerPage() {
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0 });
  const [currentOver, setCurrentOver] = useState<BallLog[]>([]);
  const [allBalls, setAllBalls] = useState<BallLog[]>([]);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [flashClass, setFlashClass] = useState("");
  const [showExtras, setShowExtras] = useState(false);

  const [playerStatuses, setPlayerStatuses] = useState<Record<string, PlayerStatus>>(() => {
    const s: Record<string, PlayerStatus> = {};
    battingPlayers.forEach((name, i) => {
      s[name] = i < 2 ? "batting" : "available";
    });
    return s;
  });

  const [batsmanStats, setBatsmanStats] = useState<Record<string, BatsmanStats>>(() => {
    const s: Record<string, BatsmanStats> = {};
    battingPlayers.forEach((name) => {
      s[name] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
    });
    return s;
  });

  const [bowlerStats, setBowlerStats] = useState<Record<string, BowlerStats>>(() => {
    const s: Record<string, BowlerStats> = {};
    bowlingPlayers.forEach((name) => {
      s[name] = { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
    });
    return s;
  });

  const [striker, setStriker] = useState(battingPlayers[0]);
  const [nonStriker, setNonStriker] = useState(battingPlayers[1]);
  const [bowler, setBowler] = useState(bowlingPlayers[0]);
  const [partnership, setPartnership] = useState({ runs: 0, balls: 0 });

  const totalOvers = 6;

  const availableBatsmen = battingPlayers.filter((n) => playerStatuses[n] === "available");

  const flash = useCallback((cls: string, label: string) => {
    setFlashClass(cls);
    setLastEvent(label);
    setTimeout(() => setFlashClass(""), 800);
  }, []);

  const getStrikeRate = (stats: BatsmanStats) =>
    stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";

  const getEconomy = (stats: BowlerStats) =>
    stats.overs > 0 || stats.balls > 0
      ? (stats.runs / (stats.overs + stats.balls / 6)).toFixed(1)
      : "0.0";

  const getCRR = () => {
    const totalBalls = score.overs * 6 + score.balls;
    return totalBalls > 0 ? ((score.runs / totalBalls) * 6).toFixed(2) : "0.00";
  };

  const handleWicket = () => {
    setPlayerStatuses((prev) => ({ ...prev, [striker]: "out" }));
    setPartnership({ runs: 0, balls: 0 });
    const next = battingPlayers.find((n) => playerStatuses[n] === "available" && n !== striker && n !== nonStriker);
    if (next) {
      setStriker(next);
      setPlayerStatuses((prev) => ({ ...prev, [next]: "batting" }));
    }
  };

  const handleRetiredHurt = (who: "striker" | "nonStriker") => {
    const playerName = who === "striker" ? striker : nonStriker;
    setPlayerStatuses((prev) => ({ ...prev, [playerName]: "retired" }));
    setPartnership({ runs: 0, balls: 0 });
    const next = battingPlayers.find((n) => playerStatuses[n] === "available" && n !== striker && n !== nonStriker);
    if (next) {
      if (who === "striker") setStriker(next);
      else setNonStriker(next);
      setPlayerStatuses((prev) => ({ ...prev, [next]: "batting" }));
    }
  };

  const addBall = (runs: number, type: BallLog["type"] = "normal") => {
    const isExtra = type === "wide" || type === "noball";
    const isWicket = type === "wicket";
    const actualType = runs === 4 && type === "normal" ? "four" : runs === 6 && type === "normal" ? "six" : type;

    const ball: BallLog = { runs, type: actualType, striker, bowler };
    const newBalls = isExtra ? score.balls : score.balls + 1;
    const overComplete = newBalls >= 6;

    const extraRuns = isExtra ? 1 : 0;

    setScore({
      runs: score.runs + runs + extraRuns,
      wickets: score.wickets + (isWicket ? 1 : 0),
      overs: overComplete ? score.overs + 1 : score.overs,
      balls: overComplete ? 0 : newBalls,
      extras: score.extras + extraRuns,
    });

    // Update batsman stats
    if (!isExtra) {
      setBatsmanStats((prev) => ({
        ...prev,
        [striker]: {
          ...prev[striker],
          runs: prev[striker].runs + runs,
          balls: prev[striker].balls + 1,
          fours: prev[striker].fours + (actualType === "four" ? 1 : 0),
          sixes: prev[striker].sixes + (actualType === "six" ? 1 : 0),
        },
      }));
    }

    // Update bowler stats
    const newBowlerBalls = isExtra ? bowlerStats[bowler].balls : bowlerStats[bowler].balls + 1;
    const bowlerOverComplete = newBowlerBalls >= 6;
    setBowlerStats((prev) => ({
      ...prev,
      [bowler]: {
        ...prev[bowler],
        runs: prev[bowler].runs + runs + extraRuns,
        balls: bowlerOverComplete ? 0 : newBowlerBalls,
        overs: bowlerOverComplete ? prev[bowler].overs + 1 : prev[bowler].overs,
        wickets: prev[bowler].wickets + (isWicket ? 1 : 0),
      },
    }));

    // Partnership
    if (!isWicket) {
      setPartnership((prev) => ({
        runs: prev.runs + runs + extraRuns,
        balls: prev.balls + (isExtra ? 0 : 1),
      }));
    }

    if (overComplete) {
      setAllBalls([...allBalls, ...currentOver, ball]);
      setCurrentOver([]);
    } else {
      setCurrentOver([...currentOver, ball]);
    }

    if (isWicket) {
      flash("score-flash-wicket", "WICKET! ❌");
      handleWicket();
    } else if (actualType === "four") {
      flash("score-flash-four", "FOUR! 🏏");
    } else if (actualType === "six") {
      flash("score-flash-six", "SIX! 💥");
    } else {
      flash("", `+${runs + extraRuns}`);
    }

    // Swap strike on odd runs
    if (!isExtra && !isWicket && runs % 2 !== 0) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
    }
    // Swap at end of over
    if (overComplete && !isWicket) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
    }
  };

  const undo = () => {
    if (currentOver.length === 0) return;
    const last = currentOver[currentOver.length - 1];
    const isExtra = last.type === "wide" || last.type === "noball";
    setScore({
      runs: score.runs - last.runs - (isExtra ? 1 : 0),
      wickets: score.wickets - (last.type === "wicket" ? 1 : 0),
      overs: score.overs,
      balls: isExtra ? score.balls : score.balls - 1,
      extras: score.extras - (isExtra ? 1 : 0),
    });
    setCurrentOver(currentOver.slice(0, -1));
  };

  const ballBg = (b: BallLog) => {
    switch (b.type) {
      case "four": return "bg-primary text-primary-foreground";
      case "six": return "bg-neon-yellow text-primary-foreground";
      case "wicket": return "bg-destructive text-destructive-foreground";
      case "wide": case "noball": return "bg-neon-orange text-primary-foreground";
      default: return "bg-muted text-foreground";
    }
  };

  const ballText = (b: BallLog) => {
    if (b.type === "wicket") return "W";
    if (b.type === "wide") return "Wd";
    if (b.type === "noball") return "Nb";
    return String(b.runs);
  };

  const strikerOpts = battingPlayers.filter((n) => n === striker || playerStatuses[n] === "available");
  const nonStrikerOpts = battingPlayers.filter((n) => n === nonStriker || playerStatuses[n] === "available");
  const bs = batsmanStats[striker];
  const bns = batsmanStats[nonStriker];
  const bw = bowlerStats[bowler];

  return (
    <div className="min-h-screen bg-background">
      {/* Top header bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-bold text-destructive uppercase tracking-wider">LIVE</span>
          </div>
          <span className="font-display text-sm font-bold text-foreground">
            {battingTeam.name} vs {bowlingTeam.name}
          </span>
          <span className="text-xs text-muted-foreground">{totalOvers} Ov</span>
        </div>
      </div>

      <div className="container mx-auto max-w-lg px-4">
        {/* Score Header — CricHeroes style */}
        <motion.div className={`py-5 text-center border-b border-border ${flashClass}`}>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-display text-6xl font-bold text-foreground">
              {score.runs}<span className="text-3xl text-muted-foreground">/{score.wickets}</span>
            </span>
            <span className="text-lg text-muted-foreground font-display">
              ({score.overs}.{score.balls}/{totalOvers})
            </span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>CRR: <strong className="text-foreground">{getCRR()}</strong></span>
            <span>Extras: <strong className="text-foreground">{score.extras}</strong></span>
          </div>
          <AnimatePresence>
            {lastEvent && (
              <motion.div
                key={lastEvent + Date.now()}
                initial={{ opacity: 0, scale: 2, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4 }}
                className="mt-2"
              >
                <span className={`inline-block font-display text-xl font-bold px-4 py-1 rounded-full ${
                  lastEvent.includes("SIX") ? "bg-neon-yellow/20 text-neon-yellow" :
                  lastEvent.includes("FOUR") ? "bg-primary/20 text-primary" :
                  lastEvent.includes("WICKET") ? "bg-destructive/20 text-destructive" :
                  "text-muted-foreground"
                }`}>
                  {lastEvent}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Batsmen info — CricHeroes style table */}
        <div className="border-b border-border">
          {/* Striker row */}
          <div className="flex items-center py-3 px-1 bg-primary/5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-primary text-xs">🏏</span>
              <select
                value={striker}
                onChange={(e) => {
                  const next = e.target.value;
                  setPlayerStatuses((prev) => ({ ...prev, [striker]: "available", [next]: "batting" }));
                  setStriker(next);
                }}
                className="bg-transparent text-foreground text-sm font-semibold truncate appearance-none cursor-pointer focus:outline-none min-w-0 max-w-[120px]"
              >
                {strikerOpts.filter((n) => n !== nonStriker).map((n) => (
                  <option key={n} value={n} className="bg-card text-foreground">{n}</option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-5 text-sm shrink-0">
              <span className="font-display font-bold text-foreground w-8 text-right">{bs.runs}</span>
              <span className="text-muted-foreground w-8 text-right">({bs.balls})</span>
              <span className="text-muted-foreground text-xs w-8 text-right">{bs.fours}×4</span>
              <span className="text-muted-foreground text-xs w-8 text-right">{bs.sixes}×6</span>
              <span className="text-xs text-primary font-semibold w-12 text-right">SR {getStrikeRate(bs)}</span>
            </div>
          </div>

          {/* Non-striker row */}
          <div className="flex items-center py-3 px-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-muted-foreground text-xs">○</span>
              <select
                value={nonStriker}
                onChange={(e) => {
                  const next = e.target.value;
                  setPlayerStatuses((prev) => ({ ...prev, [nonStriker]: "available", [next]: "batting" }));
                  setNonStriker(next);
                }}
                className="bg-transparent text-foreground text-sm truncate appearance-none cursor-pointer focus:outline-none min-w-0 max-w-[120px]"
              >
                {nonStrikerOpts.filter((n) => n !== striker).map((n) => (
                  <option key={n} value={n} className="bg-card text-foreground">{n}</option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-5 text-sm shrink-0">
              <span className="font-display font-bold text-foreground w-8 text-right">{bns.runs}</span>
              <span className="text-muted-foreground w-8 text-right">({bns.balls})</span>
              <span className="text-muted-foreground text-xs w-8 text-right">{bns.fours}×4</span>
              <span className="text-muted-foreground text-xs w-8 text-right">{bns.sixes}×6</span>
              <span className="text-xs text-muted-foreground font-semibold w-12 text-right">SR {getStrikeRate(bns)}</span>
            </div>
          </div>

          {/* Partnership */}
          <div className="flex items-center justify-between px-1 py-2 text-xs text-muted-foreground border-t border-border/50 bg-muted/20">
            <span>Partnership: <strong className="text-foreground">{partnership.runs}</strong> ({partnership.balls})</span>
            <div className="flex gap-1">
              <button onClick={() => handleRetiredHurt("striker")} disabled={availableBatsmen.length === 0}
                className="px-2 py-0.5 rounded text-neon-yellow border border-neon-yellow/30 hover:bg-neon-yellow/10 disabled:opacity-30 transition-colors">
                <HeartCrack className="h-3 w-3 inline mr-1" />Retire Striker
              </button>
              <button onClick={() => handleRetiredHurt("nonStriker")} disabled={availableBatsmen.length === 0}
                className="px-2 py-0.5 rounded text-neon-yellow border border-neon-yellow/30 hover:bg-neon-yellow/10 disabled:opacity-30 transition-colors">
                <HeartCrack className="h-3 w-3 inline mr-1" />Retire NS
              </button>
            </div>
          </div>
        </div>

        {/* Bowler */}
        <div className="flex items-center py-3 px-1 border-b border-border">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-neon-orange text-xs">🎯</span>
            <select
              value={bowler}
              onChange={(e) => setBowler(e.target.value)}
              className="bg-transparent text-foreground text-sm font-semibold truncate appearance-none cursor-pointer focus:outline-none min-w-0 max-w-[120px]"
            >
              {bowlingPlayers.map((n) => (
                <option key={n} value={n} className="bg-card text-foreground">{n}</option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
          <div className="flex items-center gap-5 text-sm shrink-0">
            <span className="text-muted-foreground w-10 text-right">{bw.overs}.{bw.balls} ov</span>
            <span className="text-muted-foreground w-8 text-right">{bw.runs}r</span>
            <span className="font-display font-bold text-foreground w-8 text-right">{bw.wickets}w</span>
            <span className="text-xs text-neon-orange font-semibold w-12 text-right">Eco {getEconomy(bw)}</span>
          </div>
        </div>

        {/* This Over — inline */}
        <div className="py-3 px-1 border-b border-border flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">This Over:</span>
          <div className="flex gap-1.5 flex-wrap">
            {currentOver.map((b, i) => (
              <span key={i} className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${ballBg(b)}`}>
                {ballText(b)}
              </span>
            ))}
            {currentOver.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>

        {/* Player status strip */}
        <div className="py-2 px-1 border-b border-border overflow-x-auto">
          <div className="flex gap-1">
            {battingPlayers.map((name) => {
              const status = playerStatuses[name];
              const colors =
                status === "batting" ? "bg-primary/15 text-primary border-primary/20" :
                status === "out" ? "bg-destructive/10 text-destructive/50 border-destructive/10 line-through" :
                status === "retired" ? "bg-neon-yellow/10 text-neon-yellow/60 border-neon-yellow/10" :
                "bg-transparent text-muted-foreground/50 border-border/50";
              return (
                <span key={name} className={`text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap ${colors}`}>
                  {name.split(" ")[0]}
                  {status === "out" && " ✕"}
                  {status === "retired" && " ⚕"}
                </span>
              );
            })}
          </div>
        </div>

        {/* Scoring buttons — CricHeroes circular style */}
        <div className="py-6 space-y-4">
          {/* Run buttons — large circles */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((r) => (
              <button
                key={r}
                onClick={() => addBall(r)}
                className="w-14 h-14 rounded-full border-2 border-border bg-card text-foreground font-display text-xl font-bold hover:bg-muted hover:border-primary/40 active:scale-95 transition-all"
              >
                {r}
              </button>
            ))}
          </div>

          {/* 4 and 6 — colored circles */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => addBall(4)}
              className="w-16 h-16 rounded-full bg-primary/15 text-primary border-2 border-primary/40 font-display text-2xl font-bold hover:bg-primary/25 active:scale-95 transition-all animate-pulse-glow"
            >
              4
            </button>
            <button
              onClick={() => addBall(6)}
              className="w-16 h-16 rounded-full bg-neon-yellow/15 text-neon-yellow border-2 border-neon-yellow/40 font-display text-2xl font-bold hover:bg-neon-yellow/25 active:scale-95 transition-all"
            >
              6
            </button>
          </div>

          {/* Wicket — big red button */}
          <div className="flex justify-center">
            <button
              onClick={() => addBall(0, "wicket")}
              className="px-8 py-3 rounded-full bg-destructive/15 text-destructive border-2 border-destructive/40 font-display text-lg font-bold uppercase tracking-wider hover:bg-destructive/25 active:scale-95 transition-all"
            >
              Wicket
            </button>
          </div>

          {/* Extras toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowExtras(!showExtras)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showExtras ? "Hide Extras ▲" : "Extras ▼"}
            </button>
          </div>

          <AnimatePresence>
            {showExtras && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex justify-center gap-3">
                  <button onClick={() => addBall(0, "wide")}
                    className="px-5 py-2.5 rounded-full border border-neon-orange/40 text-neon-orange text-sm font-semibold hover:bg-neon-orange/10 active:scale-95 transition-all">
                    Wide
                  </button>
                  <button onClick={() => addBall(0, "noball")}
                    className="px-5 py-2.5 rounded-full border border-neon-orange/40 text-neon-orange text-sm font-semibold hover:bg-neon-orange/10 active:scale-95 transition-all">
                    No Ball
                  </button>
                  <button onClick={() => addBall(1, "wide")}
                    className="px-5 py-2.5 rounded-full border border-neon-orange/20 text-neon-orange/70 text-sm font-semibold hover:bg-neon-orange/10 active:scale-95 transition-all">
                    Wd+1
                  </button>
                  <button onClick={() => addBall(1, "noball")}
                    className="px-5 py-2.5 rounded-full border border-neon-orange/20 text-neon-orange/70 text-sm font-semibold hover:bg-neon-orange/10 active:scale-95 transition-all">
                    Nb+1
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 pb-8">
          <Button onClick={undo} variant="outline" size="sm" className="flex-1 border-border text-muted-foreground hover:text-foreground">
            <Undo2 className="h-4 w-4 mr-1.5" /> Undo
          </Button>
          <Button variant="outline" size="sm" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10">
            <ArrowRight className="h-4 w-4 mr-1.5" /> End Innings
          </Button>
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
