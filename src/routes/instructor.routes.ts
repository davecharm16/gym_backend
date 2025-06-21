import { Router } from 'express';
import {
  createInstructor,
  getAllInstructors,
  getInstructorById,
  updateInstructor,
  deleteInstructor,
} from '../controllers/instructor.controller'
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', requireAuth ,createInstructor);
router.get('/', requireAuth,getAllInstructors);
router.get('/:id', requireAuth,getInstructorById);
router.put('/:id', requireAuth,updateInstructor);
router.delete('/:id', requireAuth,deleteInstructor);

export default router;