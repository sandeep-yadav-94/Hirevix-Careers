import express from 'express'
import jobRoutes from './routes/job.js'
import cors from 'cors'



const app = express();
app.use(cors());
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
