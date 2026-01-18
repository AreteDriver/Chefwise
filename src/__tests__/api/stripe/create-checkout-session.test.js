import handler from '@/pages/api/stripe/create-checkout-session';

// Mock object to avoid Jest hoisting issues
const mocks = {
  customersList: jest.fn(),
  customersCreate: jest.fn(),
  checkoutSessionsCreate: jest.fn(),
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      list: (...args) => mocks.customersList(...args),
      create: (...args) => mocks.customersCreate(...args),
    },
    checkout: {
      sessions: {
        create: (...args) => mocks.checkoutSessionsCreate(...args),
      },
    },
  }));
});

describe('create-checkout-session API', () => {
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
    it('returns 400 when userId is missing', async () => {
      req.body = { userEmail: 'test@example.com' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('returns 400 when userEmail is missing', async () => {
      req.body = { userId: 'user123' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('returns 400 when both are missing', async () => {
      req.body = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Customer lookup', () => {
    it('searches for existing customer by email', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.customersList.mockResolvedValue({
        data: [{ id: 'cus_existing' }],
      });

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.customersList).toHaveBeenCalledWith({
        email: 'test@example.com',
        limit: 1,
      });
    });

    it('uses existing customer when found', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.customersList.mockResolvedValue({
        data: [{ id: 'cus_existing' }],
      });

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.customersCreate).not.toHaveBeenCalled();
      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing',
        })
      );
    });

    it('creates new customer when none exists', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.customersList.mockResolvedValue({
        data: [],
      });

      mocks.customersCreate.mockResolvedValue({
        id: 'cus_new',
      });

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.customersCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          firebaseUID: 'user123',
        },
      });
    });

    it('uses newly created customer for checkout', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.customersList.mockResolvedValue({
        data: [],
      });

      mocks.customersCreate.mockResolvedValue({
        id: 'cus_new',
      });

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_new',
        })
      );
    });
  });

  describe('Checkout session creation', () => {
    beforeEach(() => {
      mocks.customersList.mockResolvedValue({
        data: [{ id: 'cus_test' }],
      });
    });

    it('returns session ID and URL', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/session123',
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        sessionId: 'cs_test123',
        url: 'https://checkout.stripe.com/session123',
      });
    });

    it('creates subscription mode session', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
        })
      );
    });

    it('enables card payment method', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
        })
      );
    });

    it('uses provided priceId', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
        priceId: 'price_custom',
      };

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_custom',
              quantity: 1,
            },
          ],
        })
      );
    });

    it('includes firebase UID in metadata', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            firebaseUID: 'user123',
          },
        })
      );
    });

    it('sets success URL with session ID placeholder', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining('{CHECKOUT_SESSION_ID}'),
        })
      );
    });

    it('sets cancel URL', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await handler(req, res);

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          cancel_url: expect.stringContaining('canceled=true'),
        })
      );
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mocks.customersList.mockResolvedValue({
        data: [{ id: 'cus_test' }],
      });
    });

    it('returns 500 when customer lookup fails', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.customersList.mockRejectedValue(new Error('Stripe error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when checkout session creation fails', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.checkoutSessionsCreate.mockRejectedValue(new Error('Stripe error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns error message in response', async () => {
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      mocks.checkoutSessionsCreate.mockRejectedValue(new Error('Invalid price ID'));

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid price ID' });
    });

    it('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      req.body = {
        userId: 'user123',
        userEmail: 'test@example.com',
      };

      const error = new Error('Test error');
      mocks.checkoutSessionsCreate.mockRejectedValue(error);

      await handler(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error creating checkout session:', error);
      consoleSpy.mockRestore();
    });
  });
});
