import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js'



dotenv.config();

const app = express();
app.use(express.json());


const port = Number(process.env.PORT ?? 4002);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use("/api/user", userRoutes);

app.listen(port, () => {
  console.log(`User service is running on http://localhost:${port}`);
});