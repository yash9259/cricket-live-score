import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  ChevronRight,
  CircleDot,
  Download,
  LayoutDashboard,
  LogOut,
  Monitor,
  PanelLeft,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoginPage from "./LoginPage";

type Tab = "overview" | "registrations" | "control";
const ADMIN_SESSION_STORAGE_KEY = "adminSessionToken";

export default function AdminPage() {
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "");
  const [tab, setTab] = useState<Tab>("overview");
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const adminSession = useQuery(api.adminAuth.validateSession, sessionToken ? { token: sessionToken } : "skip");
  const isLoggedIn = adminSession?.authenticated ?? false;
  const registrations = useQuery(
    api.registrations.listRegistrations,
    isLoggedIn ? { token: sessionToken } : "skip",
  ) ?? [];
  const stats = useQuery(api.registrations.registrationStats);
  const settings = useQuery(api.settings.getPublicSettings);
  const liveScore = useQuery(api.liveScore.getCurrent);
  const setRegistrationOnlyMode = useMutation(api.settings.setRegistrationOnlyMode);
  const logout = useMutation(api.adminAuth.logout);
  const [searchText, setSearchText] = useState("");

  const isRegistrationOnlyMode = settings?.registrationOnlyMode ?? false;
  const totalRevenue = registrations.reduce((sum, row) => sum + row.fee, 0);
  const activeTabTitle: Record<Tab, string> = {
    overview: "Admin Dashboard",
    registrations: "Team Registrations",
    control: "Control Center",
  };

  const activeTabDescription: Record<Tab, string> = {
    overview: "Live metrics, revenue trend, and growth snapshot",
    registrations: "Browse team applications and export registration data",
    control: "Manage frontend visibility and live panel access",
  };

  const monthlyRevenue = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((monthLabel, index) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - (5 - index));
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    const total = registrations
      .filter((row) => {
        const created = new Date(row.createdAt);
        return created.getMonth() === month && created.getFullYear() === year;
      })
      .reduce((sum, row) => sum + row.fee, 0);

    return {
      month: monthLabel,
      value: total,
    };
  });

  const monthlyTeams = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((monthLabel, index) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - (5 - index));
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    const count = registrations.filter((row) => {
      const created = new Date(row.createdAt);
      return created.getMonth() === month && created.getFullYear() === year;
    }).length;

    return {
      month: monthLabel,
      value: count,
    };
  });

  const maxRevenue = Math.max(...monthlyRevenue.map((x) => x.value), 1);
  const maxTeams = Math.max(...monthlyTeams.map((x) => x.value), 1);

  const filteredRegistrations = registrations.filter((row) => {
    if (!searchText.trim()) return true;
    const q = searchText.trim().toLowerCase();
    return (
      row.teamName.toLowerCase().includes(q)
      || row.captainName.toLowerCase().includes(q)
      || row.phone.toLowerCase().includes(q)
      || row.categoryLabel.toLowerCase().includes(q)
    );
  });

  const clearSession = () => {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    setSessionToken("");
  };

  const handleLogout = async () => {
    if (sessionToken) {
      await logout({ token: sessionToken });
    }
    clearSession();
  };

  const exportRegistrationsCsv = () => {
    const headers = [
      "Team Name",
      "Captain",
      "Phone",
      "Category",
      "Fee",
      "Status",
      "Captain Age",
      "Players",
      "Created At",
    ];

    const escapeCsv = (value: string | number) => {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = registrations.map((row) => {
      const captainAge = "captainAge" in row ? String((row as any).captainAge) : "";
      const players = row.players
        .map((p, i) => {
          const ageOrDob = "age" in (p as any) ? `${(p as any).age}y` : (p as any).dob;
          return `${i + 2}. ${p.name} (${ageOrDob})`;
        })
        .join(" | ");
      return [
        row.teamName,
        row.captainName,
        row.phone,
        row.categoryLabel,
        row.fee,
        "approved",
        captainAge,
        players,
        new Date(row.createdAt).toLocaleString(),
      ];
    });

    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (sessionToken && adminSession && !adminSession.authenticated) {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      setSessionToken("");
    }
  }, [sessionToken, adminSession?.authenticated]);

  if (sessionToken && adminSession === undefined) {
    return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Validating admin session...</div>;
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={(token) => {
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token);
      setSessionToken(token);
    }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen md:grid-cols-[250px_1fr]">
        <aside className="border-r border-border bg-card/80 backdrop-blur">
          <div className="flex h-16 items-center gap-3 border-b border-border px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b3e5fc] text-slate-900">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-foreground">VRP Admin</p>
              <p className="text-[11px] text-muted-foreground">Secure Control Panel</p>
            </div>
          </div>

          <div className="p-3">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Main Menu</p>
            <div className="space-y-1">
              <SidebarItem
                label="Dashboard"
                active={tab === "overview"}
                icon={LayoutDashboard}
                onClick={() => setTab("overview")}
              />
              <SidebarItem
                label="Registrations"
                active={tab === "registrations"}
                icon={Users}
                onClick={() => setTab("registrations")}
              />
              <SidebarItem
                label="Control Center"
                active={tab === "control"}
                icon={Settings}
                onClick={() => setTab("control")}
              />
            </div>
          </div>

          <div className="px-3 pb-3">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</p>
            <div className="space-y-2">
              <Link to="/scorer" className="block">
                <Button className="w-full justify-start bg-[#b3e5fc] text-slate-900 hover:bg-[#9fd8f2]">
                  <Radio className="mr-2 h-4 w-4" /> Scorer Panel
                </Button>
              </Link>
              <Link to="/display" className="block">
                <Button variant="outline" className="w-full justify-start border-[#b3e5fc]/50 text-[#b3e5fc] hover:bg-[#b3e5fc]/15">
                  <Monitor className="mr-2 h-4 w-4" /> Score Display
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-auto p-3">
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center gap-4 border-b border-border bg-card/60 px-4 md:px-6">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex text-muted-foreground">
              <PanelLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">{activeTabTitle[tab]}</h1>
            </div>
            <div className="relative w-full max-w-[280px] md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search teams, captain, phone..."
                className="pl-9 bg-background"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#b3e5fc]" />
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b3e5fc] text-xs font-bold text-slate-900">
              A
            </div>
          </header>

          <section className="space-y-5 px-4 py-5 md:px-6">
            <div>
              <p className="text-sm text-muted-foreground">{activeTabDescription[tab]}</p>
            </div>

            {tab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Total Teams" value={stats?.total ?? 0} icon={Users} statusLabel="Live" />
                  <StatCard label="Approved Teams" value={stats?.paid ?? 0} icon={ShieldCheck} statusLabel="Confirmed" />
                  <StatCard label="Active Match" value={liveScore ? 1 : 0} icon={Radio} statusLabel={liveScore ? "On Air" : "Idle"} />
                  <StatCard label="Revenue" value={`Rs. ${totalRevenue}`} icon={Wallet} statusLabel="Paid registrations" isText />
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-2xl font-bold text-foreground">Revenue</h3>
                      <span className="text-xs text-muted-foreground">Last 6 months</span>
                    </div>
                    <div className="space-y-3">
                      {monthlyRevenue.map((point) => (
                        <div key={point.month} className="grid grid-cols-[34px_1fr_auto] items-center gap-3 text-sm">
                          <span className="text-muted-foreground">{point.month}</span>
                          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#b3e5fc]"
                              style={{ width: `${Math.max((point.value / maxRevenue) * 100, point.value > 0 ? 8 : 0)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-foreground">Rs. {point.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-2xl font-bold text-foreground">Team Growth</h3>
                      <span className="text-xs text-muted-foreground">Monthly registrations</span>
                    </div>
                    <div className="flex items-end gap-3 h-44">
                      {monthlyTeams.map((point) => (
                        <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                          <div className="relative flex h-32 w-full items-end rounded-md bg-muted/40 px-1 pb-1">
                            <div
                              className="w-full rounded bg-[#b3e5fc]"
                              style={{ height: `${Math.max((point.value / maxTeams) * 100, point.value > 0 ? 8 : 0)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{point.month}</p>
                          <p className="text-xs font-semibold text-foreground">{point.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-2xl font-bold text-foreground">Live Score Snapshot</h3>
                    <span className="inline-flex items-center gap-1 text-xs text-[#b3e5fc]">
                      <CircleDot className="h-3.5 w-3.5" /> Real-time
                    </span>
                  </div>
                  {liveScore ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-border bg-background px-4 py-3">
                        <p className="text-xs text-muted-foreground">Teams</p>
                        <p className="mt-1 font-semibold text-foreground">{liveScore.battingTeam} vs {liveScore.bowlingTeam}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-background px-4 py-3">
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="mt-1 font-display text-2xl text-[#b3e5fc]">{liveScore.runs}/{liveScore.wickets}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-background px-4 py-3">
                        <p className="text-xs text-muted-foreground">Overs</p>
                        <p className="mt-1 font-semibold text-foreground">{liveScore.overs}.{liveScore.balls} | {liveScore.lastEvent || "-"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No live score yet. Start a match from Scorer Panel.</p>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "registrations" && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredRegistrations.length}</span> of {registrations.length} registrations
                  </p>
                  <Button onClick={exportRegistrationsCsv} variant="outline" className="border-[#b3e5fc]/50 text-[#b3e5fc] hover:bg-[#b3e5fc]/15">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
                        {filteredRegistrations.map((row) => {
                      const isExpanded = expandedTeamId === row._id;
                      return (
                        <Fragment key={row._id}>
                          <tr className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-4 font-semibold text-foreground">
                              <button
                                type="button"
                                onClick={() => setExpandedTeamId(isExpanded ? null : row._id)}
                                className="text-left hover:text-[#b3e5fc] transition-colors"
                              >
                                {isExpanded ? "▼" : "▶"} {row.teamName}
                              </button>
                            </td>
                            <td className="p-4 text-muted-foreground">{row.captainName}</td>
                            <td className="p-4 text-muted-foreground">{row.phone}</td>
                            <td className="p-4 text-muted-foreground">{row.categoryLabel}</td>
                            <td className="p-4 text-[#b3e5fc] font-semibold">Rs. {row.fee}</td>
                            <td className="p-4">
                              <span className="text-xs font-bold px-2 py-1 rounded-full uppercase bg-[#b3e5fc]/20 text-[#b3e5fc]">
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

                        {filteredRegistrations.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                              No team found for "{searchText}".
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="px-4 py-3 text-xs text-muted-foreground border-t border-border">Pending: 0 (manual WhatsApp approval flow)</p>
                </div>
              </motion.div>
            )}

            {tab === "control" && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-bold text-foreground">Frontend Visibility</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isRegistrationOnlyMode ? "bg-destructive/20 text-destructive" : "bg-[#b3e5fc]/20 text-[#b3e5fc]"}`}>
                      {isRegistrationOnlyMode ? "Register-Only" : "Public Open"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ON: only Register page shown to public users. OFF: normal public navigation.
                  </p>
                  <Button
                    onClick={() => setRegistrationOnlyMode({ enabled: !isRegistrationOnlyMode, token: sessionToken })}
                    className={isRegistrationOnlyMode ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-[#b3e5fc] text-slate-900 hover:bg-[#9fd8f2]"}
                  >
                    {isRegistrationOnlyMode ? "Turn OFF (Show All Public Menu)" : "Turn ON (Register Only Mode)"}
                  </Button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-display text-xl font-bold text-foreground mb-4">Live Operations</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link to="/scorer" className="block">
                      <div className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-[#b3e5fc]/60">
                        <p className="font-semibold text-foreground">Scorer Panel</p>
                        <p className="mt-1 text-sm text-muted-foreground">Update runs, wickets, and overs in real time.</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs text-[#b3e5fc]">Open Panel <ChevronRight className="h-3.5 w-3.5" /></span>
                      </div>
                    </Link>
                    <Link to="/display" className="block">
                      <div className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-[#b3e5fc]/60">
                        <p className="font-semibold text-foreground">Score Display</p>
                        <p className="mt-1 text-sm text-muted-foreground">Public live scoreboard for LED/TV display.</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs text-[#b3e5fc]">Open Display <ChevronRight className="h-3.5 w-3.5" /></span>
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  label,
  active,
  icon: Icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
        active
          ? "bg-[#b3e5fc]/20 text-[#b3e5fc]"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  isText,
  statusLabel,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  isText?: boolean;
  statusLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#b3e5fc]/15 text-[#b3e5fc]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#b3e5fc]">{statusLabel}</span>
      </div>
      <p className={`font-display font-bold text-foreground ${isText ? "text-2xl" : "text-4xl"}`}>{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
