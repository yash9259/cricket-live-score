export interface Player {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: number;
  runsConceded: number;
  isOut: boolean;
  howOut?: string;
}

export interface Team {
  id: string;
  name: string;
  captain: string;
  phone: string;
  players: Player[];
  status: "pending" | "approved" | "rejected";
  logo?: string;
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  date: string;
  time: string;
  status: "upcoming" | "live" | "completed";
  venue: string;
  overs: number;
  scoreA?: { runs: number; wickets: number; overs: number; balls: number };
  scoreB?: { runs: number; wickets: number; overs: number; balls: number };
  toss?: string;
  batting?: "A" | "B";
  winner?: string;
  mom?: string;
  ballByBall?: BallEvent[];
}

export interface BallEvent {
  over: number;
  ball: number;
  runs: number;
  type: "normal" | "wide" | "noball" | "wicket" | "four" | "six";
  batsman: string;
  bowler: string;
}

const makePlayers = (names: string[]): Player[] =>
  names.map((name, i) => ({
    id: `p${i}`,
    name,
    runs: Math.floor(Math.random() * 45),
    balls: Math.floor(Math.random() * 30) + 5,
    fours: Math.floor(Math.random() * 5),
    sixes: Math.floor(Math.random() * 3),
    wickets: Math.floor(Math.random() * 3),
    overs: Math.floor(Math.random() * 4),
    runsConceded: Math.floor(Math.random() * 30),
    isOut: Math.random() > 0.5,
    howOut: Math.random() > 0.5 ? "Caught" : "Bowled",
  }));

export const teams: Team[] = [
  {
    id: "t1", name: "Thunder Strikers", captain: "Raj Patel", phone: "9876543210",
    players: makePlayers(["Raj Patel", "Kiran Shah", "Dev Mehta", "Nikhil Joshi", "Arjun Desai", "Sagar Lohana"]),
    status: "approved",
  },
  {
    id: "t2", name: "Royal Warriors", captain: "Amit Thakkar", phone: "9876543211",
    players: makePlayers(["Amit Thakkar", "Vishal Parmar", "Rohit Gajjar", "Sunil Rana", "Jay Solanki", "Kunal Mehta"]),
    status: "approved",
  },
  {
    id: "t3", name: "Storm Blazers", captain: "Harsh Trivedi", phone: "9876543212",
    players: makePlayers(["Harsh Trivedi", "Manthan Dave", "Bhavin Shah", "Chirag Patel", "Yash Modi", "Ravi Kumar"]),
    status: "approved",
  },
  {
    id: "t4", name: "Eagle XI", captain: "Pritesh Lohana", phone: "9876543213",
    players: makePlayers(["Pritesh Lohana", "Gaurav Sindhi", "Mahesh Bhai", "Nilesh Vora", "Tushar Kothari", "Ramesh Jain"]),
    status: "pending",
  },
  {
    id: "t5", name: "Fire Hawks", captain: "Deepak Nagrani", phone: "9876543214",
    players: makePlayers(["Deepak Nagrani", "Suresh Advani", "Mohan Lalwani", "Sanjay Murjani", "Vinod Chhabria", "Anil Bijlani"]),
    status: "approved",
  },
  {
    id: "t6", name: "Night Riders", captain: "Kamal Vaswani", phone: "9876543215",
    players: makePlayers(["Kamal Vaswani", "Prakash Dhanani", "Naresh Thadani", "Ashok Mansukhani", "Jatin Kukreja", "Hemant Chawla"]),
    status: "pending",
  },
];

