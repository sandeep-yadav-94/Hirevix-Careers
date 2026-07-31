import axios from "axios";
import { AuthenticatedRequest } from "../middleware/auth.js";
import getBuffer from "../utils/buffers.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";

export const createCompany = TryCatch(async(req:AuthenticatedRequest, res) =>{

    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication is required");
    }

    if(user.role !== "recruiter"){
        throw new ErrorHandler(403, "Only recruiters can create a company");
    }

    const {name, description, website} = req.body || {};

    if(!name || !description || !website){
        throw new ErrorHandler(400, "Name, description and website are required");
    }

    const existingCompanies = await sql`
    SELECT company_id
    FROM companies
    WHERE LOWER(name) = LOWER(${String(name).trim()})
    `;

    if(existingCompanies.length > 0){
        throw new ErrorHandler(409, `A company with the name ${name} already exists`);
    }

    const file = req.file;

    if(!file){
        throw new ErrorHandler(400, "Company logo file is required");
    }

    const fileBuffer = getBuffer(file);

    if(!fileBuffer || !fileBuffer.content){
        throw new ErrorHandler(500, "Failed to create the file buffer");
    }

    if(!process.env.UPLOAD_SERVICE){
        throw new ErrorHandler(500, "Upload service is not configured");
    }

    let uploadResult: { url?: string; public_id?: string } = {};

    try {
        const response = await axios.post(`${process.env.UPLOAD_SERVICE}/api/utils/upload`, {buffer: fileBuffer.content}, { timeout: 20000 });
        uploadResult = response.data || {};
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Failed to upload company logo";
        throw new ErrorHandler(502, message);
    }

    if(!uploadResult.url || !uploadResult.public_id){
        throw new ErrorHandler(502, "Upload service did not return a valid logo response");
    }

    const [newCompany] = await sql`
    INSERT INTO companies (
        name,
        description,
        website,
        logo,
        logo_public_id,
        recruiter_id
    )
    VALUES (
        ${String(name).trim()},
        ${String(description).trim()},
        ${String(website).trim()},
        ${uploadResult.url},
        ${uploadResult.public_id},
        ${user.user_id}
    )
    RETURNING *;
`;

    res.json({
        message: "Company created successfully",
        company: newCompany,
    })

})

export const deleteCompany = TryCatch(async(req:AuthenticatedRequest, res) =>{

    const user = req.user;
    const {companyId} = req.params;

    const [company] = await sql`SELECT logo_public_id FROM companies WHERE company_id = ${companyId} AND recruiter_id = ${user?.user_id}`;

    if(!company){
        throw new ErrorHandler(404, "Company not found or you are not authorized to delete it");
    }

    await sql`DELETE FROM companies WHERE company_id = ${companyId}`;

    res.json({
        message: "Company and all associated jobs have been deleted",
    })

})


export const createJob = TryCatch(async(req:AuthenticatedRequest, res) => {

    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    if(user.role != "recruiter"){
        throw new ErrorHandler(403, "Forbidden: Only recruiter can creeate a job");
    }

    const {title, description, salary, location, role, job_type, work_location, company_id, openings} = req.body;
    
    if(!title || !description || !salary || !location || !role || !openings){
        throw new ErrorHandler(400, "All the fields are required");
    }

    const [company] = await sql`SELECT company_id FROM companies WHERE company_id = ${company_id} AND recruiter_id = ${user.user_id}`;

    if(!company){
        throw new ErrorHandler(404, "Company not found");
    }

    const [newJob] = await sql`INSERT INTO jobs (title, description, salary, location, role, job_type, work_location, company_id, posted_by_recruiter_id, openings) VALUES (${title}, ${description}, ${salary}, ${location}, ${role}, ${job_type}, ${work_location}, ${company_id}, ${user.user_id}, ${openings}) RETURNING *`;

    res.json({
        message: "Job Posted Successfully",
        job: newJob,
    })

})


