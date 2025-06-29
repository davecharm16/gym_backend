import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { forceResetPassword, getUserById, login, register, registerStudent, requestPasswordReset } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/register', register);
router.get('/user/:id', requireAuth, getUserById);
router.post('/login', login); 
router.post('/registerStudent', registerStudent); 
router.post('/reset-password', requestPasswordReset); 
router.post('/admin-reset-password', forceResetPassword); 




export default router;
