// @ts-ignore
import multer from 'multer'

const storage = multer.memoryStorage();

const uploadFile = multer({storage}).single("File")

export default uploadFile;