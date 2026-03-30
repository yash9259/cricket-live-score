import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock auth — accept any non-empty credentials
    if (email.trim() && password.trim()) {
      onLogin();
    } else {
      setError("Please enter email and password");
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
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
              placeholder="admin@lohana.com"
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

          <Button type="submit" size="lg" className="w-full font-display text-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Lock className="h-4 w-4 mr-2" /> Sign In
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Demo: enter any email & password to continue
          </p>
        </form>
      </motion.div>
    </div>
  );
}
