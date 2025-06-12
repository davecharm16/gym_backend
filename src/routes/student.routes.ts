import express from 'express';
import { getStudents, getStudentById } from '../controllers/students.controller';
import { requireAuth } from '../middlewares/auth.middleware';


const router = express.Router();

router.get('/', requireAuth, getStudents);
router.get('/:id', requireAuth ,getStudentById);

export default router;
