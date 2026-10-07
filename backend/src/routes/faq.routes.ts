import express from 'express';
import { getActiveFAQs } from '../controllers/faq.controller';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.get('/:target', catchAsync(getActiveFAQs));

export default router;
