// Mock the auth middleware to bypass authentication in tests
jest.mock('@/middleware/withAuth', () => ({
  withAuth: (handler) => handler,
}));

import { handler } from '@/app/api/chat-recipe/handler';

// Mock object to avoid Jest hoisting issues
const mocks = {
  create: jest.fn(),
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args) => mocks.create(...args),
      },
    },
  }));
});

describe('chat-recipe API', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      method: 'POST',
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('Method validation', () => {
    it('returns 405 for GET requests', async () => {
      req.method = 'GET';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 405 for PUT requests', async () => {
      req.method = 'PUT';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 405 for DELETE requests', async () => {
      req.method = 'DELETE';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('Input validation', () => {
    it('returns 400 when messages is missing', async () => {
      req.body = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Messages are required' });
    });

    it('returns 400 when messages is not an array', async () => {
      req.body = { messages: 'not an array' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Messages are required' });
    });

    it('returns 400 when messages is null', async () => {
      req.body = { messages: null };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when messages is an object', async () => {
      req.body = { messages: { role: 'user', content: 'test' } };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Successful chat response', () => {
    it('returns AI response message', async () => {
      req.body = {
        messages: [{ role: 'user', content: 'What can I make with chicken?' }],
      };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Here are some great chicken recipes!',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Here are some great chicken recipes!',
      });
    });

    it('calls OpenAI with correct model', async () => {
      req.body = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      mocks.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
        })
      );
    });

    it('includes user messages in request', async () => {
      const userMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'Recipe please' },
      ];

      req.body = { messages: userMessages };

      mocks.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            ...userMessages,
          ]),
        })
      );
    });

    it('includes ChefWise system prompt', async () => {
      req.body = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      mocks.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('ChefWise'),
            }),
          ]),
        })
      );
    });

    it('system prompt includes cooking assistant personality', async () => {
      req.body = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      mocks.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('cooking assistant'),
            }),
          ]),
        })
      );
    });

    it('sets max_tokens to 500', async () => {
      req.body = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      mocks.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 500,
        })
      );
    });

    it('uses temperature 0.8', async () => {
      req.body = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      mocks.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
        })
      );
    });
  });

  describe('Conversation handling', () => {
    it('handles empty messages array', async () => {
      req.body = { messages: [] };

      mocks.create.mockResolvedValue({
        choices: [{ message: { content: 'Hello!' } }],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles long conversation history', async () => {
      const longHistory = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      req.body = { messages: longHistory };

      mocks.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mocks.create).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('returns 500 when OpenAI fails', async () => {
      req.body = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      mocks.create.mockRejectedValue(new Error('OpenAI API error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get response' });
    });

    it('returns 500 on rate limit error', async () => {
      req.body = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      mocks.create.mockRejectedValue(new Error('Rate limit exceeded'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      req.body = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      const error = new Error('Test error');
      mocks.create.mockRejectedValue(error);

      await handler(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('OpenAI Error:', error);
      consoleSpy.mockRestore();
    });
  });
});
