import { Router } from 'express';
import { createCheckin } from '../controllers/checkin.controller';

const router = Router();

router.post('/', createCheckin);

export default router;
