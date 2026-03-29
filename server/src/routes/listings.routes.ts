import { Router } from 'express';
import { body } from 'express-validator';
import { getListings, createListing, getListingById, updateListing, deleteListing } from '../controllers/listings.controller';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.get('/', getListings as any);
router.get('/available', getListings as any);
router.get('/:id', getListingById as any);

router.use(requireAuth);

router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('quantity_unit').notEmpty().withMessage('Quantity unit is required'),
  body('expiry_datetime').isISO8601().withMessage('Valid expiry datetime is required'),
  validateRequest
], createListing as any);

router.put('/:id', updateListing as any);
router.delete('/:id', deleteListing as any);

export default router;
