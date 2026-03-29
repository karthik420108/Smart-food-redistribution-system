import { Router } from 'express';
import { getGlobalLeaderboard, getPublicStats } from '../controllers/public.controller';

const router = Router();

/**
 * @route   GET /api/public/leaderboard
 * @desc    Get top contributors for landing page hall of fame
 * @access  Public
 */
router.get('/leaderboard', getGlobalLeaderboard);

/**
 * @route   GET /api/public/stats
 * @desc    Get aggregate impact stats for landing page hero
 * @access  Public
 */
router.get('/stats', getPublicStats);

export default router;
