const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'frontend', 'src', 'app', 'about', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');
const replacements = [
  [/min-h-\[100svh\]/g, 'min-h-svh'],
  [/font-\[family-name:var\(--font-display\)\]/g, 'font-(family-name:--font-display)'],
  [/font-\[family-name:var\(--font-body\)\]/g, 'font-(family-name:--font-body)'],
  [/font-\[family-name:var\(--font-mono\)\]/g, 'font-mono'],
  [/bg-gradient-to-b/g, 'bg-linear-to-b'],
  [/bg-gradient-to-br/g, 'bg-linear-to-br'],
  [/bg-gradient-to-r/g, 'bg-linear-to-r'],
  [/bg-white\/\[0\.03\]/g, 'bg-white/3'],
  [/bg-white\/\[0\.02\]/g, 'bg-white/2'],
  [/sm:w-\[380px\]/g, 'sm:w-95'],
  [/md:auto-rows-\[180px\]/g, 'md:auto-rows-45'],
  [/from-violet-500\/\[0\.08\]/g, 'from-violet-500/8'],
  [/from-cyan-400\/\[0\.08\]/g, 'from-cyan-400/8'],
  [/bg-emerald-400\/\[0\.06\]/g, 'bg-emerald-400/6'],
  [/hover:bg-white\/\[0\.04\]/g, 'hover:bg-white/4'],
];
for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}
fs.writeFileSync(file, content, 'utf8');
console.log('Patched about page classes.');
