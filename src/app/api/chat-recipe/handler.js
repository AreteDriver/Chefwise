import OpenAI from 'openai';
import { withAuth } from '@/middleware/withAuth';
import { rateLimit } from '@/middleware/rateLimit';

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const SYSTEM_PROMPT = `You are ChefWise, an enthusiastic and helpful AI cooking assistant. You help people discover recipes, answer cooking questions, and provide meal suggestions.

Your personality:
- Friendly and conversational
- Ask clarifying questions to understand preferences
- Offer multiple options when appropriate
- Provide detailed recipes when requested
- Give cooking tips and substitutions

When someone asks about recipes:
1. Ask about dietary restrictions, preferences, or cooking time if not mentioned
2. Offer 2-3 options based on their needs
3. When they choose one, provide a detailed recipe with ingredients and steps
4. Be ready to modify or suggest alternatives

Keep responses concise but helpful. Use emojis occasionally to be friendly.`;

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 5000;
const OPENAI_TIMEOUT_MS = 30000;
const VALID_ROLES = ['user', 'assistant'];
const checkRateLimit = rateLimit({ windowMs: 60_000, max: 15, name: 'chat-recipe' });

export async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (checkRateLimit(req, res)) return;

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages are required and must be an array' });
  }

  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: `Messages array must contain 1-${MAX_MESSAGES} messages` });
  }

  for (const msg of messages) {
    if (!msg.role || !VALID_ROLES.includes(msg.role)) {
      return res.status(400).json({ error: 'Each message must have a valid role (user or assistant)' });
    }
    if (typeof msg.content !== 'string' || msg.content.length === 0 || msg.content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Each message content must be a string between 1 and ${MAX_MESSAGE_LENGTH} characters` });
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    let completion;
    try {
      completion = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.8,
        max_tokens: 500,
      }, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    const message = completion.choices[0].message.content;

    return res.status(200).json({ message });
  } catch (error) {
    console.error('OpenAI Error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(503).json({ error: 'Service temporarily busy. Please try again in a moment.' });
    }

    return res.status(500).json({ error: 'Failed to get response. Please try again.' });
  }
}

export default withAuth(handler);
