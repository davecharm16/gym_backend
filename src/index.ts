import express, { Request, Response, NextFunction, Router } from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import checkInRoutes from './routes/checkin.routes';
import studentRoutes from './routes/student.routes';
import subscriptionRoutes from './routes/subscription.routes';


import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).send('🚀 Gym backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/checkIn', checkInRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);





app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
