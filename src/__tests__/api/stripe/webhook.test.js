/**
 * Stripe Webhook Handler Tests
 */

// Store mock functions in a shared object to avoid hoisting issues
const mocks = {
  update: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  constructEvent: jest.fn(),
  customersRetrieve: jest.fn(),
};

// Mock Stripe - use function to access mocks object
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: (...args) => mocks.constructEvent(...args),
    },
    customers: {
      retrieve: (...args) => mocks.customersRetrieve(...args),
    },
  }));
});

// Mock micro buffer
jest.mock('micro', () => ({
  buffer: jest.fn().mockResolvedValue(Buffer.from('test-body')),
}));

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (...args) => mocks.collection(...args),
      })),
      {
        FieldValue: {
          serverTimestamp: jest.fn(() => 'server-timestamp'),
        },
      }
    ),
  };
});

// Import handler after mocks are set up
import handler, { config } from '@/pages/api/stripe/webhook';

describe('Stripe Webhook Handler', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mocks.collection.mockReturnValue({ doc: mocks.doc });
    mocks.doc.mockReturnValue({ update: mocks.update });
    mocks.update.mockResolvedValue();

    mockReq = {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('config', () => {
    it('should disable body parser', () => {
      expect(config.api.bodyParser).toBe(false);
    });
  });

  describe('HTTP method validation', () => {
    it('should reject non-POST requests', async () => {
      mockReq.method = 'GET';

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should accept POST requests', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'test.event',
        data: { object: {} },
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).not.toHaveBeenCalledWith(405);
    });
  });

  describe('signature verification', () => {
    it('should return 400 on invalid signature', async () => {
      mocks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith('Webhook Error: Invalid signature');
    });
  });

  describe('checkout.session.completed', () => {
    it('should upgrade user to premium', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { firebaseUID: 'user123' },
            customer: 'cus_123',
            subscription: 'sub_123',
          },
        },
      });

      await handler(mockReq, mockRes);

      expect(mocks.collection).toHaveBeenCalledWith('users');
      expect(mocks.doc).toHaveBeenCalledWith('user123');
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          planTier: 'premium',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          subscriptionStatus: 'active',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle missing firebaseUID in metadata', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {},
            customer: 'cus_123',
          },
        },
      });

      await handler(mockReq, mockRes);

      expect(mocks.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('customer.subscription.created', () => {
    it('should update subscription status to active', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_end: 1735689600,
          },
        },
      });

      mocks.customersRetrieve.mockResolvedValue({
        metadata: { firebaseUID: 'user123' },
      });

      await handler(mockReq, mockRes);

      expect(mocks.customersRetrieve).toHaveBeenCalledWith('cus_123');
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          planTier: 'premium',
          subscriptionStatus: 'active',
          stripeSubscriptionId: 'sub_123',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should set premium for trialing status', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'trialing',
            current_period_end: 1735689600,
          },
        },
      });

      mocks.customersRetrieve.mockResolvedValue({
        metadata: { firebaseUID: 'user123' },
      });

      await handler(mockReq, mockRes);

      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          planTier: 'premium',
          subscriptionStatus: 'trialing',
        })
      );
    });
  });

  describe('customer.subscription.updated', () => {
    it('should downgrade to free for past_due status', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'past_due',
            current_period_end: 1735689600,
          },
        },
      });

      mocks.customersRetrieve.mockResolvedValue({
        metadata: { firebaseUID: 'user123' },
      });

      await handler(mockReq, mockRes);

      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          planTier: 'free',
          subscriptionStatus: 'past_due',
        })
      );
    });

    it('should handle missing firebaseUID in customer metadata', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_123',
            status: 'active',
            current_period_end: 1735689600,
          },
        },
      });

      mocks.customersRetrieve.mockResolvedValue({
        metadata: {},
      });

      await handler(mockReq, mockRes);

      expect(mocks.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should downgrade user to free plan', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_123',
          },
        },
      });

      mocks.customersRetrieve.mockResolvedValue({
        metadata: { firebaseUID: 'user123' },
      });

      await handler(mockReq, mockRes);

      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          planTier: 'free',
          subscriptionStatus: 'canceled',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing firebaseUID', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_123',
          },
        },
      });

      mocks.customersRetrieve.mockResolvedValue({
        metadata: {},
      });

      await handler(mockReq, mockRes);

      expect(mocks.update).not.toHaveBeenCalled();
    });
  });

  describe('invoice.payment_succeeded', () => {
    it('should record successful payment', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_123',
            amount_paid: 900, // $9.00 in cents
          },
        },
      });

      mocks.customersRetrieve.mockResolvedValue({
        metadata: { firebaseUID: 'user123' },
      });

      await handler(mockReq, mockRes);

      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          lastPaymentAmount: 9,
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('invoice.payment_failed', () => {
    it('should mark payment as failed', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_123',
          },
        },
      });

      mocks.customersRetrieve.mockResolvedValue({
        metadata: { firebaseUID: 'user123' },
      });

      await handler(mockReq, mockRes);

      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentFailed: true,
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('unhandled events', () => {
    it('should return 200 for unhandled event types', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'some.unknown.event',
        data: { object: {} },
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('error handling', () => {
    it('should return 500 on handler error', async () => {
      mocks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { firebaseUID: 'user123' },
            customer: 'cus_123',
          },
        },
      });

      mocks.update.mockRejectedValueOnce(new Error('Firebase error'));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Webhook handler failed' });
    });
  });
});
