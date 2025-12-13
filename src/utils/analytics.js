/**
 * Analytics and Error Reporting Configuration
 * Integrates Firebase Analytics and Crashlytics
 */

import React from 'react';
import { getAnalytics, logEvent as firebaseLogEvent, setUserProperties } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { app } from '../firebase/firebaseConfig';

let analytics = null;
let performance = null;

/**
 * Initialize analytics (client-side only)
 */
export const initAnalytics = () => {
  if (typeof window !== 'undefined' && app) {
    try {
      analytics = getAnalytics(app);
      performance = getPerformance(app);
      console.log('Analytics initialized');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }
};

/**
 * Log a custom event
 * @param {string} eventName - Event name
 * @param {Object} params - Event parameters
 */
export const logEvent = (eventName, params = {}) => {
  if (analytics) {
    firebaseLogEvent(analytics, eventName, params);
  }
};

/**
 * Set user properties for analytics
 * @param {Object} properties - User properties
 */
export const setUserAnalyticsProperties = (properties) => {
  if (analytics) {
    setUserProperties(analytics, properties);
  }
};

/**
 * Track page views
 * @param {string} pageName - Page name
 * @param {string} pageTitle - Page title
 */
export const trackPageView = (pageName, pageTitle) => {
  logEvent('page_view', {
    page_name: pageName,
    page_title: pageTitle,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  });
};

/**
 * Track recipe generation
 * @param {Object} params - Recipe parameters
 */
export const trackRecipeGeneration = (params) => {
  logEvent('generate_recipe', {
    diet_type: params.dietType,
    ingredient_count: params.ingredients?.length || 0,
    has_preferences: !!params.preferences,
  });
};

/**
 * Track meal plan generation
 * @param {number} days - Number of days
 */
export const trackMealPlanGeneration = (days) => {
  logEvent('generate_meal_plan', {
    plan_days: days,
  });
};

/**
 * Track pantry actions
 * @param {string} action - Action type (add, remove, update)
 */
export const trackPantryAction = (action) => {
  logEvent('pantry_action', {
    action_type: action,
  });
};

/**
 * Track recipe saves
 */
export const trackRecipeSave = () => {
  logEvent('save_recipe');
};

/**
 * Track subscription events
 * @param {string} event - Event type (upgrade_click, subscription_complete)
 * @param {string} plan - Plan type
 */
export const trackSubscription = (event, plan) => {
  logEvent(event, {
    plan_type: plan,
  });
};

/**
 * Track search queries
 * @param {string} query - Search query
 * @param {number} resultCount - Number of results
 */
export const trackSearch = (query, resultCount) => {
  logEvent('search', {
    search_term: query,
    result_count: resultCount,
  });
};

/**
 * Track errors
 * @param {Error} error - Error object
 * @param {string} context - Error context
 */
export const trackError = (error, context) => {
  logEvent('error', {
    error_message: error.message,
    error_stack: error.stack?.substring(0, 200),
    error_context: context,
  });
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Tracked error:', error, 'Context:', context);
  }
};

/**
 * Track user engagement
 * @param {number} duration - Session duration in seconds
 */
export const trackEngagement = (duration) => {
  logEvent('user_engagement', {
    engagement_time_msec: duration * 1000,
  });
};

/**
 * Track feature usage
 * @param {string} feature - Feature name
 */
export const trackFeatureUsage = (feature) => {
  logEvent('feature_use', {
    feature_name: feature,
  });
};

/**
 * Custom error boundary for React
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    trackError(error, 'ErrorBoundary');
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Oops! Something went wrong.</h2>
          <p>We've been notified and are working on a fix.</p>
          <button onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const analyticsUtils = {
  initAnalytics,
  logEvent,
  setUserAnalyticsProperties,
  trackPageView,
  trackRecipeGeneration,
  trackMealPlanGeneration,
  trackPantryAction,
  trackRecipeSave,
  trackSubscription,
  trackSearch,
  trackError,
  trackEngagement,
  trackFeatureUsage,
  ErrorBoundary,
};

export default analyticsUtils;
