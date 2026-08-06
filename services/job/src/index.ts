import app from "./app.js";
import dotenv from 'dotenv'
import { sql } from "./utils/db.js";

dotenv.config();


async function initDB() {
    try {
        // Create enum types if they do not exist. Run each statement separately
        const jobTypeExists = await sql`SELECT 1 FROM pg_type WHERE typname = 'job_type'`;
        if ((jobTypeExists as any[]).length === 0) {
            await sql`CREATE TYPE job_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Internship')`;
        }

        const workLocationExists = await sql`SELECT 1 FROM pg_type WHERE typname = 'work_location'`;
        if ((workLocationExists as any[]).length === 0) {
            await sql`CREATE TYPE work_location AS ENUM ('On-site', 'Remote', 'Hybrid')`;
        }

        const appStatusExists = await sql`SELECT 1 FROM pg_type WHERE typname = 'application_status'`;
        if ((appStatusExists as any[]).length === 0) {
            await sql`CREATE TYPE application_status AS ENUM ('Submitted', 'In Review', 'Shortlisted', 'Interview', 'Hired', 'Rejected')`;
        } else {
            // Try to add missing enum values one-by-one; ignore duplicate errors
            try { await sql`ALTER TYPE application_status ADD VALUE 'In Review'`; } catch (e) { }
            try { await sql`ALTER TYPE application_status ADD VALUE 'Shortlisted'`; } catch (e) { }
            try { await sql`ALTER TYPE application_status ADD VALUE 'Interview'`; } catch (e) { }
        }

        await sql`
        CREATE TABLE IF NOT EXISTS companies (
        company_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        website VARCHAR(255) NOT NULL,
        logo VARCHAR(255) NOT NULL,
        logo_public_id VARCHAR(255) NOT NULL,
        recruiter_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        `;

        await sql`
    CREATE TABLE IF NOT EXISTS jobs (
    job_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    salary NUMERIC(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    job_type job_type NOT NULL,
    openings NUMERIC(3, 1) NOT NULL,
    role VARCHAR(255) NOT NULL,
    work_location work_location NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    posted_by_recruiter_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
)
`;


        await sql`
    CREATE TABLE IF NOT EXISTS applications (
        application_id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
        applicant_id INTEGER NOT NULL,
        applicant_email VARCHAR(255) NOT NULL,
        status application_status NOT NULL DEFAULT 'Submitted',
        resume VARCHAR(500) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        subscribed BOOLEAN,
        UNIQUE(job_id, applicant_id)
    );
    `;

        // ensure recruiter_note column exists for storing recruiter comments
        await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS recruiter_note TEXT`;

        console.log("Job service Database tables checked and created successfully");

    } catch (error) {
        console.log("Error while creating tables", error);
        process.exit(1);
    }
}


initDB().then(()=>{
    app.listen(process.env.PORT, () => {
    console.log(`Job service is runing on http://localhost:${process.env.PORT}`);
})
})

