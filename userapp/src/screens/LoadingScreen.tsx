import React from 'react';
import BrandSplash from '@/components/common/BrandSplash';

const LoadingScreen: React.FC<any> = () => {
  return <BrandSplash subtitle="جاري التجهيز…" showLoader />;
};

export default LoadingScreen;
