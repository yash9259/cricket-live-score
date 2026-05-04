import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { RotateCcw, UserCircle2, ArrowRightLeft } from "lucide-react";
import { Navigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_SESSION_STORAGE_KEY = "adminSessionToken";

const defaultState = {
  battingTeam: "",
  bowlingTeam: "",
  striker: "",
  nonStriker: "",
  bowler: "",
  runs: 0,
  wickets: 0,
  overs: 0,
  balls: 0,
  lastEvent: "",
  inning: 1,
  target: undefined as number | undefined,
};

export default function ScorerPage() {
  const [sessionToken] = useState(() => localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "");
  const session = useQuery(api.adminAuth.validateSession, sessionToken ? { token: sessionToken } : "skip");
  const live = useQuery(api.liveScore.getCurrent);
  const registrations = useQuery(api.registrations.listRegistrations);
  const upsert = useMutation(api.liveScore.upsert);
  const reset = useMutation(api.liveScore.reset);

  const [battingTeam, setBattingTeam] = useState(defaultState.battingTeam);
  const [bowlingTeam, setBowlingTeam] = useState(defaultState.bowlingTeam);
  const [striker, setStriker] = useState(defaultState.striker);
  const [nonStriker, setNonStriker] = useState(defaultState.nonStriker);
  const [bowler, setBowler] = useState(defaultState.bowler);

  const [runs, setRuns] = useState(defaultState.runs);
  const [wickets, setWickets] = useState(defaultState.wickets);
  const [overs, setOvers] = useState(defaultState.overs);
  const [balls, setBalls] = useState(defaultState.balls);
  const [lastEvent, setLastEvent] = useState(defaultState.lastEvent);
  const [inning, setInning] = useState(defaultState.inning);
  const [target, setTarget] = useState<number | undefined>(defaultState.target);

  const [firstInningScore, setFirstInningScore] = useState<{ runs: number, wickets: number, overs: number, balls: number } | undefined>(undefined);
  const [outPlayers, setOutPlayers] = useState<string[]>([]);

  const [strikerRuns, setStrikerRuns] = useState(0);
  const [strikerBalls, setStrikerBalls] = useState(0);
  const [nonStrikerRuns, setNonStrikerRuns] = useState(0);
  const [nonStrikerBalls, setNonStrikerBalls] = useState(0);
  const [bowlerRuns, setBowlerRuns] = useState(0);
  const [bowlerWickets, setBowlerWickets] = useState(0);
  const [bowlerBalls, setBowlerBalls] = useState(0);
  const [freeHitPending, setFreeHitPending] = useState(false);
  const [ballHistory, setBallHistory] = useState<string[]>([]);
  const [pendingBatsmanReplacements, setPendingBatsmanReplacements] = useState(0);

  const [history, setHistory] = useState<Array<any>>([]);

  // Modal states
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [isBatsmanModalOpen, setIsBatsmanModalOpen] = useState(false);
  const [tempBowler, setTempBowler] = useState("");
  const [tempStriker, setTempStriker] = useState("");
  const [tempNonStriker, setTempNonStriker] = useState("");
  const [shouldOpenBowlerAfterBatsman, setShouldOpenBowlerAfterBatsman] = useState(false);

  // Super Ball state
  const [showSuperBallPopup, setShowSuperBallPopup] = useState(false);

  // Options for dropdowns
  const teamOptions = useMemo(() => {
    return registrations?.map(r => r.teamName) || [];
  }, [registrations]);

  const battingPlayers = useMemo(() => {
    const team = registrations?.find(r => r.teamName === battingTeam);
    if (!team) return [];
    return [team.captainName, ...team.players.map(p => p.name)];
  }, [registrations, battingTeam]);

  const bowlingPlayers = useMemo(() => {
    const team = registrations?.find(r => r.teamName === bowlingTeam);
    if (!team) return [];
    return [team.captainName, ...team.players.map(p => p.name)];
  }, [registrations, bowlingTeam]);

  // Filtered team options to prevent duplicate teams
  const filteredBattingTeamOptions = useMemo(() => teamOptions.filter(name => name !== bowlingTeam), [teamOptions, bowlingTeam]);
  const filteredBowlingTeamOptions = useMemo(() => teamOptions.filter(name => name !== battingTeam), [teamOptions, battingTeam]);

  useEffect(() => {
    if (!live) return;
    setBattingTeam(live.battingTeam);
    setBowlingTeam(live.bowlingTeam);
    setStriker(live.striker || "");
    setNonStriker(live.nonStriker || "");
    setBowler(live.bowler || "");
    setRuns(live.runs);
    setWickets(live.wickets);
    setOvers(live.overs);
    setBalls(live.balls);
    setLastEvent(live.lastEvent);
    setInning(live.inning ?? 1);
    setTarget(live.target);
    setFirstInningScore(live.firstInningScore);

    setStrikerRuns(live.strikerRuns || 0);
    setStrikerBalls(live.strikerBalls || 0);
    setNonStrikerRuns(live.nonStrikerRuns || 0);
    setNonStrikerBalls(live.nonStrikerBalls || 0);
    setBowlerRuns(live.bowlerRuns || 0);
    setBowlerWickets(live.bowlerWickets || 0);
    setBowlerBalls(live.bowlerBalls || 0);
    setBallHistory(live.ballHistory || []);
    setOutPlayers(live.outPlayers || []);
  }, [live]);

  const scoreText = useMemo(() => `${runs}/${wickets} (${overs}.${balls})`, [runs, wickets, overs, balls]);

  const syncScore = async (next: any) => {
    if (!sessionToken) return;

    await upsert({
      token: sessionToken,
      battingTeam: next.battingTeam || battingTeam,
      bowlingTeam: next.bowlingTeam || bowlingTeam,
      striker: next.striker !== undefined ? next.striker : striker,
      nonStriker: next.nonStriker !== undefined ? next.nonStriker : nonStriker,
      bowler: next.bowler !== undefined ? next.bowler : bowler,
      runs: next.runs !== undefined ? next.runs : runs,
      wickets: next.wickets !== undefined ? next.wickets : wickets,
      overs: next.overs !== undefined ? next.overs : overs,
      balls: next.balls !== undefined ? next.balls : balls,
      lastEvent: next.lastEvent !== undefined ? next.lastEvent : lastEvent,
      inning: next.inning !== undefined ? next.inning : inning,
      target: next.target !== undefined ? next.target : target,
      firstInningScore: next.firstInningScore !== undefined ? next.firstInningScore : firstInningScore,
      strikerRuns: next.strikerRuns !== undefined ? next.strikerRuns : strikerRuns,
      strikerBalls: next.strikerBalls !== undefined ? next.strikerBalls : strikerBalls,
      nonStrikerRuns: next.nonStrikerRuns !== undefined ? next.nonStrikerRuns : nonStrikerRuns,
      nonStrikerBalls: next.nonStrikerBalls !== undefined ? next.nonStrikerBalls : nonStrikerBalls,
      bowlerRuns: next.bowlerRuns !== undefined ? next.bowlerRuns : bowlerRuns,
      bowlerWickets: next.bowlerWickets !== undefined ? next.bowlerWickets : bowlerWickets,
      bowlerBalls: next.bowlerBalls !== undefined ? next.bowlerBalls : bowlerBalls,
      ballHistory: next.ballHistory !== undefined ? next.ballHistory : ballHistory,
      showAnimation: next.showAnimation,
      animationId: next.animationId,
      outPlayers: next.outPlayers !== undefined ? next.outPlayers : outPlayers,
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

  const snapshotCurrent = () => {
    setHistory((prev) => [...prev, {
      battingTeam, bowlingTeam, striker, nonStriker, bowler, runs, wickets, overs, balls, lastEvent, inning, target,
      strikerRuns, strikerBalls, nonStrikerRuns, nonStrikerBalls, bowlerRuns, bowlerWickets, bowlerBalls, outPlayers, freeHitPending, ballHistory, pendingBatsmanReplacements
    }]);
  };

  // Super Ball is the 6th ball of every over (balls === 5, i.e. 0-indexed last ball)
  const isSuperBall = balls === 5;

  const handleRuns = async (value: number, isSuperBallMode = false) => {
    snapshotCurrent();
    // On super ball, double normal runs
    const shouldDoubleRuns = isSuperBallMode || freeHitPending;
    const effectiveValue = shouldDoubleRuns ? value * 2 : value;
    const { nextBalls, nextOvers } = addBallProgress();
    const eventText = isSuperBallMode ? `⚡${value}×2=${effectiveValue}` : `+${value}`;
    const nextBallHistory = balls === 0 ? [eventText] : [...ballHistory, eventText].slice(-6);

    let nextStriker = striker;
    let nextNonStriker = nonStriker;
    let nextStrikerRuns = strikerRuns + effectiveValue;
    let nextStrikerBalls = strikerBalls + 1;
    let nextNonStrikerRuns = nonStrikerRuns;
    let nextNonStrikerBalls = nonStrikerBalls;
    let overChanged = false;

    if (effectiveValue % 2 !== 0) {
      nextStriker = nonStriker;
      nextNonStriker = striker;
      // Swap stats for state
      const tempR = nextStrikerRuns;
      const tempB = nextStrikerBalls;
      nextStrikerRuns = nextNonStrikerRuns;
      nextStrikerBalls = nextNonStrikerBalls;
      nextNonStrikerRuns = tempR;
      nextNonStrikerBalls = tempB;
    }

    if (nextBalls === 0 && nextOvers > overs) {
      const temp = nextStriker;
      nextStriker = nextNonStriker;
      nextNonStriker = temp;
      // Swap stats for state
      const tempR = nextStrikerRuns;
      const tempB = nextStrikerBalls;
      nextStrikerRuns = nextNonStrikerRuns;
      nextStrikerBalls = nextNonStrikerBalls;
      nextNonStrikerRuns = tempR;
      nextNonStrikerBalls = tempB;
      overChanged = true;
    }

    const nextRuns = runs + effectiveValue;
    const eventLabel = isSuperBallMode ? `⚡${value}×2=${effectiveValue}` : `+${value}`;
    const next = {
      runs: nextRuns,
      overs: nextOvers,
      balls: nextBalls,
      lastEvent: eventLabel,
      ballHistory: nextBallHistory,
      striker: nextStriker,
      nonStriker: nextNonStriker,
      bowler: overChanged ? "" : bowler,
      strikerRuns: nextStrikerRuns,
      strikerBalls: nextStrikerBalls,
      nonStrikerRuns: nextNonStrikerRuns,
      nonStrikerBalls: nextNonStrikerBalls,
      bowlerRuns: bowlerRuns + effectiveValue,
      bowlerBalls: bowlerBalls + 1,
      showAnimation: isSuperBallMode
        ? "super-ball"
        : effectiveValue === 4 ? "four" : effectiveValue === 6 ? "six" : undefined,
      animationId: (isSuperBallMode || effectiveValue === 4 || effectiveValue === 6) ? Date.now() : undefined,
    };

    setRuns(next.runs);
    setOvers(next.overs);
    setBalls(next.balls);
    setLastEvent(next.lastEvent);
    setStriker(next.striker);
    setNonStriker(next.nonStriker);
    setBowler(next.bowler);
    setStrikerRuns(next.strikerRuns);
    setStrikerBalls(next.strikerBalls);
    setNonStrikerRuns(next.nonStrikerRuns);
    setNonStrikerBalls(next.nonStrikerBalls);
    setBowlerRuns(next.bowlerRuns);
    setBowlerBalls(next.bowlerBalls);
    setFreeHitPending(false);
    setBallHistory(nextBallHistory);
    await syncScore(next);

    // 2nd Inning Win Condition
    if (inning === 2 && target && nextRuns >= target) {
      alert(`MATCH OVER! ${battingTeam} won by ${6 - wickets} wickets!`);
      return;
    }

    // Inning/Match Over by Overs
    if (nextOvers === 6) {
      if (inning === 1) {
        alert("1st Inning Completed! Please start the 2nd Inning.");
      } else {
        if (target && nextRuns < target) {
          alert(`MATCH OVER! ${bowlingTeam} won by ${target - nextRuns - 1} runs!`);
        } else if (target && nextRuns === target - 1) {
          alert("MATCH TIED!");
        }
      }
      return;
    }

    if (overChanged) {
      setTempBowler("");
      setIsBowlerModalOpen(true);
    }
  };

  const handleWicket = async (isSuperBallMode = false) => {
    if (freeHitPending) {
      alert("Free hit active: wicket does not count on this ball.");
      return;
    }

    snapshotCurrent();
    const { nextBalls, nextOvers } = addBallProgress();

    let nextStriker = "";
    let nextNonStriker = nonStriker;
    let overChanged = false;

    if (isSuperBallMode) {
      nextStriker = "";
      nextNonStriker = "";
    } else if (nextBalls === 0 && nextOvers > overs) {
      nextStriker = nonStriker;
      nextNonStriker = "";
      overChanged = true;
    }

    // Super Ball: wicket counts as 2 wickets
    const wicketsToAdd = isSuperBallMode ? 2 : 1;
    const nextWickets = Math.min(wickets + wicketsToAdd, 6);
    const eventLabel = isSuperBallMode ? "⚡WICKET×2" : "WICKET";
    const nextBallHistory = balls === 0 ? [eventLabel] : [...ballHistory, eventLabel].slice(-6);
    const nextOutPlayers = isSuperBallMode ? [...outPlayers, striker, nonStriker] : [...outPlayers, striker];
    const next = {
      wickets: nextWickets,
      overs: nextOvers,
      balls: nextBalls,
      lastEvent: eventLabel,
      ballHistory: nextBallHistory,
      striker: nextStriker,
      nonStriker: nextNonStriker,
      bowler: overChanged ? "" : bowler,
      strikerRuns: 0,
      strikerBalls: 0,
      bowlerWickets: bowlerWickets + wicketsToAdd,
      bowlerBalls: bowlerBalls + 1,
      showAnimation: isSuperBallMode ? "super-ball-wicket" : "wicket",
      animationId: Date.now(),
      outPlayers: nextOutPlayers,
    };

    setWickets(next.wickets);
    setOvers(next.overs);
    setBalls(next.balls);
    setLastEvent(next.lastEvent);
    setStriker(next.striker);
    setNonStriker(next.nonStriker);
    setBowler(next.bowler);
    setStrikerRuns(0);
    setStrikerBalls(0);
    setBowlerWickets(next.bowlerWickets);
    setBowlerBalls(next.bowlerBalls);
    setOutPlayers(next.outPlayers);
    setFreeHitPending(false);
    setBallHistory(nextBallHistory);
    setPendingBatsmanReplacements(isSuperBallMode ? 2 : 1);
    await syncScore(next);

    // Check if all out (assuming 6 wickets for box cricket)
    if (nextWickets === 6) {
      if (inning === 1) {
        alert("ALL OUT! 1st Inning Completed.");
      } else {
        alert(`MATCH OVER! ${bowlingTeam} won!`);
      }
      return;
    }

    if (nextOvers === 6) {
      if (inning === 1) {
        alert("1st Inning Completed! Please start the 2nd Inning.");
      } else {
        alert(`MATCH OVER! ${bowlingTeam} won!`);
      }
      return;
    }

    setTempStriker("");
    setTempNonStriker(nextNonStriker);
    setIsBatsmanModalOpen(true);

    if (overChanged) {
      setShouldOpenBowlerAfterBatsman(true);
    }
  };

  const handleExtra = async (label: "WIDE" | "NO BALL") => {
    // On Super Ball: Wide or No Ball (no extra runs) = just 2 runs, no doubling
    snapshotCurrent();
    const nextRuns = runs + 2;
    const next = {
      runs: nextRuns,
      lastEvent: label,
      bowlerRuns: bowlerRuns + 2,
      showAnimation: label === "NO BALL" ? "no-ball" : undefined,
      animationId: label === "NO BALL" ? Date.now() : undefined,
    };
    setRuns(next.runs);
    setLastEvent(next.lastEvent);
    setBowlerRuns(next.bowlerRuns);
    if (label === "NO BALL") {
      setFreeHitPending(true);
    }
    await syncScore(next);

    // 2nd Inning Win Condition
    if (inning === 2 && target && nextRuns >= target) {
      alert(`MATCH OVER! ${battingTeam} won!`);
      return;
    }
  };

  // No Ball + extra runs (no doubling on super ball per rule 3)
  const handleNoBallWithRuns = async (extraRuns: number, isSuperBallMode = false) => {
    snapshotCurrent();
    // No ball = 2 penalty + the extra runs scored. Never doubled.
    const totalAdded = 2 + extraRuns;
    const nextRuns = runs + totalAdded;
    const eventLabel = isSuperBallMode ? `⚡NB+${extraRuns}(no dbl)` : `NB+${extraRuns}`;
    const next = {
      runs: nextRuns,
      lastEvent: eventLabel,
      bowlerRuns: bowlerRuns + totalAdded,
      showAnimation: "no-ball",
      animationId: Date.now(),
    };
    setRuns(next.runs);
    setLastEvent(next.lastEvent);
    setBowlerRuns(next.bowlerRuns);
    setFreeHitPending(true);
    await syncScore(next);

    if (inning === 2 && target && nextRuns >= target) {
      alert(`MATCH OVER! ${battingTeam} won!`);
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));

    setBattingTeam(prev.battingTeam);
    setBowlingTeam(prev.bowlingTeam);
    setStriker(prev.striker);
    setNonStriker(prev.nonStriker);
    setBowler(prev.bowler);
    setRuns(prev.runs);
    setWickets(prev.wickets);
    setOvers(prev.overs);
    setBalls(prev.balls);
    setLastEvent(prev.lastEvent);
    setInning(prev.inning);
    setTarget(prev.target);
    setStrikerRuns(prev.strikerRuns);
    setStrikerBalls(prev.strikerBalls);
    setNonStrikerRuns(prev.nonStrikerRuns);
    setNonStrikerBalls(prev.nonStrikerBalls);
    setBowlerRuns(prev.bowlerRuns);
    setBowlerWickets(prev.bowlerWickets);
    setBowlerBalls(prev.bowlerBalls);
    setOutPlayers(prev.outPlayers || []);
    setFreeHitPending(prev.freeHitPending || false);
    setBallHistory(prev.ballHistory || []);
    setPendingBatsmanReplacements(prev.pendingBatsmanReplacements || 0);

    await syncScore(prev);
  };

  const handleReset = async () => {
    if (!sessionToken) return;
    if (!confirm("Are you sure you want to RESET the entire match? This will clear all scores, teams, and players.")) return;

    setHistory([]);
    setBattingTeam("");
    setBowlingTeam("");
    setStriker("");
    setNonStriker("");
    setBowler("");
    setRuns(0);
    setWickets(0);
    setOvers(0);
    setBalls(0);
    setLastEvent("");
    setInning(1);
    setTarget(undefined);
    setFirstInningScore(undefined);
    setStrikerRuns(0);
    setStrikerBalls(0);
    setNonStrikerRuns(0);
    setNonStrikerBalls(0);
    setBowlerRuns(0);
    setBowlerWickets(0);
    setBowlerBalls(0);
    setOutPlayers([]);
    setFreeHitPending(false);
    setBallHistory([]);
    setPendingBatsmanReplacements(0);

    await reset({ token: sessionToken });
  };

  const handleInningChange = async () => {
    if (inning === 1) {
      const newTarget = runs + 1;
      if (!confirm(`End 1st Inning? 2nd Inning target will be ${newTarget}. Teams will be swapped.`)) return;

      const currentScore = { runs, wickets, overs, balls };
      const next = {
        battingTeam: bowlingTeam,
        bowlingTeam: battingTeam,
        striker: "",
        nonStriker: "",
        bowler: "",
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        lastEvent: "2nd INNING START",
        inning: 2,
        target: newTarget,
        firstInningScore: currentScore,
        strikerRuns: 0,
        strikerBalls: 0,
        nonStrikerRuns: 0,
        nonStrikerBalls: 0,
        bowlerRuns: 0,
        bowlerWickets: 0,
        bowlerBalls: 0,
        outPlayers: [],
        ballHistory: [],
      };

      setHistory([]);
      setBattingTeam(next.battingTeam);
      setBowlingTeam(next.bowlingTeam);
      setStriker("");
      setNonStriker("");
      setBowler("");
      setRuns(0);
      setWickets(0);
      setOvers(0);
      setBalls(0);
      setLastEvent(next.lastEvent);
      setInning(2);
      setTarget(newTarget);
      setFirstInningScore(currentScore);
      setStrikerRuns(0);
      setStrikerBalls(0);
      setNonStrikerRuns(0);
      setNonStrikerBalls(0);
      setBowlerRuns(0);
      setBowlerWickets(0);
      setBowlerBalls(0);
      setOutPlayers([]);
      setFreeHitPending(false);
      setBallHistory([]);
      setPendingBatsmanReplacements(0);

      await syncScore(next);
    } else {
      if (!confirm("Go back to 1st Inning? This will restore the 1st inning score.")) return;

      const restored = firstInningScore || { runs: 0, wickets: 0, overs: 0, balls: 0 };
      const next = {
        battingTeam: bowlingTeam, // swap back
        bowlingTeam: battingTeam,
        runs: restored.runs,
        wickets: restored.wickets,
        overs: restored.overs,
        balls: restored.balls,
        inning: 1,
        target: undefined,
        lastEvent: "REVERTED TO 1st INN",
        strikerRuns: 0,
        strikerBalls: 0,
        nonStrikerRuns: 0,
        nonStrikerBalls: 0,
        bowlerRuns: 0,
        bowlerWickets: 0,
        bowlerBalls: 0,
        outPlayers: [],
        ballHistory: [],
      };

      setBattingTeam(next.battingTeam);
      setBowlingTeam(next.bowlingTeam);
      setRuns(next.runs);
      setWickets(next.wickets);
      setOvers(next.overs);
      setBalls(next.balls);
      setInning(1);
      setTarget(undefined);
      setLastEvent(next.lastEvent);
      setStrikerRuns(0);
      setStrikerBalls(0);
      setNonStrikerRuns(0);
      setNonStrikerBalls(0);
      setBowlerRuns(0);
      setBowlerWickets(0);
      setBowlerBalls(0);
      setOutPlayers([]);
      setFreeHitPending(false);
      setBallHistory([]);
      setPendingBatsmanReplacements(0);

      await syncScore(next);
    }
  };

  const saveTeamsAndPlayers = async () => {
    await syncScore({});
  };

  const swapBatsmenManual = async () => {
    snapshotCurrent();
    const next = {
      striker: nonStriker,
      nonStriker: striker,
      strikerRuns: nonStrikerRuns,
      strikerBalls: nonStrikerBalls,
      nonStrikerRuns: strikerRuns,
      nonStrikerBalls: strikerBalls,
      ballHistory,
    };
    setStriker(next.striker);
    setNonStriker(next.nonStriker);
    setStrikerRuns(next.strikerRuns);
    setStrikerBalls(next.strikerBalls);
    setNonStrikerRuns(next.nonStrikerRuns);
    setNonStrikerBalls(next.nonStrikerBalls);
    await syncScore(next);
  };

  const saveBowlerModal = async () => {
    setBowler(tempBowler);
    setBowlerRuns(0);
    setBowlerWickets(0);
    setBowlerBalls(0);
    setIsBowlerModalOpen(false);
    await syncScore({
      bowler: tempBowler,
      bowlerRuns: 0,
      bowlerWickets: 0,
      bowlerBalls: 0,
    });
  };

  const saveBatsmanModal = async () => {
    const isStrikerMissing = striker === "";

    if (isStrikerMissing) {
      setStriker(tempStriker);
      setStrikerRuns(0);
      setStrikerBalls(0);
      await syncScore({
        striker: tempStriker,
        strikerRuns: 0,
        strikerBalls: 0
      });
    } else {
      setNonStriker(tempStriker);
      setNonStrikerRuns(0);
      setNonStrikerBalls(0);
      await syncScore({
        nonStriker: tempStriker,
        nonStrikerRuns: 0,
        nonStrikerBalls: 0
      });
    }

    const remainingReplacements = pendingBatsmanReplacements - 1;
    setPendingBatsmanReplacements(remainingReplacements);
    setTempStriker("");

    if (remainingReplacements > 0) {
      return;
    }

    setIsBatsmanModalOpen(false);

    if (shouldOpenBowlerAfterBatsman) {
      setTempBowler("");
      setIsBowlerModalOpen(true);
      setShouldOpenBowlerAfterBatsman(false);
    }
  };

  const canScore = useMemo(() => {
    return striker !== "" && nonStriker !== "" && bowler !== "";
  }, [striker, nonStriker, bowler]);

  // Show Super Ball popup whenever balls === 5 and scoring is possible
  useEffect(() => {
    if (isSuperBall && canScore) {
      setShowSuperBallPopup(true);
    }
  }, [overs, balls]); // trigger on ball count change

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
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">

      {/* MATCH SECTION */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Live Match Control</h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold border border-primary/30">
              Inning {inning}
            </span>
            <Button onClick={handleInningChange} size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              {inning === 1 ? "Start 2nd Inning" : "Back to 1st Inning"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Batting Team</Label>
            <Select value={battingTeam} onValueChange={setBattingTeam}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select Batting Team" />
              </SelectTrigger>
              <SelectContent>
                {filteredBattingTeamOptions.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bowling Team</Label>
            <Select value={bowlingTeam} onValueChange={setBowlingTeam}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select Bowling Team" />
              </SelectTrigger>
              <SelectContent>
                {filteredBowlingTeamOptions.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-primary"><UserCircle2 className="w-4 h-4" /> Striker</Label>
            <Select value={striker} onValueChange={setStriker}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select Striker" />
              </SelectTrigger>
              <SelectContent>
                {battingPlayers.map(name => (
                  <SelectItem key={name} value={name} disabled={outPlayers.includes(name) || name === nonStriker}>
                    {name}{outPlayers.includes(name) ? " (out)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-muted-foreground"><UserCircle2 className="w-4 h-4" /> Non-Striker</Label>
            <Select value={nonStriker} onValueChange={setNonStriker}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select Non-Striker" />
              </SelectTrigger>
              <SelectContent>
                {battingPlayers.map(name => (
                  <SelectItem key={name} value={name} disabled={outPlayers.includes(name) || name === striker}>
                    {name}{outPlayers.includes(name) ? " (out)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-neon-orange"><UserCircle2 className="w-4 h-4" /> Bowler</Label>
            <Select value={bowler} onValueChange={setBowler}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select Bowler" />
              </SelectTrigger>
              <SelectContent>
                {bowlingPlayers.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={saveTeamsAndPlayers} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">Save Match Info</Button>
          <Button onClick={swapBatsmenManual} variant="outline" className="text-foreground"><ArrowRightLeft className="w-4 h-4 mr-2" /> Swap Batsmen</Button>
        </div>
      </div>

      <motion.div className="rounded-xl border border-primary/30 bg-primary/10 p-8 text-center flex flex-col md:flex-row justify-between items-center px-12 gap-8">
        <div className="text-left space-y-1">
          <p className="text-xl font-bold text-foreground">Batting</p>
          <p className="text-lg text-primary">{striker || <span className="text-destructive animate-pulse">Select Striker</span>}*</p>
          <p className="text-md text-muted-foreground">{nonStriker || <span className="text-destructive animate-pulse">Select Non-Striker</span>}</p>
        </div>
        <div className="text-center">
          {inning === 2 && target && (
            <div className="space-y-1 mb-2">
              {firstInningScore && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  1st Inn: {firstInningScore.runs}/{firstInningScore.wickets} ({firstInningScore.overs}.{firstInningScore.balls})
                </p>
              )}
              <p className="text-sm font-bold text-neon-yellow tracking-widest uppercase">Target: {target}</p>
            </div>
          )}
          <p className="font-display text-6xl font-bold text-primary">{scoreText}</p>
          <p className="text-sm text-muted-foreground mt-2 font-medium bg-background px-3 py-1 rounded-full inline-block border border-border">Last: {lastEvent || "-"}</p>
          {inning === 2 && target && (
            <p className="text-sm text-muted-foreground mt-2 font-medium">Need {Math.max(0, target - runs)} runs to win</p>
          )}
        </div>
        <div className="text-right space-y-1">
          <p className="text-xl font-bold text-foreground">Bowling</p>
          <p className="text-lg text-neon-orange">{bowler || <span className="text-destructive animate-pulse">Select Bowler</span>}</p>
        </div>
      </motion.div>

      <div className={`rounded-xl border p-6 space-y-4 transition-all ${isSuperBall && canScore ? "border-yellow-400/60 bg-yellow-500/5 shadow-[0_0_24px_2px_rgba(234,179,8,0.15)]" : "border-border bg-card"}`}>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-bold">Runs & Events</h2>
              {(isSuperBall || freeHitPending) && canScore && (
                <span className="animate-pulse text-xs font-black px-2.5 py-1 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 uppercase tracking-wider">
                      {freeHitPending ? "FREE HIT" : "⚡ Super Ball!"}
                </span>
              )}
            </div>
            {!canScore && <p className="text-xs text-destructive font-medium animate-pulse">Please select players to continue scoring</p>}
          </div>
          <Button onClick={handleUndo} variant="secondary" size="sm" className="bg-secondary text-secondary-foreground"><RotateCcw className="h-4 w-4 mr-2" />Undo Last Event</Button>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <Button
              key={n}
              disabled={!canScore}
              onClick={() => isSuperBall ? handleRuns(n, true) : handleRuns(n)}
              className={`text-lg font-bold py-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                isSuperBall && canScore
                  ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg shadow-yellow-400/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isSuperBall && canScore && n > 0 ? (
                <span className="flex flex-col items-center leading-none">
                  <span className="text-base font-black">{n}</span>
                  <span className="text-[9px] opacity-70">→{n * 2}</span>
                </span>
              ) : n}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <Button
            disabled={!canScore || freeHitPending}
            onClick={() => isSuperBall ? handleWicket(true) : handleWicket()}
            variant="destructive"
            className="py-6 text-lg font-bold disabled:opacity-50"
          >
            {freeHitPending ? "FREE HIT" : isSuperBall && canScore ? "⚡WICKET (×2)" : "WICKET"}
          </Button>
          <Button disabled={!canScore} onClick={() => handleExtra("WIDE")} variant="outline" className="border-neon-orange/40 text-neon-orange hover:bg-neon-orange/10 py-6 text-lg font-bold disabled:opacity-50">
            Wide (2 Runs)
          </Button>
          {/* No Ball: on super ball show option for just 2 runs or no ball + runs */}
          {isSuperBall && canScore ? (
            <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
              <Button disabled={!canScore} onClick={() => handleExtra("NO BALL")} variant="outline" className="border-neon-yellow/40 text-neon-yellow hover:bg-neon-yellow/10 py-2.5 text-sm font-bold disabled:opacity-50">
                No Ball (2 only)
              </Button>
              <select
                className="w-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-300 rounded-lg p-2 text-sm font-bold"
                defaultValue=""
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    handleNoBallWithRuns(val, true);
                    e.target.value = "";
                  }
                }}
              >
                <option value="" disabled>⚡NB + Runs (no dbl)</option>
                {[1, 2, 3, 4, 6].map(r => (
                  <option key={r} value={r}>NB + {r} runs = {2 + r} total</option>
                ))}
              </select>
            </div>
          ) : (
            <Button disabled={!canScore} onClick={() => handleExtra("NO BALL")} variant="outline" className="border-neon-yellow/40 text-neon-yellow hover:bg-neon-yellow/10 py-6 text-lg font-bold col-span-2 md:col-span-1 disabled:opacity-50">
              No Ball (2 Runs)
            </Button>
          )}
        </div>

        <div className="pt-8 flex justify-end">
          <Button onClick={handleReset} variant="ghost" className="text-destructive hover:bg-destructive/10">Reset Whole Match</Button>
        </div>
      </div>

      {/* Super Ball Popup */}
      {showSuperBallPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-2 border-yellow-400/60 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-[0_0_60px_10px_rgba(234,179,8,0.25)]"
          >
            <div className="text-6xl mb-3 animate-bounce">⚡</div>
            <h2 className="font-display text-3xl font-black text-yellow-400 mb-2">SUPER BALL!</h2>
            <p className="text-muted-foreground text-sm mb-1">This is the <strong className="text-yellow-300">last ball of the over</strong>.</p>
            <ul className="text-xs text-left text-muted-foreground space-y-1 mb-5 mt-3 bg-black/30 rounded-lg p-3">
              <li>⚡ <span className="text-yellow-300 font-semibold">Runs</span> — doubled on super ball or free hit (0→0, 1→2, 2→4, 3→6, 4→8, 6→12)</li>
              <li>🟠 <span className="text-orange-300 font-semibold">Wide / No Ball (plain)</span> — 2 runs only</li>
              <li>🟡 <span className="text-yellow-200 font-semibold">No Ball + Runs</span> — NOT doubled, just NB+runs</li>
              <li>🟢 <span className="text-green-300 font-semibold">Free Hit</span> — the next legal ball after a no-ball</li>
              <li>💀 <span className="text-red-400 font-semibold">Wicket</span> — counts as 2 wickets!</li>
            </ul>
            <Button
              onClick={() => setShowSuperBallPopup(false)}
              className="w-full bg-yellow-400 text-black font-black hover:bg-yellow-300 text-lg py-5"
            >
              Got it — Bowl!
            </Button>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <Dialog open={isBowlerModalOpen} onOpenChange={setIsBowlerModalOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Over Completed! Select New Bowler</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bowler Name</Label>
              <Select value={tempBowler} onValueChange={setTempBowler}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Bowler" />
                </SelectTrigger>
                <SelectContent>
                  {bowlingPlayers.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveBowlerModal} disabled={!tempBowler} className="w-full">Start New Over</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatsmanModalOpen} onOpenChange={setIsBatsmanModalOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Wicket! Select New Batsman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select New Batsman</Label>
              <Select value={tempStriker} onValueChange={setTempStriker}>
                <SelectTrigger>
                  <SelectValue placeholder="Select New Batsman" />
                </SelectTrigger>
                <SelectContent>
                    {battingPlayers.map(name => (
                      <SelectItem key={name} value={name} disabled={outPlayers.includes(name) || name === tempNonStriker}>
                        {name}{outPlayers.includes(name) ? " (out)" : ""}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveBatsmanModal} disabled={!tempStriker} className="w-full">Continue Match</Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}
