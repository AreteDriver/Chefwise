import handler from '@/pages/api/stripe/portal';

// Mock object to avoid Jest hoisting issues
const mocks = {
  billingPortalSessionsCreate: jest.fn(),
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    billingPortal: {
      sessions: {
        create: (...args) => mocks.billingPortalSessionsCreate(...args),
      },
    },
  }));
});

describe('portal API', () => {
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

    it('returns 405 for PATCH requests', async () => {
      req.method = 'PATCH';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('Input validation', () => {
    it('returns 400 when customerId is missing', async () => {
      req.body = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing customer ID' });
    });

    it('returns 400 when customerId is null', async () => {
      req.body = { customerId: null };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when customerId is empty string', async () => {
      req.body = { customerId: '' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Portal session creation', () => {
    it('returns portal URL on success', async () => {
      req.body = { customerId: 'cus_test123' };

      mocks.billingPortalSessionsCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test',
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        url: 'https://billing.stripe.com/session/test',
      });
    });

    it('calls Stripe with customer ID', async () => {
      req.body = { customerId: 'cus_abc123' };

      mocks.billingPortalSessionsCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test',
      });

      await handler(req, res);

      expect(mocks.billingPortalSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_abc123',
        })
      );
    });

    it('sets return URL to subscription page', async () => {
      req.body = { customerId: 'cus_test' };

      mocks.billingPortalSessionsCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test',
      });

      await handler(req, res);

      expect(mocks.billingPortalSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          return_url: expect.stringContaining('/subscription'),
        })
      );
    });

    it('uses default localhost URL when env not set', async () => {
      req.body = { customerId: 'cus_test' };

      mocks.billingPortalSessionsCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test',
      });

      await handler(req, res);

      expect(mocks.billingPortalSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          return_url: expect.stringContaining('localhost:3000'),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('returns 500 when Stripe fails', async () => {
      req.body = { customerId: 'cus_test' };

      mocks.billingPortalSessionsCreate.mockRejectedValue(new Error('Stripe error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns error message in response', async () => {
      req.body = { customerId: 'cus_test' };

      mocks.billingPortalSessionsCreate.mockRejectedValue(
        new Error('Customer not found')
      );

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ error: 'Customer not found' });
    });

    it('handles invalid customer ID error', async () => {
      req.body = { customerId: 'invalid_id' };

      mocks.billingPortalSessionsCreate.mockRejectedValue(
        new Error('No such customer: invalid_id')
      );

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No such customer: invalid_id',
      });
    });

    it('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      req.body = { customerId: 'cus_test' };

      const error = new Error('Test error');
      mocks.billingPortalSessionsCreate.mockRejectedValue(error);

      await handler(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error creating portal session:', error);
      consoleSpy.mockRestore();
    });
  });
});
