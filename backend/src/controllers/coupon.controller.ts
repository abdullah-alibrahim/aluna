import { Request, Response } from 'express';
import Coupon from '../models/Coupon';
import User from '../models/User';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const getCoupons = async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new NotFoundError('User not found');

  const allCoupons = await Coupon.find({ isActive: true, expiryDate: { $gt: new Date() } }).sort({ createdAt: -1 });

  const collected = user.collectedCoupons || [];

  const couponsData = allCoupons.map((c) => {
    const isCollectedItem = collected.find(col => col.couponId.toString() === c._id.toString());
    let status = 'available';
    if (isCollectedItem) {
      status = isCollectedItem.isUsed ? 'used' : 'collected';
    }
    return { ...c.toObject(), status };
  });

  res.json(couponsData);
};

export const collectCoupon = async (req: Request, res: Response) => {
  const { couponId } = req.params;
  const user = await User.findById(req.user!.id);
  if (!user) throw new NotFoundError('User not found');

  const coupon = await Coupon.findOne({ _id: couponId as string, isActive: true, expiryDate: { $gt: new Date() } });
  if (!coupon) throw new BadRequestError('Invalid or expired coupon');

  const alreadyCollected = user.collectedCoupons?.find(c => c.couponId.toString() === couponId);
  if (alreadyCollected) {
    throw new BadRequestError('Coupon already collected');
  }

  user.collectedCoupons.push({ couponId: coupon._id as any, isUsed: false, collectedAt: new Date() });
  await user.save();

  res.json({ message: 'Coupon collected successfully' });
};
