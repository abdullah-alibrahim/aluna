import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Ticket {
  _id: string;
  userId: { _id: string; name: string; email: string };
  shopId?: { _id: string; name: string };
  subject: string;
  reason: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: string;
}

export interface TicketMessage {
  _id: string;
  ticketId: string;
  senderId: { _id: string; name: string; avatar?: string };
  isAdmin: boolean;
  text: string;
  read: boolean;
  createdAt: string;
}

interface TicketState {
  tickets: Ticket[];
  messages: TicketMessage[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
  actionLoading: boolean;
}

const initialState: TicketState = {
  tickets: [],
  messages: [],
  loading: false,
  messagesLoading: false,
  error: null,
  actionLoading: false,
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/users/tickets');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب التذاكر');
    }
  }
);

export const fetchTicketMessages = createAsyncThunk(
  'tickets/fetchMessages',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/users/tickets/${ticketId}/messages`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الرسائل');
    }
  }
);

export const sendTicketMessage = createAsyncThunk(
  'tickets/sendMessage',
  async ({ ticketId, text }: { ticketId: string; text: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/users/tickets/${ticketId}/messages`, { text });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إرسال الرسالة');
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData: { subject: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/users/tickets', ticketData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إنشاء التذكرة');
    }
  }
);

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    addMessageRealTime: (state, action) => {
      // Append if it doesn't already exist
      if (!state.messages.find(m => m._id === action.payload._id)) {
        state.messages.push(action.payload);
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Messages
      .addCase(fetchTicketMessages.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(fetchTicketMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchTicketMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload as string;
      })
      // Send Message
      .addCase(sendTicketMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      // Create Ticket
      .addCase(createTicket.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addMessageRealTime, clearMessages } = ticketSlice.actions;
export default ticketSlice.reducer;
