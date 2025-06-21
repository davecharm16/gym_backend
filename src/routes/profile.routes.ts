// src/routes/me.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getMyProfile } from '../controllers/profile.controller';

const router = Router();

router.get('/', requireAuth ,getMyProfile);

export default router;
