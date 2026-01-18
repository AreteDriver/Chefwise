/**
 * Authentication Middleware for Next.js API Routes
 *
 * Verifies Firebase ID tokens and attaches user info to the request.
 * Use this to protect API routes that require authentication.
 *
 * Usage:
 *   import { withAuth } from '@/middleware/withAuth';
 *
 *   async function handler(req, res) {
 *     // req.user contains { uid, email, ... }
 *     const userId = req.user.uid;
 *     ...
 *   }
 *
 *   export default withAuth(handler);
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // In production, use service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      // For development, use application default credentials
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Higher-order function that wraps an API handler with authentication
 *
 * @param {Function} handler - The API route handler function
 * @param {Object} options - Configuration options
 * @param {boolean} options.optional - If true, allows unauthenticated requests (user will be null)
 * @returns {Function} Wrapped handler with authentication
 */
export function withAuth(handler, options = {}) {
  const { optional = false } = options;

  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = extractToken(authHeader);

      if (!token) {
        if (optional) {
          req.user = null;
          return handler(req, res);
        }
        return res.status(401).json({
          error: 'Authentication required',
          code: 'auth/missing-token',
        });
      }

      // Verify the token with Firebase Admin
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user info to request
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          name: decodedToken.name,
          picture: decodedToken.picture,
        };

        return handler(req, res);
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError.code);

        if (optional) {
          req.user = null;
          return handler(req, res);
        }

        // Map Firebase error codes to user-friendly messages
        const errorMessages = {
          'auth/id-token-expired': 'Session expired. Please sign in again.',
          'auth/id-token-revoked': 'Session revoked. Please sign in again.',
          'auth/invalid-id-token': 'Invalid authentication token.',
          'auth/argument-error': 'Invalid authentication token format.',
        };

        const message = errorMessages[verifyError.code] || 'Authentication failed';

        return res.status(401).json({
          error: message,
          code: verifyError.code || 'auth/verification-failed',
        });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal authentication error',
        code: 'auth/internal-error',
      });
    }
  };
}

/**
 * Check if user has a specific plan tier
 * Use after withAuth to verify subscription status
 *
 * @param {string} requiredTier - Required plan tier ('free' or 'premium')
 * @returns {Function} Middleware function
 */
export function requirePlan(requiredTier) {
  return (handler) => {
    return withAuth(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'auth/missing-token',
        });
      }

      try {
        // Get user's plan from Firestore
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(req.user.uid)
          .get();

        const userData = userDoc.exists ? userDoc.data() : {};
        const planTier = userData.planTier || 'free';

        // Allow if user has required tier or higher
        const tierOrder = { free: 0, premium: 1 };
        if (tierOrder[planTier] < tierOrder[requiredTier]) {
          return res.status(403).json({
            error: `This feature requires a ${requiredTier} plan`,
            code: 'subscription/insufficient-tier',
            currentTier: planTier,
            requiredTier,
          });
        }

        req.user.planTier = planTier;
        return handler(req, res);
      } catch (error) {
        console.error('Plan check error:', error);
        return res.status(500).json({
          error: 'Failed to verify subscription',
          code: 'subscription/check-failed',
        });
      }
    });
  };
}

export default withAuth;
