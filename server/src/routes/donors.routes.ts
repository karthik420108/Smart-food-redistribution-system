import { Router } from 'express';
import { getMe, updateMe, kycUpload } from '../controllers/donors.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/me', getMe as any);
router.put('/me', updateMe as any);
router.post('/kyc-upload', kycUpload as any);

export default router;
