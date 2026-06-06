const fs = require('fs');
const text = fs.readFileSync('frontend/lib/i18n.ts', 'utf8');
const starts = [['fr', /fr:\s*\{/], ['en', /en:\s*\{/], ['ar', /ar:\s*\{/]];
for (const [lang, regex] of starts) {
  const idx = text.search(regex);
  if (idx < 0) continue;
  let depth = 0;
  let i = idx;
  let slice = '';
  for (; i < text.length; i++) {
    const ch = text[i];
    slice += ch;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const keys = [];
  const re = /"([^\"]+)"\s*:\s*/g;
  let m;
  while ((m = re.exec(slice))) {
    keys.push(m[1]);
  }
  const counts = keys.reduce((acc, k) => {
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const dups = Object.entries(counts).filter(([, v]) => v > 1);
  console.log(lang, dups.length ? JSON.stringify(dups, null, 2) : 'no dup');
}
