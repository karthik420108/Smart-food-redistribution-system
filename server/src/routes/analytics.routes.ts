import { Router } from 'express';
import { getOverviewStats, getWeeklyDonations, getDetailedDonorImpact } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/overview', getOverviewStats);
router.get('/weekly', getWeeklyDonations);
router.get('/detailed', getDetailedDonorImpact);

export default router;
