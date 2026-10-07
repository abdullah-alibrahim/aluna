import { Request, Response } from 'express';
import Branch from '../models/Branch';
import Shop from '../models/Shop';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

const paramId = (value: string | string[] | undefined) => {
  if (!value) throw new BadRequestError('معرّف ناقص');
  return Array.isArray(value) ? value[0]! : value;
};

const assertOwnerShop = async (shopId: string, ownerId: string) => {
  const shop = await Shop.findById(shopId);
  if (!shop) throw new NotFoundError('الصالون غير موجود');
  if (shop.ownerId.toString() !== ownerId) throw new ForbiddenError('غير مصرح');
  return shop;
};

export const listOwnerBranches = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  const shop = await assertOwnerShop(shopId, req.user!.id);

  // Backfill main branch for shops created before branches feature
  const count = await Branch.countDocuments({ shopId });
  if (count === 0) {
    await Branch.create({
      shopId,
      name: 'الفرع الرئيسي',
      address: shop.address,
      cityId: shop.cityId,
      location: shop.location,
      operatingHours: shop.operatingHours || [],
      isMain: true,
      isActive: true,
    });
  }

  const branches = await Branch.find({ shopId }).populate('cityId', 'name').sort({ isMain: -1, createdAt: 1 });
  res.json(branches);
};

export const listPublicBranches = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  const shop = await Shop.findOne({ _id: shopId as any, isApproved: true });
  if (!shop) throw new NotFoundError('الصالون غير موجود');
  const branches = await Branch.find({ shopId, isActive: true })
    .populate('cityId', 'name')
    .sort({ isMain: -1, name: 1 });
  res.json(branches);
};

export const createBranch = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  const shop = await assertOwnerShop(shopId, req.user!.id);
  const { name, address, cityId, phone, longitude, latitude, operatingHours, isMain } = req.body;

  if (!name || !address || !cityId || longitude == null || latitude == null) {
    throw new BadRequestError('الاسم والعنوان والمدينة والموقع مطلوبة');
  }

  if (isMain) {
    await Branch.updateMany({ shopId }, { $set: { isMain: false } });
  }

  const count = await Branch.countDocuments({ shopId });
  const branch = await Branch.create({
    shopId,
    name,
    address,
    cityId,
    phone,
    location: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
    operatingHours: operatingHours || shop.operatingHours || [],
    isMain: Boolean(isMain) || count === 0,
    isActive: true,
  });

  await branch.populate('cityId', 'name');
  res.status(201).json(branch);
};

export const updateBranch = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  const branchId = paramId(req.params.branchId);
  await assertOwnerShop(shopId, req.user!.id);

  const branch = await Branch.findOne({ _id: branchId as any, shopId });
  if (!branch) throw new NotFoundError('الفرع غير موجود');

  const { name, address, cityId, phone, longitude, latitude, operatingHours, isMain, isActive } = req.body;

  if (name) branch.name = name;
  if (address) branch.address = address;
  if (cityId) branch.cityId = cityId;
  if (phone !== undefined) branch.phone = phone;
  if (longitude != null && latitude != null) {
    branch.location = { type: 'Point', coordinates: [Number(longitude), Number(latitude)] };
  }
  if (operatingHours) branch.operatingHours = operatingHours;
  if (typeof isActive === 'boolean') branch.isActive = isActive;

  if (isMain === true) {
    await Branch.updateMany({ shopId, _id: { $ne: branch._id } }, { $set: { isMain: false } });
    branch.isMain = true;
  }

  await branch.save();
  await branch.populate('cityId', 'name');
  res.json(branch);
};

export const deleteBranch = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  const branchId = paramId(req.params.branchId);
  await assertOwnerShop(shopId, req.user!.id);

  const branch = await Branch.findOne({ _id: branchId as any, shopId });
  if (!branch) throw new NotFoundError('الفرع غير موجود');
  if (branch.isMain) {
    throw new BadRequestError('لا يمكن حذف الفرع الرئيسي. عيّن فرعاً آخر كرئيسي أولاً');
  }

  branch.isActive = false;
  await branch.save();
  res.json({ message: 'تم إيقاف الفرع' });
};
