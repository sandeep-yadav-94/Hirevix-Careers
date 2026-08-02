import express from 'express';
import authRoutes from './routes/auth.js';
import cors from 'cors'


const app = express();
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

export default app;