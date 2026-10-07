import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/client';

export interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'ai';
}

export interface VisionAnalysis {
  styleName: string;
  instructions: string;
  hairType: string;
  maintenance: string;
  products: string[];
}

interface AIState {
  chatMessages: ChatMessage[];
  isChatTyping: boolean;
  chatError: string | null;

  visionAnalysis: VisionAnalysis | null;
  isVisionAnalyzing: boolean;
  visionError: string | null;
}

const initialState: AIState = {
  chatMessages: [
    {
      id: '1',
      text: "مرحباً! أنا مستشارة الأناقة في ألونا. كيف أقدر أساعدك اليوم؟ (مثلاً: 'أي قصة تناسب الوجه المدوّر؟' أو 'كم مرة استخدم زيت الشعر؟')",
      role: 'ai'
    }
  ],
  isChatTyping: false,
  chatError: null,

  visionAnalysis: null,
  isVisionAnalyzing: false,
  visionError: null,
};

// --- Thunks ---

export const sendChatMessage = createAsyncThunk(
  'ai/sendChatMessage',
  async (messageText: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const history = state.ai.chatMessages.map((m: ChatMessage) => ({ role: m.role, text: m.text }));

      const { data } = await apiClient.post('/ai/chat', {
        message: messageText,
        history
      });

      return data.data.reply;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Sorry, I am having trouble connecting right now.'
      );
    }
  }
);

export const analyzeLook = createAsyncThunk(
  'ai/analyzeLook',
  async (base64Image: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/ai/analyze-image', {
        base64Image,
      });

      return data.data.analysis;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Sorry, I couldn't analyze this image right now."
      );
    }
  }
);

// --- Slice ---

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    addMessageToChat: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    clearVisionAnalysis: (state) => {
      state.visionAnalysis = null;
      state.visionError = null;
    }
  },
  extraReducers: (builder) => {
    // sendChatMessage
    builder.addCase(sendChatMessage.pending, (state) => {
      state.isChatTyping = true;
      state.chatError = null;
    });
    builder.addCase(sendChatMessage.fulfilled, (state, action) => {
      state.isChatTyping = false;
      state.chatMessages.push({
        id: Date.now().toString(),
        text: action.payload,
        role: 'ai',
      });
    });
    builder.addCase(sendChatMessage.rejected, (state, action) => {
      state.isChatTyping = false;
      state.chatError = action.payload as string;
      state.chatMessages.push({
        id: Date.now().toString(),
        text: action.payload as string,
        role: 'ai',
      });
    });

    // analyzeLook
    builder.addCase(analyzeLook.pending, (state) => {
      state.isVisionAnalyzing = true;
      state.visionError = null;
      state.visionAnalysis = null;
    });
    builder.addCase(analyzeLook.fulfilled, (state, action) => {
      state.isVisionAnalyzing = false;
      state.visionAnalysis = action.payload;
    });
    builder.addCase(analyzeLook.rejected, (state, action) => {
      state.isVisionAnalyzing = false;
      state.visionError = action.payload as string;
      state.visionAnalysis = {
        styleName: "خطأ في التحليل",
        instructions: action.payload as string,
        hairType: "N/A",
        maintenance: "N/A",
        products: []
      };
    });
  },
});

export const { addMessageToChat, clearVisionAnalysis } = aiSlice.actions;
export default aiSlice.reducer;
