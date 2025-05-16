import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).send('🚀 Gym backend is running!');
});

app.use('/api/auth', authRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
