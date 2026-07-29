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