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
      <div className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        {/* Status badge */}
        <div className="flex justify-between items-center mb-4">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusColors[match.status]}`}>
            {match.status === "live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />}
            {match.status}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Bhuj, Kutch
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          {[
            { name: match.teamAName, color: "text-primary" },
            { name: match.teamBName, color: "text-neon-orange" }
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

            return (
              <Fragment key={team.name}>
                <div className="flex-1 text-center">
                  <p className="font-display text-lg font-bold text-foreground">{team.name}</p>
                  {score && (
                    <p className={`font-display text-2xl font-bold ${team.color} mt-1`}>
                      {score.runs}/{score.wickets}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({score.overs}.{score.balls})
                      </span>
                    </p>
                  )}
                </div>
                {idx === 0 && <span className="font-display text-lg text-muted-foreground font-bold">VS</span>}
              </Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {match.date || "TBD"}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {match.time || "TBD"}</span>
        </div>

        <div className="flex flex-col items-center gap-2 mt-4 pt-3 border-t border-border">
          {match.winnerName && (
            <p className="text-center text-sm font-black uppercase tracking-widest text-emerald-500">
              🏆 {match.winnerName} won
            </p>
          )}
          {match.manOfTheMatch && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest">
               <Zap className="h-3 w-3 fill-yellow-500" />
               <span>MOM: {match.manOfTheMatch}</span>
            </div>
          )}
        </div>
        
        {(match.tossWinner || match.liveScore?.tossWinner) && (
          <div className="mt-2 text-[10px] text-center text-muted-foreground font-medium italic">
            Toss: {match.tossWinner || match.liveScore?.tossWinner} chose to {match.tossDecision || match.liveScore?.tossDecision}
          </div>
        )}
      </div>
    </Link>
  );
}
