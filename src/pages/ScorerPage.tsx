import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Navigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_SESSION_STORAGE_KEY = "adminSessionToken";

const defaultState = {
  battingTeam: "Team A",
  bowlingTeam: "Team B",
  runs: 0,
  wickets: 0,
  overs: 0,
  balls: 0,
  lastEvent: "",
};

export default function ScorerPage() {
  const [sessionToken] = useState(() => localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "");
  const session = useQuery(api.adminAuth.validateSession, sessionToken ? { token: sessionToken } : "skip");
  const live = useQuery(api.liveScore.getCurrent);
  const upsert = useMutation(api.liveScore.upsert);
  const reset = useMutation(api.liveScore.reset);

  const [battingTeam, setBattingTeam] = useState(defaultState.battingTeam);
  const [bowlingTeam, setBowlingTeam] = useState(defaultState.bowlingTeam);
  const [runs, setRuns] = useState(defaultState.runs);
  const [wickets, setWickets] = useState(defaultState.wickets);
  const [overs, setOvers] = useState(defaultState.overs);
  const [balls, setBalls] = useState(defaultState.balls);
  const [lastEvent, setLastEvent] = useState(defaultState.lastEvent);
  const [history, setHistory] = useState<Array<{ runs: number; wickets: number; overs: number; balls: number; lastEvent: string }>>([]);

  useEffect(() => {
    if (!live) return;
    setBattingTeam(live.battingTeam);
    setBowlingTeam(live.bowlingTeam);
    setRuns(live.runs);
    setWickets(live.wickets);
    setOvers(live.overs);
    setBalls(live.balls);
    setLastEvent(live.lastEvent);
  }, [live]);

  const scoreText = useMemo(() => `${runs}/${wickets} (${overs}.${balls})`, [runs, wickets, overs, balls]);

  const syncScore = async (next: {
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    lastEvent: string;
  }) => {
    if (!sessionToken) return;

    await upsert({
      token: sessionToken,
      battingTeam,
      bowlingTeam,
      runs: next.runs,
      wickets: next.wickets,
      overs: next.overs,
      balls: next.balls,
      lastEvent: next.lastEvent,
    });
  };

  const addBallProgress = () => {
    let nextBalls = balls + 1;
    let nextOvers = overs;
    if (nextBalls >= 6) {
      nextBalls = 0;
      nextOvers += 1;
    }
    return { nextBalls, nextOvers };
  };

  const handleRuns = async (value: number) => {
    const snapshot = { runs, wickets, overs, balls, lastEvent };
    setHistory((prev) => [...prev, snapshot]);
    const { nextBalls, nextOvers } = addBallProgress();
    const next = {
      runs: runs + value,
      wickets,
      overs: nextOvers,
      balls: nextBalls,
      lastEvent: `+${value}`,
    };
    setRuns(next.runs);
    setOvers(next.overs);
    setBalls(next.balls);
    setLastEvent(next.lastEvent);
    await syncScore(next);
  };

  const handleWicket = async () => {
    const snapshot = { runs, wickets, overs, balls, lastEvent };
    setHistory((prev) => [...prev, snapshot]);
    const { nextBalls, nextOvers } = addBallProgress();
    const next = {
      runs,
      wickets: wickets + 1,
      overs: nextOvers,
      balls: nextBalls,
      lastEvent: "WICKET",
    };
    setWickets(next.wickets);
    setOvers(next.overs);
    setBalls(next.balls);
    setLastEvent(next.lastEvent);
    await syncScore(next);
  };

  const handleExtra = async (label: "WIDE" | "NO BALL") => {
    const snapshot = { runs, wickets, overs, balls, lastEvent };
    setHistory((prev) => [...prev, snapshot]);
    const next = {
      runs: runs + 1,
      wickets,
      overs,
      balls,
      lastEvent: label,
    };
    setRuns(next.runs);
    setLastEvent(next.lastEvent);
    await syncScore(next);
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setRuns(prev.runs);
    setWickets(prev.wickets);
    setOvers(prev.overs);
    setBalls(prev.balls);
    setLastEvent(prev.lastEvent);
    await syncScore(prev);
  };

  const handleReset = async () => {
    if (!sessionToken) return;

    setHistory([]);
    setRuns(0);
    setWickets(0);
    setOvers(0);
    setBalls(0);
    setLastEvent("");
    await reset({ token: sessionToken });
    await upsert({
      token: sessionToken,
      battingTeam,
      bowlingTeam,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      lastEvent: "",
    });
  };

  const saveTeams = async () => {
    if (!sessionToken) return;

    await upsert({
      token: sessionToken,
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      overs,
      balls,
      lastEvent,
    });
  };

  if (!sessionToken) {
    return <Navigate to="/admin" replace />;
  }

  if (session === undefined) {
    return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Validating admin session...</div>;
  }

  if (!session.authenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Live Scorer Panel</h1>
        <p className="text-sm text-muted-foreground">All updates are saved to Convex and reflected instantly in display/admin.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Batting Team</Label>
            <Input value={battingTeam} onChange={(e) => setBattingTeam(e.target.value)} className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label>Bowling Team</Label>
            <Input value={bowlingTeam} onChange={(e) => setBowlingTeam(e.target.value)} className="bg-muted border-border" />
          </div>
        </div>
        <Button onClick={saveTeams} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">Save Team Names</Button>
      </div>

      <motion.div className="rounded-xl border border-primary/30 bg-primary/10 p-8 text-center">
        <p className="font-display text-6xl font-bold text-primary">{scoreText}</p>
        <p className="text-sm text-muted-foreground mt-2">Last Event: {lastEvent || "-"}</p>
      </motion.div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">Run Controls</h2>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 6].map((n) => (
            <Button key={n} onClick={() => handleRuns(n)} className="bg-primary text-primary-foreground hover:bg-primary/90">+{n}</Button>
          ))}
          <Button onClick={handleWicket} variant="destructive">Wicket</Button>
          <Button onClick={() => handleExtra("WIDE")} variant="outline" className="border-neon-orange/40 text-neon-orange">Wide</Button>
          <Button onClick={() => handleExtra("NO BALL")} variant="outline" className="border-neon-yellow/40 text-neon-yellow">No Ball</Button>
          <Button onClick={handleUndo} variant="outline"><RotateCcw className="h-4 w-4 mr-2" />Undo</Button>
        </div>
        <Button onClick={handleReset} variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">Reset Score</Button>
      </div>
    </div>
  );
}
