import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Zap } from "lucide-react";

export default function MatchCard({ match }: { match: any }) {
  const statusColors: Record<string, string> = {
    live: "bg-destructive text-destructive-foreground",
    scheduled: "bg-neon-yellow text-primary-foreground",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <Link to={`/match/${match._id}`}>
      <div className="group relative rounded-xl border border-border bg-card hover:bg-muted/50 transition-all hover:shadow-md">
        {/* Match Header */}
        <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-muted/20">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {match.categoryLabel || "Match Detail"} • Bhuj
          </p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${match.status === 'live' ? 'text-red-500' : 'text-muted-foreground'}`}>
            {match.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />}
            {match.status}
          </span>
        </div>

        {/* Teams Area */}
        <div className="p-4 space-y-3">
          {[
            { name: match.teamAName, color: "text-foreground" },
            { name: match.teamBName, color: "text-foreground" }
          ].map((team, idx) => {
            const score = match.status === "completed" 
              ? (idx === 0 ? match.finalScoreA : match.finalScoreB)
              : (match.status === "live" && match.liveScore)
                ? (team.name === match.liveScore.battingTeam 
                  ? { runs: match.liveScore.runs, wickets: match.liveScore.wickets, overs: match.liveScore.overs, balls: match.liveScore.balls }
                  : (team.name === match.liveScore.bowlingTeam && match.liveScore.inning === 2)
                    ? match.liveScore.firstInningScore
                    : null)
                : null;

            const isBatting = match.status === "live" && match.liveScore?.battingTeam === team.name;

            return (
              <div key={team.name + idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <p className={`font-display text-lg font-bold truncate ${isBatting ? 'text-primary' : 'text-foreground'}`}>
                    {team.name}
                    {isBatting && <span className="ml-2 text-[10px] uppercase text-primary animate-pulse font-black">● Batting</span>}
                  </p>
                </div>
                {score ? (
                  <p className="font-display text-xl font-black text-foreground tabular-nums">
                    {score.runs}/{score.wickets}
                    <span className="text-xs text-muted-foreground font-medium ml-1.5">
                      ({score.overs}.{score.balls})
                    </span>
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest italic opacity-40">Yet to bat</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Match Footer / Result */}
        <div className="px-4 py-3 border-t border-border bg-muted/5">
          {match.status === "completed" && match.winnerName ? (
            <p className="text-xs font-bold text-primary uppercase tracking-wide">
              {match.winnerName} won by {match.resultMessage || "clear margin"}
            </p>
          ) : match.status === "live" ? (
            <p className="text-xs font-medium text-primary uppercase tracking-wide">
               {match.liveScore?.lastEvent || "Match in progress..."}
            </p>
          ) : (
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
               <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {match.date || "TBD"}</span>
               <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {match.time || "TBD"}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
