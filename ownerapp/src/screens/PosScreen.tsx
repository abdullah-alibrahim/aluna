import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import apiClient from '@/api/client';
import { formatMoney } from '@/utils/helper';

type Line = { name: string; unitPrice: string; quantity: string };

export default function PosScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const shop = route.params?.shop;

  const [tab, setTab] = useState<'pos' | 'expenses'>('pos');
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [lines, setLines] = useState<Line[]>([{ name: '', unitPrice: '', quantity: '1' }]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [discount, setDiscount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [s, inv, exp] = await Promise.all([
        apiClient.get(`/owner/shops/${shop._id}/pos/summary`),
        apiClient.get(`/owner/shops/${shop._id}/invoices`),
        apiClient.get(`/owner/shops/${shop._id}/expenses`),
      ]);
      setSummary(s.data);
      setInvoices(inv.data);
      setExpenses(exp.data);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل تحميل نقطة البيع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [shop?._id]);

  const createInvoice = async () => {
    const items = lines
      .map((l) => ({
        type: 'custom' as const,
        name: l.name.trim(),
        quantity: Math.max(1, Number(l.quantity) || 1),
        unitPrice: Number(l.unitPrice),
      }))
      .filter((l) => l.name && Number.isFinite(l.unitPrice));

    if (!items.length) {
      Alert.alert('تنبيه', 'أضيفي بنداً واحداً على الأقل');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/owner/shops/${shop._id}/invoices`, {
        customerName: customerName.trim() || undefined,
        items,
        paymentMethod,
        discountAmount: Number(discount) || 0,
      });
      setLines([{ name: '', unitPrice: '', quantity: '1' }]);
      setCustomerName('');
      setDiscount('');
      await load();
      Alert.alert('تم', 'صدرت الفاتورة');
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل إنشاء الفاتورة');
    } finally {
      setSaving(false);
    }
  };

  const createExpense = async () => {
    const amount = Number(expAmount);
    if (!expCategory.trim() || !Number.isFinite(amount)) {
      Alert.alert('تنبيه', 'التصنيف والمبلغ مطلوبان');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/owner/shops/${shop._id}/expenses`, {
        category: expCategory.trim(),
        amount,
      });
      setExpCategory('');
      setExpAmount('');
      await load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل تسجيل المصروف');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-3 py-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white border border-gray-lighter items-center justify-center">
          <ArrowLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-lg text-black-main">نقطة البيع</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <ActivityIndicator color="#B59451" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          <View className="flex-row gap-2 mb-3">
            <View className="flex-1 bg-white rounded-2xl border border-gray-lighter p-3">
              <Text className="text-gray-medium text-xs mb-1">مبيعات اليوم</Text>
              <Text className="font-figtree-bold text-lg text-primary">{formatMoney(summary?.sales)}</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-gray-lighter p-3">
              <Text className="text-gray-medium text-xs mb-1">مصاريف اليوم</Text>
              <Text className="font-figtree-bold text-lg text-error">{formatMoney(summary?.expenses)}</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-gray-lighter p-3">
              <Text className="text-gray-medium text-xs mb-1">الصافي</Text>
              <Text className="font-figtree-bold text-lg text-black-main">{formatMoney(summary?.net)}</Text>
            </View>
          </View>

          <View className="flex-row mb-3 bg-white rounded-full p-1 border border-gray-lighter">
            {(['pos', 'expenses'] as const).map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => setTab(key)}
                className={`flex-1 py-2 rounded-full items-center ${tab === key ? 'bg-primary' : ''}`}
              >
                <Text className={`font-figtree-bold text-sm ${tab === key ? 'text-white' : 'text-gray-medium'}`}>
                  {key === 'pos' ? 'فاتورة' : 'مصاريف'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'pos' ? (
            <>
              <View className="bg-white rounded-3xl border border-gray-lighter p-4 mb-3">
                <TextInput value={customerName} onChangeText={setCustomerName} placeholder="اسم الزبون (اختياري)" textAlign="right" className="border border-gray-lighter rounded-xl px-3 py-2 mb-3" />
                {lines.map((line, idx) => (
                  <View key={idx} className="mb-2 border border-gray-lighter rounded-xl p-2">
                    <TextInput
                      value={line.name}
                      onChangeText={(v) => {
                        const next = [...lines];
                        next[idx] = { ...next[idx], name: v };
                        setLines(next);
                      }}
                      placeholder="اسم البند"
                      textAlign="right"
                      className="px-2 py-1 mb-1"
                    />
                    <View className="flex-row gap-2">
                      <TextInput
                        value={line.quantity}
                        onChangeText={(v) => {
                          const next = [...lines];
                          next[idx] = { ...next[idx], quantity: v };
                          setLines(next);
                        }}
                        placeholder="الكمية"
                        keyboardType="numeric"
                        textAlign="right"
                        className="flex-1 border border-gray-lighter rounded-lg px-2 py-1"
                      />
                      <TextInput
                        value={line.unitPrice}
                        onChangeText={(v) => {
                          const next = [...lines];
                          next[idx] = { ...next[idx], unitPrice: v };
                          setLines(next);
                        }}
                        placeholder="السعر"
                        keyboardType="numeric"
                        textAlign="right"
                        className="flex-1 border border-gray-lighter rounded-lg px-2 py-1"
                      />
                      {lines.length > 1 && (
                        <TouchableOpacity
                          onPress={() => setLines(lines.filter((_, i) => i !== idx))}
                          className="w-10 items-center justify-center"
                        >
                          <Trash2 size={16} color="#E11D48" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setLines([...lines, { name: '', unitPrice: '', quantity: '1' }])}
                  className="flex-row items-center justify-center gap-1 py-2 mb-3"
                >
                  <Plus size={16} color="#B59451" />
                  <Text className="text-primary font-figtree-bold text-sm">بند إضافي</Text>
                </TouchableOpacity>
                <TextInput value={discount} onChangeText={setDiscount} placeholder="خصم (اختياري)" keyboardType="numeric" textAlign="right" className="border border-gray-lighter rounded-xl px-3 py-2 mb-3" />
                <View className="flex-row gap-2 mb-3">
                  {(['cash', 'card'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 rounded-full items-center border ${paymentMethod === m ? 'bg-primary border-primary' : 'border-gray-lighter'}`}
                    >
                      <Text className={`font-figtree-bold text-sm ${paymentMethod === m ? 'text-white' : 'text-black-main'}`}>
                        {m === 'cash' ? 'نقدي' : 'بطاقة'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={createInvoice} disabled={saving} className="bg-primary py-3 rounded-full items-center">
                  {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-figtree-bold">إصدار الفاتورة</Text>}
                </TouchableOpacity>
              </View>
              <Text className="font-figtree-bold text-base mb-2">آخر الفواتير</Text>
              {invoices.slice(0, 20).map((inv) => (
                <View key={inv._id} className="bg-white rounded-2xl border border-gray-lighter p-3 mb-2 flex-row justify-between">
                  <View>
                    <Text className="font-figtree-bold text-sm">{inv.invoiceNumber}</Text>
                    <Text className="text-xs text-gray-medium">{inv.customerName || 'زبون نقدي'} · {inv.items?.length || 0} بنود</Text>
                  </View>
                  <Text className="font-figtree-bold text-primary">{formatMoney(inv.total)}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <View className="bg-white rounded-3xl border border-gray-lighter p-4 mb-3">
                <TextInput value={expCategory} onChangeText={setExpCategory} placeholder="تصنيف (إيجار، مواد...)" textAlign="right" className="border border-gray-lighter rounded-xl px-3 py-2 mb-2" />
                <TextInput value={expAmount} onChangeText={setExpAmount} placeholder="المبلغ" keyboardType="numeric" textAlign="right" className="border border-gray-lighter rounded-xl px-3 py-2 mb-3" />
                <TouchableOpacity onPress={createExpense} disabled={saving} className="bg-black-main py-3 rounded-full items-center">
                  {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-figtree-bold">تسجيل مصروف</Text>}
                </TouchableOpacity>
              </View>
              {expenses.slice(0, 30).map((e) => (
                <View key={e._id} className="bg-white rounded-2xl border border-gray-lighter p-3 mb-2 flex-row justify-between">
                  <Text className="font-figtree-bold text-sm">{e.category}</Text>
                  <Text className="font-figtree-bold text-error">{formatMoney(e.amount)}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
