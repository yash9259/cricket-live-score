import { Fragment, useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Radio, Settings, Users, Wallet, Menu, Bell, Search,
  LayoutDashboard, FileText, BarChart3, ChevronRight, Activity, UserCheck, Trash2, Edit2, Plus
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoginPage from "./LoginPage";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line
} from "recharts";

type Tab = "overview" | "registrations" | "matches" | "control";

const ADMIN_SESSION_STORAGE_KEY = "adminSessionToken";


export default function AdminPage() {
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "");
  const session = useQuery(api.adminAuth.validateSession, sessionToken ? { token: sessionToken } : "skip");

  const isLoggedIn = sessionToken !== "" && session?.authenticated === true;

  const handleLogin = (token: string) => {
    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token);
    setSessionToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    setSessionToken("");
  };

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab") as Tab;
    if (t && ["overview", "registrations", "matches", "control"].includes(t)) return t;
    return "overview";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

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
  const seriesLeaderboard = useQuery(api.matches.getSeriesLeaderboard);
  const setRegistrationOnlyMode = useMutation(api.settings.setRegistrationOnlyMode);
  const setRegistrationsEnabled = useMutation(api.settings.setRegistrationsEnabled);

  const matches = useQuery(api.matches.list) ?? [];
  const generateAutoMatches = useMutation(api.matches.generateAutomatic);
  const createManualMatch = useMutation(api.matches.createManual);
  const deleteMatch = useMutation(api.matches.deleteMatch);
  const deleteAllScheduled = useMutation(api.matches.deleteAllScheduled);
  const startMatch = useMutation(api.matches.startMatch);
  const updateMatchStatus = useMutation(api.matches.updateStatus);
  const importMatches = useMutation(api.matches.createMany);

  const updateRegistration = useMutation(api.registrations.updateRegistration);
  const deleteRegistration = useMutation(api.registrations.deleteRegistration);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManualRegOpen, setIsManualRegOpen] = useState(false);

  const [selectedMatchCategory, setSelectedMatchCategory] = useState("");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [teamASearch, setTeamASearch] = useState("");
  const [teamBSearch, setTeamBSearch] = useState("");
  const [matchStatusFilter, setMatchStatusFilter] = useState<"all" | "scheduled" | "live" | "completed">("all");

  const filteredMatches = useMemo(() => {
    if (matchStatusFilter === "all") return matches;
    return matches.filter(m => m.status === matchStatusFilter);
  }, [matches, matchStatusFilter]);

  // Registration Tab Logic
  const nameCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    registrations.forEach(r => {
      const key = `${r.categoryId}||${r.teamName.trim().toLowerCase()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [registrations]);

  const isDuplicate = (r: any) =>
    (nameCountMap.get(`${r.categoryId}||${r.teamName.trim().toLowerCase()}`) ?? 0) > 1;

  const duplicateCount = registrations.filter(isDuplicate).length;

  const displayedRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const matchesSearch = r.teamName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           r.captainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.phone.includes(searchQuery);
      const matchesDup = !showDuplicatesOnly || isDuplicate(r);
      const matchesCategory = selectedCategory === "all" || r.categoryId === selectedCategory;
      return matchesSearch && matchesDup && matchesCategory;
    });
  }, [registrations, searchQuery, showDuplicatesOnly, nameCountMap, selectedCategory]);

  const categories = [
    { id: "youth", label: "યુવાનો 16 વર્ષ થી ઉપરના" },
    { id: "women", label: "મહિલાઓ તથા 16 વર્ષ થી વધુ ઉંમર ની યુવતીઓ" },
    { id: "boys-11-15", label: "બાળકો (11 થી 15 વર્ષ)" },
    { id: "girls-11-15", label: "બાલિકાઓ (11 થી 15 વર્ષ)" },
    { id: "kids-5-10", label: "બાળકો તથા બાલિકાઓ (5 થી 10 વર્ષ)" },
  ];

  const isRegistrationOnlyMode = settings?.registrationOnlyMode ?? false;
  const isRegistrationsEnabled = settings?.registrationsEnabled ?? true;

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
    // Find max players to set headers
    const maxPlayers = Math.max(...registrations.map(r => r.players.length), 0);
    const playerHeaders = Array.from({ length: maxPlayers }, (_, i) => `Player ${i + 2}`);

    const headers = ["Team Name", "Captain", "Phone", "Category", "Fee", "Status", "Captain Age", ...playerHeaders];
    const escapeCsv = (value: string | number) => {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = registrations.map((row) => {
      const captainAge = "captainAge" in row ? String((row as any).captainAge) : "";
      const playerCols = row.players.map(p => `${p.name} (${"age" in (p as any) ? (p as any).age + 'y' : (p as any).dob})`);

      // Fill empty columns if this team has fewer players than the max
      while (playerCols.length < maxPlayers) {
        playerCols.push("");
      }

      return [
        row.teamName,
        row.captainName,
        row.phone,
        row.categoryLabel,
        row.fee,
        "approved",
        captainAge,
        ...playerCols
      ];
    });

    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `teams-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportMatchesCsv = () => {
    const headers = ["Team A", "Team B", "Category", "Status", "Date", "Time"];
    const escapeCsv = (value: string | number) => {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = matches.map((m) => [
      m.teamAName,
      m.teamBName,
      m.categoryLabel,
      m.status,
      m.date || "",
      m.time || ""
    ]);

    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `matches-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportMatchesCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      if (!csvData) return;

      const lines = csvData.split("\n").map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return; // Only header or empty

      // Helper to strip quotes
      const clean = (s: string) => s.replace(/^["']|["']$/g, '').trim();

      const headers = lines[0].split(",").map(clean);
      const teamAIdx = headers.indexOf("Team A");
      const teamBIdx = headers.indexOf("Team B");
      const catIdx = headers.indexOf("Category");
      const dateIdx = headers.indexOf("Date");
      const timeIdx = headers.indexOf("Time");

      if (teamAIdx === -1 || teamBIdx === -1 || catIdx === -1) {
        alert("Invalid CSV format. Required columns: Team A, Team B, Category");
        return;
      }

      const matchesToCreate = [];
      const teamsByCategory: Record<string, any[]> = {};

      // Group registrations by category for better matching
      registrations.forEach(r => {
        if (!teamsByCategory[r.categoryLabel]) teamsByCategory[r.categoryLabel] = [];
        teamsByCategory[r.categoryLabel].push(r);
      });

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(clean);
        const teamAName = cols[teamAIdx];
        const teamBName = cols[teamBIdx];
        const categoryLabel = cols[catIdx];
        const date = dateIdx !== -1 ? cols[dateIdx] : undefined;
        const time = timeIdx !== -1 ? cols[timeIdx] : undefined;

        const categoryTeams = teamsByCategory[categoryLabel] || [];
        const teamA = categoryTeams.find(t => t.teamName === teamAName);
        const teamB = categoryTeams.find(t => t.teamName === teamBName);

        if (teamA && teamB) {
          matchesToCreate.push({
            teamAId: teamA._id,
            teamBId: teamB._id,
            categoryId: teamA.categoryId,
            categoryLabel: teamA.categoryLabel,
            date,
            time,
          });
        }
      }

      if (matchesToCreate.length > 0) {
        try {
          await importMatches({ token: sessionToken, matches: matchesToCreate as any });
          alert(`Successfully imported ${matchesToCreate.length} matches!`);
        } catch (err) {
          alert("Import failed. Check console for details.");
          console.error(err);
        }
      } else {
        alert("No matching teams found in CSV.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  if (session === undefined && sessionToken !== "") {
    return <div className="min-h-screen bg-background flex items-center justify-center p-8"><p className="text-muted-foreground">Validating admin session...</p></div>;
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;

  }

  const sidebarLinks = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "registrations", label: "Registrations", icon: Users },
    { id: "matches", label: "Match Making", icon: Activity },
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${tab === link.id
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
                onClick={handleLogout}
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

              {/* Registration Forms by Category */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold text-lg">Registration Forms by Category</h3>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">Total: {stats?.total ?? 0}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {categories.map((cat) => {
                    const isMatch = (s: any) => {
                      if (s.id === cat.id) return true;
                      const sLabel = s.label?.trim() || "";
                      const catLabel = cat.label?.trim() || "";
                      if (sLabel === catLabel) return true;
                      if (sLabel && catLabel && (sLabel.includes(catLabel) || catLabel.includes(sLabel))) return true;
                      if (cat.id === "women") {
                        const variations = [
                          "મહિલાઓ તથા 16 વર્ષ થી વધુ ઉંમર ની યુવતીઓ",
                          "મહિલાઓ તથા યુવતીઓ 16 વર્ષ થી વધુ ઉંમર ના",
                          "મહિલાઓ તથા 16 વર્ષ થી વધુ ઉંમર ની યુવતીઓ  "
                        ];
                        return variations.some(v => sLabel.includes(v) || v.includes(sLabel));
                      }
                      return false;
                    };

                    const categoryData = stats?.byCategory?.find(isMatch);
                    const count = categoryData?.count ?? 0;

                    return (
                      <div
                        key={cat.id}
                        className={`relative group overflow-hidden bg-muted/20 border border-border/50 rounded-xl p-5 transition-all hover:bg-muted/30 hover:border-primary/30`}
                      >
                        <div className="flex flex-col h-full justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Forms</p>
                            <p className="text-4xl font-black text-primary font-display">{count}</p>
                          </div>
                          <p className="text-xs text-foreground/80 font-bold line-clamp-2 min-h-[2.5rem] leading-relaxed">
                            {cat.label}
                          </p>
                        </div>
                        {/* Progress Bar Background */}
                        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: stats?.total ? `${(count / stats.total) * 100}%` : 0 }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Display any unmatched categories for debugging */}
                  {stats?.byCategory?.filter((s: any) => {
                    return !categories.some(cat => {
                      if (s.id === cat.id) return true;
                      const sLabel = s.label?.trim() || "";
                      const catLabel = cat.label?.trim() || "";
                      if (sLabel === catLabel) return true;
                      if (sLabel && catLabel && (sLabel.includes(catLabel) || catLabel.includes(sLabel))) return true;
                      if (cat.id === "women") {
                        const variations = [
                          "મહિલાઓ તથા 16 વર્ષ થી વધુ ઉંમર ની યુવતીઓ",
                          "મહિલાઓ તથા યુવતીઓ 16 વર્ષ થી વધુ ઉંમર ના",
                          "મહિલાઓ તથા 16 વર્ષ થી વધુ ઉંમર ની યુવતીઓ  "
                        ];
                        return variations.some(v => sLabel.includes(v) || v.includes(sLabel));
                      }
                      return false;
                    });
                  }).map((unmatched: any) => (
                    <div
                      key={unmatched.id || unmatched.label}
                      className="relative group overflow-hidden bg-destructive/10 border border-destructive/20 rounded-xl p-5"
                    >
                      <div className="flex flex-col h-full justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-destructive uppercase tracking-wider mb-1">Unmatched</p>
                          <p className="text-4xl font-black text-destructive font-display">{unmatched.count}</p>
                        </div>
                        <p className="text-xs text-foreground/80 font-bold line-clamp-2 min-h-[2.5rem] leading-relaxed">
                          {unmatched.label || unmatched.id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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

              {/* Player Leaderboard */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold text-lg">Series Leaderboard (Top Players)</h3>
                  <Link to="/leaderboard" className="text-sm text-primary hover:underline flex items-center">
                    Full Leaderboard <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 font-semibold text-muted-foreground uppercase text-xs">Player</th>
                        <th className="pb-3 font-semibold text-muted-foreground uppercase text-xs">Team</th>
                        <th className="pb-3 font-semibold text-muted-foreground uppercase text-xs text-center">Batting</th>
                        <th className="pb-3 font-semibold text-muted-foreground uppercase text-xs text-center">Bowling</th>
                        <th className="pb-3 font-semibold text-muted-foreground uppercase text-xs text-right">Total Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {seriesLeaderboard?.slice(0, 5).map((player: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                          <td className="py-4 font-medium flex items-center gap-2">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>
                              {idx + 1}
                            </span>
                            {player.playerName}
                          </td>
                          <td className="py-4 text-muted-foreground">{player.teamName}</td>
                          <td className="py-4 text-center">{player.batting}</td>
                          <td className="py-4 text-center">{player.bowling}</td>
                          <td className="py-4 text-right font-bold text-primary">{player.total}</td>
                        </tr>
                      ))}
                      {(!seriesLeaderboard || seriesLeaderboard.length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">No stats available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "matches" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-2xl">Match Making</h3>
                  <p className="text-sm text-muted-foreground">Generate matches automatically or create them manually.</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      id="match-csv-upload"
                      onChange={handleImportMatchesCsv}
                    />
                    <Button
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => document.getElementById('match-csv-upload')?.click()}
                    >
                      <FileText className="h-4 w-4 mr-2" /> Import CSV
                    </Button>
                  </div>
                  <Button onClick={exportMatchesCsv} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                    <FileText className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      if (confirm("Delete all scheduled matches?")) {
                        await deleteAllScheduled({ token: sessionToken });
                      }
                    }}
                  >
                    Clear Scheduled
                  </Button>
                  <Button
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        const count = await generateAutoMatches({ token: sessionToken });
                        alert(`Successfully generated ${count} matches!`);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={isGenerating}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isGenerating ? "Generating..." : "Generate Auto Matches"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manual Creation Form */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Manual Match
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                        <Select
                          value={selectedMatchCategory}
                          onValueChange={(value) => {
                            setSelectedMatchCategory(value);
                            setTeamAId("");
                            setTeamBId("");
                            setTeamASearch("");
                            setTeamBSearch("");
                          }}
                        >
                          <SelectTrigger className="w-full bg-muted border border-border">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedMatchCategory && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Team A</label>
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                              <Input 
                                placeholder="Search Team A..." 
                                value={teamASearch}
                                onChange={(e) => setTeamASearch(e.target.value)}
                                className="pl-8 h-8 mb-1 bg-muted/50 text-xs"
                              />
                            </div>
                            <Select
                              value={teamAId}
                              onValueChange={setTeamAId}
                            >
                              <SelectTrigger className="w-full bg-muted border border-border">
                                <SelectValue placeholder="Select Team A" />
                              </SelectTrigger>
                              <SelectContent>
                                {registrations
                                  .filter(r => r.categoryId === selectedMatchCategory && 
                                    (r.teamName.toLowerCase().includes(teamASearch.toLowerCase()) || 
                                     r.captainName.toLowerCase().includes(teamASearch.toLowerCase())))
                                  .map(r => (
                                    <SelectItem key={r._id} value={r._id}>{r.teamName} ({r.captainName})</SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Team B</label>
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                              <Input 
                                placeholder="Search Team B..." 
                                value={teamBSearch}
                                onChange={(e) => setTeamBSearch(e.target.value)}
                                className="pl-8 h-8 mb-1 bg-muted/50 text-xs"
                              />
                            </div>
                            <Select
                              value={teamBId}
                              onValueChange={setTeamBId}
                            >
                              <SelectTrigger className="w-full bg-muted border border-border">
                                <SelectValue placeholder="Select Team B" />
                              </SelectTrigger>
                              <SelectContent>
                                {registrations
                                  .filter(r => r.categoryId === selectedMatchCategory && r._id !== teamAId && 
                                    (r.teamName.toLowerCase().includes(teamBSearch.toLowerCase()) || 
                                     r.captainName.toLowerCase().includes(teamBSearch.toLowerCase())))
                                  .map(r => (
                                    <SelectItem key={r._id} value={r._id}>{r.teamName} ({r.captainName})</SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                              <Input
                                type="date"
                                value={matchDate}
                                onChange={(e) => setMatchDate(e.target.value)}
                                className="bg-muted border border-border h-9"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-muted-foreground uppercase">Time</label>
                              <Input
                                type="time"
                                value={matchTime}
                                onChange={(e) => setMatchTime(e.target.value)}
                                className="bg-muted border border-border h-9"
                              />
                            </div>
                          </div>

                          <Button
                            className="w-full mt-2"
                            disabled={!teamAId || !teamBId}
                            onClick={async () => {
                              try {
                                const cat = categories.find(c => c.id === selectedMatchCategory);
                                await createManualMatch({
                                  token: sessionToken,
                                  teamAId: teamAId as any,
                                  teamBId: teamBId as any,
                                  categoryId: selectedMatchCategory,
                                  categoryLabel: cat?.label ?? "",
                                  date: matchDate || undefined,
                                  time: matchTime || undefined,
                                });
                                setTeamAId("");
                                setTeamBId("");
                                setMatchDate("");
                                setMatchTime("");
                                toast({
                                  title: "Match Created",
                                  description: "The manual match has been scheduled successfully.",
                                });
                              } catch (err: any) {
                                toast({
                                  title: "Error",
                                  description: err.message || "Failed to create match",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Create Match
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scheduled Matches List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                      <h4 className="font-bold">Match List</h4>
                      <div className="flex gap-1 p-1 bg-muted rounded-lg">
                        {(["all", "scheduled", "live", "completed"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setMatchStatusFilter(s)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                              matchStatusFilter === s 
                                ? "bg-primary text-white shadow-sm" 
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="p-4 font-semibold text-muted-foreground uppercase text-xs">Match</th>
                            <th className="p-4 font-semibold text-muted-foreground uppercase text-xs">Category</th>
                            <th className="p-4 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                            <th className="p-4 font-semibold text-muted-foreground uppercase text-xs text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {filteredMatches.map((match) => (
                            <Fragment key={match._id}>
                              <tr className="hover:bg-muted/10 transition-colors">
                              <td className="p-4 font-medium">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex flex-col">
                                    <span className="text-foreground">{match.teamAName}</span>
                                    <span className="text-[10px] text-muted-foreground flex gap-2">
                                      <span>Capt: {match.captainAName}</span>
                                      <span>•</span>
                                      <span>{match.phoneA}</span>
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-primary/50 uppercase font-black px-2 py-0.5 bg-primary/5 border border-primary/10 rounded w-fit">vs</span>
                                  <div className="flex flex-col">
                                    <span className="text-foreground">{match.teamBName}</span>
                                    <span className="text-[10px] text-muted-foreground flex gap-2">
                                      <span>Capt: {match.captainBName}</span>
                                      <span>•</span>
                                      <span>{match.phoneB}</span>
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded bg-muted text-xs border border-border flex flex-col items-center text-center min-w-[100px]">
                                  <span>{match.categoryLabel}</span>
                                  {(match.date || match.time) && (
                                    <span className="text-[9px] text-primary/70 mt-1">
                                      {match.date} {match.time}
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="p-4">
                                <Select
                                  value={match.status}
                                  onValueChange={async (newStatus: any) => {
                                    try {
                                      await updateMatchStatus({
                                        token: sessionToken,
                                        matchId: match._id,
                                        status: newStatus
                                      });
                                      toast({
                                        title: "Status Updated",
                                        description: `Match status changed to ${newStatus}`,
                                      });
                                    } catch (err: any) {
                                      toast({
                                        title: "Error",
                                        description: err.message || "Failed to update status",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className={`h-7 w-28 text-[10px] font-black uppercase tracking-wider border-none focus:ring-0 ${
                                    match.status === "live" ? "bg-primary/20 text-primary" : 
                                    match.status === "completed" ? "bg-muted text-muted-foreground" :
                                    "bg-primary/10 text-primary"
                                  }`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="live">Live</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`h-8 rounded-lg transition-all ${expandedMatchId === match._id ? 'bg-primary text-white border-primary' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
                                  onClick={() => setExpandedMatchId(expandedMatchId === match._id ? null : match._id)}
                                >
                                  {expandedMatchId === match._id ? "Hide Score" : "View Score"}
                                </Button>

                                {match.status === "scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-primary text-primary hover:bg-primary/10"
                                    onClick={() => startMatch({ token: sessionToken, matchId: match._id })}
                                  >
                                    Start Live
                                  </Button>
                                )}

                                <button
                                  onClick={async () => {
                                    if (confirm("Are you sure you want to delete this match? This will also remove any associated live scores.")) {
                                      try {
                                        await deleteMatch({ token: sessionToken, id: match._id });
                                        toast({
                                          title: "Match Deleted",
                                          description: "The match record has been removed.",
                                        });
                                      } catch (err: any) {
                                        toast({
                                          title: "Error",
                                          description: err.message || "Failed to delete match",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>

                                {match.status === "completed" && (
                                   <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/5 rounded border border-primary/10">
                                     {match.winnerName ? `WINNER: ${match.winnerName}` : "MATCH TIED"}
                                   </span>
                                )}
                              </td>
                            </tr>
                            <AnimatePresence>
                              {expandedMatchId === match._id && (
                                <tr>
                                  <td colSpan={4} className="p-0 border-none">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-muted/5 border-b border-border/50"
                                    >
                                      <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                          <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Detailed Scoreboard</h4>
                                          </div>
                                          {match.status === "completed" && match.finalScoreA && match.finalScoreB && (
                                            <div className="text-xs font-bold px-3 py-1 bg-card border border-border rounded-lg">
                                              Final Score: {match.teamAName} {match.finalScoreA.runs}/{match.finalScoreA.wickets} vs {match.teamBName} {match.finalScoreB.runs}/{match.finalScoreB.wickets}
                                            </div>
                                          )}
                                        </div>
                                        <ScoreboardTable matchId={match._id} />
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </Fragment>
                        ))}
                        {filteredMatches.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                              No {matchStatusFilter !== "all" ? matchStatusFilter : ""} matches found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
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
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search team or captain..."
                        className="pl-9 h-10 w-64 bg-muted/30"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[200px] h-10 bg-muted/30 border-border">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => setShowDuplicatesOnly(prev => !prev)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                        showDuplicatesOnly
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                          : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.4-3.4" />
                        <path d="M13 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                        <path d="m21 21-1.9-1.9" />
                      </svg>
                      Duplicates
                    </button>
                    <Button onClick={() => setIsManualRegOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                      <Plus className="h-4 w-4 mr-2" /> Manual Reg
                    </Button>
                    <Button onClick={exportRegistrationsCsv} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 shadow-sm">
                      <FileText className="h-4 w-4 mr-2" /> Export
                    </Button>
                  </div>
                </div>

                {showDuplicatesOnly && duplicateCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    <span>Showing <strong>{duplicateCount}</strong> entries with duplicate team names in the same category. Review and remove the unwanted ones.</span>
                  </div>
                )}

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
                        {displayedRegistrations.map((row) => {
                          const isExpanded = expandedTeamId === row._id;
                          const rowIsDup = isDuplicate(row);
                          return (
                            <Fragment key={row._id}>
                              <tr className={`hover:bg-muted/10 transition-colors ${rowIsDup ? "border-l-2 border-amber-500/60" : ""}`}>
                                <td className="p-4">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTeamId(isExpanded ? null : row._id)}
                                    className="flex items-center gap-2 text-left hover:text-primary transition-colors font-bold"
                                  >
                                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
                                    {row.teamName}
                                    {rowIsDup && (
                                      <span className="ml-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">Dup</span>
                                    )}
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
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingTeam(row);
                                        setIsEditDialogOpen(true);
                                      }}
                                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                      title="Edit Team"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Are you sure you want to delete team "${row.teamName}"?`)) {
                                          try {
                                            await deleteRegistration({ token: sessionToken, id: row._id });
                                            toast({ title: "Deleted", description: "Team registration deleted successfully." });
                                          } catch (err) {
                                            toast({ title: "Error", description: "Failed to delete team.", variant: "destructive" });
                                          }
                                        }
                                      }}
                                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                      title="Delete Team"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
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
                                            {(!( "paymentRef" in row) || !(row as any).paymentRef) && (!("paymentScreenshotUrl" in row) || !(row as any).paymentScreenshotUrl) && (
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
                        {displayedRegistrations.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              {showDuplicatesOnly ? "No duplicate team names found. All registrations are unique!" : "No registrations found."}
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
                    onClick={async () => {
                      try {
                        await setRegistrationOnlyMode({ enabled: !isRegistrationOnlyMode, token: sessionToken });
                        toast({
                          title: isRegistrationOnlyMode ? "Normal Mode Enabled" : "Registration Mode Enabled",
                          description: isRegistrationOnlyMode ? "Homepage is now visible." : "Users are now forced to the registration form.",
                        });
                      } catch (err: any) {
                        toast({
                          title: "Error",
                          description: err.message,
                          variant: "destructive",
                        });
                      }
                    }}
                    className={`shrink-0 shadow-sm transition-all ${isRegistrationOnlyMode
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-muted-foreground text-white hover:bg-muted-foreground/90"
                      }`}
                  >
                    {isRegistrationOnlyMode ? "Enabled (Turn OFF)" : "Disabled (Turn ON)"}
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-border bg-muted/20">
                  <div>
                    <p className="font-semibold text-foreground text-lg">Accept New Registrations</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      When disabled, the registration form will be locked and will not accept any new submissions.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={async () => {
                      try {
                        await setRegistrationsEnabled({ enabled: !isRegistrationsEnabled, token: sessionToken });
                        toast({
                          title: isRegistrationsEnabled ? "Registrations Closed" : "Registrations Opened",
                          description: isRegistrationsEnabled ? "Form is now locked." : "New teams can now register.",
                        });
                      } catch (err: any) {
                        toast({
                          title: "Error",
                          description: err.message,
                          variant: "destructive",
                        });
                      }
                    }}
                    className={`shrink-0 shadow-sm transition-all ${isRegistrationsEnabled
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-destructive hover:bg-destructive/90 text-white"
                      }`}
                  >
                    {isRegistrationsEnabled ? "Open (Turn OFF)" : "Closed (Turn ON)"}
                  </Button>
                </div>
              </div>

            </motion.div>
          )}
        </main>
      </div>

      <EditTeamDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        team={editingTeam}
        token={sessionToken}
        onUpdate={updateRegistration}
      />

      <ManualRegDialog
        isOpen={isManualRegOpen}
        onClose={() => setIsManualRegOpen(false)}
      />
    </div>
  );
}

function EditTeamDialog({
  isOpen,
  onClose,
  team,
  token,
  onUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  team: any;
  token: string;
  onUpdate: any;
}) {
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (team) {
      setFormData({
        teamName: team.teamName,
        captainName: team.captainName,
        captainAge: team.captainAge,
        phone: team.phone,
        players: team.players.map((p: any) => ({ name: p.name, age: p.age || p.dob })), // Handle both age/dob for display
      });
    }
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate({
        token,
        id: team._id,
        teamName: formData.teamName,
        captainName: formData.captainName,
        captainAge: Number(formData.captainAge),
        phone: formData.phone,
        players: formData.players.map((p: any) => ({
          name: p.name,
          age: Number(p.age),
        })),
        categoryId: team.categoryId,
        categoryLabel: team.categoryLabel,
      });
      toast({ title: "Updated", description: "Team details updated successfully." });
      onClose();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update team.", variant: "destructive" });
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team: {team?.teamName}</DialogTitle>
          <DialogDescription>Update the team details and player roster.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input
                value={formData.teamName}
                onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={team.categoryLabel} disabled className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Captain Name</Label>
              <Input
                value={formData.captainName}
                onChange={e => setFormData({ ...formData, captainName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Captain Age</Label>
              <Input
                type="number"
                value={formData.captainAge}
                onChange={e => setFormData({ ...formData, captainAge: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-bold">Players</Label>
            {formData.players.map((player: any, idx: number) => (
              <div key={idx} className="grid grid-cols-2 gap-4 p-3 border rounded-lg bg-muted/20">
                <div className="space-y-1">
                  <Label className="text-xs">Player {idx + 2} Name</Label>
                  <Input
                    value={player.name}
                    onChange={e => {
                      const newPlayers = [...formData.players];
                      newPlayers[idx].name = e.target.value;
                      setFormData({ ...formData, players: newPlayers });
                    }}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Age</Label>
                  <Input
                    type="number"
                    value={player.age}
                    onChange={e => {
                      const newPlayers = [...formData.players];
                      newPlayers[idx].age = e.target.value;
                      setFormData({ ...formData, players: newPlayers });
                    }}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManualRegDialog({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Manual Team Registration</DialogTitle>
          <DialogDescription>Fill out the form below to register a new team manually.</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto p-6 pt-2">
          {/* We can't easily embed RegisterPage because it has its own layout/header, 
              but for this task, I'll recommend the user to use the public /register page 
              or I can implement a simplified version. Given the complexity of RegisterPage,
              I'll add a link to the register page or a simple iframe/component if possible.
              However, for the best UX, I'll just put a message and a button to open in new tab
              OR I can try to render RegisterPage without its surrounding layout if I modify it.
          */}
          <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
            <div className="bg-primary/10 p-6 rounded-full">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <div className="max-w-md">
              <h3 className="text-xl font-bold mb-2">Use Standard Registration Flow</h3>
              <p className="text-muted-foreground mb-6">
                The best way to register a team is to use the standard registration portal. 
                This ensures all validations and payment tracking are handled correctly.
              </p>
              <Link to="/register" target="_blank">
                <Button size="lg" className="gap-2">
                  Open Registration Page <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${trend === "Live" ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
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
