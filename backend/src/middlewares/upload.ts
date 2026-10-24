import multer from 'multer';
import type { Request } from 'express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

const hasCloudinary =
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

const storage = hasCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: async () => ({
        folder: 'salonapp',
        allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
      }),
    })
  : multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('يرجى رفع صور فقط', 400));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

/** Cloudinary path or base64 data URL when Cloudinary is not configured */
export function uploadedImageUrl(file?: Express.Multer.File): string | undefined {
  if (!file) return undefined;
  if ((file as any).path) return (file as any).path as string;
  if (file.buffer?.length) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }
  return undefined;
}
