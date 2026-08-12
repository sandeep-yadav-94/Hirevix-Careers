import express, { urlencoded } from 'express'
import dotenv from 'dotenv'
import routes from './routes.js';
import cors from 'cors'
import { v2 as cloudinary } from 'cloudinary';


dotenv.config();

cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key:  process.env.API_KEY,
        api_secret: process.env.API_SECRET
    });

const app = express();
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
];
const vercelOriginRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || vercelOriginRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));


app.use(express.json({limit:"50mb"}))
app.use(express.urlencoded({limit:"50mb", extended:true}));

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.get('/utils/health', (_req, res) => {
    res.json({ status: 'ok', service: 'utils' });
});


app.use("/api/utils", routes);



app.listen(process.env.PORT, ()=>{
    console.log(`utils services is running on http://localhost:${process.env.PORT}`)
})
