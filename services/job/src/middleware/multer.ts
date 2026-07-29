import multer from 'multer'
import type { Request, Response, NextFunction } from 'express'

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFile = (req: Request, res: Response, next: NextFunction) => {
    upload.any()(req, res, (err: any) => {
        if (err) {
            return next(err);
        }

        const files = req.files as any[] | undefined;
        const file = files?.[0];

        if (file) {
            (req as Request & { file?: any }).file = file;
        }

        next();
    });
};

export default uploadFile;