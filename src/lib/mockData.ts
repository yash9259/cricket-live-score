export interface Player {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
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
  year: number;
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

const makePlayers = (entries: { name: string; age: number; gender: "male" | "female" }[]): Player[] =>
  entries.map((e, i) => ({
    id: `p${i}`,
    name: e.name,
    age: e.age,
    gender: e.gender,
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
  // 2026 teams
  {
    id: "t1", name: "Thunder Strikers", captain: "Raj Patel", phone: "9876543210", year: 2026,
    players: makePlayers([
      { name: "Raj Patel", age: 28, gender: "male" },
      { name: "Kiran Shah", age: 14, gender: "male" },
      { name: "Dev Mehta", age: 32, gender: "male" },
      { name: "Nikhil Joshi", age: 13, gender: "male" },
      { name: "Arjun Desai", age: 22, gender: "male" },
      { name: "Sagar Lohana", age: 19, gender: "male" },
      { name: "Priya Patel", age: 24, gender: "female" },
      { name: "Meera Shah", age: 12, gender: "female" },
    ]),
    status: "approved",
  },
  {
    id: "t2", name: "Royal Warriors", captain: "Amit Thakkar", phone: "9876543211", year: 2026,
    players: makePlayers([
      { name: "Amit Thakkar", age: 30, gender: "male" },
      { name: "Vishal Parmar", age: 14, gender: "male" },
      { name: "Rohit Gajjar", age: 25, gender: "male" },
      { name: "Sunil Rana", age: 11, gender: "male" },
      { name: "Jay Solanki", age: 18, gender: "male" },
      { name: "Kunal Mehta", age: 27, gender: "male" },
      { name: "Anjali Rana", age: 21, gender: "female" },
    ]),
    status: "approved",
  },
  {
    id: "t3", name: "Storm Blazers", captain: "Harsh Trivedi", phone: "9876543212", year: 2026,
    players: makePlayers([
      { name: "Harsh Trivedi", age: 29, gender: "male" },
      { name: "Manthan Dave", age: 13, gender: "male" },
      { name: "Bhavin Shah", age: 35, gender: "male" },
      { name: "Chirag Patel", age: 22, gender: "male" },
      { name: "Yash Modi", age: 15, gender: "male" },
      { name: "Ravi Kumar", age: 20, gender: "male" },
      { name: "Sneha Trivedi", age: 19, gender: "female" },
      { name: "Pooja Dave", age: 14, gender: "female" },
    ]),
    status: "approved",
  },
  {
    id: "t4", name: "Eagle XI", captain: "Pritesh Lohana", phone: "9876543213", year: 2026,
    players: makePlayers([
      { name: "Pritesh Lohana", age: 26, gender: "male" },
      { name: "Gaurav Sindhi", age: 12, gender: "male" },
      { name: "Mahesh Bhai", age: 40, gender: "male" },
      { name: "Nilesh Vora", age: 16, gender: "male" },
      { name: "Tushar Kothari", age: 14, gender: "male" },
      { name: "Ramesh Jain", age: 33, gender: "male" },
      { name: "Kavita Lohana", age: 28, gender: "female" },
    ]),
    status: "pending",
  },
  {
    id: "t5", name: "Fire Hawks", captain: "Deepak Nagrani", phone: "9876543214", year: 2026,
    players: makePlayers([
      { name: "Deepak Nagrani", age: 31, gender: "male" },
      { name: "Suresh Advani", age: 15, gender: "male" },
      { name: "Mohan Lalwani", age: 24, gender: "male" },
      { name: "Sanjay Murjani", age: 13, gender: "male" },
      { name: "Vinod Chhabria", age: 27, gender: "male" },
      { name: "Anil Bijlani", age: 20, gender: "male" },
      { name: "Rekha Nagrani", age: 22, gender: "female" },
      { name: "Nisha Advani", age: 14, gender: "female" },
    ]),
    status: "approved",
  },
  {
    id: "t6", name: "Night Riders", captain: "Kamal Vaswani", phone: "9876543215", year: 2026,
    players: makePlayers([
      { name: "Kamal Vaswani", age: 34, gender: "male" },
      { name: "Prakash Dhanani", age: 11, gender: "male" },
      { name: "Naresh Thadani", age: 28, gender: "male" },
      { name: "Ashok Mansukhani", age: 19, gender: "male" },
      { name: "Jatin Kukreja", age: 23, gender: "male" },
      { name: "Hemant Chawla", age: 17, gender: "male" },
      { name: "Sonal Vaswani", age: 25, gender: "female" },
    ]),
    status: "pending",
  },
  // 2025 teams
  {
    id: "t7", name: "Rising Stars", captain: "Vikram Lohana", phone: "9876543220", year: 2025,
    players: makePlayers([
      { name: "Vikram Lohana", age: 27, gender: "male" },
      { name: "Akash Sindhi", age: 14, gender: "male" },
      { name: "Rahul Keswani", age: 30, gender: "male" },
      { name: "Prem Lalwani", age: 12, gender: "male" },
      { name: "Divya Lohana", age: 20, gender: "female" },
      { name: "Rina Keswani", age: 18, gender: "female" },
    ]),
    status: "approved",
  },
  {
    id: "t8", name: "Super Kings", captain: "Govind Mirpuri", phone: "9876543221", year: 2025,
    players: makePlayers([
      { name: "Govind Mirpuri", age: 33, gender: "male" },
      { name: "Tarun Bhagnani", age: 13, gender: "male" },
      { name: "Arun Wadhwa", age: 29, gender: "male" },
      { name: "Lalit Chandiramani", age: 15, gender: "male" },
      { name: "Manisha Mirpuri", age: 26, gender: "female" },
    ]),
    status: "approved",
  },
  {
    id: "t9", name: "Blazing Bolts", captain: "Sunil Ramchandani", phone: "9876543222", year: 2025,
    players: makePlayers([
      { name: "Sunil Ramchandani", age: 25, gender: "male" },
      { name: "Karan Jagtiani", age: 11, gender: "male" },
      { name: "Vijay Gidwani", age: 35, gender: "male" },
      { name: "Neeraj Thadani", age: 14, gender: "male" },
      { name: "Geeta Ramchandani", age: 23, gender: "female" },
      { name: "Komal Jagtiani", age: 13, gender: "female" },
    ]),
    status: "approved",
  },
  // 2024 teams
  {
    id: "t10", name: "Cricket Lions", captain: "Deepesh Vaswani", phone: "9876543230", year: 2024,
    players: makePlayers([
      { name: "Deepesh Vaswani", age: 29, gender: "male" },
      { name: "Sumit Chhabria", age: 14, gender: "male" },
      { name: "Rajiv Nagrani", age: 32, gender: "male" },
      { name: "Lakshmi Vaswani", age: 21, gender: "female" },
      { name: "Anita Chhabria", age: 15, gender: "female" },
    ]),
    status: "approved",
  },
  {
    id: "t11", name: "Phoenix XI", captain: "Mohan Bijlani", phone: "9876543231", year: 2024,
    players: makePlayers([
      { name: "Mohan Bijlani", age: 36, gender: "male" },
      { name: "Raju Lalchandani", age: 12, gender: "male" },
      { name: "Dinesh Advani", age: 28, gender: "male" },
      { name: "Sunita Bijlani", age: 24, gender: "female" },
      { name: "Neeta Lalchandani", age: 13, gender: "female" },
    ]),
    status: "approved",
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

// Tournament years
export const tournamentYears = [2024, 2025, 2026];

// Helper: get teams by year
export const getTeamsByYear = (year: number) => teams.filter((t) => t.year === year);

// Helper: demographics for a set of players
export function getDemographics(players: { age: number; gender: "male" | "female" }[]) {
  const childrenUnder15 = players.filter((p) => p.age < 15).length;
  const boysOver15 = players.filter((p) => p.gender === "male" && p.age >= 15).length;
  const ladies = players.filter((p) => p.gender === "female").length;
  return { childrenUnder15, boysOver15, ladies, total: players.length };
}
