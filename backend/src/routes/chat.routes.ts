import express from 'express';
import {
  startOrGetConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from '../controllers/chat.controller';
import { protect } from '../middlewares/auth';
import { catchAsync } from '../utils/catchAsync';
import { upload } from '../middlewares/upload';

const router = express.Router();

// Apply auth middleware to all chat routes
router.use(protect);

router.post('/start/:shopId', catchAsync(startOrGetConversation));
router.get('/', catchAsync(getMyConversations));

router.route('/:conversationId/messages')
  .get(catchAsync(getMessages))
  .post(upload.single('image'), catchAsync(sendMessage));

router.patch('/:conversationId/read', catchAsync(markAsRead));

export default router;
