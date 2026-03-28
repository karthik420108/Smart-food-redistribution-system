import { Router } from 'express';
import { body } from 'express-validator';
import { createClaim, verifyPickup, getClaims } from '../controllers/claims.controller';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.post('/', [
  body('listing_id').notEmpty(),
  body('quantity_claimed').isNumeric(),
  validateRequest
], createClaim as any);

router.post('/:id/verify-pickup', [
  body('pickup_code').isLength({ min: 6, max: 6 }),
  validateRequest
], verifyPickup as any);

router.get('/', getClaims as any);

export default router;
