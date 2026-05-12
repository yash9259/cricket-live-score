import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "../convex/_generated/api";
import Navbar from "@/components/Navbar";
import BottomNavbar from "@/components/BottomNavbar";

// Lazy load pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const MatchesPage = lazy(() => import("@/pages/MatchesPage"));
const MatchDetailPage = lazy(() => import("@/pages/MatchDetailPage"));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ScorerPage = lazy(() => import("@/pages/ScorerPage"));
const DisplayPage = lazy(() => import("@/pages/DisplayPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
      {!isDisplay && !isAdminArea && (
        <>
          <Navbar registrationOnlyMode={registrationOnlyMode} />
          <BottomNavbar />
        </>
      )}
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
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
      </Suspense>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
