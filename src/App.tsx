import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "../convex/_generated/api";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/HomePage";
import RegisterPage from "@/pages/RegisterPage";
import MatchesPage from "@/pages/MatchesPage";
import MatchDetailPage from "@/pages/MatchDetailPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import AdminPage from "@/pages/AdminPage";
import ScorerPage from "@/pages/ScorerPage";
import DisplayPage from "@/pages/DisplayPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { pathname } = useLocation();
  const isDisplay = pathname.startsWith("/display");
  const settings = useQuery(api.settings.getPublicSettings);
  const registrationOnlyMode = settings?.registrationOnlyMode ?? false;

  const isAdminArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/scorer") ||
    pathname.startsWith("/display");
  const isRegisterArea = pathname.startsWith("/register");

  if (registrationOnlyMode && !isRegisterArea && !isAdminArea) {
    return <Navigate to="/register" replace />;
  }

  return (
    <>
      {/* Show Navbar only if not in display, admin, or scorer area */}
      {!isDisplay && !isAdminArea && <Navbar registrationOnlyMode={registrationOnlyMode} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/match/:id" element={<MatchDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/scorer" element={<ScorerPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
