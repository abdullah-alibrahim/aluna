import React from 'react';
import BrandSplash from '@/components/common/BrandSplash';

const LoadingScreen: React.FC<any> = () => {
  return <BrandSplash subtitle="جاري تجهيز لوحة المالك…" showLoader />;
};

export default LoadingScreen;
