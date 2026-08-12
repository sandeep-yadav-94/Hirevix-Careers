import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js'
import { sql } from './utils/db.js';
import cors from 'cors';


dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "https://hirevix-careers.vercel.app",
  "https://hirevix-careers-e389tbocm-sandeep-yadav-94s-projects.vercel.app",
  "https://hirevix-careers-p3rsjjf7r-sandeep-yadav-94s-projects.vercel.app",
];
const vercelOriginRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || vercelOriginRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json());


const port = Number(process.env.PORT ?? 4002);

app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

app.use("/api/user", userRoutes);

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

    await sql`
      CREATE TABLE IF NOT EXISTS skills (
        skill_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'skills_name_key'
        ) THEN
          ALTER TABLE skills ADD CONSTRAINT skills_name_key UNIQUE (name);
        END IF;
      END$$;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_skills (
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        skill_id INT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, skill_id)
      )
    `;

    console.log('✅ User service database initialized successfully');
  } catch (error) {
    console.error('❌ User service database initialization failed:', error);
    process.exit(1);
  }
}

initDb().then(() => {
  app.listen(port, () => {
    console.log(`User service is running on http://localhost:${port}`);
  });
});
app.get('/user/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({ status: 'ok', service: 'user', serverTime: new Date().toISOString() });
});
app.get('/user/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({ status: 'ok', service: 'user', serverTime: new Date().toISOString() });
});
