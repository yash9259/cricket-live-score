import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [teamName, setTeamName] = useState("");
  const [captain, setCaptain] = useState("");
  const [phone, setPhone] = useState("");
  const [players, setPlayers] = useState(["", ""]);
  const [submitted, setSubmitted] = useState(false);

  const addPlayer = () => setPlayers([...players, ""]);
  const removePlayer = (i: number) => setPlayers(players.filter((_, idx) => idx !== i));
  const updatePlayer = (i: number, v: string) => {
    const copy = [...players];
    copy[i] = v;
    setPlayers(copy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <CheckCircle className="h-20 w-20 text-primary mx-auto" />
          <h2 className="font-display text-4xl font-bold text-foreground">Registration Submitted!</h2>
          <p className="text-muted-foreground">Your team <span className="text-primary font-semibold">{teamName}</span> is pending approval.</p>
          <Button onClick={() => { setSubmitted(false); setTeamName(""); setCaptain(""); setPhone(""); setPlayers(["", ""]); }} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            Register Another Team
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Register Your Team</h1>
        <p className="text-muted-foreground mb-8">Fill in the details below to join the tournament.</p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-8">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Thunder Strikers" required className="bg-muted border-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="captain">Captain Name</Label>
              <Input id="captain" value={captain} onChange={(e) => setCaptain(e.target.value)} placeholder="Full name" required className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required className="bg-muted border-border" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Players</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addPlayer} className="text-primary hover:bg-primary/10">
                <Plus className="h-4 w-4 mr-1" /> Add Player
              </Button>
            </div>
            {players.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={p}
                  onChange={(e) => updatePlayer(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  required
                  className="bg-muted border-border"
                />
                {players.length > 2 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePlayer(i)} className="text-destructive hover:bg-destructive/10 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" size="lg" className="w-full font-display text-lg bg-primary text-primary-foreground hover:bg-primary/90">
            Submit Registration
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
