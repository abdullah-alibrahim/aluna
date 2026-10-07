import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { User, CheckCircle2 } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { t } from '@/i18n';

interface Staff {
  _id: string;
  name: string;
  role?: string;
  avatar?: string;
  branchId?: string;
}

interface Branch {
  _id: string;
  name: string;
  address?: string;
  isMain?: boolean;
}

interface Companion {
  guestName: string;
  staffId: string;
}

interface StaffDateStepProps {
  staffList: Staff[];
  selectedStaffId: string;
  setSelectedStaffId: (id: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  colors: any;
  branches?: Branch[];
  selectedBranchId?: string;
  setSelectedBranchId?: (id: string) => void;
  isGroupBooking?: boolean;
  setIsGroupBooking?: (v: boolean) => void;
  companions?: Companion[];
  setCompanions?: (v: Companion[]) => void;
}

export default function StaffDateStep({
  staffList,
  selectedStaffId,
  setSelectedStaffId,
  selectedDate,
  setSelectedDate,
  colors,
  branches = [],
  selectedBranchId,
  setSelectedBranchId,
  isGroupBooking = false,
  setIsGroupBooking,
  companions = [],
  setCompanions,
}: StaffDateStepProps) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
      {branches.length > 1 && setSelectedBranchId && (
        <View className="px-3 mb-3 mt-3">
          <Text className="font-figtree-bold text-xl text-black-main mb-3">الفرع</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {branches.map((b) => {
              const active = selectedBranchId === b._id;
              return (
                <TouchableOpacity
                  key={b._id}
                  onPress={() => setSelectedBranchId(b._id)}
                  className={`mr-2 px-4 py-2 rounded-full border ${active ? 'bg-primary border-primary' : 'bg-white border-gray-lighter'}`}
                >
                  <Text className={`font-figtree-bold text-sm ${active ? 'text-white' : 'text-black-main'}`}>
                    {b.name}{b.isMain ? ' · رئيسي' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {setIsGroupBooking && (
        <View className="px-3 mb-3 mt-1">
          <TouchableOpacity
            onPress={() => setIsGroupBooking(!isGroupBooking)}
            className={`flex-row items-center justify-between px-4 py-3 rounded-2xl border ${isGroupBooking ? 'border-primary bg-primary/5' : 'border-gray-lighter bg-white'}`}
          >
            <View>
              <Text className="font-figtree-bold text-base text-black-main">حجز جماعي</Text>
              <Text className="font-figtree-medium text-xs text-gray-medium">أضيفي أشخاصاً معكِ في نفس الموعد</Text>
            </View>
            <View className={`w-6 h-6 rounded-full border items-center justify-center ${isGroupBooking ? 'bg-primary border-primary' : 'border-gray-medium'}`}>
              {isGroupBooking ? <CheckCircle2 size={16} color="#FFF" /> : null}
            </View>
          </TouchableOpacity>

          {isGroupBooking && setCompanions && (
            <View className="mt-3">
              {companions.map((c, idx) => (
                <View key={idx} className="bg-white border border-gray-lighter rounded-2xl p-3 mb-2">
                  <Text className="font-figtree-bold text-sm mb-2">مرافق {idx + 1}</Text>
                  <TextInput
                    value={c.guestName}
                    onChangeText={(v) => {
                      const next = [...companions];
                      next[idx] = { ...next[idx], guestName: v };
                      setCompanions(next);
                    }}
                    placeholder="اسم المرافق"
                    textAlign="right"
                    className="border border-gray-lighter rounded-xl px-3 py-2 mb-2 font-figtree-medium"
                  />
                  <ScrollView horizontal className="mb-2">
                    {staffList.filter((s) => s._id !== 'any').map((s) => (
                      <TouchableOpacity
                        key={s._id}
                        onPress={() => {
                          const next = [...companions];
                          next[idx] = { ...next[idx], staffId: s._id };
                          setCompanions(next);
                        }}
                        className={`mr-2 px-3 py-1.5 rounded-full border ${c.staffId === s._id ? 'bg-primary border-primary' : 'border-gray-lighter'}`}
                      >
                        <Text className={`text-xs font-figtree-bold ${c.staffId === s._id ? 'text-white' : 'text-black-main'}`}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={() => setCompanions(companions.filter((_, i) => i !== idx))}
                    className="self-start"
                  >
                    <Text className="text-error text-xs font-figtree-bold">حذف</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {companions.length < 4 && (
                <TouchableOpacity
                  onPress={() =>
                    setCompanions([
                      ...companions,
                      { guestName: `مرافق ${companions.length + 1}`, staffId: staffList.find((s) => s._id !== selectedStaffId)?._id || staffList[0]?._id || '' },
                    ])
                  }
                  className="bg-primary/10 py-3 rounded-full items-center"
                >
                  <Text className="text-primary font-figtree-bold text-sm">+ إضافة مرافق</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      <View className="px-3 mb-3 mt-3">
        <Text className="font-figtree-bold text-xl text-black-main mb-3">{t('booking.selectExperts')}</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible" contentContainerStyle={{ paddingRight: 16 }}>
          <TouchableOpacity 
            onPress={() => setSelectedStaffId('any')}
            className={`items-center mr-3 p-3 rounded-2xl w-28 relative ${selectedStaffId === 'any' ? 'border border-primary bg-primary/5' : 'bg-white border border-transparent'}`}
          >
            <View className="w-[60px] h-[60px] rounded-full bg-gray-50 items-center justify-center mb-2">
              <User size={26} color={colors.gray.light} strokeWidth={1.5} />
            </View>
            <Text className="font-figtree-bold text-[13px] text-black-main text-center mb-0.5">{t('booking.anyone')}</Text>
            <Text className="font-figtree-medium text-[10px] text-gray-light text-center">{t('booking.availableNow')}</Text>
            
            {selectedStaffId === 'any' && (
              <View className="absolute -top-1 -right-1 bg-white rounded-full">
                <CheckCircle2 size={18} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>

          {staffList.map(staff => {
            const isSelected = selectedStaffId === staff._id;
            return (
              <TouchableOpacity 
                key={staff._id}
                onPress={() => setSelectedStaffId(staff._id)}
                className={`items-center mr-3 p-3 rounded-2xl w-28 relative ${isSelected ? 'border border-primary bg-primary/5' : 'bg-white border border-transparent'}`}
              >
                <View className="w-[60px] h-[60px] rounded-full bg-gray-50 items-center justify-center mb-2 overflow-hidden">
                  {staff.avatar ? (
                    <Image source={{ uri: staff.avatar }} className="w-full h-full" />
                  ) : (
                    <User size={26} color={colors.gray.medium} strokeWidth={1.5} />
                  )}
                </View>
                <Text className="font-figtree-bold text-[13px] text-black-main text-center mb-0.5" numberOfLines={1}>{staff.name}</Text>
                <Text className="font-figtree-medium text-[10px] text-gray-light text-center" numberOfLines={1}>{staff.role || t('booking.expert')}</Text>
                
                {isSelected && (
                  <View className="absolute -top-1 -right-1 bg-white rounded-full">
                    <CheckCircle2 size={18} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View className="px-3 mb-3 mt-3">
        <Text className="font-figtree-bold text-xl text-black-main mb-4">{t('booking.dateTime')}</Text>
        <View className="bg-white rounded-3xl overflow-hidden pt-2 pb-4">
          <Calendar
            current={selectedDate.toISOString().split('T')[0]}
            minDate={new Date().toISOString().split('T')[0]}
            onDayPress={(day: any) => setSelectedDate(new Date(day.timestamp))}
            monthFormat={'MMMM yyyy'}
            firstDay={1}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: colors.gray.light,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: colors.primary,
              dayTextColor: colors['black-main'],
              textDisabledColor: colors.gray.lighter,
              arrowColor: colors.gray.medium,
              monthTextColor: colors['black-main'],
              textDayFontFamily: 'Figtree_500Medium',
              textMonthFontFamily: 'Figtree_700Bold',
              textDayHeaderFontFamily: 'Figtree_600SemiBold',
              textMonthFontSize: 16,
              textDayFontSize: 14,
              textDayHeaderFontSize: 11,
              'stylesheet.calendar.header': {
                header: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingLeft: 10,
                  paddingRight: 10,
                  marginTop: 6,
                  alignItems: 'center'
                },
                dayHeader: {
                  marginTop: 12,
                  marginBottom: 12,
                  textAlign: 'center',
                  color: colors.gray.light,
                  fontFamily: 'Figtree_600SemiBold',
                  fontSize: 11,
                  textTransform: 'uppercase'
                }
              },
              'stylesheet.day.basic': {
                base: {
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                },
                selected: {
                  backgroundColor: colors.primary,
                  borderRadius: 18,
                }
              }
            } as any}
            markedDates={{
              [selectedDate.toISOString().split('T')[0]]: { selected: true, disableTouchEvent: true }
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
