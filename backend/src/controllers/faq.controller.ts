import { Request, Response } from 'express';
import FAQ from '../models/FAQ';

/**
 * @desc    Get all active FAQs for a specific target ('user' or 'owner')
 * @route   GET /api/faqs/:target
 * @access  Public
 */
export const getActiveFAQs = async (req: Request, res: Response) => {
  const target = (req.params.target || req.query.target) as string | undefined;

  let filter: any = { isActive: true };
  if (target) {
    filter.target = target;
  }

  if (filter.target && !['user', 'owner'].includes(filter.target)) {
    return res.status(400).json({ message: 'Invalid target specified. Use "user" or "owner".' });
  }

  const faqs = await FAQ.find(filter).sort({ createdAt: 1 });
  res.status(200).json(faqs);
};
