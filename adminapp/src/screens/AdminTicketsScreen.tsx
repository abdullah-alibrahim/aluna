import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { 
  ArrowLeft, 
  Ticket as TicketIcon,
  Search,
  MessageCircle,
  MoreVertical,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchTickets, 
  addMessageRealTime,
  Ticket
} from '@/store/slices/ticketSlice';
import { t, ticketStatusLabel } from '@/i18n';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';
import io from 'socket.io-client';
import { API_URL } from '@/api/client';

const colors = twConfig.theme.extend.colors;

const AdminTicketsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  
  const { tickets, loading } = useAppSelector(state => state.tickets);
  const { user, token } = useAppSelector(state => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState<any>(null);

  // Initialize socket connection for Admin
  useEffect(() => {
    if (user && token) {
      const newSocket = io(API_URL.replace('/api', ''), {
        auth: { token }
      });
      
      newSocket.on('connect', () => {
        newSocket.emit('join', user._id); // Join admin room
      });

      newSocket.on('receiveTicketMessage', (message) => {
        dispatch(addMessageRealTime(message));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token, dispatch]);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-error-light text-error';
      case 'in_progress': return 'bg-warning-light text-warning';
      case 'resolved': return 'bg-success-light text-success';
      case 'closed': return 'bg-gray-200 text-gray-dark';
      default: return 'bg-gray-200 text-gray-dark';
    }
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity 
      onPress={() => {
        navigation.navigate('Chat', {
          ticketId: item._id,
          subject: item.subject,
          status: item.status,
          reason: item.reason,
          userId: item.userId
        });
      }}
      className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-4">
          <Text className="font-figtree-bold text-base text-black-main mb-1" numberOfLines={1}>{item.subject}</Text>
          <Text className="font-figtree-regular text-xs text-gray-medium mb-2" numberOfLines={2}>{item.reason}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}>
          <Text className={`font-figtree-semibold text-[10px] uppercase tracking-wider ${getStatusColor(item.status).split(' ')[1]}`}>
            {ticketStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3 mt-1">
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-full bg-primary/20 items-center justify-center mr-2">
            <Text className="font-figtree-bold text-[10px] text-primary">{item.userId?.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text className="font-figtree-medium text-xs text-black-main">{item.userId?.name || 'مستخدم'}</Text>
        </View>
        <Text className="font-figtree-regular text-[10px] text-gray-medium">
          {dayjs(item.createdAt).format('MMM D, h:mm A')}
        </Text>
      </View>
    </TouchableOpacity>
  );



  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 10 }}>
      <View className="flex-row items-center px-3 bg-background z-10 ">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
        >
          <ArrowLeft size={20} color={colors['black-main']} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-figtree-bold text-xl text-black-main">تذاكر الدعم</Text>
        </View>
      </View>

      <View className="px-3 py-2">
        <View className="flex-row items-center bg-white rounded-full border border-gray-lighter px-4 h-12 shadow-sm shadow-black/5">
          <Search size={18} color={colors.gray.light} className="mr-2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحثي بالموضوع أو المستخدم..."
            placeholderTextColor={colors.gray.light}
            className="flex-1 font-figtree-medium text-sm text-black-main"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={item => item._id}
          renderItem={renderTicketItem}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <TicketIcon size={48} color={colors.gray.light} className="mb-3" />
              <Text className="font-figtree-medium text-gray-medium text-base">لا توجد تذاكر دعم.</Text>
            </View>
          }
        />
      )}



    </View>
  );
};

export default AdminTicketsScreen;
