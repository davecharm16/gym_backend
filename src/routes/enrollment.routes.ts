import { Router } from 'express';
import {
  enrollTrainings,
  getEnrollmentsByStudent,
  unenrollTrainings,
} from '../controllers/enrollment.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', requireAuth, enrollTrainings);
router.get('/:studentId', requireAuth, getEnrollmentsByStudent);
router.delete('/', requireAuth, unenrollTrainings);

export default router;
