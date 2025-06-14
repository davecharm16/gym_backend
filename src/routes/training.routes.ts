import { Router } from 'express';
import {
  createTraining,
  getAllTrainings,
  getTrainingById,
  updateTraining,
  deleteTraining,
} from '../controllers/training.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', requireAuth, createTraining);
router.get('/', requireAuth, getAllTrainings);
router.get('/:id', requireAuth, getTrainingById);
router.put('/:id', requireAuth, updateTraining);
router.delete('/:id',requireAuth, deleteTraining);

export default router;
