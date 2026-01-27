import OpenAI from 'openai';
import { withAuth } from '@/middleware/withAuth';

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

export async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const message = completion.choices[0].message.content;

    return res.status(200).json({ message });
  } catch (error) {
    console.error('OpenAI Error:', error);
    return res.status(500).json({ error: 'Failed to get response' });
  }
}

export default withAuth(handler);
