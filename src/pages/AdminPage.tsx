import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { LogOut, Radio, Settings, Users, Wallet } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import LoginPage from "./LoginPage";

type Tab = "overview" | "registrations" | "control";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const registrations = useQuery(api.registrations.listRegistrations) ?? [];
  const stats = useQuery(api.registrations.registrationStats);
  const settings = useQuery(api.settings.getPublicSettings);
  const liveScore = useQuery(api.liveScore.getCurrent);
  const setRegistrationOnlyMode = useMutation(api.settings.setRegistrationOnlyMode);

  const isRegistrationOnlyMode = settings?.registrationOnlyMode ?? false;

  const exportRegistrationsCsv = () => {
    const headers = [
      "Team Name",
      "Captain",
      "Phone",
      "Category",
      "Fee",
      "Status",
      "Captain DOB",
      "Players",
      "Created At",
    ];

    const escapeCsv = (value: string | number) => {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = registrations.map((row) => {
      const players = row.players.map((p, i) => `${i + 2}. ${p.name} (${p.dob})`).join(" | ");
      return [
        row.teamName,
        row.captainName,
        row.phone,
        row.categoryLabel,
        row.fee,
        "approved",
        row.captainDob,
        players,
        new Date(row.createdAt).toLocaleString(),
      ];
    });

    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-4xl font-bold text-foreground">Admin Panel</h1>
        <Button variant="ghost" onClick={() => setIsLoggedIn(false)} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
      <p className="text-muted-foreground mb-8">Manage teams, live score, and frontend visibility.</p>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(["overview", "registrations", "control"] as Tab[]).map((t) => (
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

      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Registrations" value={stats?.total ?? 0} icon={Users} />
            <StatCard label="Approved Teams" value={stats?.paid ?? 0} icon={Wallet} />
            <StatCard label="Pending Payments" value={0} icon={Wallet} />
            <StatCard label="Site Mode" value={isRegistrationOnlyMode ? "Register" : "Open"} icon={Settings} isText />
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-xl font-bold text-foreground mb-3">Live Score Snapshot</h3>
            {liveScore ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">{liveScore.battingTeam} vs {liveScore.bowlingTeam}</p>
                <p className="text-primary font-display text-3xl">{liveScore.runs}/{liveScore.wickets}</p>
                <p className="text-muted-foreground">Overs: {liveScore.overs}.{liveScore.balls}</p>
                <p className="text-muted-foreground">Last Event: {liveScore.lastEvent || "-"}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No live score yet. Start scoring from Scorer panel.</p>
            )}
          </div>
        </motion.div>
      )}

      {tab === "registrations" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={exportRegistrationsCsv} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              Export CSV
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-4 font-medium">Team</th>
                    <th className="p-4 font-medium">Captain</th>
                    <th className="p-4 font-medium">Phone</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Fee</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((row) => {
                    const isExpanded = expandedTeamId === row._id;
                    return (
                      <Fragment key={row._id}>
                        <tr className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-4 font-semibold text-foreground">
                            <button
                              type="button"
                              onClick={() => setExpandedTeamId(isExpanded ? null : row._id)}
                              className="text-left hover:text-primary transition-colors"
                            >
                              {isExpanded ? "▼" : "▶"} {row.teamName}
                            </button>
                          </td>
                          <td className="p-4 text-muted-foreground">{row.captainName}</td>
                          <td className="p-4 text-muted-foreground">{row.phone}</td>
                          <td className="p-4 text-muted-foreground">{row.categoryLabel}</td>
                          <td className="p-4 text-primary font-semibold">Rs. {row.fee}</td>
                          <td className="p-4">
                            <span className="text-xs font-bold px-2 py-1 rounded-full uppercase bg-primary/20 text-primary">
                              approved
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-border/50 bg-muted/10">
                            <td colSpan={6} className="p-4">
                              <p className="text-sm font-semibold text-foreground mb-2">Team Members</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="rounded border border-border bg-card px-3 py-2">
                                  <span className="text-muted-foreground">Captain: </span>
                                  <span className="font-medium text-foreground">{row.captainName}</span>
                                </div>
                                {row.players.map((player, idx) => (
                                  <div key={`${row._id}-${idx}`} className="rounded border border-border bg-card px-3 py-2">
                                    <span className="text-muted-foreground">Player {idx + 2}: </span>
                                    <span className="font-medium text-foreground">{player.name}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Pending: 0 (manual WhatsApp approval flow)</p>
        </motion.div>
      )}

      {tab === "control" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-xl font-bold text-foreground">Frontend Visibility Control</h3>
            <p className="text-sm text-muted-foreground">
              ON: only Register page shown to public users. OFF: normal public navigation.
            </p>
            <Button
              onClick={() => setRegistrationOnlyMode({ enabled: !isRegistrationOnlyMode })}
              className={isRegistrationOnlyMode ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}
            >
              {isRegistrationOnlyMode ? "Turn OFF (Show All Public Menu)" : "Turn ON (Register Only Mode)"}
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-xl font-bold text-foreground mb-4">Live Panels</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/scorer">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Radio className="h-4 w-4 mr-2" /> Open Scorer Panel
                </Button>
              </Link>
              <Link to="/display">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                  Open Score Display
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  isText,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="h-6 w-6 text-primary mb-2" />
      <p className={`font-display font-bold ${isText ? "text-xl" : "text-3xl"}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
