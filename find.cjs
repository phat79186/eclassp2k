const fs = require('fs'); 
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n'); 
lines.forEach((l, i) => { 
    if (l.includes('function StudentAssignmentModal') || l.includes('function QuizTakeModal')) {
        console.log((i+1) + ': ' + l.trim()); 
    }
});