const ballByBallSample: BallEvent[] = [
  { over: 1, ball: 1, runs: 1, type: "normal", batsman: "Raj Patel", bowler: "Amit Thakkar" },
  { over: 1, ball: 2, runs: 4, type: "four", batsman: "Kiran Shah", bowler: "Amit Thakkar" },
  { over: 1, ball: 3, runs: 0, type: "wicket", batsman: "Kiran Shah", bowler: "Amit Thakkar" },
  { over: 1, ball: 4, runs: 0, type: "normal", batsman: "Dev Mehta", bowler: "Amit Thakkar" },
  { over: 1, ball: 5, runs: 2, type: "normal", batsman: "Dev Mehta", bowler: "Amit Thakkar" },
  { over: 1, ball: 6, runs: 6, type: "six", batsman: "Raj Patel", bowler: "Amit Thakkar" },
  { over: 2, ball: 1, runs: 1, type: "wide", batsman: "Raj Patel", bowler: "Vishal Parmar" },
  { over: 2, ball: 2, runs: 1, type: "normal", batsman: "Raj Patel", bowler: "Vishal Parmar" },
  { over: 2, ball: 3, runs: 4, type: "four", batsman: "Dev Mehta", bowler: "Vishal Parmar" },
  { over: 2, ball: 4, runs: 0, type: "normal", batsman: "Raj Patel", bowler: "Vishal Parmar" },
  { over: 2, ball: 5, runs: 2, type: "normal", batsman: "Dev Mehta", bowler: "Vishal Parmar" },
  { over: 2, ball: 6, runs: 6, type: "six", batsman: "Raj Patel", bowler: "Vishal Parmar" },
];

export const matches: Match[] = [
  {
    id: "m1", teamA: teams[0], teamB: teams[1], date: "2026-03-30", time: "18:00",
    status: "live", venue: "Lohana Sports Club", overs: 6,
    scoreA: { runs: 82, wickets: 3, overs: 5, balls: 2 },
    scoreB: { runs: 45, wickets: 1, overs: 3, balls: 4 },
    toss: "Thunder Strikers", batting: "A",
    ballByBall: ballByBallSample,
  },
  {
    id: "m2", teamA: teams[2], teamB: teams[4], date: "2026-03-30", time: "20:00",
    status: "upcoming", venue: "Lohana Sports Club", overs: 6,
  },
  {
    id: "m3", teamA: teams[0], teamB: teams[2], date: "2026-03-29", time: "18:00",
    status: "completed", venue: "Lohana Sports Club", overs: 6,
    scoreA: { runs: 95, wickets: 4, overs: 6, balls: 0 },
    scoreB: { runs: 78, wickets: 6, overs: 6, balls: 0 },
    toss: "Thunder Strikers", batting: "A", winner: "Thunder Strikers", mom: "Raj Patel",
    ballByBall: ballByBallSample,
  },
  {
    id: "m4", teamA: teams[1], teamB: teams[4], date: "2026-03-29", time: "20:00",
    status: "completed", venue: "Lohana Sports Club", overs: 6,
    scoreA: { runs: 67, wickets: 5, overs: 6, balls: 0 },
    scoreB: { runs: 70, wickets: 2, overs: 5, balls: 3 },
    toss: "Fire Hawks", batting: "B", winner: "Fire Hawks", mom: "Deepak Nagrani",
  },
];

export const topBatsmen = [
  { name: "Raj Patel", team: "Thunder Strikers", runs: 142, matches: 3, sr: 185.7 },
  { name: "Deepak Nagrani", team: "Fire Hawks", runs: 118, matches: 2, sr: 196.6 },
  { name: "Harsh Trivedi", team: "Storm Blazers", runs: 95, matches: 2, sr: 158.3 },
  { name: "Amit Thakkar", team: "Royal Warriors", runs: 87, matches: 3, sr: 145.0 },
  { name: "Pritesh Lohana", team: "Eagle XI", runs: 76, matches: 2, sr: 152.0 },
];

export const topBowlers = [
  { name: "Amit Thakkar", team: "Royal Warriors", wickets: 7, matches: 3, economy: 6.5 },
  { name: "Sagar Lohana", team: "Thunder Strikers", wickets: 5, matches: 3, economy: 7.2 },
  { name: "Bhavin Shah", team: "Storm Blazers", wickets: 5, matches: 2, economy: 8.1 },
  { name: "Suresh Advani", team: "Fire Hawks", wickets: 4, matches: 2, economy: 6.8 },
  { name: "Vishal Parmar", team: "Royal Warriors", wickets: 3, matches: 3, economy: 7.5 },
];
