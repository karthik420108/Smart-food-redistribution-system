import { Router } from 'express';
import { body } from 'express-validator';
import { register, verifyOtp, login, refresh, logout } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 10 }).withMessage('Password must be at least 10 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('donor_type').isIn(['individual', 'business']).withMessage('Invalid donor type'),
  validateRequest
], register as any);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validateRequest
], login as any);

router.post('/verify-otp', [
  body('phone').notEmpty(),
  body('token').notEmpty(),
  validateRequest
], verifyOtp as any);

router.post('/refresh', [
  body('refresh_token').notEmpty(),
  validateRequest
], refresh as any);

router.post('/logout', logout as any);

export default router;
