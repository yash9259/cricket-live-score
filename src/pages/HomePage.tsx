import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { Trophy, Users, Zap, ChevronRight } from "lucide-react";
import { matches, topBatsmen, topBowlers } from "@/lib/mockData";
import { api } from "../../convex/_generated/api";
import MatchCard from "@/components/MatchCard";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function HomePage() {
  const liveMatches = matches.filter((m) => m.status === "live");
  const recentMatches = matches.filter((m) => m.status === "completed").slice(0, 4);
  const liveScore = useQuery(api.liveScore.getCurrent);
  const registrationStats = useQuery(api.registrations.registrationStats);
  const heroImage = {
    src: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=2000&q=80",
    alt: "Cricket ball on green grass",
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroImage.src}
          alt={heroImage.alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/55 to-neon-orange/20" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
              <Zap className="h-4 w-4" />
              {liveScore
                ? `${liveScore.battingTeam} ${liveScore.runs}/${liveScore.wickets} (${liveScore.overs}.${liveScore.balls})`
                : "Season 2026 — Live Now"}
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-foreground">
              VAGAD RAGHUVANSHI PARIVAR - BHUJ <br />
              <span className="text-primary neon-text-green">BOX CRICKET</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Experience thrilling box cricket action. Register your team, follow live scores, and compete for glory!
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/register">
                <Button size="lg" className="font-display text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90">
                  Register Team
                </Button>
              </Link>
              <Link to="/matches">
                <Button size="lg" variant="outline" className="font-display text-lg px-8 border-primary/30 text-primary hover:bg-primary/10">
                  View Matches <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="border-b border-border bg-card/50 py-6">
        <div className="container mx-auto px-4 flex items-center justify-center text-muted-foreground">
          <span className="font-display text-sm md:text-base font-semibold tracking-wide">
            Powered By : vagad raghuvanshi yuva sagathn
          </span>
        </div>
      </section>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <span className="live-badge">LIVE</span>
              <h2 className="font-display text-3xl font-bold text-foreground">Live Matches</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {liveMatches.map((m, i) => (
                <motion.div key={m.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <MatchCard match={m} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Matches */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground mb-8">Recent Matches</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {recentMatches.map((m, i) => (
              <motion.div key={m.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <MatchCard match={m} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Players */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground mb-8 flex items-center gap-2">
            <Trophy className="h-7 w-7 text-neon-yellow" /> Top Performers
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Top Batsmen */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-xl font-bold text-neon-yellow mb-4">🏏 Most Runs</h3>
              <div className="space-y-3">
                {topBatsmen.slice(0, 3).map((b, i) => (
                  <div key={b.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-2xl font-bold text-muted-foreground">#{i + 1}</span>
                      <div>
                        <p className="font-semibold text-foreground">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.team}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-neon-yellow">{b.runs}</p>
                      <p className="text-xs text-muted-foreground">SR: {b.sr}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Bowlers */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-xl font-bold text-neon-orange mb-4">🎯 Most Wickets</h3>
              <div className="space-y-3">
                {topBowlers.slice(0, 3).map((b, i) => (
                  <div key={b.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-2xl font-bold text-muted-foreground">#{i + 1}</span>
                      <div>
                        <p className="font-semibold text-foreground">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.team}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-neon-orange">{b.wickets}</p>
                      <p className="text-xs text-muted-foreground">Eco: {b.economy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/leaderboard">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                View Full Leaderboard <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Teams", value: `${registrationStats?.total ?? 0}`, icon: Users, color: "text-primary" },
              { label: "Matches", value: "4", icon: Trophy, color: "text-neon-yellow" },
              { label: "Live Runs", value: `${liveScore?.runs ?? 0}`, icon: Zap, color: "text-neon-orange" },
              { label: "Live Wkts", value: `${liveScore?.wickets ?? 0}`, icon: Trophy, color: "text-destructive" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border bg-card p-6 text-center"
              >
                <s.icon className={`h-8 w-8 mx-auto mb-3 ${s.color}`} />
                <p className={`font-display text-4xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-display text-lg mb-2">
            VAGAD RAGHUVANSHI PARIVAR - BHUJ <span className="text-primary">BOX CRICKET</span> 2026
          </p>
          <p>Organized by Lohana Samaj • All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
