const fs = require('fs'); const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n'); lines.forEach((l, i) => { if (l.toLowerCase().includes('làm l?i')) console.log((i+1) + ': ' + l); });
