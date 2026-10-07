// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  User, 
  Settings, 
  Bell, 
  ShieldCheck, 
  ChevronRight, 
  LogOut,
  BadgeCheck,
  MapPin,
  Grid,
  Percent,
  CircleDollarSign,
  Store,
  Ticket,
  Calendar,
  Image as ImageIcon,
  MessageCircleQuestion,
  Edit3
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import ConfirmationModal from '../components/common/ConfirmationModal';

import { API_URL } from '../api/client';
import { t } from '@/i18n';

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    dispatch(logoutUser());
  };

  const getImageUrl = (url: string | undefined | null) => {
    if (!url) return `https://ui-avatars.com/api/?name=${user?.name || 'Owner'}&background=B59451&color=fff&bold=true`;
    if (url.startsWith('http')) return url;
    const baseUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
    return `${baseUrl}${url}`;
  };

  const sections = [
    {
      title: t('profile.businessFinance'),
      items: [
        { id: 1, title: t('profile.myShops'), icon: Store, color: '#B59451', onPress: () => navigation.navigate('MyShops') },
        { id: 2, title: t('profile.allBookings'), icon: Calendar, color: '#B59451', onPress: () => navigation.navigate('Bookings') },
        { id: 3, title: t('profile.myWallet'), icon: CircleDollarSign, color: '#B59451', onPress: () => navigation.navigate('OwnerWallet') },
        { id: 4, title: t('profile.supportTickets'), icon: Ticket, color: '#B59451', onPress: () => navigation.navigate('Messages') },
      ]
    },
    {
      title: t('profile.securityAccount'),
      items: [
        { id: 5, title: t('profile.editProfile'), icon: User, color: '#14110A', onPress: () => navigation.navigate('OwnerEditProfile') },
        { id: 6, title: t('profile.helpFaqs'), icon: MessageCircleQuestion, color: '#14110A', onPress: () => navigation.navigate('OwnerFAQs') },
        { id: 7, title: t('profile.changePassword'), icon: ShieldCheck, color: '#14110A', onPress: () => navigation.navigate('ChangePassword') },
        { id: 8, title: t('profile.notifications'), icon: Bell, color: '#14110A', onPress: () => navigation.navigate('Notifications') },
      ]
    }
  ];

  const MenuItem = ({ item, isLast }) => (
    <TouchableOpacity 
      onPress={item.onPress}
      className={`flex-row items-center py-4 ${!isLast ? 'border-b border-gray-lighter' : ''}`}
      activeOpacity={0.6}
    >
      <View className="w-10 h-10 rounded-full bg-background items-center justify-center mr-4">
        <item.icon size={20} color={item.color} strokeWidth={2} />
      </View>
      <Text className="flex-1 font-figtree-semibold text-base text-black-main">
        {item.title}
      </Text>
      <ChevronRight size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        className="px-3"
      >
        {/* Header Title */}
        <View className="py-3 px-2">
          <Text className="font-figtree-bold text-2xl text-black-main">{t('profile.title')}</Text>
        </View>

        {/* Profile Card */}
        <View className="flex-row items-center p-5 bg-white rounded-3xl mb-3 shadow-sm shadow-black/5 border border-gray-lighter">
          <View className="w-16 h-16 rounded-full bg-background overflow-hidden border-2 border-primary/20 p-0.5">
            <Image 
              source={{ uri: getImageUrl(user?.avatar || user?.profilePicture) }}
              className="w-full h-full rounded-full"
            />
          </View>
          <View className="ml-4 flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="font-figtree-bold text-xl text-black-main mr-1" numberOfLines={1}>
                {user?.name || 'مالكة الصالون'}
              </Text>
              <BadgeCheck size={18} color="#B59451" fill="#FFF" />
            </View>
            <Text className="font-figtree-medium text-gray-medium text-xs" numberOfLines={1}>
              {user?.email || 'owner@salonapp.com'}
            </Text>
            <View className="mt-2 bg-primary/10 self-start px-2 py-1 rounded-md">
              <Text className="font-figtree-bold text-primary text-[10px] uppercase tracking-wider">
                {t('profile.roleOwner')}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('OwnerEditProfile')}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 shadow-sm shadow-black/5"
          >
            <Edit3 size={18} color="#B59451" />
          </TouchableOpacity>
        </View>

        {/* Sections */}
        {sections.map((section, idx) => (
          <View key={idx} className="mb-3">
            <Text className="font-figtree-bold text-xs text-gray-medium uppercase tracking-widest mb-3 px-2">
              {section.title}
            </Text>
            <View className="bg-white rounded-3xl px-4 py-1 shadow-sm shadow-black/5 border border-gray-lighter">
              {section.items.map((item, index) => (
                <MenuItem 
                  key={item.id} 
                  item={item} 
                  isLast={index === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={() => setShowLogoutModal(true)}
          className="flex-row items-center justify-center mt-2 bg-white py-4 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5"
        >
          <LogOut size={20} color="#F43F5E" strokeWidth={2} className="mr-2" />
          <Text className="font-figtree-bold text-base text-rose-500">
            {t('profile.signOut')}
          </Text>
        </TouchableOpacity>

        {/* Confirmation Modal */}
        <ConfirmationModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          title={t('profile.signOut')}
          message={t('profile.signOutConfirmOwner')}
          confirmText={t('profile.signOut')}
          type="danger"
        />
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
