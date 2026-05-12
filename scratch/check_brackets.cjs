const fs = require('fs');
const content = fs.readFileSync('e:/cricket-live-score/src/pages/ScorerPage.tsx', 'utf8');

function checkBrackets(str) {
    const stack = [];
    const brackets = {
        '(': ')',
        '{': '}',
        '[': ']'
    };
    const lines = str.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (brackets[char]) {
                stack.push({ char, line: i + 1, col: j + 1 });
            } else if (Object.values(brackets).includes(char)) {
                const last = stack.pop();
                if (!last || brackets[last.char] !== char) {
                    console.log(`Unbalanced bracket: found ${char} at line ${i + 1}, col ${j + 1}`);
                    if (last) console.log(`Expected ${brackets[last.char]} matching ${last.char} from line ${last.line}, col ${last.col}`);
                    return;
                }
            }
        }
    }
    if (stack.length > 0) {
        const last = stack.pop();
        console.log(`Unclosed bracket: ${last.char} from line ${last.line}, col ${last.col}`);
    } else {
        console.log('Brackets are balanced!');
    }
}

checkBrackets(content);
