import multer from 'multer'

const storage = multer.memoryStorage();

const uploadFile = multer({ storage }).fields([
  { name: 'File', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
]);

export default uploadFile;