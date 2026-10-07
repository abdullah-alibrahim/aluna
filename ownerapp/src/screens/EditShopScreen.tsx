import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  FlatList,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateShop } from '@/store/slices/shopSlice';
import { fetchCities } from '@/store/slices/citySlice';
import { fetchCategories } from '@/store/slices/categorySlice';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ImagePlus, X, MapPin, Clock, CheckCircle2, ChevronDown, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { t } from '@/i18n';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS: Record<string, string> = {
  Monday: 'الإثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت',
  Sunday: 'الأحد',
};
const TIME_SLOTS = Array.from({ length: 24 * 2 }).map((_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditShop'>;
type EditShopRouteProp = RouteProp<RootStackParamList, 'EditShop'>;

export default function EditShopScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditShopRouteProp>();
  const dispatch = useAppDispatch();
  
  const { shop } = route.params;
  const { loading: updating } = useAppSelector(state => state.shops);
  const { cities } = useAppSelector(state => state.cities);
  const { categories } = useAppSelector(state => state.categories);

  const [name, setName] = useState(shop.name);
  const [description, setDescription] = useState(shop.description || '');
  const [address, setAddress] = useState(shop.address);
  const [slotInterval, setSlotInterval] = useState((shop as any).slotInterval?.toString() || '15');
  const [cityId, setCityId] = useState(typeof shop.cityId === 'object' ? shop.cityId._id : shop.cityId);
  const [showCityPicker, setShowCityPicker] = useState(false);
  
  const [categoryIds, setCategoryIds] = useState<string[]>(
    shop.categoryIds?.map((c: any) => typeof c === 'string' ? c : c._id) || []
  );

  const [existingImages, setExistingImages] = useState<string[]>(shop.images || []);
  const [newImages, setNewImages] = useState<string[]>([]);
  
  const initialLat = shop.location?.coordinates?.[1] || 33.5138;
  const initialLng = shop.location?.coordinates?.[0] || 36.2765;
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
  const webviewRef = useRef<WebView>(null);
  
  // Operating Hours
  const defaultHours = DAYS.map(day => ({
    day, open: '09:00', close: '18:00', isClosed: day === 'Sunday'
  }));

  const mergedHours = defaultHours.map(dh => {
    const existing = shop.operatingHours?.find(oh => oh.day === dh.day);
    if (existing) {
      return { ...dh, open: existing.open, close: existing.close, isClosed: existing.isClosed };
    }
    return dh;
  });

  const [operatingHours, setOperatingHours] = useState(mergedHours);

  // Time Picker Modal State
  const [timePickerConfig, setTimePickerConfig] = useState<{ dayIndex: number, type: 'open'|'close', visible: boolean }>({
    dayIndex: 0, type: 'open', visible: false
  });

  useEffect(() => {
    dispatch(fetchCities());
    dispatch(fetchCategories());
  }, [dispatch]);

  const totalImages = existingImages.length + newImages.length;

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - totalImages,
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleDayClosed = (index: number) => {
    const newHours = [...operatingHours];
    newHours[index].isClosed = !newHours[index].isClosed;
    setOperatingHours(newHours);
  };

  const handleTimeSelect = (time: string) => {
    const newHours = [...operatingHours];
    newHours[timePickerConfig.dayIndex][timePickerConfig.type] = time;
    setOperatingHours(newHours);
    setTimePickerConfig(prev => ({ ...prev, visible: false }));
  };

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'User-Agent': 'SalonApp/1.0',
          'Accept-Language': 'ar',
        }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (e) {
      console.log('Geocoding error', e);
    }
  };

  const toggleCategory = (id: string) => {
    if (categoryIds.includes(id)) {
      setCategoryIds(categoryIds.filter(c => c !== id));
    } else {
      setCategoryIds([...categoryIds, id]);
    }
  };

  const onSubmit = () => {
    if (!name || !address || !cityId || categoryIds.length === 0) {
      return Alert.alert(t('common.error'), t('shop.requiredFields'));
    }
    if (totalImages === 0) {
      return Alert.alert(t('common.error'), t('shop.galleryRequired'));
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('address', address);
    formData.append('slotInterval', slotInterval);
    formData.append('cityId', cityId);
    formData.append('categoryIds', JSON.stringify(categoryIds));
    formData.append('longitude', coordinates.lng.toString());
    formData.append('latitude', coordinates.lat.toString());
    formData.append('operatingHours', JSON.stringify(operatingHours));
    formData.append('existingImages', JSON.stringify(existingImages));

    newImages.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `image${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      
      formData.append('images', {
        uri,
        name: filename,
        type,
      } as any);
    });

    dispatch(updateShop({ id: shop._id, formData })).unwrap()
      .then(() => {
        Alert.alert(t('common.success'), t('shop.updatedSuccess'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]);
      })
      .catch((err) => {
        Alert.alert(t('common.error'), err);
      });
  };

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; background-color: #F9F5EB; }
          #map { height: 100vh; width: 100vw; border-radius: 16px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${coordinates.lat}, ${coordinates.lng}], 13);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
          }).addTo(map);

          let marker = L.marker([${coordinates.lat}, ${coordinates.lng}], { draggable: true }).addTo(map);

          function updateCoords(lat, lng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng }));
          }

          marker.on('dragend', function (e) {
            updateCoords(marker.getLatLng().lat, marker.getLatLng().lng);
          });

          map.on('click', function (e) {
            marker.setLatLng(e.latlng);
            updateCoords(e.latlng.lat, e.latlng.lng);
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-3 bg-background">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-lighter shadow-sm shadow-black/5">
          <ChevronLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="text-black-main font-figtree-bold text-lg">{t('shop.editTitle')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}>
        
        {/* Basic Info */}
        <View className="bg-white p-3 rounded-2xl border border-gray-lighter shadow-sm shadow-black/5 mb-3 z-50">
          <Text className="text-black-main font-figtree-bold text-lg mb-3 px-1">{t('shop.basicDetails')}</Text>
          
          <Text className="text-gray-dark font-figtree-medium mb-1 ml-1 text-xs">{t('shop.shopName')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-background px-4 py-3 rounded-2xl font-figtree-medium text-black-main mb-3 border border-gray-lighter"
            placeholder={t('shop.shopNamePlaceholder')}
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-gray-dark font-figtree-medium mb-1 ml-1 text-xs">{t('shop.description')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            className="bg-background px-4 py-3 rounded-2xl font-figtree-medium text-black-main mb-3 border border-gray-lighter"
            placeholder={t('shop.descriptionPlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text className="text-gray-dark font-figtree-medium mb-1 ml-1 text-xs">{t('shop.city')}</Text>
          <TouchableOpacity 
            onPress={() => setShowCityPicker(!showCityPicker)}
            className="bg-background px-4 py-4 rounded-2xl flex-row justify-between items-center mb-3 border border-gray-lighter"
          >
            <Text className={`font-figtree-medium ${cityId ? 'text-black-main' : 'text-gray-medium'}`}>
              {cityId ? cities.find(c => c._id === cityId)?.name : t('shop.selectCity')}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

            {showCityPicker && (
            <View className="bg-background rounded-2xl mb-3 overflow-hidden border border-gray-lighter absolute top-[280px] left-3 right-3 z-50 shadow-md" style={{ maxHeight: 200 }}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {cities.map(city => (
                  <TouchableOpacity 
                    key={city._id}
                    className="p-4 border-b border-gray-lighter flex-row justify-between items-center"
                    onPress={() => { 
                      setCityId(city._id); 
                      setShowCityPicker(false); 
                      if (city.coordinates && city.coordinates.coordinates) {
                        const lng = city.coordinates.coordinates[0];
                        const lat = city.coordinates.coordinates[1];
                        setCoordinates({ lat, lng });
                        webviewRef.current?.injectJavaScript(`
                          map.setView([${lat}, ${lng}], 13);
                          marker.setLatLng([${lat}, ${lng}]);
                          true;
                        `);
                        fetchAddressFromCoords(lat, lng);
                      }
                    }}
                  >
                    <Text className="text-black-main font-figtree-medium">{city.name}</Text>
                    {cityId === city._id && <CheckCircle2 size={18} color="#B59451" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text className="text-gray-dark font-figtree-medium mb-2 ml-1 text-xs mt-1">{t('shop.categories')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {categories.map(category => {
                const isSelected = categoryIds.includes(category._id);
                return (
                  <TouchableOpacity 
                    key={category._id}
                    onPress={() => toggleCategory(category._id)}
                    className={`bg-background rounded-2xl p-3 border ${isSelected ? 'border-primary shadow-sm shadow-primary/20' : 'border-gray-lighter'} items-center justify-center w-28`}
                  >
                    {category.image ? (
                      <Image source={{ uri: category.image }} className="w-12 h-12 rounded-full mb-2" />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-white items-center justify-center mb-2 border border-gray-lighter">
                        <Text className="text-gray-medium text-[10px]">{t('shop.noImage')}</Text>
                      </View>
                    )}
                    <Text className="text-black-main font-figtree-bold text-center text-xs" numberOfLines={1}>
                      {category.name}
                    </Text>
                    {isSelected && (
                      <View className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                        <CheckCircle2 size={12} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text className="text-gray-dark font-figtree-medium mb-1 ml-1 text-xs mt-1">{t('shop.address')}</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            className="bg-background px-4 py-3 rounded-2xl font-figtree-medium text-black-main border border-gray-lighter mb-3"
            placeholder={t('shop.addressPlaceholder')}
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-gray-dark font-figtree-medium mb-1 ml-1 text-xs mt-1">{t('shop.slotInterval')}</Text>
          <TextInput
            value={slotInterval}
            onChangeText={setSlotInterval}
            keyboardType="numeric"
            className="bg-background px-4 py-3 rounded-2xl font-figtree-medium text-black-main border border-gray-lighter"
            placeholder={t('shop.slotIntervalPlaceholder')}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Location / Map */}
        <View className="bg-white p-3 rounded-2xl border border-gray-lighter shadow-sm shadow-black/5 mb-3 -z-10">
          <View className="flex-row items-center gap-2 mb-2 px-1">
            <MapPin size={20} color="#B59451" />
            <Text className="text-black-main font-figtree-bold text-lg">{t('shop.pinLocation')}</Text>
          </View>
          <Text className="text-gray-medium font-figtree-regular text-xs mb-3 px-1 leading-5">
            {t('shop.pinLocationHint')}
          </Text>
          
          <View className="h-56 w-full rounded-2xl overflow-hidden mb-3 border border-gray-lighter relative">
            <WebView
              ref={webviewRef}
              source={{ html: leafletHTML }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  setCoordinates(data);
                  fetchAddressFromCoords(data.lat, data.lng);
                } catch (e) {}
              }}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
          </View>
          
          <View className="flex-row justify-between bg-background p-3 rounded-xl border border-gray-lighter">
            <Text className="text-gray-dark font-figtree-medium text-xs">Lat: {coordinates.lat.toFixed(6)}</Text>
            <Text className="text-gray-dark font-figtree-medium text-xs">Lng: {coordinates.lng.toFixed(6)}</Text>
          </View>
        </View>

        {/* Operating Hours */}
        <View className="bg-white p-3 rounded-2xl border border-gray-lighter shadow-sm shadow-black/5 mb-3 -z-10">
          <View className="flex-row items-center gap-2 mb-3 px-1">
            <Clock size={20} color="#B59451" />
            <Text className="text-black-main font-figtree-bold text-lg">{t('shop.operatingHours')}</Text>
          </View>

          {operatingHours.map((oh, index) => (
            <View key={oh.day} className="flex-row items-center justify-between py-3 border-b border-gray-lighter">
              <View className="w-20 pl-1">
                <Text className={`font-figtree-bold ${oh.isClosed ? 'text-gray-medium line-through' : 'text-black-main'}`}>
                  {DAY_LABELS[oh.day] || oh.day}
                </Text>
              </View>
              
              {!oh.isClosed ? (
                <View className="flex-row flex-1 justify-center gap-3 items-center px-2">
                  <TouchableOpacity 
                    className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/20"
                    onPress={() => setTimePickerConfig({ dayIndex: index, type: 'open', visible: true })}
                  >
                    <Text className="text-primary font-figtree-bold text-sm">{oh.open}</Text>
                  </TouchableOpacity>
                  <Text className="text-gray-medium font-figtree-bold">-</Text>
                  <TouchableOpacity 
                    className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/20"
                    onPress={() => setTimePickerConfig({ dayIndex: index, type: 'close', visible: true })}
                  >
                    <Text className="text-primary font-figtree-bold text-sm">{oh.close}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-1 items-center">
                  <Text className="text-gray-medium font-figtree-medium text-xs bg-gray-lighter px-3 py-1 rounded-full border border-gray-medium/20">{t('shop.closed')}</Text>
                </View>
              )}

              <Switch 
                value={!oh.isClosed} 
                onValueChange={() => toggleDayClosed(index)} 
                trackColor={{ false: '#E5E7EB', true: '#B59451' }}
                thumbColor="#FFF"
              />
            </View>
          ))}
        </View>

        {/* Images */}
        <View className="bg-white p-3 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5 mb-3 -z-10">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-black-main font-figtree-bold text-lg">المعرض ({totalImages}/5) *</Text>
            {totalImages < 5 && (
              <TouchableOpacity onPress={pickImages} className="bg-primary/10 p-2 rounded-xl">
                <ImagePlus size={20} color="#B59451" />
              </TouchableOpacity>
            )}
          </View>
          
          {totalImages > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {existingImages.map((uri, index) => (
                <View key={`existing-${index}`} className="w-[31%] aspect-square relative mb-1">
                  <Image source={{ uri }} className="w-full h-full rounded-2xl border border-gray-lighter" />
                  <TouchableOpacity 
                    onPress={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm"
                  >
                    <X size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {newImages.map((uri, index) => (
                <View key={`new-${index}`} className="w-[31%] aspect-square relative mb-1">
                  <Image source={{ uri }} className="w-full h-full rounded-2xl border border-primary/50" />
                  <TouchableOpacity 
                    onPress={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm"
                  >
                    <X size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {/* Add More Button if less than 5 */}
              {totalImages < 5 && (
                 <TouchableOpacity 
                  onPress={pickImages}
                  className="w-[31%] aspect-square border-2 border-dashed border-gray-medium bg-background rounded-2xl items-center justify-center mb-1"
                 >
                   <ImagePlus size={24} color="#9CA3AF" />
                 </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              onPress={pickImages}
              className="border-2 border-dashed border-gray-medium bg-background rounded-2xl p-6 items-center justify-center"
            >
              <ImagePlus size={28} color="#9CA3AF" className="mb-2" />
              <Text className="text-gray-dark font-figtree-medium text-center text-xs">اضغطي لرفع حتى 5 صور.</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* Footer Submit */}
      <View className="bg-white p-3 border-t border-gray-lighter" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <TouchableOpacity 
          onPress={onSubmit}
          disabled={updating}
          className={`py-4 rounded-2xl flex-row justify-center items-center gap-2 ${updating ? 'bg-gray-medium' : 'bg-primary shadow-sm shadow-primary/30'}`}
        >
          {updating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" />
              <Text className="text-white font-figtree-bold text-base">{t('shop.saveChanges')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={timePickerConfig.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-1/2 p-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-lighter px-2 mt-2">
              <Text className="text-black-main font-figtree-bold text-lg">
                اختاري {timePickerConfig.type === 'open' ? 'وقت الفتح' : 'وقت الإغلاق'}
              </Text>
              <TouchableOpacity onPress={() => setTimePickerConfig(prev => ({ ...prev, visible: false }))} className="bg-gray-lighter p-2 rounded-full">
                <X size={18} color="#14110A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TIME_SLOTS}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="py-4 border-b border-gray-lighter items-center active:bg-gray-lighter"
                  onPress={() => handleTimeSelect(item)}
                >
                  <Text className="text-black-main font-figtree-medium text-base">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}
