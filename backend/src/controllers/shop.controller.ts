import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Shop from '../models/Shop';
import Branch from '../models/Branch';
import Service from '../models/Service';
import PortfolioItem from '../models/PortfolioItem';
import Banner from '../models/Banner';
import User from '../models/User';
import Staff from '../models/Staff';
import { NotFoundError, BadRequestError } from '../utils/errors';
import cache, { cached } from '../utils/cache';

// Browse Approved Shops
export const getApprovedShops = async (req: Request, res: Response) => {
  const key = `shops:approved:${JSON.stringify(req.query || {})}`;
  const cachedShops = cache.get(key);
  if (cachedShops) {
    res.json(cachedShops);
    return;
  }

  const { cityId, search, longitude, latitude, radius, minRating, minPrice, maxPrice, date, categoryId, sortBy } = req.query;

  const pipeline: any[] = [];

  // 1. GeoSpatial Search (Must be the first stage if coordinates exist)
  if (longitude && latitude) {
    const maxDist = radius ? parseInt(radius as string) : 10000; // default 10km
    pipeline.push({
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
        },
        distanceField: 'distance',
        maxDistance: maxDist,
        spherical: true,
        query: { isApproved: true },
      },
    });
  } else {
    pipeline.push({ $match: { isApproved: true } });
  }

  // 2. City Filter
  if (cityId) {
    pipeline.push({ $match: { cityId: new mongoose.Types.ObjectId(cityId as string) } });
  }

  // 2.5 Category Filter
  if (categoryId) {
    pipeline.push({ $match: { categoryIds: new mongoose.Types.ObjectId(categoryId as string) } });
  }

  // 3. Search by Name
  if (search) {
    pipeline.push({ $match: { name: { $regex: search as string, $options: 'i' } } });
  }

  // 4. Rating Filter
  if (minRating) {
    pipeline.push({ $match: { rating: { $gte: parseFloat(minRating as string) } } });
  }

  // 5. Date Availability Filter
  if (date) {
    const dayOfWeek = new Date(date as string).toLocaleDateString('en-US', { weekday: 'long' });
    pipeline.push({
      $match: {
        operatingHours: {
          $elemMatch: {
            day: dayOfWeek,
            isClosed: false,
          },
        },
      },
    });
  }

  // 6. Price Range Filter (Requires joining Services)
  pipeline.push({
    $lookup: {
      from: 'services',
      localField: '_id',
      foreignField: 'shopId',
      as: 'shopServices',
    },
  });

  if (minPrice || maxPrice) {
    const priceQuery: any = {};
    if (minPrice) priceQuery.$gte = parseFloat(minPrice as string);
    if (maxPrice) priceQuery.$lte = parseFloat(maxPrice as string);

    pipeline.push({
      $match: {
        'shopServices.price': priceQuery,
      },
    });
  }

  // Calculate startingPrice
  pipeline.push({
    $addFields: {
      startingPrice: { $min: '$shopServices.price' }
    }
  });

  // Only send the cover image in list views to keep payloads small
  pipeline.push({ $addFields: { images: { $slice: ['$images', 1] } } });
  // Remove the services array and heavy/unused fields to keep payload clean
  pipeline.push({ $project: { shopServices: 0, __v: 0, ownerId: 0, rejectionReason: 0, updatedAt: 0, createdAt: 0, location: 0 } });

  // 6.5 Dynamic Sorting
  let sortConfig: any = { isFeatured: -1, distance: 1 }; // Default
  if (sortBy === 'rating') {
    sortConfig = { rating: -1, distance: 1 };
  } else if (sortBy === 'price_low') {
    sortConfig = { startingPrice: 1, distance: 1 };
  } else if (sortBy === 'price_high') {
    sortConfig = { startingPrice: -1, distance: 1 };
  }
  
  pipeline.push({ $sort: sortConfig });

  // 7. Populate City details manually
  pipeline.push({
    $lookup: {
      from: 'cities',
      localField: 'cityId',
      foreignField: '_id',
      as: 'cityId',
    },
  });
  pipeline.push({
    $unwind: {
      path: '$cityId',
      preserveNullAndEmptyArrays: true,
    },
  });

  const shops = await Shop.aggregate(pipeline);
  cache.set(key, shops, 30);
  res.json(shops);
};

// Approved Shop details
export const getShopDetails = async (req: Request, res: Response) => {
  const key = `shop:details:${req.params.id}`;
  const cachedDetail = cache.get(key);
  if (cachedDetail) { res.json(cachedDetail); return; }

  const shop = await Shop.findOne({ _id: req.params.id as any, isApproved: true }).populate('cityId', 'name');
  if (!shop) throw new NotFoundError('Shop not found');

  let branches = await Branch.find({ shopId: shop._id, isActive: true })
    .populate('cityId', 'name')
    .sort({ isMain: -1, name: 1 });

  if (!branches.length) {
    const created = await Branch.create({
      shopId: shop._id,
      name: 'الفرع الرئيسي',
      address: shop.address,
      cityId: shop.cityId,
      location: shop.location,
      operatingHours: shop.operatingHours || [],
      isMain: true,
      isActive: true,
    });
    await created.populate('cityId', 'name');
    branches = [created];
  }

  const [services, staff] = await Promise.all([
    Service.find({ shopId: shop._id }).populate('categoryId', 'name'),
    Staff.find({ shopId: shop._id }).populate('servicesProvided', 'name'),
  ]);

  const payload = { shop, services, staff, branches };
  cache.set(key, payload, 60);
  res.json(payload);
};

// Favorites management
export const toggleFavoriteShop = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user!.id;

  const shop = await Shop.findById(shopId);
  if (!shop) throw new NotFoundError('Shop not found');

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const isFavorited = user.favoriteShops.includes(shopId as any);

  if (isFavorited) {
    await User.findByIdAndUpdate(userId, {
      $pull: { favoriteShops: shopId }
    });
    res.json({ message: 'Removed from favorites', isFavorited: false });
  } else {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { favoriteShops: shopId }
    });
    res.json({ message: 'Added to favorites', isFavorited: true });
  }
};

export const getMyFavorites = async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id)
    .populate({
      path: 'favoriteShops',
      populate: { path: 'cityId', select: 'name' }
    });

  if (!user) throw new NotFoundError('User not found');

  res.json(user.favoriteShops);
};

// Shop Portfolio
export const getShopPortfolio = async (req: Request, res: Response) => {
  const { shopId } = req.params;

  const portfolio = await PortfolioItem.find({ shopId: shopId as string })
    .populate('serviceId', 'name price duration')
    .populate('staffId', 'name role avatar')
    .sort({ createdAt: -1 });

  res.json(portfolio);
};

// Banners
export const getActiveBanners = async (req: Request, res: Response) => {
  const banners = await cached('banners:active', 300, async () => {
    return await Banner.find({ isActive: true })
      .select('title imageUrl targetLink isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();
  });
  res.json(banners);
};
