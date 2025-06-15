import { Router } from 'express';
import { getAttendanceLogs } from '../controllers/attendance.controller';

const router = Router();

router.get('/', getAttendanceLogs); // GET /api/attendance?student_id=<uuid>

export default router;
