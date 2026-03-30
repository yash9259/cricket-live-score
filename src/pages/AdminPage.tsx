import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Trophy, Zap, CheckCircle, XCircle, Eye, LogOut,
  ChevronDown, ChevronRight, Calendar, UserCheck, Baby, User
} from "lucide-react";
import { teams, matches, tournamentYears, getTeamsByYear, getDemographics } from "@/lib/mockData";
import type { Team, Player } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import LoginPage from "./LoginPage";

type Tab = "dashboard" | "teams" | "matches" | "tournament";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [expandedYear, setExpandedYear] = useState<number | null>(2026);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const allPlayers = teams.flatMap((t) => t.players);
  const globalDemographics = getDemographics(allPlayers);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-4xl font-bold text-foreground">Admin Panel</h1>
        <Button variant="ghost" onClick={() => setIsLoggedIn(false)} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
      <p className="text-muted-foreground mb-8">Manage teams, matches, and tournament data</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(["dashboard", "tournament", "teams", "matches"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Teams", value: teams.length, icon: Users, color: "text-primary" },
              { label: "Pending", value: teams.filter((t) => t.status === "pending").length, icon: Zap, color: "text-neon-yellow" },
              { label: "Total Matches", value: matches.length, icon: Trophy, color: "text-neon-orange" },
              { label: "Live Now", value: matches.filter((m) => m.status === "live").length, icon: Zap, color: "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-5">
                <s.icon className={`h-6 w-6 ${s.color} mb-2`} />
                <p className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Demographics overview */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-xl font-bold text-foreground mb-4">📊 Player Demographics (All Years)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DemographicCard icon={Users} label="Total Players" value={globalDemographics.total} color="text-primary" />
              <DemographicCard icon={Baby} label="Children (Under 15)" value={globalDemographics.childrenUnder15} color="text-neon-yellow" />
              <DemographicCard icon={UserCheck} label="Boys (15+)" value={globalDemographics.boysOver15} color="text-neon-orange" />
              <DemographicCard icon={User} label="Ladies" value={globalDemographics.ladies} color="text-pink-400" />
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">🟢 Thunder Strikers vs Royal Warriors — <span className="text-destructive font-semibold">LIVE</span></p>
              <p className="text-muted-foreground">📝 Eagle XI — Registration pending approval</p>
              <p className="text-muted-foreground">📝 Night Riders — Registration pending approval</p>
              <p className="text-muted-foreground">✅ Thunder Strikers won vs Storm Blazers</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* TOURNAMENT — Year → Team → Players hierarchy */}
      {tab === "tournament" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" /> Tournament History
          </h2>

          {tournamentYears.map((year) => {
            const yearTeams = getTeamsByYear(year);
            const yearPlayers = yearTeams.flatMap((t) => t.players);
            const yearDemo = getDemographics(yearPlayers);
            const isYearOpen = expandedYear === year;

            return (
              <div key={year} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Year header */}
                <button
                  onClick={() => setExpandedYear(isYearOpen ? null : year)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {isYearOpen ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    <div className="text-left">
                      <p className="font-display text-2xl font-bold text-foreground">
                        <span className="text-primary">{year}</span> Tournament
                      </p>
                      <p className="text-sm text-muted-foreground">{yearTeams.length} teams • {yearPlayers.length} players</p>
                    </div>
                  </div>
                  <div className="hidden md:flex gap-6 text-sm">
                    <span className="text-neon-yellow font-semibold">👶 {yearDemo.childrenUnder15} Under 15</span>
                    <span className="text-neon-orange font-semibold">👦 {yearDemo.boysOver15} Boys 15+</span>
                    <span className="text-pink-400 font-semibold">👩 {yearDemo.ladies} Ladies</span>
                  </div>
                </button>

                {/* Year demographics on mobile */}
                <AnimatePresence>
                  {isYearOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Mobile demographics */}
                      <div className="md:hidden grid grid-cols-3 gap-3 px-5 pb-3">
                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                          <p className="text-xs text-muted-foreground">Under 15</p>
                          <p className="font-display text-lg font-bold text-neon-yellow">{yearDemo.childrenUnder15}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                          <p className="text-xs text-muted-foreground">Boys 15+</p>
                          <p className="font-display text-lg font-bold text-neon-orange">{yearDemo.boysOver15}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                          <p className="text-xs text-muted-foreground">Ladies</p>
                          <p className="font-display text-lg font-bold text-pink-400">{yearDemo.ladies}</p>
                        </div>
                      </div>

                      {/* Teams list */}
                      <div className="border-t border-border">
                        {yearTeams.map((team) => {
                          const teamDemo = getDemographics(team.players);
                          const isTeamOpen = expandedTeam === team.id;

                          return (
                            <div key={team.id} className="border-b border-border/50 last:border-b-0">
                              {/* Team header */}
                              <button
                                onClick={() => setExpandedTeam(isTeamOpen ? null : team.id)}
                                className="w-full flex items-center justify-between p-4 pl-12 hover:bg-muted/20 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {isTeamOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                  <div className="text-left">
                                    <p className="font-semibold text-foreground flex items-center gap-2">
                                      {team.name}
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                                        team.status === "approved" ? "bg-primary/20 text-primary" :
                                        team.status === "pending" ? "bg-neon-yellow/20 text-neon-yellow" :
                                        "bg-destructive/20 text-destructive"
                                      }`}>{team.status}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">Captain: {team.captain} • {team.players.length} players</p>
                                  </div>
                                </div>
                                <div className="hidden md:flex gap-4 text-xs">
                                  <span className="text-neon-yellow">👶 {teamDemo.childrenUnder15}</span>
                                  <span className="text-neon-orange">👦 {teamDemo.boysOver15}</span>
                                  <span className="text-pink-400">👩 {teamDemo.ladies}</span>
                                </div>
                              </button>

                              {/* Players table */}
                              <AnimatePresence>
                                {isTeamOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    {/* Team demographics cards (mobile) */}
                                    <div className="md:hidden grid grid-cols-3 gap-2 px-12 pb-3">
                                      <div className="rounded bg-muted/30 p-1.5 text-center">
                                        <p className="text-[10px] text-muted-foreground">U-15</p>
                                        <p className="font-bold text-neon-yellow">{teamDemo.childrenUnder15}</p>
                                      </div>
                                      <div className="rounded bg-muted/30 p-1.5 text-center">
                                        <p className="text-[10px] text-muted-foreground">Boys</p>
                                        <p className="font-bold text-neon-orange">{teamDemo.boysOver15}</p>
                                      </div>
                                      <div className="rounded bg-muted/30 p-1.5 text-center">
                                        <p className="text-[10px] text-muted-foreground">Ladies</p>
                                        <p className="font-bold text-pink-400">{teamDemo.ladies}</p>
                                      </div>
                                    </div>

                                    <div className="px-12 pb-4">
                                      <div className="rounded-lg border border-border overflow-hidden">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="bg-muted/50 text-muted-foreground text-left">
                                              <th className="p-3 font-medium">#</th>
                                              <th className="p-3 font-medium">Player Name</th>
                                              <th className="p-3 font-medium">Age</th>
                                              <th className="p-3 font-medium">Category</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {team.players.map((player, idx) => (
                                              <tr key={player.id} className="border-t border-border/30 hover:bg-muted/10">
                                                <td className="p-3 text-muted-foreground">{idx + 1}</td>
                                                <td className="p-3 font-medium text-foreground">{player.name}</td>
                                                <td className="p-3 text-muted-foreground">{player.age}</td>
                                                <td className="p-3">
                                                  <PlayerBadge player={player} />
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      {/* Summary row */}
                                      <div className="flex gap-4 mt-3 text-xs">
                                        <span className="rounded-full bg-neon-yellow/10 text-neon-yellow px-3 py-1 font-semibold">
                                          👶 Under 15: {teamDemo.childrenUnder15}
                                        </span>
                                        <span className="rounded-full bg-neon-orange/10 text-neon-orange px-3 py-1 font-semibold">
                                          👦 Boys 15+: {teamDemo.boysOver15}
                                        </span>
                                        <span className="rounded-full bg-pink-400/10 text-pink-400 px-3 py-1 font-semibold">
                                          👩 Ladies: {teamDemo.ladies}
                                        </span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* TEAMS */}
      {tab === "teams" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-4 font-medium">Team</th>
                    <th className="p-4 font-medium">Year</th>
                    <th className="p-4 font-medium">Captain</th>
                    <th className="p-4 font-medium">Players</th>
                    <th className="p-4 font-medium">U-15</th>
                    <th className="p-4 font-medium">Boys</th>
                    <th className="p-4 font-medium">Ladies</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => {
                    const demo = getDemographics(t.players);
                    return (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-4 font-semibold text-foreground">{t.name}</td>
                        <td className="p-4 text-primary font-display font-bold">{t.year}</td>
                        <td className="p-4 text-muted-foreground">{t.captain}</td>
                        <td className="p-4 text-muted-foreground">{t.players.length}</td>
                        <td className="p-4 text-neon-yellow font-semibold">{demo.childrenUnder15}</td>
                        <td className="p-4 text-neon-orange font-semibold">{demo.boysOver15}</td>
                        <td className="p-4 text-pink-400 font-semibold">{demo.ladies}</td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                            t.status === "approved" ? "bg-primary/20 text-primary" :
                            t.status === "pending" ? "bg-neon-yellow/20 text-neon-yellow" :
                            "bg-destructive/20 text-destructive"
                          }`}>{t.status}</span>
                        </td>
                        <td className="p-4 flex gap-2">
                          {t.status === "pending" && (
                            <>
                              <Button size="sm" className="h-7 bg-primary text-primary-foreground hover:bg-primary/90">
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-destructive hover:bg-destructive/10">
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-muted-foreground">
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* MATCHES */}
      {tab === "matches" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg font-bold text-foreground">All Matches</h3>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">+ Create Match</Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-4 font-medium">Match</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Overs</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-4 font-semibold text-foreground">{m.teamA.name} vs {m.teamB.name}</td>
                      <td className="p-4 text-muted-foreground">{m.date} {m.time}</td>
                      <td className="p-4 text-muted-foreground">{m.overs}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                          m.status === "live" ? "bg-destructive/20 text-destructive" :
                          m.status === "upcoming" ? "bg-neon-yellow/20 text-neon-yellow" :
                          "bg-muted text-muted-foreground"
                        }`}>{m.status}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{m.winner || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DemographicCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 text-center">
      <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
      <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function PlayerBadge({ player }: { player: Player }) {
  if (player.age < 15) {
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neon-yellow/20 text-neon-yellow">👶 Under 15</span>;
  }
  if (player.gender === "female") {
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-400/20 text-pink-400">👩 Lady</span>;
  }
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neon-orange/20 text-neon-orange">👦 Boy 15+</span>;
}
