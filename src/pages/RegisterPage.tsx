import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = [
  { id: "youth", label: "યુવાનો 16 વર્ષ થી ઉપરના", fee: 1500 },
  { id: "women", label: "યુવતીઓ તથા મહિલાઓ 16 વર્ષ થી ઉપર ની", fee: 1200 },
  { id: "boys-11-15", label: "બાળકો (11 થી 15 વર્ષ) - 01-04-2011 પછી જન્મ હોવો જોઈએ", fee: 900 },
  { id: "girls-11-15", label: "બાલિકાઓ (11 થી 15 વર્ષ) - 01-04-2011 પછી જન્મ હોવો જોઈએ", fee: 900 },
  { id: "kids-5-10", label: "બાળકો તથા બાલિકાઓ (5 થી 10 વર્ષ) - 01-04-2016 પછી જન્મ હોવો જોઈએ", fee: 900 },
];

const calculateAge = (dob: string): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

export default function RegisterPage() {
  const [section, setSection] = useState<"rules" | "team" | "payment">("rules");
  const [teamName, setTeamName] = useState("");
  const [captain, setCaptain] = useState("");
  const [captainDOB, setCaptainDOB] = useState("");
  const [phone, setPhone] = useState("");
  const [players, setPlayers] = useState(Array(5).fill({ name: "", dob: "" }));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [teamValidationError, setTeamValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const createRegistration = useMutation(api.registrations.createRegistration);

  const updatePlayer = (i: number, field: "name" | "dob", value: string) => {
    const copy = [...players];
    copy[i] = { ...copy[i], [field]: value };
    setPlayers(copy);
  };

  const selectedFee = categories.find(c => c.id === selectedCategory)?.fee || 0;
  const upiPaymentUrl = `upi://pay?pa=9033615897@upi&pn=VRP Box Cricket&am=${selectedFee}&cu=INR`;
  const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPaymentUrl)}`;

  const getCategoryAgeRule = (categoryId: string) => {
    if (categoryId === "youth" || categoryId === "women") return "16+ years";
    if (categoryId === "boys-11-15" || categoryId === "girls-11-15") return "11-15 years";
    if (categoryId === "kids-5-10") return "5-10 years";
    return "selected category";
  };

  const isAgeAllowedForCategory = (age: number | null, categoryId: string) => {
    if (age === null) return false;
    if (categoryId === "youth" || categoryId === "women") return age >= 16;
    if (categoryId === "boys-11-15" || categoryId === "girls-11-15") return age >= 11 && age <= 15;
    if (categoryId === "kids-5-10") return age >= 5 && age <= 10;
    return false;
  };

  const captainAge = calculateAge(captainDOB);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (section === "rules") {
      setSection("team");
    } else if (section === "team") {
      if (!selectedCategory) {
        setTeamValidationError("Please select a category.");
        return;
      }

      if (!isAgeAllowedForCategory(captainAge, selectedCategory)) {
        setTeamValidationError(`Captain age must be in ${getCategoryAgeRule(selectedCategory)} for selected category.`);
        return;
      }

      for (let i = 0; i < players.length; i++) {
        const playerAge = calculateAge(players[i].dob);
        if (!isAgeAllowedForCategory(playerAge, selectedCategory)) {
          setTeamValidationError(`Player ${i + 2} age must be in ${getCategoryAgeRule(selectedCategory)} for selected category.`);
          return;
        }
      }

      setTeamValidationError("");
      setSection("payment");
    } else if (section === "payment") {
      try {
        setSubmitError("");
        setIsSubmitting(true);
        await createRegistration({
          categoryId: selectedCategory,
          categoryLabel: categories.find((c) => c.id === selectedCategory)?.label ?? "",
          teamName,
          captainName: captain,
          captainDob: captainDOB,
          phone,
          players,
          fee: selectedFee,
          createdAt: Date.now(),
        });
        setSubmitted(true);
      } catch {
        setSubmitError("Registration save failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
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
          <p className="text-muted-foreground">Your team <span className="text-primary font-semibold">{teamName}</span> is approved and saved.</p>
          <Button onClick={() => { setSubmitted(false); setTeamName(""); setCaptain(""); setCaptainDOB(""); setPhone(""); setPlayers(Array(5).fill({ name: "", dob: "" })); setSelectedCategory(""); setTeamValidationError(""); setSubmitError(""); setSection("rules"); }} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            Register Another Team
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">ટુર્નામેન્ટ નોંધણી</h1>
        <p className="text-muted-foreground mb-8">VRP BOX CRICKET ટુર્નામેન્ટમાં તમારી ટીમની નોંધણી કરો</p>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {["rules", "team", "payment"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-display font-bold text-sm ${section === s ? "bg-primary text-primary-foreground" : i < ["rules", "team", "payment"].indexOf(section) ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"}`}>
                {i + 1}
              </div>
              {i < 2 && <div className="w-12 h-0.5 bg-border mx-1" />}
            </div>
          ))}
        </div>

        {/* Section 1: Rules */}
        {section === "rules" && (
          <motion.form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">કુલ નિયમો (Tournament Rules)</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="font-semibold text-foreground mb-2">⚠️ મર્યાદિત સંખ્યા માં ફોર્મ હોવા થી વહેલા અને પહેલા ફોર્મ ભરી દેવા</p>
                  <p>આ ટુર્નામેન્ટ ફક્ત લોહાણા જ્ઞાતિ પૂરતી મર્યાદિત છે.</p>
                </div>

                <ul className="space-y-3 list-disc list-inside">
                  <li>આ સમગ્ર બોક્સ ક્રિકેટ ટુર્નામેન્ટ પાંચ અલગ અલગ વિભાગમાં મેચ રમાડવામાં આવશે.</li>
                  <li>દરેક મેચ 6 ઓવરની રહેશે જેમાં દરેક ઓવર નો છેલ્લો બોલ સુપર બોલ રહેશે.</li>
                  <li>એક ખેલાડી એક જ ઓવર નાખી શકશે તથા એક ખેલાડી એક જ ટીમમાં ભાગ લઈ શકશે.</li>
                  <li>વાઈડ તથા નોબોલ ના 2 રન રહેશે તથા દરેક નોબોલ પછીનો બોલ ફ્રી હિટ રહેશે.</li>
                  <li>સુપર બોલ માં જો વાઈડ અથવા નો બોલ પડશે તો માત્ર 2 રન ગણાશે.</li>
                  <li>જો કોઈ બોલર ફાસ્ટ બોલ નાખશે તો અમ્પાયર નોબોલ આપી શકશે.</li>
                </ul>

                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="font-semibold text-foreground mb-2">📋 ફર્જિયાત નોંધણી અને ફી ભરણી</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>એન્ટ્રી ફી ફરજિયાત ગુગલ પે (Google Pay) અથવા UPI (9033615897@upi) દ્વારા ભરવાની રહેશે.</li>
                    <li>ફી ભર્યા બાદ તેનો સ્ક્રીનશોટ મોબાઇલ નંબર 88661 14748 (યોગેશ મીરાણી) પર ટીમ અને કેપ્ટન ના નામ સાથે Whatsapp કરવાનો રહેશે.</li>
                    <li>માત્ર ફોર્મ ભરેલું હશે અને એન્ટ્રી ફી બાકી હશે તો તે ટીમનું નામ ડ્રોમાં નાખવામાં આવશે નહિ.</li>
                    <li>ફોર્મ ભરવાની છેલ્લી તારીખ 31-04-2026 મંગળવાર સુધી રહેશે.</li>
                  </ul>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="font-semibold text-foreground mb-2">👕 ડ્રેસ કોડ અને નિર્ણય</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>મેચ દરમિયાન દરેક ટીમે ફરજિયાત એક સરખા ડ્રેસ કોડમાં આવવાનું રહેશે.</li>
                    <li>સમગ્ર ટુર્નામેન્ટમાં અમ્પાયર નો નિર્ણય આખરી નિર્ણય રહેશે જે દરેક ટીમને બંધનકર્તા રહેશે.</li>
                    <li>આ સમગ્ર ટુર્નામેન્ટમાં ફેરફાર કરવાનો હક આયોજકનો રહેશે અને તે દરેક ટીમને બંધનકર્તા રહેશે.</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/15 p-6 rounded-lg border-2 border-yellow-500/50 shadow-md">
                  <p className="font-semibold text-foreground mb-3">👶 નાના બાળકો અને મહિલાઓ માટે</p>
                  <p className="text-base font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-500/20 p-3 rounded border-l-4 border-yellow-500">
                    ⭐ જો બોલ એક ટીપ ખાઈ ને બીજી ટીપ લાઈન ની અંદર પડશે તો ગણતરી માં લેવા માં આવશે.
                  </p>
                  <p className="font-semibold text-foreground mb-2 mt-3">📞 વધુ માહિતી માટે સંપર્ક કરો</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><span className="font-semibold">નરેન એચ. મીરાણી</span><br />99250 41531</p>
                    <p><span className="font-semibold">હાર્દિક બી આચાર્ય</span><br />9913060111</p>
                    <p><span className="font-semibold">સંજય જે ઘટ્ટા</span><br />9173568000</p>
                    <p><span className="font-semibold">કપિલ આર ઠક્કર</span><br />8758762625</p>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-display text-lg bg-primary text-primary-foreground hover:bg-primary/90">
              આગલો વિભાગ (Next)
            </Button>
          </motion.form>
        )}

        {/* Section 2: Team Details */}
        {section === "team" && (
          <motion.form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">ટીમ વિવરણ (Team Details)</h2>

            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <Label className="text-base font-semibold">શ્રેણી પસંદ કરો (Select Category)</Label>
              <div className="space-y-2">
                {categories.map((cat, index) => (
                  <label
                    key={cat.id}
                    className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCategory === cat.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="teamCategory"
                        value={cat.id}
                        checked={selectedCategory === cat.id}
                        onChange={() => {
                          setSelectedCategory(cat.id);
                          setTeamValidationError("");
                        }}
                        required
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {index + 1}... {cat.label} (એન્ટ્રી ફી રૂ. {cat.fee}/-)
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Team Info */}
            <div className="space-y-4 pb-6 border-b border-border">
              <div className="space-y-2">
                <Label htmlFor="teamName" className="font-semibold">ટીમનું નામ <span className="text-destructive">*</span> (Team Name)</Label>
                <Input 
                  id="teamName" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value)} 
                  placeholder="દા.ત. Lightning Strikers" 
                  required 
                  className="bg-muted border-border" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="captain" className="font-semibold">કપ્તાનનું નામ <span className="text-destructive">*</span> (Captain Name)</Label>
                  <Input 
                    id="captain" 
                    value={captain} 
                    onChange={(e) => setCaptain(e.target.value)} 
                    placeholder="સંપૂર્ણ નામ" 
                    required 
                    className="bg-muted border-border" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold">ફોન નંબર <span className="text-destructive">*</span> (Phone Number)</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={phone} 
                    onChange={(e) => {
                      const numOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(numOnly);
                    }}
                    placeholder="9876543210" 
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required 
                    className="bg-muted border-border" 
                  />
                  {phone && phone.length < 10 && (
                    <p className="text-xs text-orange-600">10 આંકડા જરૂરી છે</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="captainDOB" className="font-semibold">કપ્તાનની જન્મતારીખ <span className="text-destructive">*</span> (Captain Date of Birth)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    id="captainDOB" 
                    type="date" 
                    value={captainDOB} 
                    onChange={(e) => setCaptainDOB(e.target.value)} 
                    required 
                    className="bg-muted border-border" 
                  />
                  {captainDOB && (
                    <div className="bg-primary/10 rounded px-3 py-2 flex items-center justify-center border border-primary/20">
                      <span className="text-sm font-semibold text-primary">
                        {captainAge} વર્ષ
                      </span>
                    </div>
                  )}
                </div>
                {selectedCategory && captainDOB && !isAgeAllowedForCategory(captainAge, selectedCategory) && (
                  <p className="text-xs text-destructive">
                    Captain age must be in {getCategoryAgeRule(selectedCategory)}.
                  </p>
                )}
              </div>
            </div>

            {/* Players */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground">ખેલાડીઓ (પંક્તિ 2-6) - Players</h3>
              {players.map((player, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                  <p className="font-semibold text-foreground text-sm">ખેલાડી #{i + 2}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`player-name-${i}`} className="text-xs font-semibold">ખેલાડીનું નામ <span className="text-destructive">*</span></Label>
                      <Input 
                        id={`player-name-${i}`}
                        value={player.name}
                        onChange={(e) => updatePlayer(i, "name", e.target.value)}
                        placeholder={`ખેલાડી ${i + 2} નું નામ`}
                        required
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`player-dob-${i}`} className="text-xs font-semibold">જન્મતારીખ <span className="text-destructive">*</span></Label>
                      <div className="flex gap-2">
                        <Input 
                          id={`player-dob-${i}`}
                          type="date"
                          value={player.dob}
                          onChange={(e) => updatePlayer(i, "dob", e.target.value)}
                          required
                          className="bg-background border-border flex-1"
                        />
                        {player.dob && (
                          <div className="bg-primary/10 rounded px-2 py-2 flex items-center justify-center border border-primary/20 min-w-fit">
                            <span className="text-xs font-semibold text-primary">
                              {calculateAge(player.dob)}y
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedCategory && player.dob && !isAgeAllowedForCategory(calculateAge(player.dob), selectedCategory) && (
                        <p className="text-xs text-destructive">
                          Player age must be in {getCategoryAgeRule(selectedCategory)}.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {teamValidationError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                  <p className="text-sm font-semibold text-destructive">{teamValidationError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                size="lg" 
                className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setSection("rules")}
              >
                પાછળ (Back)
              </Button>
              <Button type="submit" size="lg" className="flex-1 font-display text-lg bg-primary text-primary-foreground hover:bg-primary/90" disabled={!selectedCategory}>
                આગલો વિભાગ (Next)
              </Button>
            </div>
          </motion.form>
        )}

        {/* Section 3: Payment */}
        {section === "payment" && (
          <motion.form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">ચલણ અને શ્રેણી (Category & Payment)</h2>

            <div className="space-y-3">
              <Label className="text-base font-semibold">પસંદ કરેલી શ્રેણી (Selected Category)</Label>
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/10">
                <p className="font-semibold text-foreground">{categories.find((c) => c.id === selectedCategory)?.label}</p>
                <p className="text-primary font-display text-lg mt-1">₹{selectedFee}/-</p>
              </div>
            </div>

            {selectedCategory && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 border border-primary/30 rounded-lg p-6 space-y-4"
              >
                <div className="flex justify-between items-center pb-4 border-b border-primary/20">
                  <span className="font-display text-lg text-foreground">ચલણીય રકમ (Payable Amount)</span>
                  <span className="font-display text-3xl font-bold text-primary">₹{selectedFee}/-</span>
                </div>

                <div className="bg-white p-4 rounded-lg flex justify-center">
                  <img 
                    src={qrCodeSrc}
                    alt="UPI QR Code" 
                    className="h-48 w-48"
                  />
                </div>

                <div className="bg-muted/50 p-3 rounded text-center space-y-1">
                  <p className="text-xs text-muted-foreground">UPI ID / QR Code માટે</p>
                  <p className="font-display font-bold text-foreground">9033615897@upi</p>
                </div>

                <div className="bg-red-500/20 border-2 border-red-600 rounded-lg p-6 shadow-lg">
                  <div className="flex gap-3 items-start">
                    <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-1 animate-pulse" />
                    <div className="flex-1">
                      <p className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">⭐ મહત્વપૂર્ણ</p>
                      <p className="text-base font-semibold text-red-800 dark:text-red-300 leading-relaxed">
                        ચલણ કર્યા પછી સ્ક્રીનશોટ <span className="font-display text-lg bg-red-600/30 px-2 py-1 rounded">88661 14748</span> (યોગેશ) પર WhatsApp કરો
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                size="lg" 
                className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setSection("team")}
              >
                પાછળ (Back)
              </Button>
              <Button 
                type="submit" 
                size="lg" 
                disabled={!selectedCategory || isSubmitting}
                className="flex-1 font-display text-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "નોંધણી સમાપ્ત કરો (Complete)"}
              </Button>
            </div>

            {submitError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-sm font-semibold text-destructive">{submitError}</p>
              </div>
            )}
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
