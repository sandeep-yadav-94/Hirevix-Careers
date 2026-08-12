const fs = require('fs');
const path = require('path');
const root = path.resolve(process.cwd());
function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}
function write(file, content) {
  fs.writeFileSync(path.join(root, file), content, 'utf8');
}
function patch(file, fn) {
  const filePath = path.join(root, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = fn(content);
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('patched', file);
  } else {
    console.log('no changes for', file);
  }
}
function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

const frontendPath = path.join(root, 'frontend', 'src');
walk(frontendPath, (fullPath) => {
  if (!fullPath.endsWith('.tsx') && !fullPath.endsWith('.ts')) return;
  let src = fs.readFileSync(fullPath, 'utf8');
  const before = src;
  src = src.replace(/declare module \"next\/navigation\"\s*\{[\s\S]*?\}\s*/g, '');
  src = src.replace(/bg-white\/\[0\.03\]/g, 'bg-white/3');
  src = src.replace(/bg-white\/\[0\.02\]/g, 'bg-white/2');
  src = src.replace(/from-violet-500\/\[0\.08\]/g, 'from-violet-500/8');
  src = src.replace(/from-cyan-400\/\[0\.08\]/g, 'from-cyan-400/8');
  src = src.replace(/from-emerald-400\/\[0\.06\]/g, 'from-emerald-400/6');
  src = src.replace(/bg-gradient-to-b/g, 'bg-linear-to-b');
  src = src.replace(/bg-gradient-to-br/g, 'bg-linear-to-br');
  src = src.replace(/bg-gradient-to-r/g, 'bg-linear-to-r');
  src = src.replace(/font-\[family-name:var\(--font-mono\)\]/g, 'font-mono');
  src = src.replace(/font-\[family-name:var\(--font-display\)\]/g, 'font-sans');
  src = src.replace(/font-\[family-name:var\(--font-body\)\]/g, 'font-sans');
  src = src.replace(/min-h-\[100svh\]/g, 'min-h-svh');
  src = src.replace(/md:auto-rows-\[180px\]/g, 'md:auto-rows-45');
  src = src.replace(/sm:w-\[380px\]/g, 'sm:w-95');
  if (src !== before) fs.writeFileSync(fullPath, src, 'utf8');
});

patch('services/auth/src/index.ts', content => content.replace(/\s*await sql`[\s\S]*?CREATE TABLE IF NOT EXISTS email_verifications \([^`]*?`;/g, ''));
patch('services/auth/package.json', content => content.replace(/\s*"resend": "\^6\.19\.0",?\r?\n?/g, ''));
patch('services/auth/package-lock.json', content => {
  let out = content.replace(/\s*"resend": "\^6\.19\.0",?\r?\n?/g, '');
  out = out.replace(/"node_modules\/resend": \{[\s\S]*?\n\s*\},?\r?\n/g, '');
  return out;
});
patch('services/auth/migrations/001_email_verification.sql', () => '-- Existing accounts remain verified; email verification metadata is no longer stored.\nALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE;\n');
console.log('cleanup complete');
