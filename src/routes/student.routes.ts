import express from 'express';
import { getStudents, getStudentById, deleteStudent, updateStudent, softDeleteStudent } from '../controllers/students.controller';
import { requireAuth } from '../middlewares/auth.middleware';


const router = express.Router();

router.get('/', requireAuth, getStudents);
router.get('/:id', requireAuth ,getStudentById);
router.put('/:id', requireAuth, updateStudent)
router.delete('/:id', requireAuth ,softDeleteStudent);


export default router;
