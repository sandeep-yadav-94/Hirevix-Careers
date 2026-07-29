import axios from "axios";
import { AuthenticatedRequest } from "../middleware/auth.js";
import getBuffer from "../utils/buffers.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";

export const myProfile = TryCatch(async(req:AuthenticatedRequest, res, next) => {
    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    res.json(user)
})

export const getUserProfile = TryCatch(async(req, res, next) => {
    const {userId} = req.params;

    if(!userId){
        throw new ErrorHandler(400, "User id is required");
    }

    try {
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
            throw new ErrorHandler(404, "User not found");
        }

        const user = users[0];
        user.skills = user.skills || [];

        res.json(user);
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

    const userId = req.user?.user_id;
    const {skillName} = req.body;

    if(!skillName || skillName.trim() === ""){
        throw new ErrorHandler(400, "Please provide a skill name");
    }

    let wasSkillAdded = false;

    try {
        await sql`BEGIN`;
        const users = await sql`SELECT user_id FROM users WHERE user_id = ${userId}`;
        if(users.length === 0){
            throw new ErrorHandler(404, "User not found");
        }
        const existingSkill = await sql`SELECT skill_id FROM skills WHERE LOWER(name) = LOWER(${skillName.trim()}) LIMIT 1`;
        let skillId: number;

        if(existingSkill.length > 0){
            skillId = existingSkill[0].skill_id;
        } else {
            try {
                const [newSkill] = await sql`INSERT INTO skills (name) VALUES (${skillName.trim()}) RETURNING skill_id`;
                skillId = newSkill.skill_id;
            } catch (error: any) {
                if(error?.code === '23505' || error?.message?.includes('duplicate')){
                    const [duplicateSkill] = await sql`SELECT skill_id FROM skills WHERE LOWER(name) = LOWER(${skillName.trim()}) LIMIT 1`;
                    if(!duplicateSkill){
                        throw error;
                    }
                    skillId = duplicateSkill.skill_id;
                } else {
                    throw error;
                }
            }
        }

        const insertionResult = await sql`INSERT INTO user_skills (user_id, skill_id) VALUES (${userId}, ${skillId}) ON CONFLICT (user_id, skill_id) DO NOTHING RETURNING user_id`;
        if(insertionResult.length > 0){
            wasSkillAdded = true;
        }
        await sql`COMMIT`;
    } catch (error: any) {
        await sql`ROLLBACK`;
        if(error instanceof ErrorHandler){
            throw error;
        }
        throw new ErrorHandler(500, error?.message || "Failed to add skill");
    }

    if(!wasSkillAdded){
        return res.status(200).json({
            message:"User Already possesses this skill",
        })
    }

    res.json({
        message:`Skill ${skillName.trim()} is added successfull`,
    })

})



export const deleteSkillFromUser = TryCatch(async(req:AuthenticatedRequest, res) =>{

    const user = req.user;

    if(!user){
        throw new ErrorHandler(401, "Authentication required");
    }

    const {skillName} = req.body;

    if(!skillName || skillName.trim() === ""){
        throw new ErrorHandler(400, "Please provide a skill name");
    }

    const result = await sql`DELETE FROM user_skills WHERE user_id = ${user.user_id} AND skill_id = (SELECT skill_id FROM skills WHERE name = ${skillName.trim()}) RETURNING user_id`;

    if(result.length === 0){
        throw new ErrorHandler(404, `skill ${skillName.trim()} was not found`);
    } 

    res.json({
        message:`Skill ${skillName.trim()} successfully deleted`
    })

})