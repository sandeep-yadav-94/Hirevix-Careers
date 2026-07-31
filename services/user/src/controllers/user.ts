import axios from "axios";
import { AuthenticatedRequest } from "../middleware/auth.js";
import getBuffer from "../utils/buffers.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import { application } from "express";

const getFreshUserProfile = async(userId: number) => {
    const users = await Promise.race([
        sql`
        SELECT u.user_id, u.name, u.email, u.phone_number, u.role, u.bio, u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id, u.subscription,
        ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) as skills
        FROM users u LEFT JOIN user_skills us ON u.user_id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.skill_id
        WHERE u.user_id = ${userId}
        GROUP BY u.user_id;
        `,
        new Promise((_, reject) => setTimeout(() => reject(new Error('User lookup timed out')), 5000))
    ]) as Array<any>;

    if(users.length === 0){
        return null;
    }

    const user = users[0];
    user.skills = user.skills || [];
    return user;
};

const extractSkillName = (body: any) => {
    if(typeof body?.skillName === 'string') return body.skillName.trim();
    if(typeof body?.skill === 'string') return body.skill.trim();
    if(typeof body?.name === 'string') return body.name.trim();
    if(Array.isArray(body?.skills) && typeof body.skills[0] === 'string') return body.skills[0].trim();
    return '';
};

