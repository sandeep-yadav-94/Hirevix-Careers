import express from 'express'
import { isAuth } from '../middleware/auth.js';
import uploadFile from '../middleware/multer.js';
import { createCompany } from '../controllers/job.js';
const router = express.Router();

router.post("/company/new", isAuth, uploadFile, createCompany);

export default router;