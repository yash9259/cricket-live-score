import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Calendar,
  MapPin,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  Trophy,
  Activity,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import MatchCard from "@/components/MatchCard";

const tabs = ["all", "live", "scheduled", "completed"] as const;

export default function MatchesPage() {
  const [tab, setTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const matches = useQuery(api.matches.list) ?? [];

  const filtered = matches.filter((m) => {
    if (tab === "all") return true;
    return m.status === tab;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-foreground mb-2">
            Match <span className="text-primary">Center</span>
          </h1>
          <p className="text-muted-foreground">Follow live scores and upcoming fixtures across all categories.</p>
        </div>

        <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-xl border border-border/50">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-lg gap-2"
          >
            <LayoutGrid className="h-4 w-4" /> Grid
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="rounded-lg gap-2"
          >
            <TableIcon className="h-4 w-4" /> Table
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${tab === t
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
          >
            {t === "live" && <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse mr-2" />}
            {t}
          </button>
        ))}
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <MatchCard match={m} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 text-left border-b border-border">
                  <th className="p-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Teams</th>
                  <th className="p-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="p-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                  <th className="p-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((match) => {
                  const isExpanded = expandedMatchId === match._id;
                  return (
                    <Fragment key={match._id}>
                      <tr className={`group transition-colors hover:bg-primary/5 ${isExpanded ? 'bg-primary/5' : ''}`}>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <span className="font-display font-bold text-base">{match.teamAName}</span>
                                  {(() => {
                                    const score = match.status === "completed"
                                      ? match.finalScoreA
                                      : (match.status === "live" && match.liveScore)
                                        ? (match.liveScore.battingTeam === match.teamAName
                                          ? { runs: match.liveScore.runs, wickets: match.liveScore.wickets, overs: match.liveScore.overs, balls: match.liveScore.balls }
                                          : (match.liveScore.bowlingTeam === match.teamAName && match.liveScore.inning === 2)
                                            ? match.liveScore.firstInningScore
                                            : null)
                                        : null;
                                    return score ? (
                                      <span className="text-xs font-bold text-primary">
                                        {score.runs}/{score.wickets} ({score.overs}.{score.balls})
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground/50">VS</span>
                                <div className="flex flex-col">
                                  <span className="font-display font-bold text-base">{match.teamBName}</span>
                                  {(() => {
                                    const score = match.status === "completed"
                                      ? match.finalScoreB
                                      : (match.status === "live" && match.liveScore)
                                        ? (match.liveScore.battingTeam === match.teamBName
                                          ? { runs: match.liveScore.runs, wickets: match.liveScore.wickets, overs: match.liveScore.overs, balls: match.liveScore.balls }
                                          : (match.liveScore.bowlingTeam === match.teamBName && match.liveScore.inning === 2)
                                            ? match.liveScore.firstInningScore
                                            : null)
                                        : null;
                                    return score ? (
                                      <span className="text-xs font-bold text-orange-500">
                                        {score.runs}/{score.wickets} ({score.overs}.{score.balls})
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(match.createdAt).toLocaleDateString()}</span>
                                <span className="md:hidden flex items-center gap-1"><Activity className="h-3 w-3" /> {match.categoryLabel}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 hidden md:table-cell">
                          <span className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-bold border border-border/50 text-muted-foreground uppercase">
                            {match.categoryLabel}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${match.status === "live"
                                ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse"
                                : match.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}>
                              {match.status === "live" && <span className="w-1 h-1 rounded-full bg-current" />}
                              {match.status === "completed" && match.winnerName ? `${match.winnerName} WON` : match.status}
                            </span>
                            {match.status === "completed" && match.manOfTheMatch && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold text-yellow-600 uppercase tracking-widest px-2">
                                <Zap className="h-2.5 w-2.5 fill-yellow-600" />
                                MOM: {match.manOfTheMatch}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-9 gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white transition-all ${isExpanded ? 'bg-primary text-white' : ''}`}
                            onClick={() => setExpandedMatchId(isExpanded ? null : match._id)}
                          >
                            {isExpanded ? (
                              <>Close Score <ChevronDown className="h-4 w-4" /></>
                            ) : (
                              <>View Score <ChevronRight className="h-4 w-4" /></>
                            )}
                          </Button>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={4} className="p-0 border-none bg-muted/5">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 md:p-8">
                                  <div className="flex items-center gap-2 mb-4">
                                    <Trophy className="h-4 w-4 text-primary" />
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Match Scoreboard</h4>
                                  </div>
                                  <ScoreboardTable matchId={match._id} />
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border mt-8">
          <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-muted-foreground opacity-20" />
          </div>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">No {tab} matches found at the moment.</p>
        </div>
      )}
    </div>
  );
}
