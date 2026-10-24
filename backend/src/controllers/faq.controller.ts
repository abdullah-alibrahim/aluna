import { Request, Response } from 'express';
import FAQ from '../models/FAQ';

/**
 * @desc    Get all active FAQs for a specific target ('user' or 'owner')
 * @route   GET /api/faqs/:target
 * @access  Public
 */
export const getActiveFAQs = async (req: Request, res: Response) => {
  const target = (req.params.target || req.query.target) as string | undefined;

  const filter: any = { isActive: true };
  if (target === 'user') {
    // Users see their own FAQs plus the shared "all" ones
    filter.target = { $in: ['user', 'all'] };
  } else if (target === 'owner') {
    filter.target = { $in: ['owner', 'all'] };
  } else if (target && target !== 'all') {
    return res.status(400).json({ message: 'Invalid target specified. Use "user", "owner" or "all".' });
  }

  const faqs = await FAQ.find(filter).sort({ createdAt: 1 });
  res.status(200).json(faqs);
};
