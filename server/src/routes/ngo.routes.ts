import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  registerNgo, loginNgo, getMyNgo, updateMyNgo,
  getLocations, addLocation, updateLocation, deleteLocation,
  getClaims, createClaim, cancelClaim, logImpact,
  getVolunteers, addVolunteer, getVolunteer, updateVolunteer, updateVolunteerStatus, deleteVolunteer,
  getTasks, createTask, reassignTask, cancelTask, rateVolunteer,
  getLiveVolunteers, getActiveTasks,
  getAnalytics,
  aiDailyBriefing, aiSuggestAssignments,
  getTaskMessages, sendTaskMessage,
} from '../controllers/ngo.controller';

const router = Router();

// ---- AUTH (unprotected) ----
router.post('/auth/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('org_name').notEmpty(),
  body('org_type').notEmpty(),
  body('registration_number').notEmpty(),
  body('contact_person').notEmpty(),
  body('phone').notEmpty(),
  body('primary_address').notEmpty(),
  validateRequest,
], registerNgo as any);

router.post('/auth/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
  validateRequest,
], loginNgo as any);

// ---- PROTECTED ----
router.use(requireAuth);

// Profile
router.get('/me', getMyNgo as any);
router.put('/me', updateMyNgo as any);

// Locations
router.get('/locations', getLocations as any);
router.post('/locations', addLocation as any);
router.put('/locations/:id', updateLocation as any);
router.delete('/locations/:id', deleteLocation as any);

// Claims
router.get('/claims', getClaims as any);
router.post('/claims', [body('listing_id').notEmpty(), body('quantity_claimed').isNumeric(), validateRequest], createClaim as any);
router.put('/claims/:id/cancel', cancelClaim as any);
router.post('/claims/:id/log-impact', logImpact as any);

// Volunteers
router.get('/volunteers', getVolunteers as any);
router.post('/volunteers', [body('full_name').notEmpty(), body('phone').notEmpty(), validateRequest], addVolunteer as any);
router.get('/volunteers/live', getLiveVolunteers as any);
router.get('/volunteers/:id', getVolunteer as any);
router.put('/volunteers/:id', updateVolunteer as any);
router.put('/volunteers/:id/status', updateVolunteerStatus as any);
router.delete('/volunteers/:id', deleteVolunteer as any);

// Tasks
router.get('/tasks', getTasks as any);
router.post('/tasks', [body('claim_id').notEmpty(), body('volunteer_id').notEmpty(), validateRequest], createTask as any);
router.get('/tasks/active', getActiveTasks as any);
router.put('/tasks/:id/reassign', reassignTask as any);
router.put('/tasks/:id/cancel', cancelTask as any);
router.post('/tasks/:id/rate-volunteer', rateVolunteer as any);

// Analytics
router.get('/analytics/overview', getAnalytics as any);

// AI
router.get('/ai-daily-briefing', aiDailyBriefing as any);
router.post('/ai-suggest-assignments', aiSuggestAssignments as any);

// Chat
router.get('/tasks/:task_id/messages', getTaskMessages as any);
router.post('/tasks/:task_id/messages', sendTaskMessage as any);

export default router;
