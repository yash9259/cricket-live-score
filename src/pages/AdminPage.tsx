import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Zap, CheckCircle, XCircle, Eye } from "lucide-react";
import { teams, matches } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

type Tab = "dashboard" | "teams" | "matches";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
      <p className="text-muted-foreground mb-8">Manage teams, matches, and tournament settings</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {(["dashboard", "teams", "matches"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      {tab === "teams" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">Team</th>
                  <th className="p-4 font-medium">Captain</th>
                  <th className="p-4 font-medium">Players</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-semibold text-foreground">{t.name}</td>
                    <td className="p-4 text-muted-foreground">{t.captain}</td>
                    <td className="p-4 text-muted-foreground">{t.players.length}</td>
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
                          <Button size="sm" className="h-7 bg-primary text-primary-foreground hover:bg-primary/90"><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-destructive hover:bg-destructive/10"><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-muted-foreground"><Eye className="h-3 w-3 mr-1" /> View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === "matches" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg font-bold text-foreground">All Matches</h3>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">+ Create Match</Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
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
        </motion.div>
      )}
    </div>
  );
}
