import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  volunteerSetupPin,
  getMyVolunteerProfile, updateVolunteerProfile,
  updateAvailability,
  getActiveTask, getVolunteerTasks, getTaskDetail, updateTaskStatus,
  verifyOtp, completeTask,
  updateLocation,
  getChat, sendChat,
} from '../controllers/volunteer.controller';

const router = Router();

// ---- Unprotected ----
router.post('/auth/setup-pin', [
  body('phone').notEmpty(),
  body('setup_pin').isLength({ min: 6, max: 6 }),
  body('new_password').isLength({ min: 8 }),
  validateRequest,
], volunteerSetupPin as any);

// ---- Protected ----
router.use(requireAuth);

// Profile
router.get('/me', getMyVolunteerProfile as any);
router.put('/me', updateVolunteerProfile as any);

// Availability
router.put('/availability', [body('availability_status').notEmpty(), validateRequest], updateAvailability as any);

// Tasks
router.get('/tasks/active', getActiveTask as any);
router.get('/tasks', getVolunteerTasks as any);
router.get('/tasks/:id', getTaskDetail as any);
router.put('/tasks/:id/status', [body('status').notEmpty(), validateRequest], updateTaskStatus as any);
router.post('/tasks/:id/verify-otp', [body('otp').isLength({ min: 6, max: 6 }), validateRequest], verifyOtp as any);
router.post('/tasks/:id/complete', [body('actual_kg_collected').isNumeric(), validateRequest], completeTask as any);

// GPS Location
router.post('/location', [body('lat').isNumeric(), body('lng').isNumeric(), validateRequest], updateLocation as any);

// Chat
router.get('/chat/:task_id', getChat as any);
router.post('/chat/:task_id', [body('message').notEmpty(), validateRequest], sendChat as any);

export default router;
