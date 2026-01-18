// Mock the auth middleware to bypass authentication in tests
jest.mock('@/middleware/withAuth', () => ({
  withAuth: (handler) => handler,
}));

import handler from '@/pages/api/generate-recipe';

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

describe('generate-recipe API', () => {
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
    it('returns 400 when ingredients is missing', async () => {
      req.body = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Ingredients are required' });
    });

    it('returns 400 when ingredients is empty string', async () => {
      req.body = { ingredients: '' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when ingredients is null', async () => {
      req.body = { ingredients: null };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Successful recipe generation', () => {
    const mockRecipe = {
      title: 'Garlic Pasta',
      ingredients: ['pasta', 'garlic', 'olive oil'],
      instructions: ['Boil pasta', 'Saute garlic', 'Combine'],
      cookTime: '20 minutes',
    };

    it('returns generated recipe', async () => {
      req.body = { ingredients: 'pasta, garlic, olive oil' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockRecipe),
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ recipe: mockRecipe });
    });

    it('calls OpenAI with correct model', async () => {
      req.body = { ingredients: 'chicken, rice' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockRecipe),
            },
          },
        ],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
        })
      );
    });

    it('includes ingredients in user message', async () => {
      req.body = { ingredients: 'tomatoes, basil, mozzarella' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockRecipe),
            },
          },
        ],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('tomatoes, basil, mozzarella'),
            }),
          ]),
        })
      );
    });

    it('includes system prompt for chef behavior', async () => {
      req.body = { ingredients: 'eggs, cheese' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockRecipe),
            },
          },
        ],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('professional chef'),
            }),
          ]),
        })
      );
    });
  });

  describe('Response parsing', () => {
    it('handles JSON wrapped in markdown code blocks', async () => {
      const mockRecipe = {
        title: 'Test Recipe',
        ingredients: ['test'],
        instructions: ['test'],
        cookTime: '10 min',
      };

      req.body = { ingredients: 'test' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '```json\n' + JSON.stringify(mockRecipe) + '\n```',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ recipe: mockRecipe });
    });

    it('handles JSON with plain code blocks', async () => {
      const mockRecipe = {
        title: 'Test Recipe',
        ingredients: ['test'],
        instructions: ['test'],
        cookTime: '10 min',
      };

      req.body = { ingredients: 'test' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '```\n' + JSON.stringify(mockRecipe) + '\n```',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ recipe: mockRecipe });
    });

    it('handles response with extra whitespace', async () => {
      const mockRecipe = {
        title: 'Test Recipe',
        ingredients: ['test'],
        instructions: ['test'],
        cookTime: '10 min',
      };

      req.body = { ingredients: 'test' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '  \n' + JSON.stringify(mockRecipe) + '  \n',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ recipe: mockRecipe });
    });
  });

  describe('Error handling', () => {
    it('returns 500 when OpenAI fails', async () => {
      req.body = { ingredients: 'test' };

      mocks.create.mockRejectedValue(new Error('OpenAI API error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to generate recipe' });
    });

    it('returns 500 when response is invalid JSON', async () => {
      req.body = { ingredients: 'test' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to generate recipe' });
    });

    it('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      req.body = { ingredients: 'test' };

      const error = new Error('Test error');
      mocks.create.mockRejectedValue(error);

      await handler(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('OpenAI Error:', error);
      consoleSpy.mockRestore();
    });
  });
});
