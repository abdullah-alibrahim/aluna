import React from 'react';
import { View, Text } from 'react-native';
import { MapPin, Calendar, Info } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

const DAY_AR: Record<string, string> = {
  Sunday: 'الأحد',
  Monday: 'الإثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت',
};

export default function ShopAbout({ shop }: { shop: any }) {
  if (!shop) return null;

  return (
    <View className="pb-10 space-y-4">
      {shop.description && (
        <View className="bg-white py-4 mb-3 border-b border-gray-100">
          <View className="flex-row items-center mb-2">
            <Info color="#B59451" size={18} />
            <Text className="text-black-main font-figtree-bold text-base ml-2">نبذة عنا</Text>
          </View>
          <Text className="text-gray-medium font-figtree text-sm leading-6">
            {shop.description}
          </Text>
        </View>
      )}

      <View className="bg-white py-4 mb-3 border-b border-gray-100">
        <View className="flex-row items-center mb-3">
          <Calendar color="#B59451" size={18} />
          <Text className="text-black-main font-figtree-bold text-base ml-2">ساعات العمل</Text>
        </View>
        
        {shop.operatingHours?.map((hours: any, index: number) => {
          const isToday = hours.day === new Date().toLocaleDateString('en-US', { weekday: 'long' });
          return (
            <View 
              key={index} 
              className={`flex-row justify-between py-2 ${index !== shop.operatingHours.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <Text className={`${isToday ? 'font-figtree-bold text-black-main' : 'font-figtree text-gray-medium'} text-sm`}>
                {DAY_AR[hours.day] || hours.day}
              </Text>
              <Text className={`${isToday ? 'font-figtree-bold text-primary' : 'font-figtree text-gray-medium'} text-sm`}>
                {hours.isClosed ? 'مغلق' : `${hours.open} - ${hours.close}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="bg-white py-4 mb-3">
        <View className="flex-row items-center mb-3">
          <MapPin color="#B59451" size={18} />
          <Text className="text-black-main font-figtree-bold text-base ml-2">الموقع</Text>
        </View>
        <Text className="text-gray-medium font-figtree text-sm mb-3 leading-5">
          {shop.address}
        </Text>
        <View className="h-40 rounded-xl overflow-hidden border border-gray-lighter">
          {shop.location?.coordinates ? (
            <WebView
              originWhitelist={['*']}
              scrollEnabled={false}
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                    <style>
                      body { padding: 0; margin: 0; }
                      html, body, #map { height: 100%; width: 100%; }
                    </style>
                  </head>
                  <body>
                    <div id="map"></div>
                    <script>
                      var lat = ${shop.location.coordinates[1]};
                      var lon = ${shop.location.coordinates[0]};
                      var map = L.map('map', { zoomControl: false }).setView([lat, lon], 14);
                      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                        attribution: ''
                      }).addTo(map);
                      var customIcon = L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      });
                      L.marker([lat, lon], {icon: customIcon}).addTo(map);
                    </script>
                  </body>
                  </html>
                `
              }}
              style={{ flex: 1 }}
            />
          ) : (
            <View className="flex-1 bg-gray-100 items-center justify-center">
               <MapPin color="#9C8C80" size={32} />
               <Text className="text-gray-light font-figtree-medium text-xs mt-2">الموقع غير متوفر</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
