import { Router } from 'express';
import { getOverviewStats, getWeeklyDonations } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/overview', getOverviewStats);
router.get('/weekly', getWeeklyDonations);

export default router;
