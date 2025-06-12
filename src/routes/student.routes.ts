import express from 'express';
import { getStudents, getStudentById } from '../controllers/students.controller';


const router = express.Router();

router.get('/', getStudents);
router.get('/:id', getStudentById);

export default router;
