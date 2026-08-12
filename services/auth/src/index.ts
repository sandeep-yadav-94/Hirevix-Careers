import dotenv from 'dotenv';
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

        // Keep existing users able to sign in; new registrations explicitly start unverified.
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
   
})
