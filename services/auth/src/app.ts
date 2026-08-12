import express from 'express';
import authRoutes from './routes/auth.js';
import cors from 'cors'


const app = express();
const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
];
const allowedOrigins = [
    ...defaultOrigins,
    ...(process.env.CORS_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []),
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
app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.get('/auth/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth' });
});
app.get('/auth/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth' });
});

export default app;
