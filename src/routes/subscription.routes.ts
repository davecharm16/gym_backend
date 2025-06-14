import express, { Router } from 'express';
import {  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription, 
} from '../controllers/subscription.controller';
import { requireAuth } from '../middlewares/auth.middleware';

  const router = Router();

  router.post('/', requireAuth ,createSubscription);
  router.get('/',requireAuth, getAllSubscriptions);
  router.get('/:id',requireAuth, getSubscriptionById);
  router.put('/:id', requireAuth, updateSubscription);
  router.delete('/:id',requireAuth, deleteSubscription);
  
  export default router;