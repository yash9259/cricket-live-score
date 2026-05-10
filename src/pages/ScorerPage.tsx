import { useEffect, useMemo, useState, Fragment } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { RotateCcw, UserCircle2, ArrowRightLeft, BarChart3, Trophy, Activity, Zap, History, LayoutDashboard, ChevronRight, AlertCircle, Info } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { POINTS_CONFIG, calculateBattingPoints, calculateBowlingPoints } from "../../convex/points";
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
import { MatchSummaryModal } from "@/components/MatchSummaryModal";
import { useToast } from "@/components/ui/use-toast";
import { ScoreBook } from "@/components/ScoreBook";
import { BookOpen } from "lucide-react";


interface BatsmanStat { name: string; runs: number; balls: number; isOut: boolean; dots?: number; points?: number; }
interface BowlerStat { name: string; runs: number; wickets: number; balls: number; dots?: number; maidens?: number; extras?: number; points?: number; }
interface DetailedBall { over: number; ball: number; runs: number; extraRuns?: number; isWicket: boolean; bowler: string; batsman: string; event: string; inning: number; timestamp: number; }


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
  const { toast } = useToast();
  const [sessionToken] = useState(() => localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "");
  const session = useQuery(api.adminAuth.validateSession, sessionToken ? { token: sessionToken } : "skip");
  const live = useQuery(api.liveScore.getCurrent);
  const registrations = useQuery(api.registrations.listRegistrations);
  const upsert = useMutation(api.liveScore.upsert);
  const reset = useMutation(api.liveScore.reset);
  const completeMatch = useMutation(api.matches.completeMatch);

  const match = useQuery(api.matches.getById, live?.matchId ? { id: live.matchId } : "skip");
  const matches = useQuery(api.matches.list) ?? [];

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
  const [matchId, setMatchId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

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
  const [detailedBallHistory, setDetailedBallHistory] = useState<DetailedBall[]>([]);
  const [pendingBatsmanReplacements, setPendingBatsmanReplacements] = useState(0);

  const [batsmenInning1, setBatsmenInning1] = useState<BatsmanStat[]>([]);
  const [bowlersInning1, setBowlersInning1] = useState<BowlerStat[]>([]);
  const [batsmenInning2, setBatsmenInning2] = useState<BatsmanStat[]>([]);
  const [bowlersInning2, setBowlersInning2] = useState<BowlerStat[]>([]);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isScoreBookOpen, setIsScoreBookOpen] = useState(false);
  const [showScoreboardOnDisplay, setShowScoreboardOnDisplay] = useState(false);

  const [isFinishing, setIsFinishing] = useState(false);
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

  const categories = [
    { id: "youth", label: "યુવાનો 16 વર્ષ થી ઉપરના" },
    { id: "women", label: "મહિલાઓ તથા 16 વર્ષ થી વધુ ઉંમર ની યુવતીઓ" },
    { id: "boys-11-15", label: "બાળકો (11 થી 15 વર્ષ)" },
    { id: "girls-11-15", label: "બાલિકાઓ (11 થી 15 વર્ષ)" },
    { id: "kids-5-10", label: "બાળકો તથા બાલિકાઓ (5 થી 10 વર્ષ)" },
  ];

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

  const selectedMatch = useMemo(() => matches.find(m => m._id === matchId), [matches, matchId]);

  const availableBattingOptions = useMemo(() => {
    if (selectedMatch) {
      return [selectedMatch.teamAName, selectedMatch.teamBName];
    }
    return filteredBattingTeamOptions;
  }, [selectedMatch, filteredBattingTeamOptions]);

  const availableBowlingOptions = useMemo(() => {
    if (selectedMatch) {
      return [selectedMatch.teamAName, selectedMatch.teamBName];
    }
    return filteredBowlingTeamOptions;
  }, [selectedMatch, filteredBowlingTeamOptions]);

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
    setMatchId(live.matchId);

    setStrikerRuns(live.strikerRuns || 0);
    setStrikerBalls(live.strikerBalls || 0);
    setNonStrikerRuns(live.nonStrikerRuns || 0);
    setNonStrikerBalls(live.nonStrikerBalls || 0);
    setBowlerRuns(live.bowlerRuns || 0);
    setBowlerWickets(live.bowlerWickets || 0);
    setBowlerBalls(live.bowlerBalls || 0);
    setBallHistory(live.ballHistory || []);
    setOutPlayers(live.outPlayers || []);
    setBatsmenInning1(live.batsmenInning1 || []);
    setBowlersInning1(live.bowlersInning1 || []);
    setBatsmenInning2(live.batsmenInning2 || []);
    setBowlersInning2(live.bowlersInning2 || []);
    setDetailedBallHistory(live.detailedBallHistory || []);
    setShowScoreboardOnDisplay(live.showScoreboard || false);
  }, [live]);

  const scoreText = `${runs}/${wickets} (${overs}.${balls})`;

  const isMatchOver = useMemo(() => {
    if (inning === 1) return false;
    if (!target) return false;
    return runs >= target || (overs === 6 && balls === 0) || wickets === 6;
  }, [inning, target, runs, overs, balls, wickets]);

  const syncScore = async (next: any) => {
    if (!sessionToken) return;
    await upsert({
      token: sessionToken,
      matchId: (next.matchId !== undefined ? next.matchId : matchId) as any,
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
      batsmenInning1: next.batsmenInning1 !== undefined ? next.batsmenInning1 : batsmenInning1,
      bowlersInning1: next.bowlersInning1 !== undefined ? next.bowlersInning1 : bowlersInning1,
      batsmenInning2: next.batsmenInning2 !== undefined ? next.batsmenInning2 : batsmenInning2,
      bowlersInning2: next.bowlersInning2 !== undefined ? next.bowlersInning2 : bowlersInning2,
      detailedBallHistory: next.detailedBallHistory !== undefined ? next.detailedBallHistory : detailedBallHistory,
      showScoreboard: next.showScoreboard !== undefined ? next.showScoreboard : showScoreboardOnDisplay,
    });
  };

  const updatePlayerStats = (
    params: {
      batsmanName?: string;
      runsScored?: number;
      ballsFaced?: number;
      isOut?: boolean;
      bowlerName?: string;
      runsConceded?: number;
      wicketsTaken?: number;
      ballsBowled?: number;
      isDot?: boolean;
      isMaiden?: boolean;
      isExtra?: boolean;
      isSuperBall?: boolean;
      currentBatsmen?: BatsmanStat[];
      currentBowlers?: BowlerStat[];
    }
  ) => {
    const isInn1 = inning === 1;
    let nextBatsmen = params.currentBatsmen || (isInn1 ? [...batsmenInning1] : [...batsmenInning2]);
    let nextBowlers = params.currentBowlers || (isInn1 ? [...bowlersInning1] : [...bowlersInning2]);

    if (params.batsmanName) {
      const idx = nextBatsmen.findIndex(b => b.name === params.batsmanName);
      if (idx > -1) {
        const b = nextBatsmen[idx];
        const newRuns = b.runs + (params.runsScored || 0);
        const newBalls = b.balls + (params.ballsFaced || 0);
        const newDots = (b.dots || 0) + (params.isDot ? 1 : 0);
        const newIsOut = params.isOut !== undefined ? params.isOut : b.isOut;
        
        const ballPoints = calculateBattingPoints({
          runs: params.runsScored || 0,
          dots: params.isDot ? 1 : 0,
          isOut: params.isOut || false,
          isSuperBall: params.isSuperBall
        });

        nextBatsmen[idx] = {
          ...b,
          runs: newRuns,
          balls: newBalls,
          dots: newDots,
          isOut: newIsOut,
          points: (b.points || 0) + ballPoints
        };
      } else {
        const ballPoints = calculateBattingPoints({
          runs: params.runsScored || 0,
          dots: params.isDot ? 1 : 0,
          isOut: params.isOut || false,
          isSuperBall: params.isSuperBall
        });
        nextBatsmen.push({ 
          name: params.batsmanName, 
          runs: params.runsScored || 0, 
          balls: params.ballsFaced || 0, 
          isOut: params.isOut || false,
          dots: params.isDot ? 1 : 0,
          points: ballPoints
        });
      }
    }

    if (params.bowlerName) {
      const idx = nextBowlers.findIndex(b => b.name === params.bowlerName);
      if (idx > -1) {
        const bw = nextBowlers[idx];
        const ballPoints = calculateBowlingPoints({
          wickets: params.wicketsTaken || 0,
          dots: params.isDot ? 1 : 0,
          extras: params.isExtra ? 1 : 0,
          maidens: params.isMaiden ? 1 : 0,
          isSuperBall: params.isSuperBall
        });

        nextBowlers[idx] = {
          ...bw,
          runs: bw.runs + (params.runsConceded || 0),
          wickets: bw.wickets + (params.wicketsTaken || 0),
          balls: bw.balls + (params.ballsBowled || 0),
          dots: (bw.dots || 0) + (params.isDot ? 1 : 0),
          maidens: (bw.maidens || 0) + (params.isMaiden ? 1 : 0),
          extras: (bw.extras || 0) + (params.isExtra ? 1 : 0),
          points: (bw.points || 0) + ballPoints
        };
      } else {
        const ballPoints = calculateBowlingPoints({
          wickets: params.wicketsTaken || 0,
          dots: params.isDot ? 1 : 0,
          extras: params.isExtra ? 1 : 0,
          maidens: params.isMaiden ? 1 : 0,
          isSuperBall: params.isSuperBall
        });
        nextBowlers.push({ 
          name: params.bowlerName, 
          runs: params.runsConceded || 0, 
          wickets: params.wicketsTaken || 0, 
          balls: params.ballsBowled || 0,
          dots: params.isDot ? 1 : 0,
          maidens: params.isMaiden ? 1 : 0,
          extras: params.isExtra ? 1 : 0,
          points: ballPoints
        });
      }
    }

    return isInn1 
      ? { batsmenInning1: nextBatsmen, bowlersInning1: nextBowlers } 
      : { batsmenInning2: nextBatsmen, bowlersInning2: nextBowlers };
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
      strikerRuns, strikerBalls, nonStrikerRuns, nonStrikerBalls, bowlerRuns, bowlerWickets, bowlerBalls, outPlayers, freeHitPending, ballHistory, detailedBallHistory, pendingBatsmanReplacements,
      batsmenInning1, bowlersInning1, batsmenInning2, bowlersInning2
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

    const newDetailedBall: DetailedBall = {
      over: overs,
      ball: balls + 1,
      runs: effectiveValue,
      isWicket: false,
      bowler,
      batsman: striker,
      event: eventLabel,
      inning,
      timestamp: Date.now(),
    };
    const nextDetailedBallHistory = [...detailedBallHistory, newDetailedBall];
    Object.assign(next, { detailedBallHistory: nextDetailedBallHistory });


    const statsUpdates = updatePlayerStats({
        batsmanName: striker,
        runsScored: effectiveValue,
        ballsFaced: 1,
        bowlerName: bowler,
        runsConceded: effectiveValue,
        ballsBowled: 1,
        isDot: effectiveValue === 0,
        isSuperBall: isSuperBallMode
    });

    Object.assign(next, statsUpdates);
    if (statsUpdates.batsmenInning1) setBatsmenInning1(statsUpdates.batsmenInning1);
    if (statsUpdates.bowlersInning1) setBowlersInning1(statsUpdates.bowlersInning1);
    if (statsUpdates.batsmenInning2) setBatsmenInning2(statsUpdates.batsmenInning2);
    if (statsUpdates.bowlersInning2) setBowlersInning2(statsUpdates.bowlersInning2);

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
    setDetailedBallHistory(nextDetailedBallHistory);
    await syncScore(next);

    // 2nd Inning Win Condition
    if (inning === 2 && target && nextRuns >= target) {
      alert(`MATCH OVER! ${battingTeam} won by ${6 - wickets} wickets!`);
      handleMatchCompletion(battingTeam);
      return;
    }

    // Inning/Match Over by Overs
    if (nextOvers === 6) {
      if (inning === 1) {
        alert("1st Inning Completed! Please start the 2nd Inning.");
      } else {
        if (target && nextRuns < target) {
          alert(`MATCH OVER! ${bowlingTeam} won by ${target - nextRuns - 1} runs!`);
          handleMatchCompletion(bowlingTeam);
        } else if (target && nextRuns === target - 1) {
          alert("MATCH TIED!");
          handleMatchCompletion(undefined);
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

    const newDetailedBall: DetailedBall = {
      over: overs,
      ball: balls + 1,
      runs: 0,
      isWicket: true,
      bowler,
      batsman: striker,
      event: eventLabel,
      inning,
      timestamp: Date.now(),
    };
    const nextDetailedBallHistory = [...detailedBallHistory, newDetailedBall];
    Object.assign(next, { detailedBallHistory: nextDetailedBallHistory });


    let statsUpdates = updatePlayerStats({
        batsmanName: striker,
        runsScored: 0,
        ballsFaced: 1,
        isOut: true,
        bowlerName: bowler,
        runsConceded: 0,
        wicketsTaken: wicketsToAdd,
        ballsBowled: 1,
        isDot: true,
        isSuperBall: isSuperBallMode
    });

    if (isSuperBallMode && nonStriker) {
        statsUpdates = updatePlayerStats({
            batsmanName: nonStriker,
            isOut: true,
            currentBatsmen: statsUpdates.batsmenInning1 || statsUpdates.batsmenInning2,
            currentBowlers: statsUpdates.bowlersInning1 || statsUpdates.bowlersInning2,
        });
    }
    
    Object.assign(next, statsUpdates);
    if (statsUpdates.batsmenInning1) setBatsmenInning1(statsUpdates.batsmenInning1);
    if (statsUpdates.bowlersInning1) setBowlersInning1(statsUpdates.bowlersInning1);
    if (statsUpdates.batsmenInning2) setBatsmenInning2(statsUpdates.batsmenInning2);
    if (statsUpdates.bowlersInning2) setBowlersInning2(statsUpdates.bowlersInning2);

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
    setDetailedBallHistory(nextDetailedBallHistory);
    setPendingBatsmanReplacements(isSuperBallMode ? 2 : 1);
    await syncScore(next);

    // Check if all out (assuming 6 wickets for box cricket)
    if (nextWickets === 6) {
      if (inning === 1) {
        alert("ALL OUT! 1st Inning Completed.");
      } else {
        alert(`MATCH OVER! ${bowlingTeam} won!`);
        handleMatchCompletion(bowlingTeam);
      }
      return;
    }

    if (nextOvers === 6) {
      if (inning === 1) {
        alert("1st Inning Completed! Please start the 2nd Inning.");
      } else {
        alert(`MATCH OVER! ${bowlingTeam} won!`);
        handleMatchCompletion(bowlingTeam);
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

    const newDetailedBall: DetailedBall = {
      over: overs,
      ball: balls, // Extras don't increment ball count in box cricket usually, but let's see. 
      // Actually balls doesn't increment here, so we use current balls index or similar.
      // In this code, handleExtra doesn't call addBallProgress.
      runs: 2,
      extraRuns: 2,
      isWicket: false,
      bowler,
      batsman: striker,
      event: label,
      inning,
      timestamp: Date.now(),
    };
    const nextDetailedBallHistory = [...detailedBallHistory, newDetailedBall];
    Object.assign(next, { detailedBallHistory: nextDetailedBallHistory });


    const statsUpdates = updatePlayerStats({
        bowlerName: bowler,
        runsConceded: 2,
        isExtra: true,
    });
    Object.assign(next, statsUpdates);
    if (statsUpdates.batsmenInning1) setBatsmenInning1(statsUpdates.batsmenInning1);
    if (statsUpdates.bowlersInning1) setBowlersInning1(statsUpdates.bowlersInning1);
    if (statsUpdates.batsmenInning2) setBatsmenInning2(statsUpdates.batsmenInning2);
    if (statsUpdates.bowlersInning2) setBowlersInning2(statsUpdates.bowlersInning2);
    setRuns(next.runs);
    setLastEvent(next.lastEvent);
    setBowlerRuns(next.bowlerRuns);
    if (label === "NO BALL") {
      setFreeHitPending(true);
    }
    setDetailedBallHistory(nextDetailedBallHistory);
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

    const newDetailedBall: DetailedBall = {
      over: overs,
      ball: balls,
      runs: totalAdded,
      extraRuns: 2,
      isWicket: false,
      bowler,
      batsman: striker,
      event: eventLabel,
      inning,
      timestamp: Date.now(),
    };
    const nextDetailedBallHistory = [...detailedBallHistory, newDetailedBall];
    Object.assign(next, { detailedBallHistory: nextDetailedBallHistory });


    const statsUpdates = updatePlayerStats({
        bowlerName: bowler,
        runsConceded: totalAdded,
        isExtra: true,
    });
    Object.assign(next, statsUpdates);
    if (statsUpdates.batsmenInning1) setBatsmenInning1(statsUpdates.batsmenInning1);
    if (statsUpdates.bowlersInning1) setBowlersInning1(statsUpdates.bowlersInning1);
    if (statsUpdates.batsmenInning2) setBatsmenInning2(statsUpdates.batsmenInning2);
    if (statsUpdates.bowlersInning2) setBowlersInning2(statsUpdates.bowlersInning2);
    setRuns(next.runs);
    setLastEvent(next.lastEvent);
    setBowlerRuns(next.bowlerRuns);
    setFreeHitPending(true);
    setDetailedBallHistory(nextDetailedBallHistory);
    await syncScore(next);

    if (inning === 2 && target && nextRuns >= target) {
      alert(`MATCH OVER! ${battingTeam} won!`);
      handleMatchCompletion(battingTeam);
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
    setDetailedBallHistory(prev.detailedBallHistory || []);
    setPendingBatsmanReplacements(prev.pendingBatsmanReplacements || 0);
    setBatsmenInning1(prev.batsmenInning1 || []);
    setBowlersInning1(prev.bowlersInning1 || []);
    setBatsmenInning2(prev.batsmenInning2 || []);
    setBowlersInning2(prev.bowlersInning2 || []);

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
    setPendingBatsmanReplacements(0);
    setBatsmenInning1([]);
    setBowlersInning1([]);
    setBatsmenInning2([]);
    setBowlersInning2([]);
    setDetailedBallHistory([]);

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
        batsmenInning2: [],
        bowlersInning2: [],
        detailedBallHistory,
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
      setBatsmenInning2([]);
      setBowlersInning2([]);

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
        batsmenInning2: [],
        bowlersInning2: [],
        detailedBallHistory,
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
      setBatsmenInning2([]);
      setBowlersInning2([]);

      await syncScore(next);
    }
  };

  const saveTeamsAndPlayers = async () => {
    await syncScore({});
  };

  const handleMatchCompletion = async (winningTeamName?: string) => {
    if (!sessionToken) return;

    try {
      const winner = registrations?.find(r => r.teamName === winningTeamName);

      const fScoreA = inning === 1 
        ? { runs, wickets, overs, balls } 
        : (firstInningScore || { runs: 0, wickets: 0, overs: 0, balls: 0 });
      
      await completeMatch({
        token: sessionToken,
        matchId: matchId as any,
        teamAName: battingTeam,
        teamBName: bowlingTeam,
        winnerId: winner?._id,
        finalScoreA: fScoreA,
        finalScoreB: inning === 2 ? { runs, wickets, overs, balls } : undefined,
      });

      toast({
        title: "Success",
        description: "Match finalized successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to finalize match",
        variant: "destructive"
      });
    }
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
    <div className="min-h-screen bg-background">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 font-display text-xl font-bold">
              <Activity className="h-6 w-6 text-primary" />
              <span>Scorer Panel</span>
            </Link>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
              <Zap className="h-3 w-3 text-yellow-500" />
              Live Sync Active
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
               <Trophy className="h-4 w-4 text-primary" />
               <span className="text-sm font-bold text-primary">Inn {inning}</span>
            </div>
            <Button 
              variant={showScoreboardOnDisplay ? "destructive" : "default"} 
              size="sm"
              className="hidden sm:flex gap-2"
              onClick={() => {
                const nextVal = !showScoreboardOnDisplay;
                setShowScoreboardOnDisplay(nextVal);
                syncScore({ showScoreboard: nextVal });
              }}
            >
              <BarChart3 className="w-4 h-4" /> 
              {showScoreboardOnDisplay ? "Stop Display" : "Broadcast"}
            </Button>
            <Button onClick={handleReset} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
               <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl py-6 space-y-6">
        
        {/* MATCH SELECTION & SWAP INNINGS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* MATCH SELECTION SECTION */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-6 py-3 flex justify-between items-center">
                 <h3 className="text-sm font-bold flex items-center gap-2">
                   <LayoutDashboard className="h-4 w-4 text-primary" /> Select Match
                 </h3>
                 {matchId && (
                   <span className="text-[10px] font-black uppercase bg-primary/20 text-primary px-2 py-0.5 rounded">
                     Currently Scoring
                   </span>
                 )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Filter by Category</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Select Match</Label>
                    <Select 
                      value={matchId || ""} 
                      onValueChange={async (id) => {
                        const selected = matches.find(m => m._id === id);
                        if (selected) {
                          setMatchId(selected._id);
                          setBattingTeam(selected.teamAName);
                          setBowlingTeam(selected.teamBName);
                          if (confirm(`Start scoring for ${selected.teamAName} vs ${selected.teamBName}?`)) {
                             await startMatch({ token: sessionToken, matchId: selected._id as any });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue placeholder="Choose a match..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(cat => selectedCategoryId === "all" || cat.id === selectedCategoryId)
                          .map(cat => {
                            const catMatches = matches.filter(m => m.categoryId === cat.id && m.status !== "completed");
                            if (catMatches.length === 0) return null;
                            return (
                              <Fragment key={cat.id}>
                                <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground bg-muted/50 rounded-md my-1">
                                  {cat.label}
                                </div>
                                {catMatches.map(m => (
                                  <SelectItem key={m._id} value={m._id}>
                                    {m.teamAName} vs {m.teamBName} {m.date ? `(${m.date})` : ""}
                                  </SelectItem>
                                ))}
                              </Fragment>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-end gap-2">
                    <Button 
                      onClick={handleInningChange} 
                      variant="outline" 
                      className="w-full h-10 gap-2 border-primary/50 text-primary hover:bg-primary/5"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {inning === 1 ? "Switch to 2nd Inn" : "Return to 1st Inn"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Manual Batting Team</Label>
                    <Select value={battingTeam} onValueChange={setBattingTeam}>
                      <SelectTrigger className="bg-muted/30 border-border h-10">
                        <SelectValue placeholder="Select Batting Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBattingOptions.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Manual Bowling Team</Label>
                    <Select value={bowlingTeam} onValueChange={setBowlingTeam}>
                      <SelectTrigger className="bg-muted/30 border-border h-10">
                        <SelectValue placeholder="Select Bowling Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBowlingOptions.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                   <Button onClick={saveTeamsAndPlayers} variant="outline" size="sm" className="text-[10px] font-bold uppercase h-8 border-primary/30 text-primary hover:bg-primary/5">
                     Save Teams
                   </Button>
                </div>
              </div>
            </div>

            {/* LIVE SCORE CONSOLE */}
            <div className="rounded-2xl border border-primary/30 bg-card shadow-xl overflow-hidden relative">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="p-8 space-y-8 relative">
                {/* Score and Progress */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
                      <span>{battingTeam || "Select Team"}</span>
                      {inning === 2 && target && (
                        <>
                          <ChevronRight className="h-3 w-3" />
                          <span className="text-yellow-500 font-bold">Target {target}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 sm:gap-4">
                      <h1 className="text-5xl sm:text-7xl font-display font-black text-foreground tabular-nums">
                        {runs}<span className="text-primary text-3xl sm:text-5xl">/{wickets}</span>
                      </h1>
                      <div className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-muted border border-border text-[10px] sm:text-sm font-bold text-muted-foreground">
                        {overs}.{balls} <span className="hidden xs:inline">Overs</span>
                      </div>
                    </div>
                  </div>

                  {/* Ball by Ball over view */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">This Over</span>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const ballText = ballHistory[i] || "";
                        const isCurrent = i === balls;
                        const isPast = i < balls;
                        return (
                          <div 
                            key={i} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 
                              ${isCurrent ? 'border-primary bg-primary/10 scale-110 shadow-lg shadow-primary/20' : 
                                isPast ? 'border-muted bg-muted/30 text-muted-foreground' : 
                                'border-dashed border-border text-border opacity-50'}
                              ${ballText.includes('W') ? 'bg-destructive/10 border-destructive text-destructive' : ''}
                              ${ballText.includes('4') || ballText.includes('6') ? 'bg-primary/20 border-primary text-primary' : ''}
                              ${ballText.includes('⚡') ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : ''}
                            `}
                          >
                            {ballText.replace('⚡', '') || (i + 1)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Player Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Batsmen */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground border-b border-border/50 pb-2">
                       <span>On Strike</span>
                       <span>Score (Balls)</span>
                    </div>
                    <div className="space-y-3">
                      <div className={`flex justify-between items-center ${!striker ? 'opacity-50' : ''}`}>
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="font-bold text-sm truncate max-w-[120px]">{striker || "Striker"}</span>
                         </div>
                         <span className="font-mono text-xs font-bold tabular-nums">
                            {strikerRuns}<span className="text-muted-foreground font-normal">({strikerBalls})</span>
                         </span>
                      </div>
                      <div className={`flex justify-between items-center ${!nonStriker ? 'opacity-50' : ''}`}>
                         <div className="flex items-center gap-2 opacity-70">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                            <span className="text-sm truncate max-w-[120px]">{nonStriker || "Non-Striker"}</span>
                         </div>
                         <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            {nonStrikerRuns}<span>({nonStrikerBalls})</span>
                         </span>
                      </div>
                    </div>
                  </div>

                  {/* Bowler */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground border-b border-border/50 pb-2">
                       <span>Current Bowler</span>
                       <span>Figures</span>
                    </div>
                    <div className={`flex justify-between items-center pt-1 ${!bowler ? 'opacity-50' : ''}`}>
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-neon-orange" />
                          <span className="font-bold text-sm truncate max-w-[120px] text-neon-orange">{bowler || "Bowler"}</span>
                       </div>
                       <div className="text-right">
                         <span className="font-mono text-xs font-bold tabular-nums">
                            {bowlerWickets}<span className="text-muted-foreground font-normal">-{bowlerRuns}</span>
                         </span>
                         <p className="text-[10px] text-muted-foreground font-medium">{Math.floor(bowlerBalls / 6)}.{bowlerBalls % 6} Overs</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* CONTROLS SECTION */}
                <div className={`rounded-xl border p-4 sm:p-6 space-y-4 sm:space-y-6 transition-all ${isSuperBall && canScore ? "border-yellow-400/60 bg-yellow-500/5 shadow-[0_0_40px_-10px_rgba(234,179,8,0.3)]" : "border-border bg-muted/30"}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                       <Zap className={`h-4 w-4 sm:h-5 sm:w-5 ${isSuperBall ? 'text-yellow-400 fill-yellow-400 animate-pulse' : 'text-muted-foreground'}`} />
                       <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isSuperBall ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                         {isSuperBall ? "⚡ Super Ball" : freeHitPending ? "🟢 Free Hit" : "Regular"}
                       </span>
                    </div>
                    <Button 
                      onClick={handleUndo} 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground h-7 gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase px-2"
                    >
                      <RotateCcw className="h-3 w-3" /> <span className="hidden xs:inline">Undo Last</span><span className="xs:hidden">Undo</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <Button
                        key={n}
                        disabled={!canScore}
                        onClick={() => isSuperBall ? handleRuns(n, true) : handleRuns(n)}
                        className={`h-12 sm:h-16 text-lg sm:text-xl font-black rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-30
                          ${isSuperBall && canScore && n > 0
                            ? "bg-yellow-400 text-black hover:bg-yellow-300 ring-2 ring-yellow-400/20"
                            : n === 4 || n === 6 
                              ? "bg-primary text-white hover:bg-primary/90" 
                              : "bg-background border border-border text-foreground hover:bg-muted"
                          }`}
                      >
                        {isSuperBall && canScore && n > 0 ? (
                          <div className="flex flex-col items-center leading-none">
                            <span className="text-sm sm:text-base">{n}</span>
                            <span className="text-[8px] sm:text-[10px] opacity-70">→{n * 2}</span>
                          </div>
                        ) : n}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <Button
                      disabled={!canScore || (freeHitPending && !isSuperBall)}
                      onClick={() => isSuperBall ? handleWicket(true) : handleWicket()}
                      variant="destructive"
                      className="h-12 sm:h-14 text-[10px] sm:text-sm font-black uppercase tracking-wider rounded-xl shadow-lg shadow-destructive/20 active:scale-95 disabled:opacity-30"
                    >
                      {freeHitPending && !isSuperBall ? (
                         <span className="flex items-center gap-1.5"><Info className="h-4 w-4" /> Free Hit</span>
                      ) : isSuperBall && canScore ? (
                         <span className="flex flex-col items-center"><span>Double Wicket</span><span className="text-[8px] opacity-70 uppercase">⚡ Super Ball</span></span>
                      ) : "Wicket"}
                    </Button>
                    
                    <Button 
                      disabled={!canScore} 
                      onClick={() => handleExtra("WIDE")} 
                      variant="outline" 
                      className="h-12 sm:h-14 border-neon-orange/40 text-neon-orange hover:bg-neon-orange/10 text-[10px] sm:text-sm font-black uppercase tracking-wider rounded-xl active:scale-95 disabled:opacity-30"
                    >
                      Wide <span className="ml-1 opacity-60 text-[8px] sm:text-xs">(2)</span>
                    </Button>

                    {isSuperBall && canScore ? (
                      <div className="flex flex-row sm:flex-col gap-1">
                        <Button 
                          disabled={!canScore} 
                          onClick={() => handleExtra("NO BALL")} 
                          variant="outline" 
                          className="h-12 sm:h-8 flex-1 sm:flex-none border-neon-yellow/40 text-neon-yellow hover:bg-neon-yellow/10 font-black uppercase tracking-tighter text-[9px] rounded-xl sm:rounded-lg active:scale-95"
                        >
                          NB (2 only)
                        </Button>
                        <Select onValueChange={(v) => handleNoBallWithRuns(Number(v), true)}>
                           <SelectTrigger className="h-12 sm:h-8 flex-1 sm:flex-none bg-yellow-400/10 border-yellow-400/30 text-yellow-400 text-[9px] font-black uppercase rounded-xl sm:rounded-lg">
                              <SelectValue placeholder="NB + RUNS" />
                           </SelectTrigger>
                           <SelectContent>
                              {[1, 2, 3, 4, 6].map(r => (
                                <SelectItem key={r} value={r.toString()}>NB + {r} ({2 + r})</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <Button 
                        disabled={!canScore} 
                        onClick={() => handleExtra("NO BALL")} 
                        variant="outline" 
                        className="h-12 sm:h-14 border-neon-yellow/40 text-neon-yellow hover:bg-neon-yellow/10 text-[10px] sm:text-sm font-black uppercase tracking-wider rounded-xl active:scale-95 disabled:opacity-30"
                      >
                        No Ball <span className="ml-1 opacity-60 text-[8px] sm:text-xs">(2)</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* STATUS FOOTER */}
              <div className="bg-muted/50 px-8 py-3 border-t border-border/50 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                 <div className="flex items-center gap-4">
                    <span>Recent: {lastEvent || "None"}</span>
                    <span>Inning: {inning}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Real-time Sync</span>
                 </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR: TEAM MANAGEMENT & SUMMARY */}
          <div className="space-y-6">
            
            {/* PLAYER SELECTION CARD */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-6">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                 <UserCircle2 className="h-4 w-4 text-primary" /> Active Players
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Striker (On Strike)</Label>
                  <Select value={striker} onValueChange={setStriker}>
                    <SelectTrigger className="bg-muted/30 border-border">
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
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Non-Striker</Label>
                  <Select value={nonStriker} onValueChange={setNonStriker}>
                    <SelectTrigger className="bg-muted/30 border-border">
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

                <div className="space-y-2 pb-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Current Bowler</Label>
                  <Select value={bowler} onValueChange={setBowler}>
                    <SelectTrigger className="bg-muted/30 border-border">
                      <SelectValue placeholder="Select Bowler" />
                    </SelectTrigger>
                    <SelectContent>
                      {bowlingPlayers.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                  <Button onClick={swapBatsmenManual} variant="outline" size="sm" className="text-[10px] font-bold uppercase h-9 gap-1.5">
                    <ArrowRightLeft className="h-3 w-3" /> Swap Bat
                  </Button>
                  <Button onClick={saveTeamsAndPlayers} variant="outline" size="sm" className="text-[10px] font-bold uppercase h-9 gap-1.5 border-primary/20 text-primary">
                    Update All
                  </Button>
                </div>
              </div>
            </div>

            {/* QUICK STATS CARD */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                 <BarChart3 className="h-4 w-4 text-primary" /> Quick Review
              </h3>
              
              <div className="space-y-3">
                 <div className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-xs font-medium">Extra Runs</span>
                    <span className="text-xs font-bold">{bowlerRuns - (strikerRuns + nonStrikerRuns)}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-xs font-medium">Current RR</span>
                    <span className="text-xs font-bold text-primary">
                       {overs > 0 || balls > 0 ? (runs / ((overs * 6 + balls) / 6)).toFixed(2) : "0.00"}
                    </span>
                 </div>
                 <Button 
                   onClick={() => setIsSummaryModalOpen(true)} 
                   variant="secondary" 
                   className="w-full text-xs font-bold uppercase tracking-wider py-5"
                 >
                   Open Full Scorecard
                 </Button>

                 <Button 
                    onClick={() => setIsScoreBookOpen(true)} 
                    variant="outline" 
                    className="w-full text-xs font-bold uppercase tracking-wider py-5 border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Check Score Book
                  </Button>
                 
                 {isMatchOver && (
                   <Button 
                     onClick={() => handleMatchCompletion(inning === 2 && target && runs >= target ? battingTeam : bowlingTeam)} 
                     className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase"
                   >
                     Finalize & End Match
                   </Button>
                 )}
              </div>
            </div>

          </div>
        </div>
      </main>

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

      {/* Scoreboard Modal */}
      <MatchSummaryModal 
        isOpen={isSummaryModalOpen} 
        onClose={() => setIsSummaryModalOpen(false)} 
        data={{
          battingTeam,
          bowlingTeam,
          inning,
          runs,
          wickets,
          overs,
          balls,
          target,
          firstInningScore,
          batsmenInning1,
          bowlersInning1,
          batsmenInning2,
          bowlersInning2
        }}
      />
      {/* Score Book Modal */}
      <Dialog open={isScoreBookOpen} onOpenChange={setIsScoreBookOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 text-slate-50 border-primary/30">
          <div className="py-4">
            <ScoreBook 
              history={detailedBallHistory} 
              inning1Team={inning === 1 ? battingTeam : bowlingTeam}
              inning2Team={inning === 2 ? battingTeam : bowlingTeam}
              batsmenInning1={batsmenInning1}
              bowlersInning1={bowlersInning1}
              batsmenInning2={batsmenInning2}
              bowlersInning2={bowlersInning2}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsScoreBookOpen(false)} className="w-full">Close Score Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

