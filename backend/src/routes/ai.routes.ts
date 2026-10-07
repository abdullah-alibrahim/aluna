import express from 'express';
import { chatWithAI, analyzeLook } from '../controllers/ai.controller';
import { protect } from '../middlewares/auth';

const router = express.Router();

// Both routes are protected so only logged-in users can use the AI
router.post('/chat', protect, chatWithAI);
router.post('/analyze-image', protect, analyzeLook);

export default router;
