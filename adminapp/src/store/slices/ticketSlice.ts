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
      const response = await apiClient.get('/admin/tickets');
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
      const response = await apiClient.get(`/admin/tickets/${ticketId}/messages`);
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
      const response = await apiClient.post(`/admin/tickets/${ticketId}/messages`, { text });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إرسال الرسالة');
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'tickets/updateStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/admin/tickets/${id}`, { status });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث التذكرة');
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
      // Update Status
      .addCase(updateTicketStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.tickets.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addMessageRealTime, clearMessages } = ticketSlice.actions;
export default ticketSlice.reducer;