const buildResponseMeta = (req: AuthenticatedRequest) => ({
    timestamp: new Date().toISOString(),
    requestId: `${req.method || 'GET'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
});

export const myProfile = TryCatch(async(req:AuthenticatedRequest, res, next) => {
    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    const freshUser = await getFreshUserProfile(user.user_id);

    if(!freshUser){
        throw new ErrorHandler(404, "User not found");
    }

    const responseMeta = buildResponseMeta(req);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Request-Id', responseMeta.requestId);
    res.setHeader('X-Response-Timestamp', responseMeta.timestamp);
    res.json({ ...freshUser, _meta: responseMeta })
})

export const getUserProfile = TryCatch(async(req, res, next) => {
    const {userId} = req.params;

    if(!userId){
        throw new ErrorHandler(400, "User id is required");
    }

    try {
        const user = await getFreshUserProfile(Number(userId));

        if(!user){
            throw new ErrorHandler(404, "User not found");
        }

        const responseMeta = buildResponseMeta(req as AuthenticatedRequest);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Request-Id', responseMeta.requestId);
        res.setHeader('X-Response-Timestamp', responseMeta.timestamp);
        res.json({ ...user, _meta: responseMeta });
    } catch (error: any) {
        if(error instanceof ErrorHandler){
            throw error;
        }

        throw new ErrorHandler(503, error?.message === 'User lookup timed out' ? 'User service is taking too long. Please try again.' : 'Unable to fetch user profile');
    }
})

export const updateUserProfile = TryCatch(async(req:AuthenticatedRequest, res) => {
    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication Required");
    }

    const {name, phoneNumber, bio} = req.body;

    const newName = name || user.name;
    const newPhoneNumber = phoneNumber || user.phone_number;
    const newBio = bio || user.bio;

    const [updatedUser] = await sql`
    UPDATE users SET name = ${newName}, phone_number = ${newPhoneNumber}, bio = ${newBio}
    WHERE user_id = ${user.user_id}
    RETURNING user_id, name, email, phone_number, bio
    `;

    res.json({
        message:"Profile Updated Successfully..",
        updatedUser,
        
    })
})


export const updateProfilePic = TryCatch(async(req:AuthenticatedRequest, res) => {

    const user = req.user;
    if(!user){
        throw new ErrorHandler(401, "Authentication Required");
    }

    const file = req.file;

    if(!file){
        throw new ErrorHandler(400, "No image file provided");
    }

    const oldPublicId = user.profile_pic_public_id;

    const fileBuffer = getBuffer(file);

    if(!fileBuffer || !fileBuffer.content){
        throw new ErrorHandler(500, "Failed to generate buffer");
    }


    if(!process.env.UPLOAD_SERVICE){
        throw new ErrorHandler(500, "Upload service is not configured");
    }

    let uploadResult: {url: string; public_id: string};

    try {
        const response = await axios.post(`${process.env.UPLOAD_SERVICE}/api/utils/upload`, {buffer:fileBuffer.content, public_id:oldPublicId}, { timeout: 20000 });
        uploadResult = response.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Failed to upload profile image";
        throw new ErrorHandler(502, message);
    }

    const [updatedUser] = await sql`
    UPDATE users SET profile_pic = ${uploadResult.url}, profile_pic_public_id = ${uploadResult.public_id}
    WHERE user_id = ${user.user_id}
    RETURNING user_id, name, profile_pic;
    `;

    res.json({
        message:"Profile pic Updated",
        updatedUser
    })

})

export const updateResume = TryCatch(async(req:AuthenticatedRequest, res) => {

    const user = req.user;
    if(!user){
        throw new ErrorHandler(401, "Authentication Required");
    }

    const file = req.file;

    if(!file){
        throw new ErrorHandler(400, "No pdf file provided");
    }

    const oldPublicId = user.resume_public_id;

    const fileBuffer = getBuffer(file);

    if(!fileBuffer || !fileBuffer.content){
        throw new ErrorHandler(500, "Failed to generate buffer");
    }


    if(!process.env.UPLOAD_SERVICE){
        throw new ErrorHandler(500, "Upload service is not configured");
    }

    let uploadResult: {url: string; public_id: string};

    try {
        const response = await axios.post(`${process.env.UPLOAD_SERVICE}/api/utils/upload`, {buffer:fileBuffer.content, public_id:oldPublicId}, { timeout: 20000 });
        uploadResult = response.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Failed to upload profile image";
        throw new ErrorHandler(502, message);
    }

    const [updatedUser] = await sql`
    UPDATE users SET resume = ${uploadResult.url}, resume_public_id = ${uploadResult.public_id}
    WHERE user_id = ${user.user_id}
    RETURNING user_id, name, resume;
    `;

    res.json({
        message:"Resume Updated",
        updatedUser
    })

})

export const addSkillToUser = TryCatch(async(req:AuthenticatedRequest, res) =>{

    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    const userId = user.user_id;
    const normalizedSkillName = extractSkillName(req.body);

    if(!normalizedSkillName){
        throw new ErrorHandler(400, "Please provide a skill name");
    }

    try {
        const existingUser = await sql`SELECT user_id FROM users WHERE user_id = ${userId}`;
        if(existingUser.length === 0){
            throw new ErrorHandler(404, "User not found");
        }

        const [existingSkill] = await sql`SELECT skill_id FROM skills WHERE LOWER(name) = LOWER(${normalizedSkillName}) LIMIT 1`;
        let skillId: number;

        if(existingSkill?.skill_id){
            skillId = existingSkill.skill_id;
        } else {
            const [newSkill] = await sql`INSERT INTO skills (name) VALUES (${normalizedSkillName}) ON CONFLICT (name) DO NOTHING RETURNING skill_id`;
            if(newSkill?.skill_id){
                skillId = newSkill.skill_id;
            } else {
                const [createdSkill] = await sql`SELECT skill_id FROM skills WHERE LOWER(name) = LOWER(${normalizedSkillName}) LIMIT 1`;
                if(!createdSkill?.skill_id){
                    throw new ErrorHandler(500, "Failed to create skill");
                }
                skillId = createdSkill.skill_id;
            }
        }

        const [insertedRelation] = await sql`INSERT INTO user_skills (user_id, skill_id) VALUES (${userId}, ${skillId}) ON CONFLICT (user_id, skill_id) DO NOTHING RETURNING user_id`;
        if(!insertedRelation?.user_id){
            return res.status(200).json({
                message:"User Already possesses this skill",
            });
        }

        const responseMeta = buildResponseMeta(req);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Request-Id', responseMeta.requestId);
        res.setHeader('X-Response-Timestamp', responseMeta.timestamp);
        res.json({
            message:`Skill ${normalizedSkillName} is added successfull`,
            _meta: responseMeta,
        });
    } catch (error: any) {
        if(error instanceof ErrorHandler){
            throw error;
        }
        throw new ErrorHandler(500, error?.message || "Failed to add skill");
    }

})



export const deleteSkillFromUser = TryCatch(async(req:AuthenticatedRequest, res) =>{

    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    const normalizedSkillName = extractSkillName(req.body);

    if(!normalizedSkillName){
        throw new ErrorHandler(400, "Please provide a skill name");
    }

    const result = await sql`DELETE FROM user_skills WHERE user_id = ${user.user_id} AND skill_id = (SELECT skill_id FROM skills WHERE LOWER(name) = LOWER(${normalizedSkillName}) LIMIT 1) RETURNING user_id`;

    if(result.length === 0){
        throw new ErrorHandler(404, `skill ${normalizedSkillName} was not found`);
    }

    const responseMeta = buildResponseMeta(req);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Request-Id', responseMeta.requestId);
    res.setHeader('X-Response-Timestamp', responseMeta.timestamp);
    res.json({
        message:`Skill ${normalizedSkillName} successfully deleted`,
        _meta: responseMeta,
    })

})


export const applyForJob = TryCatch(async(req:AuthenticatedRequest, res) => {

    const user = req.user;
    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }
    if(user.role !== "jobseeker"){
        throw new ErrorHandler(403, "Forbidden: You are not use to this api");
    }
    const applicant_id = user.user_id;
    const resume = user.resume;
    if(!resume){
        throw new ErrorHandler(400, "You need to add resume in your profile to apply this job");
    }
    const {job_id} = req.body;
    if(!job_id){
        throw new ErrorHandler(400, "Job id is required");
    }
    const [job] = await sql`SELECT is_active FROM jobs WHERE job_id = ${job_id}`;
    if(!job){
        throw new ErrorHandler(404, "No jobs with this id");
    }
    if(!job.is_active){
        throw new ErrorHandler(400, "Job is not active");
    }
    const now = Date.now();
    const subTime = req.user?.subscription ? new Date(req.user.subscription).getTime():0
    const isSubscribed = subTime > now;
    let newApplication ;
    try {
        [newApplication] = await sql`INSERT INTO applications (job_id, applicant_id, applicant_email, resume, subscribed) VALUES (${job_id}, ${applicant_id}, ${user?.email}, ${resume}, ${isSubscribed})`;
    } catch (error:any) {
        if(error.code === "23505"){
            throw new ErrorHandler(409, "you have already applied this job");
        }
        throw error;
    }

    res.json({
        message: "Applied for job successfully",
        application: newApplication,
    })

})



export const getAllapplications = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const applications = await sql`
      SELECT
        a.*,
        j.title AS job_title,
        j.salary AS job_salary,
        j.location AS job_location
      FROM applications a
      JOIN jobs j ON a.job_id = j.job_id
      WHERE a.applicant_id = ${req.user?.user_id}
    `;

    res.json(applications);
  }
);
