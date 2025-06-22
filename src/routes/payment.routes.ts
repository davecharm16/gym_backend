// src/routes/payment.routes.ts
import { Router } from 'express';
import {
  createPayment,
  getPaymentsByStudent,
  updatePayment,
  deletePayment,
  getAllPaymentsWithStudent,
  getPaymentAverages,
} from '../controllers/payment.controller'
  import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', requireAuth, createPayment); // Create a payment
router.get('/student/:studentId', requireAuth, getPaymentsByStudent); // Get payments for a student
router.get('/all-with-student', requireAuth, getAllPaymentsWithStudent); // Get payments for a student
router.get('/average', requireAuth, getPaymentAverages); // Get payments for a student
router.put('/:id', requireAuth, updatePayment); // Update a payment
router.delete('/:id', requireAuth, deletePayment); // Delete a payment

export default router;
