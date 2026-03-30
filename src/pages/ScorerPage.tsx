import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, ArrowRight, HeartCrack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teams } from "@/lib/mockData";

interface BallLog {
  runs: number;
  type: "normal" | "wide" | "noball" | "wicket" | "four" | "six";
  striker: string;
  bowler: string;
}

// Pick two teams for the match
const battingTeam = teams[0];
const bowlingTeam = teams[1];
const battingPlayers = battingTeam.players.map((p) => p.name);
const bowlingPlayers = bowlingTeam.players.map((p) => p.name);

type PlayerStatus = "available" | "out" | "retired" | "batting";

export default function ScorerPage() {
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: 0, balls: 0 });
  const [currentOver, setCurrentOver] = useState<BallLog[]>([]);
  const [allOvers, setAllOvers] = useState<BallLog[]>([]);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [flashClass, setFlashClass] = useState("");

  // Player statuses
  const [playerStatuses, setPlayerStatuses] = useState<Record<string, PlayerStatus>>(() => {
    const s: Record<string, PlayerStatus> = {};
    battingPlayers.forEach((name, i) => {
      s[name] = i === 0 ? "batting" : i === 1 ? "batting" : "available";
    });
    return s;
  });

  // Currently selected batsmen & bowler
  const [striker, setStriker] = useState(battingPlayers[0]);
  const [nonStriker, setNonStriker] = useState(battingPlayers[1]);
  const [bowler, setBowler] = useState(bowlingPlayers[0]);

  const totalOvers = 6;

  // Available batsmen for replacement (not out, not retired, not already batting)
  const availableBatsmen = battingPlayers.filter(
    (name) => playerStatuses[name] === "available"
  );

  const flash = useCallback((cls: string, label: string) => {
    setFlashClass(cls);
    setLastEvent(label);
    setTimeout(() => setFlashClass(""), 800);
  }, []);

  // When a wicket falls, mark striker as out and prompt new batsman
  const handleWicket = () => {
    setPlayerStatuses((prev) => ({ ...prev, [striker]: "out" }));
    // Auto-select next available batsman
    const next = battingPlayers.find((name) => playerStatuses[name] === "available" && name !== striker && name !== nonStriker);
    if (next) {
      setStriker(next);
      setPlayerStatuses((prev) => ({ ...prev, [next]: "batting" }));
    }
  };

  // Retired hurt
  const handleRetiredHurt = (who: "striker" | "nonStriker") => {
    const playerName = who === "striker" ? striker : nonStriker;
    setPlayerStatuses((prev) => ({ ...prev, [playerName]: "retired" }));

    const next = battingPlayers.find(
      (name) => playerStatuses[name] === "available" && name !== striker && name !== nonStriker
    );
    if (next) {
      if (who === "striker") setStriker(next);
      else setNonStriker(next);
      setPlayerStatuses((prev) => ({ ...prev, [next]: "batting" }));
    }
  };

  // Swap strike on odd runs or end of over
  const swapStrike = (runs: number, overComplete: boolean) => {
    const oddRuns = runs % 2 !== 0;
    if ((oddRuns && !overComplete) || (!oddRuns && overComplete) || (oddRuns && overComplete)) {
      // Only swap if exactly one of (odd, overComplete) is true
    }
    // Simple: swap on odd runs
    if (runs % 2 !== 0) {
      setStriker(nonStriker);
      setNonStriker(striker);
    }
    // Swap at end of over
    if (overComplete) {
      setStriker((prev) => {
        const ns = nonStriker;
        setNonStriker(prev);
        return ns;
      });
    }
  };

  const addBall = (runs: number, type: BallLog["type"] = "normal") => {
    const isExtra = type === "wide" || type === "noball";
    const isWicket = type === "wicket";
    const actualType = runs === 4 && type === "normal" ? "four" : runs === 6 && type === "normal" ? "six" : type;

    const ball: BallLog = { runs, type: actualType, striker, bowler };
    const newBalls = isExtra ? score.balls : score.balls + 1;
    const overComplete = newBalls >= 6;

    setScore({
      runs: score.runs + runs + (isExtra ? 1 : 0),
      wickets: score.wickets + (isWicket ? 1 : 0),
      overs: overComplete ? score.overs + 1 : score.overs,
      balls: overComplete ? 0 : newBalls,
    });

    if (overComplete) {
      setAllOvers([...allOvers, ...currentOver, ball]);
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
      flash("", `+${runs + (isExtra ? 1 : 0)}`);
    }

    // Swap strike on odd runs (non-extra, non-wicket)
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
    });
    setCurrentOver(currentOver.slice(0, -1));
  };

  const ballBgColor = (b: BallLog) => {
    switch (b.type) {
      case "four": return "bg-primary text-primary-foreground";
      case "six": return "bg-neon-yellow text-primary-foreground";
      case "wicket": return "bg-destructive text-destructive-foreground";
      case "wide": case "noball": return "bg-neon-orange text-primary-foreground";
      default: return "bg-muted text-foreground";
    }
  };

  const ballLabelText = (b: BallLog) => {
    if (b.type === "wicket") return "W";
    if (b.type === "wide") return "WD";
    if (b.type === "noball") return "NB";
    return String(b.runs);
  };

  // Options for striker select: current striker stays, plus available batsmen
  const strikerOptions = battingPlayers.filter(
    (name) => name === striker || playerStatuses[name] === "available"
  );
  const nonStrikerOptions = battingPlayers.filter(
    (name) => name === nonStriker || playerStatuses[name] === "available"
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="font-display text-3xl font-bold text-foreground mb-6 text-center">Scorer Panel</h1>

      {/* Score display */}
      <motion.div className={`rounded-xl border border-border bg-card p-6 text-center mb-6 ${flashClass}`}>
        <p className="text-sm text-muted-foreground mb-1">{battingTeam.name} vs {bowlingTeam.name}</p>
        <p className="font-display text-6xl font-bold text-primary neon-text-green">
          {score.runs}<span className="text-3xl text-muted-foreground">/{score.wickets}</span>
        </p>
        <p className="text-muted-foreground mt-1">Overs: {score.overs}.{score.balls} / {totalOvers}</p>

        <AnimatePresence>
          {lastEvent && (
            <motion.p
              key={lastEvent + Date.now()}
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-2xl font-bold text-neon-yellow mt-2"
            >
              {lastEvent}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Batsmen & Bowler selectors */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        {/* Striker */}
        <div className="rounded-lg bg-card border border-primary/30 p-3">
          <p className="text-xs text-primary font-semibold mb-1.5">🏏 Striker</p>
          <select
            value={striker}
            onChange={(e) => {
              const newStriker = e.target.value;
              // If selecting someone who was "available", mark them batting
              setPlayerStatuses((prev) => ({
                ...prev,
                [striker]: "available", // release old
                [newStriker]: "batting",
              }));
              setStriker(newStriker);
            }}
            className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {strikerOptions.filter((n) => n !== nonStriker).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Non-Striker */}
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground font-semibold mb-1.5">Non-Striker</p>
          <select
            value={nonStriker}
            onChange={(e) => {
              const newNS = e.target.value;
              setPlayerStatuses((prev) => ({
                ...prev,
                [nonStriker]: "available",
                [newNS]: "batting",
              }));
              setNonStriker(newNS);
            }}
            className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {nonStrikerOptions.filter((n) => n !== striker).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Bowler */}
        <div className="rounded-lg bg-card border border-neon-orange/30 p-3">
          <p className="text-xs text-neon-orange font-semibold mb-1.5">🎯 Bowler</p>
          <select
            value={bowler}
            onChange={(e) => setBowler(e.target.value)}
            className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {bowlingPlayers.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Retired Hurt buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => handleRetiredHurt("striker")}
          variant="outline"
          size="sm"
          disabled={availableBatsmen.length === 0}
          className="border-neon-yellow/30 text-neon-yellow hover:bg-neon-yellow/10 text-xs"
        >
          <HeartCrack className="h-3.5 w-3.5 mr-1.5" /> Striker Retired Hurt
        </Button>
        <Button
          onClick={() => handleRetiredHurt("nonStriker")}
          variant="outline"
          size="sm"
          disabled={availableBatsmen.length === 0}
          className="border-neon-yellow/30 text-neon-yellow hover:bg-neon-yellow/10 text-xs"
        >
          <HeartCrack className="h-3.5 w-3.5 mr-1.5" /> Non-Striker Retired
        </Button>
      </div>

      {/* Player status indicators */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {battingPlayers.map((name) => {
          const status = playerStatuses[name];
          const colors =
            status === "batting" ? "bg-primary/20 text-primary border-primary/30" :
            status === "out" ? "bg-destructive/15 text-destructive/60 border-destructive/20 line-through" :
            status === "retired" ? "bg-neon-yellow/15 text-neon-yellow/60 border-neon-yellow/20" :
            "bg-muted/50 text-muted-foreground border-border";
          return (
            <span key={name} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors}`}>
              {name.split(" ")[0]}
              {status === "out" && " ❌"}
              {status === "retired" && " 🤕"}
              {status === "batting" && " 🏏"}
            </span>
          );
        })}
      </div>

      {/* Current over */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-2">This Over</p>
        <div className="flex gap-2 flex-wrap min-h-[40px]">
          {currentOver.map((b, i) => (
            <span key={i} className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${ballBgColor(b)}`}>
              {ballLabelText(b)}
            </span>
          ))}
          {currentOver.length === 0 && <span className="text-muted-foreground text-sm">—</span>}
        </div>
      </div>

      {/* Run buttons */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[0, 1, 2, 3].map((r) => (
          <Button key={r} onClick={() => addBall(r)} size="lg" variant="outline"
            className="font-display text-2xl h-16 border-border text-foreground hover:bg-muted hover:text-foreground">
            {r}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button onClick={() => addBall(4)} size="lg"
          className="font-display text-2xl h-16 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
          4
        </Button>
        <Button onClick={() => addBall(6)} size="lg"
          className="font-display text-2xl h-16 bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30 hover:bg-neon-yellow/30">
          6
        </Button>
      </div>

      {/* Extras & Wicket */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Button onClick={() => addBall(0, "wide")} variant="outline" className="border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10">Wide</Button>
        <Button onClick={() => addBall(0, "noball")} variant="outline" className="border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10">No Ball</Button>
        <Button onClick={() => addBall(0, "wicket")} className="bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30">Wicket</Button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={undo} variant="outline" className="border-border text-muted-foreground hover:text-foreground">
          <Undo2 className="h-4 w-4 mr-2" /> Undo
        </Button>
        <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
          <ArrowRight className="h-4 w-4 mr-2" /> End Innings
        </Button>
      </div>
    </div>
  );
}
