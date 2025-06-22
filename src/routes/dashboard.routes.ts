import { Router } from 'express';
import { getTotalRegisteredStudents } from '../controllers/dashboard.controller';

const router = Router();

router.get('/total-registered', getTotalRegisteredStudents);

export default router;
