import OpenAI from 'openai';

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// Rate limit tracking (in-memory, resets on server restart)
const rateLimits = new Map();
const FREE_TIER_LIMIT = 2;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(userId, isPremium) {
  if (isPremium) return { allowed: true };

  const now = Date.now();
  const userKey = `photo_scan_${userId}`;
  const userData = rateLimits.get(userKey);

  if (!userData || now - userData.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(userKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: FREE_TIER_LIMIT - 1 };
  }

  if (userData.count >= FREE_TIER_LIMIT) {
    return {
      allowed: false,
      message: `Free tier limit reached (${FREE_TIER_LIMIT} scans/day). Upgrade to Premium for unlimited scans.`,
    };
  }

  userData.count += 1;
  rateLimits.set(userKey, userData);
  return { allowed: true, remaining: FREE_TIER_LIMIT - userData.count };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mimeType, userId, isPremium } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  if (!mimeType || !mimeType.startsWith('image/')) {
    return res.status(400).json({ error: 'Valid image MIME type is required' });
  }

  if (userId) {
    const rateCheck = checkRateLimit(userId, isPremium);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.message,
        rateLimited: true,
      });
    }
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Identify all food items visible in this image. Return ONLY a valid JSON array with no additional text or markdown formatting.

Each item should have this structure:
{"name": "item name", "quantity": "estimated amount", "unit": "unit type", "category": "category"}

Categories must be one of: Protein, Vegetables, Fruits, Grains, Dairy, Spices, Other

Guidelines:
- Be specific with item names (e.g., "chicken breast" not just "chicken")
- Estimate quantities based on visible amounts (e.g., "2", "1 bunch", "half")
- Use appropriate units (lbs, oz, cups, pieces, bunch, etc.)
- Include all visible food items including condiments, beverages, and packaged foods
- If quantity is unclear, provide a reasonable estimate
- Return an empty array [] if no food items are visible

Example output format:
[{"name": "eggs", "quantity": "12", "unit": "pieces", "category": "Protein"}, {"name": "milk", "quantity": "1", "unit": "gallon", "category": "Dairy"}]`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    let items;
    try {
      items = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      return res.status(500).json({
        error: 'Failed to parse detected items. Please try again.',
      });
    }

    if (!Array.isArray(items)) {
      return res.status(500).json({
        error: 'Invalid response format from image analysis.',
      });
    }

    const validCategories = ['Protein', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Other'];
    const normalizedItems = items
      .filter((item) => item && typeof item.name === 'string' && item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: String(item.quantity || '1').trim(),
        unit: String(item.unit || 'pieces').trim(),
        category: validCategories.includes(item.category) ? item.category : 'Other',
      }));

    return res.status(200).json({ items: normalizedItems });
  } catch (error) {
    console.error('OpenAI Vision Error:', error);

    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ error: 'API configuration error' });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(503).json({
        error: 'Service temporarily unavailable. Please try again later.',
      });
    }

    return res.status(500).json({ error: 'Failed to analyze image. Please try again.' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
