import express from 'express'
import { isAuth } from '../middleware/auth.js';
import uploadFile from '../middleware/multer.js';
import { createCompany, createJob, deleteCompany, deleteJob, getAllActiveJobs, getAllApplicationForJob, getAllCompany, getCompanyDetails, getSingleJob, updateApplication, updateCompany, updateJob } from '../controllers/job.js';
const router = express.Router();

router.post("/company/new", isAuth, uploadFile, createCompany);
router.delete("/company/:companyId", isAuth, deleteCompany);
router.put("/company/:companyId", isAuth, uploadFile, updateCompany);
router.post("/new", isAuth, createJob);
router.put("/:jobId", isAuth, updateJob)
router.delete("/:jobId", isAuth, deleteJob)
router.get("/company/all", isAuth, getAllCompany);
router.get("/company/:id", getCompanyDetails);
router.get("/all", getAllActiveJobs)
router.get("/:jobId", getSingleJob);
router.get("/application/:jobId", isAuth, getAllApplicationForJob);
router.put("/application/update/:id", isAuth, updateApplication);

export default router;
