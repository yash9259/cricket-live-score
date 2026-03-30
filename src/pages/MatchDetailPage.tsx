import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { matches } from "@/lib/mockData";
import type { BallEvent } from "@/lib/mockData";

const ballColor = (type: BallEvent["type"]) => {
  switch (type) {
    case "four": return "bg-primary text-primary-foreground";
    case "six": return "bg-neon-yellow text-primary-foreground";
    case "wicket": return "bg-destructive text-destructive-foreground";
    case "wide": case "noball": return "bg-neon-orange/80 text-primary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const ballLabel = (e: BallEvent) => {
  if (e.type === "wicket") return "W";
  if (e.type === "wide") return "WD";
  if (e.type === "noball") return "NB";
  return String(e.runs);
};

export default function MatchDetailPage() {
  const { id } = useParams();
  const match = matches.find((m) => m.id === id);
  const [tab, setTab] = useState<"scorecard" | "timeline">("scorecard");

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Match not found.</p>
        <Link to="/matches" className="text-primary underline mt-4 inline-block">Back to Matches</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/matches" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Matches
      </Link>

      {/* Scoreboard Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 md:p-8"
      >
        {match.status === "live" && <span className="live-badge mb-4 inline-flex">LIVE</span>}
        {match.winner && <p className="text-primary font-semibold text-sm mb-3">🏆 {match.winner} won{match.mom ? ` • MoM: ${match.mom}` : ""}</p>}

        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 text-center">
            <p className="font-display text-xl md:text-2xl font-bold text-foreground">{match.teamA.name}</p>
            {match.scoreA && (
              <>
                <p className="font-display text-5xl md:text-6xl font-bold text-primary mt-2 neon-text-green">
                  {match.scoreA.runs}<span className="text-3xl text-muted-foreground">/{match.scoreA.wickets}</span>
                </p>
                <p className="text-muted-foreground mt-1">({match.scoreA.overs}.{match.scoreA.balls} ov)</p>
              </>
            )}
          </div>

          <span className="font-display text-2xl text-muted-foreground/50 font-bold">VS</span>

          <div className="flex-1 text-center">
            <p className="font-display text-xl md:text-2xl font-bold text-foreground">{match.teamB.name}</p>
            {match.scoreB && (
              <>
                <p className="font-display text-5xl md:text-6xl font-bold text-neon-orange mt-2">
                  {match.scoreB.runs}<span className="text-3xl text-muted-foreground">/{match.scoreB.wickets}</span>
                </p>
                <p className="text-muted-foreground mt-1">({match.scoreB.overs}.{match.scoreB.balls} ov)</p>
              </>
            )}
          </div>
        </div>

        {match.status === "live" && match.scoreA && match.scoreB && (
          <p className="text-center mt-4 text-sm text-neon-yellow font-semibold">
            {match.teamB.name} needs {match.scoreA.runs - match.scoreB.runs + 1} runs from {(match.overs * 6) - (match.scoreB.overs * 6 + match.scoreB.balls)} balls
          </p>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mt-8 mb-6">
        {(["scorecard", "timeline"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t === "scorecard" ? "Scorecard" : "Ball by Ball"}
          </button>
        ))}
      </div>

      {tab === "scorecard" && (
        <div className="grid gap-6 md:grid-cols-2">
          {[match.teamA, match.teamB].map((team) => (
            <div key={team.id} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-lg font-bold text-foreground mb-4">{team.name} — Batting</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left border-b border-border">
                      <th className="pb-2 font-medium">Batsman</th>
                      <th className="pb-2 font-medium text-right">R</th>
                      <th className="pb-2 font-medium text-right">B</th>
                      <th className="pb-2 font-medium text-right">4s</th>
                      <th className="pb-2 font-medium text-right">6s</th>
                      <th className="pb-2 font-medium text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.players.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2 text-foreground">
                          {p.name}
                          {p.isOut && <span className="text-xs text-muted-foreground ml-1">({p.howOut})</span>}
                        </td>
                        <td className="py-2 text-right font-semibold text-foreground">{p.runs}</td>
                        <td className="py-2 text-right text-muted-foreground">{p.balls}</td>
                        <td className="py-2 text-right text-muted-foreground">{p.fours}</td>
                        <td className="py-2 text-right text-muted-foreground">{p.sixes}</td>
                        <td className="py-2 text-right text-muted-foreground">{p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="font-display text-md font-bold text-foreground mt-6 mb-3">Bowling</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left border-b border-border">
                      <th className="pb-2 font-medium">Bowler</th>
                      <th className="pb-2 font-medium text-right">O</th>
                      <th className="pb-2 font-medium text-right">R</th>
                      <th className="pb-2 font-medium text-right">W</th>
                      <th className="pb-2 font-medium text-right">Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.players.filter((p) => p.overs > 0).map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2 text-foreground">{p.name}</td>
                        <td className="py-2 text-right text-muted-foreground">{p.overs}</td>
                        <td className="py-2 text-right text-muted-foreground">{p.runsConceded}</td>
                        <td className="py-2 text-right font-semibold text-foreground">{p.wickets}</td>
                        <td className="py-2 text-right text-muted-foreground">{p.overs > 0 ? (p.runsConceded / p.overs).toFixed(1) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "timeline" && match.ballByBall && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground mb-4">Ball-by-Ball</h3>
          {Object.entries(
            match.ballByBall.reduce<Record<number, BallEvent[]>>((acc, b) => {
              (acc[b.over] = acc[b.over] || []).push(b);
              return acc;
            }, {})
          ).map(([over, balls]) => (
            <div key={over} className="mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">Over {over}</p>
              <div className="flex flex-wrap gap-2">
                {balls.map((b, i) => (
                  <span key={i} className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${ballColor(b.type)}`}>
                    {ballLabel(b)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
