import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getUserById, register } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/register', register);
router.get('/user/:id', requireAuth, getUserById);

export default router;
