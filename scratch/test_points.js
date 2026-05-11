import { calculateBattingPoints } from './convex/points.js';

console.log("Test 1 (9 runs, 2 fours):", calculateBattingPoints({ runs: 9, fours: 2 }));
console.log("Test 2 (22 runs, 1 four, 3 sixes):", calculateBattingPoints({ runs: 22, fours: 1, sixes: 3 }));
console.log("Test 3 (4 runs, 1 four):", calculateBattingPoints({ runs: 4, fours: 1 }));
