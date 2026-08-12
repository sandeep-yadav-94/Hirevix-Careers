const fs = require('fs');
const path = require('path');
const root = path.resolve(process.cwd());

function patch(filePath, transform) {
  const fullPath = path.join(root, filePath);
  const original = fs.readFileSync(fullPath, 'utf8');
  const updated = transform(original);
  if (updated !== original) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log('patched', filePath);
  } else {
    console.log('no changes for', filePath);
  }
}

patch('frontend/src/app/about/page.tsx', content => {
  let c = content;
  c = c.replace(/declare module "next\/navigation"\s*\{[\s\S]*?\}\s*/g, '');
  c = c.replace(/import \{ useRouter\s*\} from "next\/navigation";/g, 'import { useRouter } from "next/navigation";');
  const replacements = [
    ['bg-white/[0.03]', 'bg-white/3'],
    ['bg-white/[0.02]', 'bg-white/2'],
    ['from-violet-500/[0.08]', 'from-violet-500/8'],
    ['from-cyan-400/[0.08]', 'from-cyan-400/8'],
    ['from-emerald-400/[0.06]', 'from-emerald-400/6'],
    ['bg-gradient-to-b', 'bg-linear-to-b'],
    ['bg-gradient-to-br', 'bg-linear-to-br'],
    ['bg-gradient-to-r', 'bg-linear-to-r'],
    ['font-[family-name:var(--font-mono)]', 'font-mono'],
    ['font-[family-name:var(--font-display)]', 'font-sans'],
    ['font-[family-name:var(--font-body)]', 'font-sans'],
    ['min-h-[100svh]', 'min-h-svh'],
    ['md:auto-rows-[180px]', 'md:auto-rows-45'],
    ['sm:w-[380px]', 'sm:w-95'],
  ];
  replacements.forEach(([from, to]) => {
    c = c.split(from).join(to);
  });
  return c;
});

patch('services/auth/src/index.ts', () => `import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

dotenv.config({
    path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env')
});

import app from './app.js';
import { sql } from './utils/db.js';

const port = Number(process.env.PORT ?? 4000);

async function initDb() {
    try {
        await sql`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                CREATE TYPE user_role AS ENUM ('jobseeker', 'recruiter');
            END IF;
        END$$;
        `;

        await sql`
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            role user_role NOT NULL,
            bio TEXT,
            resume VARCHAR(255),
            resume_public_id VARCHAR(255),
            profile_pic VARCHAR(255),
            profile_pic_public_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            subscription TIMESTAMP
        )
        `;

        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE`;

        await sql`
        CREATE TABLE IF NOT EXISTS skills (
            skill_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE
        )
        `;

        await sql`
        CREATE TABLE IF NOT EXISTS user_skills (
            user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            skill_id INT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, skill_id)
        )
        `;

        console.log("✅ Database initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        process.exit(1);
    }
}

initDb().then(() => {
     app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
    });
});
`);

patch('services/auth/package.json', content => {
  let c = content;
  c = c.replace(/"resend": "\^6\.19\.0",?\r?\n?/g, '');
  c = c.replace(/"multer": "\^2\.2\.0",?\r?\n?\s*\}/g, '"multer": "^2.2.0"\n  }');
  return c;
});

patch('services/auth/package-lock.json', content => {
  let c = content;
  c = c.replace(/"resend": "\^6\.19\.0",?\r?\n?/g, '');
  c = c.replace(/"node_modules\/resend": \{[\s\S]*?\n\s*\},?\r?\n/g, '');
  return c;
});

patch('services/auth/migrations/001_email_verification.sql', () => '-- Existing accounts remain verified; email verification metadata is no longer stored.\nALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE;\n');
console.log('cleanup complete');
