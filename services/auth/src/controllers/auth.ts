import axios from "axios";
import getBuffer from "../utils/buffers.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const registerUser = TryCatch(async (req, res) => {
  const { name, email, password, phoneNumber, role, bio } = req.body;

  if (!name || !email || !password || !phoneNumber || !role) {
    throw new ErrorHandler(400, 'Please fill all details...');
  }

  if (role !== 'recruiter' && role !== 'jobseeker') {
    throw new ErrorHandler(400, 'Invalid user role.');
  }

  const existingUsers = await sql`SELECT user_id FROM users WHERE email = ${email}`;
  if (existingUsers.length > 0) {
    throw new ErrorHandler(409, `User with ${email} email is already exist..please try another..`);
  }

  const hashPassword = await bcrypt.hash(password, 10);
  let registeredUser;
  let createdUserId: number | null = null;

  try {
    if (role === 'recruiter') {
      const [user] = await sql`INSERT INTO users (name, email, password, phone_number, role, is_verified) VALUES (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role}, TRUE) RETURNING user_id, name, email, phone_number, role, created_at`;
      registeredUser = user;
      createdUserId = user.user_id;
    } else if (role === 'jobseeker') {
      const uploadedFiles = req.files as Record<string, Express.Multer.File[]> | undefined;
      const file = uploadedFiles?.File?.[0] ?? uploadedFiles?.file?.[0] ?? uploadedFiles?.resume?.[0] ?? null;

      if (!file) {
        throw new ErrorHandler(400, 'Resume file is required for job seekers...');
      }

      const fileBuffer = getBuffer(file);
      if (!fileBuffer || !fileBuffer.content) {
        throw new ErrorHandler(500, 'Failed to generate buffer of this file...');
      }

      let resumeUrl: string | null = null;
      let resumePublicId: string | null = null;

      if (process.env.UPLOAD_SERVICE) {
        try {
          const { data } = await axios.post(`${process.env.UPLOAD_SERVICE}/api/utils/upload`, { buffer: fileBuffer.content });
          resumeUrl = data?.url ?? null;
          resumePublicId = data?.public_id ?? null;
        } catch (uploadError) {
          console.warn('Resume upload failed, continuing with registration:', uploadError);
        }
      }

      const [user] = await sql`INSERT INTO users (name, email, password, phone_number, role, bio, resume, resume_public_id, is_verified) VALUES (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role}, ${bio}, ${resumeUrl}, ${resumePublicId}, TRUE) RETURNING user_id, name, email, phone_number, role, bio, resume, created_at`;
      registeredUser = user;
      createdUserId = user.user_id;
    }

    if (!registeredUser) {
      throw new ErrorHandler(500, 'Unable to create the user account.');
    }

    // Generate JWT token for immediate login
    const jwtSecret = process.env.JWT_SEC || process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ErrorHandler(500, 'JWT secret is not configured on the server.');
    }

    const token = jwt.sign({ id: registeredUser.user_id }, jwtSecret, { expiresIn: '15d' });

    // Return user data with token for immediate login
    registeredUser.skills = registeredUser.skills || [];
    return res.status(201).json({
      message: 'Registration successful. You are now logged in.',
      user: registeredUser,
      userObject: registeredUser,
      token,
      requiresVerification: false,
    });
  } catch (error) {
    if (createdUserId) {
      try {
        await sql`DELETE FROM users WHERE user_id = ${createdUserId}`;
      } catch (cleanupError) {
        console.error('Failed to clean up incomplete registration:', cleanupError);
      }
    }
    throw error;
  }
});

export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ErrorHandler(400, 'Please fill all details..');
  }

  const user = await sql`
    SELECT
      u.user_id,
      u.name,
      u.email,
      u.password,
      u.phone_number,
      u.role,
      u.bio,
      u.resume,
      u.profile_pic,
      u.subscription,
      u.is_verified,
      ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) AS skills
    FROM users u
    LEFT JOIN user_skills us ON u.user_id = us.user_id
    LEFT JOIN skills s ON us.skill_id = s.skill_id
    WHERE u.email = ${email}
    GROUP BY u.user_id;
  `;

  if (user.length === 0) {
    throw new ErrorHandler(400, 'Invalid Credentials..');
  }

  const userObject = user[0];
  const matchPassword = await bcrypt.compare(password, userObject.password);

  if (!matchPassword) {
    throw new ErrorHandler(400, 'Wrong Password');
  }

  userObject.skills = userObject.skills || [];
  delete userObject.password;

  const jwtSecret = process.env.JWT_SEC || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new ErrorHandler(500, 'JWT secret is not configured on the server.');
  }

  const token = jwt.sign({ id: userObject.user_id }, jwtSecret, { expiresIn: '15d' });

  return res.json({
    message: 'User logged in successfully',
    user: userObject,
    userObject,
    token,
  });
});

export default registerUser;