export const updateJob = TryCatch(async(req:AuthenticatedRequest, res) =>{

    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    if(user.role != "recruiter"){
        throw new ErrorHandler(403, "Forbidden: Only recruiter can creeate a job");
    }

    const {title, description, salary, location, role, job_type, work_location, company_id, openings, is_active} = req.body;

    const [existingJob] = await sql`SELECT posted_by_recruiter_id FROM jobs WHERE job_id = ${req.params.jobId}`;

    if(!existingJob){
        throw new ErrorHandler(404, "Job not found");
    }

    if(existingJob.posted_by_recruiter_id !== user.user_id){
        throw new ErrorHandler(403, "Forbidden: You are not allowed");
    }

    const [updatedJob] = await sql`UPDATE jobs SET title = ${title},
    description = ${description},
    salary = ${salary},
    location = ${location},
    role = ${role},
    job_type = ${job_type},
    work_location = ${work_location},
    openings = ${openings},
    is_active = ${is_active}
    WHERE job_id = ${req.params.jobId} RETURNING *;
    `;


    res.json({
        message:"Job updated successfully",
        job : updatedJob,
    })

})



export const getAllCompany = TryCatch(async(req:AuthenticatedRequest, res)=>{

    const companies = await sql`SELECT * FROM companies WHERE recruiter_id = ${req.user?.user_id}`;

    res.json(companies);

})



export const getCompanyDetails = TryCatch(async(req:AuthenticatedRequest, res) =>{
    const {id} = req.params;

    if(!id){
        throw new ErrorHandler(400, "Company id is required");
    }

    const [companyData] = await sql`SELECT c.*, COALESCE(
    (
       SELECT json_agg(j.*) FROM jobs j WHERE j.company_id = c.company_id
    ),
    '[]'::json
    ) AS jobs
     FROM companies c WHERE c.company_id = ${id} GROUP BY c.company_id;`;

    if(!companyData){
        throw new ErrorHandler(404, "company not found");
    }

    res.json(companyData);
})




export const getAllActiveJobs = TryCatch(async (req, res) =>{

    const { title, location } = req.query as {
        title?: string;
        location?: string;
    };

    let queryString = `SELECT j.job_id, j.title, j.description, j.salary, j.location, j.job_type, j.role, j.work_location, j.created_at, c.name AS company_name, c.logo AS company_logo, c.company_id AS company_id FROM jobs j JOIN companies c ON j.company_id = c.company_id WHERE j.is_active = true `;

    const values = [];

    let paramIndex = 1;

    if(title){
        queryString += ` AND j.title ILIKE $${paramIndex}`;
        values.push(`%${title}%`);
        paramIndex++;
    }

    if(location){
        queryString += ` AND j.location ILIKE $${paramIndex}`;
        values.push(`%${location}%`);
        paramIndex++;
    }

    queryString += " ORDER BY j.created_at DESC";

    const jobs = await sql.query(queryString, values) as any[];

    res.json(jobs);
})



export const getSingleJob = TryCatch(async(req, res) => {
    const job = await sql`SELECT * FROM jobs WHERE job_id = ${req.params.jobId}`;
    res.json(job);
})

export const getAllApplicationForJob = TryCatch(async(req:AuthenticatedRequest, res) => {

    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    if(user.role != "recruiter"){
        throw new ErrorHandler(403, "Forbidden: Only recruiter can access this route");
    }

    const  {jobId} = req.params;

    const [job] = await sql`SELECT posted_by_recruiter_id FROM jobs WHERE job_id = ${jobId}`;

    if(!job){
        throw new ErrorHandler(404, "job not found");
    }

    if(job.posted_by_recruiter_id !== user.user_id){
        throw new ErrorHandler(403, "Forbidden: You are not allowed");
    }

    const applications = await sql`SELECT * FROM applications WHERE job_id = ${jobId} ORDER BY subscribed DESC, applied_at ASC`;

    res.json(applications);


})



export const updateApplication = TryCatch(async(req:AuthenticatedRequest, res) => {

    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    if(user.role != "recruiter"){
        throw new ErrorHandler(403, "Forbidden: Only recruiter can access this route");
    }

    const {id} = req.params;

    const [application] = await sql`SELECT * FROM applications WHERE application_id = ${id}`;

    if(!application){
        throw new ErrorHandler(404, "Application not found");
    }

    const [job] = await sql`SELECT posted_by_recruiter_id, title FROM jobs WHERE job_id = ${application.job_id}`;

    if(!job){
        throw new ErrorHandler(404, "no job with this id");
    }

    if(job.posted_by_recruiter_id !== user.user_id){
        throw new ErrorHandler(403, "Forbidden: You are not allowed");
    }

    const [updatedApplication] = await sql`UPDATE applications SET status = ${req.body.status} WHERE application_id = ${id} RETURNING *`;

    res.json({
        message: "Application Updated successfully",
        updatedApplication
    })


})


