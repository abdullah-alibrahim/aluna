import { Image } from 'react-native';

const banner1 = require('../../assets/banner-aluna-1.png');
const banner2 = require('../../assets/banner-aluna-2.png');
const banner3 = require('../../assets/banner-aluna-3.png');

function assetUri(mod: number) {
  return Image.resolveAssetSource(mod)?.uri || '';
}

/** Default Aluna carousel slides (local brand art). */
export const brandCarouselBanners = [
  { _id: 'brand-1', imageUrl: assetUri(banner1), imageLocal: banner1, isActive: true },
  { _id: 'brand-2', imageUrl: assetUri(banner2), imageLocal: banner2, isActive: true },
  { _id: 'brand-3', imageUrl: assetUri(banner3), imageLocal: banner3, isActive: true },
];
