import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BallLog {
  runs: number;
  type: "normal" | "wide" | "noball" | "wicket" | "four" | "six";
}

export default function ScorerPage() {
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: 0, balls: 0 });
  const [currentOver, setCurrentOver] = useState<BallLog[]>([]);
  const [allOvers, setAllOvers] = useState<BallLog[]>([]);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [flashClass, setFlashClass] = useState("");

  const totalOvers = 6;
  const striker = "Raj Patel";
  const nonStriker = "Dev Mehta";
  const bowler = "Amit Thakkar";

  const flash = (cls: string, label: string) => {
    setFlashClass(cls);
    setLastEvent(label);
    setTimeout(() => setFlashClass(""), 800);
  };

  const addBall = (runs: number, type: BallLog["type"] = "normal") => {
    const isExtra = type === "wide" || type === "noball";
    const isWicket = type === "wicket";
    const actualType = runs === 4 && type === "normal" ? "four" : runs === 6 && type === "normal" ? "six" : type;

    const ball: BallLog = { runs, type: actualType };
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

    if (actualType === "four") flash("score-flash-four", "FOUR! 🏏");
    else if (actualType === "six") flash("score-flash-six", "SIX! 💥");
    else if (isWicket) flash("score-flash-wicket", "WICKET! ❌");
    else flash("", `+${runs + (isExtra ? 1 : 0)}`);
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

  const ballLabel = (b: BallLog) => {
    if (b.type === "wicket") return "W";
    if (b.type === "wide") return "WD";
    if (b.type === "noball") return "NB";
    return String(b.runs);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="font-display text-3xl font-bold text-foreground mb-6 text-center">Scorer Panel</h1>

      {/* Score display */}
      <motion.div className={`rounded-xl border border-border bg-card p-6 text-center mb-6 ${flashClass}`}>
        <p className="text-sm text-muted-foreground mb-1">Thunder Strikers vs Royal Warriors</p>
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

      {/* Batsmen & Bowler */}
      <div className="grid grid-cols-3 gap-3 mb-6 text-center text-sm">
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Striker</p>
          <p className="font-semibold text-foreground truncate">{striker}</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Non-Striker</p>
          <p className="font-semibold text-foreground truncate">{nonStriker}</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Bowler</p>
          <p className="font-semibold text-foreground truncate">{bowler}</p>
        </div>
      </div>

      {/* Current over */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-2">This Over</p>
        <div className="flex gap-2 flex-wrap min-h-[40px]">
          {currentOver.map((b, i) => (
            <span key={i} className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${ballBgColor(b)}`}>
              {ballLabel(b)}
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
