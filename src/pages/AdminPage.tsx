import { Fragment, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, Radio, Settings, Users, Wallet, Menu, Bell, Search, 
  LayoutDashboard, FileText, BarChart3, ChevronRight, Activity, UserCheck
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoginPage from "./LoginPage";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, LineChart, Line 
} from "recharts";

type Tab = "overview" | "registrations" | "control";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const handleTabSelect = (id: Tab) => {
    setTab(id);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const registrations = useQuery(api.registrations.listRegistrations) ?? [];
  const stats = useQuery(api.registrations.registrationStats);
  const settings = useQuery(api.settings.getPublicSettings);
  const liveScore = useQuery(api.liveScore.getCurrent);
  const setRegistrationOnlyMode = useMutation(api.settings.setRegistrationOnlyMode);

  const isRegistrationOnlyMode = settings?.registrationOnlyMode ?? false;

  // Chart Data Processing
  const { revenueData, growthData } = useMemo(() => {
    if (!registrations.length) return { revenueData: [], growthData: [] };
    
    // Process registrations into daily buckets
    const dailyMap = new Map<string, { count: number, revenue: number }>();
    
    registrations.forEach(reg => {
      const dateStr = new Date(reg.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
      const current = dailyMap.get(dateStr) || { count: 0, revenue: 0 };
      dailyMap.set(dateStr, {
        count: current.count + 1,
        revenue: current.revenue + reg.fee,
      });
    });

    const sortedDates = Array.from(dailyMap.keys()).reverse(); // Registrations come newest first, reverse for chronological
    
    let cumulativeCount = 0;
    const growthData = sortedDates.map(date => {
      cumulativeCount += dailyMap.get(date)!.count;
      return { name: date, users: cumulativeCount };
    });

    const revenueData = sortedDates.map(date => ({
      name: date,
      revenue: dailyMap.get(date)!.revenue
    }));

    return { revenueData, growthData };
  }, [registrations]);

  const totalRevenue = registrations.reduce((acc, curr) => acc + curr.fee, 0);

  const exportRegistrationsCsv = () => {
    const headers = ["Team Name", "Captain", "Phone", "Category", "Fee", "Status", "Captain Age", "Players", "Created At"];
    const escapeCsv = (value: string | number) => {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = registrations.map((row) => {
      const captainAge = "captainAge" in row ? String((row as any).captainAge) : "";
      const players = row.players.map((p, i) => {
          const ageOrDob = "age" in (p as any) ? `${(p as any).age}y` : (p as any).dob;
          return `${i + 2}. ${p.name} (${ageOrDob})`;
        }).join(" | ");
      return [row.teamName, row.captainName, row.phone, row.categoryLabel, row.fee, "approved", captainAge, players, new Date(row.createdAt).toLocaleString()];
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

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const sidebarLinks = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "registrations", label: "Registrations", icon: Users },
    { id: "control", label: "System Controls", icon: Settings },
  ];

  const externalLinks = [
    { href: "/scorer", label: "Scorer Panel", icon: Radio },
    { href: "/display", label: "Live Display", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="absolute md:relative h-full border-r border-border bg-card flex flex-col z-30 shrink-0 shadow-2xl md:shadow-none"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <h1 className="font-display font-bold text-xl whitespace-nowrap">VRP Admin</h1>
            </div>
            
            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Main Menu</p>
              {sidebarLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleTabSelect(link.id as Tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    tab === link.id 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </button>
              ))}

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-8 px-3">Live Tools</p>
              {externalLinks.map((link) => (
                <Link key={link.href} to={link.href} target="_blank">
                  <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </div>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-display font-bold text-lg capitalize">
              {tab === "overview" ? "Admin Dashboard" : tab}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 bg-muted/30 border-none h-9 rounded-full focus-visible:ring-1"
              />
            </div>
            <button className="relative p-2 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-card"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border border-primary/30">
              A
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-muted/10">
          
          {tab === "overview" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Teams" value={stats?.total ?? 0} icon={Users} trend="Up" />
                <StatCard label="Approved Players" value={(stats?.paid ?? 0) * 6} icon={UserCheck} trend="Live" />
                <StatCard label="Total Revenue" value={`₹${totalRevenue}`} icon={Wallet} trend="Live" />
                <StatCard label="Site Mode" value={isRegistrationOnlyMode ? "Register Only" : "Fully Open"} icon={Settings} />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Revenue Chart */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-bold text-lg">Revenue Trend</h3>
                  </div>
                  <div className="h-[250px] w-full">
                    {revenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `₹${val}`} />
                          <RechartsTooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }}
                          />
                          <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                    )}
                  </div>
                </div>

                {/* Growth Chart */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-bold text-lg">Team Registrations</h3>
                  </div>
                  <div className="h-[250px] w-full">
                    {growthData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={growthData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }}
                          />
                          <Line type="monotone" dataKey="users" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Live Score Snapshot */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg">Current Match Snapshot</h3>
                  <Link to="/display" target="_blank" className="text-sm text-primary hover:underline flex items-center">
                    Open Display <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                
                {liveScore ? (
                  <div className="flex flex-col md:flex-row md:items-center gap-6 p-4 rounded-lg bg-muted/20 border border-border">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Batting vs Bowling</p>
                      <p className="font-display text-xl font-bold">{liveScore.battingTeam} <span className="text-muted-foreground font-normal mx-2">vs</span> {liveScore.bowlingTeam}</p>
                    </div>
                    <div className="flex-1 md:text-center border-y md:border-y-0 md:border-x border-border/50 py-4 md:py-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Score</p>
                      <p className="font-display text-4xl font-bold text-primary">{liveScore.runs}<span className="text-2xl text-muted-foreground">/{liveScore.wickets}</span></p>
                      <p className="text-sm text-muted-foreground mt-1">Overs: {liveScore.overs}.{liveScore.balls}</p>
                    </div>
                    <div className="flex-1 md:text-right">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Recent Event</p>
                      <span className="inline-block px-3 py-1 bg-background border border-border rounded-full text-sm font-medium">
                        {liveScore.lastEvent || "Match Started"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-lg bg-muted/10 border border-dashed border-border">
                    <Radio className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground">No active match found.</p>
                    <p className="text-sm text-muted-foreground mt-1">Start scoring from the Scorer panel to see live updates.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "registrations" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-display font-bold text-2xl">Registered Teams</h3>
                  <p className="text-sm text-muted-foreground">Manage and export team registrations.</p>
                </div>
                <Button onClick={exportRegistrationsCsv} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  <FileText className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-left">
                        <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Team Details</th>
                        <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Captain</th>
                        <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Contact</th>
                        <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Category</th>
                        <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Fee</th>
                        <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {registrations.map((row) => {
                        const isExpanded = expandedTeamId === row._id;
                        return (
                          <Fragment key={row._id}>
                            <tr className="hover:bg-muted/10 transition-colors">
                              <td className="p-4">
                                <button
                                  type="button"
                                  onClick={() => setExpandedTeamId(isExpanded ? null : row._id)}
                                  className="flex items-center gap-2 text-left hover:text-primary transition-colors font-bold"
                                >
                                  <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
                                  {row.teamName}
                                </button>
                              </td>
                              <td className="p-4 font-medium">{row.captainName}</td>
                              <td className="p-4 text-muted-foreground">{row.phone}</td>
                              <td className="p-4 text-muted-foreground">
                                <span className="px-2 py-1 rounded-md bg-muted/40 border border-border/50 text-xs truncate max-w-[200px] inline-block">
                                  {row.categoryLabel}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-foreground">₹{row.fee}</td>
                              <td className="p-4 text-right">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  Approved
                                </span>
                              </td>
                            </tr>

                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={6} className="p-0 border-none">
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-muted/10 border-b border-border/50"
                                    >
                                      <div className="p-6 ml-6 border-l-2 border-primary/30 my-2">
                                        <p className="text-xs uppercase font-bold text-muted-foreground mb-3">Roster Details</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          <div className="bg-background border border-border rounded-lg p-3 shadow-sm flex justify-between items-center">
                                            <span className="text-muted-foreground text-xs font-semibold">Captain (Age: {"captainAge" in row ? String((row as any).captainAge) : "-"})</span>
                                            <span className="font-bold">{row.captainName}</span>
                                          </div>
                                          {row.players.map((player, idx) => (
                                            <div key={`${row._id}-${idx}`} className="bg-background border border-border rounded-lg p-3 shadow-sm flex justify-between items-center">
                                              <span className="text-muted-foreground text-xs font-semibold">Player {idx + 2} (Age: {"age" in (player as any) ? `${(player as any).age}` : "-"})</span>
                                              <span className="font-bold">{player.name}</span>
                                            </div>
                                          ))}
                                        </div>

                                        <p className="text-xs uppercase font-bold text-muted-foreground mt-6 mb-3">Payment Details</p>
                                        <div className="bg-background border border-border rounded-lg p-4 shadow-sm space-y-4">
                                          {"paymentRef" in row && (row as any).paymentRef && (
                                            <div>
                                              <span className="text-muted-foreground text-xs font-semibold block mb-1">UTR / Reference Number</span>
                                              <span className="font-bold font-mono bg-muted/50 px-2 py-1 rounded inline-block">{(row as any).paymentRef}</span>
                                            </div>
                                          )}
                                          {"paymentScreenshotUrl" in row && (row as any).paymentScreenshotUrl && (
                                            <div>
                                              <span className="text-muted-foreground text-xs font-semibold block mb-2">Payment Screenshot</span>
                                              <a href={(row as any).paymentScreenshotUrl} target="_blank" rel="noreferrer">
                                                <img src={(row as any).paymentScreenshotUrl} alt="Payment Screenshot" className="max-w-xs max-h-48 rounded-lg border border-border shadow-sm hover:opacity-90 transition-opacity object-contain" />
                                              </a>
                                            </div>
                                          )}
                                          {(!("paymentRef" in row) || !(row as any).paymentRef) && (!("paymentScreenshotUrl" in row) || !(row as any).paymentScreenshotUrl) && (
                                            <div className="text-sm text-muted-foreground italic">No payment details provided.</div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </Fragment>
                        );
                      })}
                      {registrations.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No registrations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "control" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
              
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-border">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl">Website Configuration</h3>
                    <p className="text-sm text-muted-foreground mt-1">Manage global settings and visibility modes for the public frontend.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-border bg-muted/20">
                  <div>
                    <p className="font-semibold text-foreground text-lg">Registration Only Mode</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      When enabled, the homepage is hidden and users are forced to see the Registration Form.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setRegistrationOnlyMode({ enabled: !isRegistrationOnlyMode })}
                    className={`shrink-0 shadow-sm transition-all ${
                      isRegistrationOnlyMode 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "bg-muted-foreground text-white hover:bg-muted-foreground/90"
                    }`}
                  >
                    {isRegistrationOnlyMode ? "Enabled (Turn OFF)" : "Disabled (Turn ON)"}
                  </Button>
                </div>
              </div>

            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "Up" | "Live" | string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
            trend === "Live" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
}
