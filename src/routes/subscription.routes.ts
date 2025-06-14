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
  router.get('/', getAllSubscriptions);
  router.get('/:id', getSubscriptionById);
  router.put('/:id', updateSubscription);
  router.delete('/:id', deleteSubscription);
  
  export default router;