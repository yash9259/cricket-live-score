import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Match } from "@/lib/mockData";

export default function MatchCard({ match }: { match: Match }) {
  const statusColors: Record<string, string> = {
    live: "bg-destructive text-destructive-foreground",
    upcoming: "bg-neon-yellow text-primary-foreground",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <Link to={`/match/${match.id}`}>
      <div className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        {/* Status badge */}
        <div className="flex justify-between items-center mb-4">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusColors[match.status]}`}>
            {match.status === "live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />}
            {match.status}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {match.venue}
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="font-display text-lg font-bold text-foreground">{match.teamA.name}</p>
            {match.scoreA && (
              <p className="font-display text-2xl font-bold text-primary mt-1">
                {match.scoreA.runs}/{match.scoreA.wickets}
                <span className="text-sm text-muted-foreground ml-2">
                  ({match.scoreA.overs}.{match.scoreA.balls})
                </span>
              </p>
            )}
          </div>

          <span className="font-display text-lg text-muted-foreground font-bold">VS</span>

          <div className="flex-1 text-center">
            <p className="font-display text-lg font-bold text-foreground">{match.teamB.name}</p>
            {match.scoreB && (
              <p className="font-display text-2xl font-bold text-neon-orange mt-1">
                {match.scoreB.runs}/{match.scoreB.wickets}
                <span className="text-sm text-muted-foreground ml-2">
                  ({match.scoreB.overs}.{match.scoreB.balls})
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {match.date}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {match.time}</span>
        </div>

        {match.winner && (
          <p className="text-center text-sm font-semibold text-primary mt-2">
            🏆 {match.winner} won
          </p>
        )}
      </div>
    </Link>
  );
}
