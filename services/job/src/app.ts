import express from 'express'
import jobRoutes from './routes/job.js'
import cors from 'cors'



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
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.get('/job/health', (_req, res) => {
    res.json({ status: 'ok', service: 'job' });
});

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.get('/job/health', (_req, res) => {
    res.json({ status: 'ok', service: 'job' });
});



app.use("/api/job", jobRoutes);




export default app;
