import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onLogin: (token: string) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const login = useMutation(api.adminAuth.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const result = await login({ email, password });
      if (result.success && result.token) {
        onLogin(result.token);
        return;
      }
      setError(result.message);
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#b3e5fc]/20 mb-4">
            <Trophy className="h-8 w-8 text-[#b3e5fc]" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage the tournament</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="admin@vrpyuvasangthanbhuj.in"
              className="bg-muted border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              className="bg-muted border-border"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full font-display text-lg bg-[#b3e5fc] text-slate-900 hover:bg-[#9fd8f2] disabled:opacity-60">
            <Lock className="h-4 w-4 mr-2" /> {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Admin-only access
          </p>
        </form>
      </motion.div>
    </div>
  );
}
