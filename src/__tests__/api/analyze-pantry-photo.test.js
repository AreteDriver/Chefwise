import handler from '@/app/api/analyze-pantry-photo/handler';

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

describe('analyze-pantry-photo API', () => {
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
    it('returns 400 when image is missing', async () => {
      req.body = { mimeType: 'image/jpeg' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Image data is required' });
    });

    it('returns 400 when mimeType is missing', async () => {
      req.body = { image: 'base64data' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Valid image MIME type is required' });
    });

    it('returns 400 when mimeType is not an image type', async () => {
      req.body = { image: 'base64data', mimeType: 'application/pdf' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Valid image MIME type is required' });
    });
  });

  describe('Successful image analysis', () => {
    const mockItems = [
      { name: 'Eggs', quantity: '12', unit: 'pieces', category: 'Protein' },
      { name: 'Milk', quantity: '1', unit: 'gallon', category: 'Dairy' },
    ];

    it('returns detected items', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg', userId: 'user123' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockItems),
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items: mockItems });
    });

    it('calls OpenAI with gpt-4o model', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockItems),
            },
          },
        ],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
        })
      );
    });

    it('includes image in the request with correct format', async () => {
      req.body = { image: 'testbase64data', mimeType: 'image/png' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockItems),
            },
          },
        ],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image_url',
                  image_url: {
                    url: 'data:image/png;base64,testbase64data',
                  },
                }),
              ]),
            }),
          ]),
        })
      );
    });

    it('uses low temperature for consistent results', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockItems),
            },
          },
        ],
      });

      await handler(req, res);

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
        })
      );
    });
  });

  describe('Response parsing', () => {
    it('handles JSON wrapped in markdown code blocks', async () => {
      const mockItems = [{ name: 'Eggs', quantity: '12', unit: 'pieces', category: 'Protein' }];

      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '```json\n' + JSON.stringify(mockItems) + '\n```',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items: mockItems });
    });

    it('handles JSON with plain code blocks', async () => {
      const mockItems = [{ name: 'Milk', quantity: '1', unit: 'gallon', category: 'Dairy' }];

      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '```\n' + JSON.stringify(mockItems) + '\n```',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items: mockItems });
    });

    it('normalizes item categories to valid options', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                { name: 'Item', quantity: '1', unit: 'piece', category: 'InvalidCategory' },
              ]),
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        items: [{ name: 'Item', quantity: '1', unit: 'piece', category: 'Other' }],
      });
    });

    it('filters out items with empty names', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                { name: 'Valid Item', quantity: '1', unit: 'piece', category: 'Other' },
                { name: '', quantity: '1', unit: 'piece', category: 'Other' },
                { name: '   ', quantity: '1', unit: 'piece', category: 'Other' },
              ]),
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        items: [{ name: 'Valid Item', quantity: '1', unit: 'piece', category: 'Other' }],
      });
    });

    it('provides default values for missing quantity and unit', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                { name: 'Item', category: 'Protein' },
              ]),
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        items: [{ name: 'Item', quantity: '1', unit: 'pieces', category: 'Protein' }],
      });
    });

    it('returns empty array when no items detected', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '[]',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items: [] });
    });
  });

  describe('Error handling', () => {
    it('returns 500 when OpenAI fails', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockRejectedValue(new Error('OpenAI API error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to analyze image. Please try again.' });
    });

    it('returns 500 when response is invalid JSON', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

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
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to parse detected items. Please try again.' });
    });

    it('returns 500 when response is not an array', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"name": "not an array"}',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid response format from image analysis.' });
    });

    it('returns 500 for invalid_api_key error', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      const error = new Error('Invalid API key');
      error.code = 'invalid_api_key';
      mocks.create.mockRejectedValue(error);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'API configuration error' });
    });

    it('returns 503 for rate_limit_exceeded error', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      const error = new Error('Rate limit exceeded');
      error.code = 'rate_limit_exceeded';
      mocks.create.mockRejectedValue(error);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ error: 'Service temporarily unavailable. Please try again later.' });
    });

    it('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      const error = new Error('Test error');
      mocks.create.mockRejectedValue(error);

      await handler(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('OpenAI Vision Error:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('Rate limiting', () => {
    it('allows requests without userId', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg' };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '[]',
            },
          },
        ],
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('allows premium users unlimited scans', async () => {
      req.body = { image: 'base64data', mimeType: 'image/jpeg', userId: 'premium_user', isPremium: true };

      mocks.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '[]',
            },
          },
        ],
      });

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        await handler(req, res);
      }

      // All should succeed (last call)
      expect(res.status).toHaveBeenLastCalledWith(200);
    });
  });
});
