import { Request, Response } from 'express';
// import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { catchAsync } from '../utils/catchAsync';

// --- GROQ CLIENT ---
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in the backend environment.');
  }
  return new Groq({ apiKey });
};

export const chatWithAI = catchAsync(async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ status: 'error', message: 'Message is required' });
  }

  const systemInstruction = `You are a highly skilled, polite, and trendy AI beauty and style consultant for Aluna (ألونا) beauty app. 
Your goal is to provide exceptional advice on hairstyles, hair care, beard styling, skincare, and general grooming. 
You should be concise, professional, yet warm and approachable. Do NOT provide medical advice.`;

  // --- GROQ IMPLEMENTATION ---
  const ai = getGroqClient();

  const messages: any[] = [
    { role: 'system', content: systemInstruction }
  ];

  if (history && history.length > 0) {
    for (const msg of history) {
      messages.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text
      });
    }
  }

  messages.push({
    role: 'user',
    content: message
  });

  const completion = await ai.chat.completions.create({
    model: 'llama-3.1-8b-instant', // Highly optimized Groq chat model
    messages: messages,
  });

  res.status(200).json({
    status: 'success',
    data: {
      reply: completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response."
    }
  });
});

export const analyzeLook = catchAsync(async (req: Request, res: Response) => {
  const { base64Image, prompt } = req.body;

  if (!base64Image) {
    return res.status(400).json({ status: 'error', message: 'Base64 image is required' });
  }

  const defaultPrompt = `Analyze this hairstyle/grooming look. Please provide the response strictly in JSON format matching the following structure:
{
  "styleName": "The name or best description of this style",
  "instructions": "Exactly what a client should tell their stylist/barber to achieve this look",
  "hairType": "Recommended hair type for this style",
  "maintenance": "Estimated maintenance level (e.g. Low, Medium, High)",
  "products": ["Product 1", "Product 2"]
}`;

  const finalPrompt = prompt || defaultPrompt;

  const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    return res.status(400).json({ status: 'error', message: 'Invalid base64 image format. Expected data URI.' });
  }

  const mimeType = matches[1];
  const data = matches[2];

  // --- GROQ IMPLEMENTATION ---
  const ai = getGroqClient();

  const completion = await ai.chat.completions.create({
    model: 'qwen/qwen3.6-27b', // Ensure we use the correct active Groq vision model
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: finalPrompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${data}` } }
        ]
      }
    ],
    response_format: { type: 'json_object' }
  });

  let parsedAnalysis = null;
  try {
    const rawContent = completion.choices[0]?.message?.content || "{}";
    parsedAnalysis = JSON.parse(rawContent);
  } catch (error) {
    console.error("Failed to parse JSON from Vision API", error);
    // Fallback if the model ignores JSON formatting
    parsedAnalysis = {
      styleName: "Analysis Error",
      instructions: "Could not format the response properly.",
      hairType: "N/A",
      maintenance: "N/A",
      products: []
    };
  }

  res.status(200).json({
    status: 'success',
    data: {
      analysis: parsedAnalysis
    }
  });
});
