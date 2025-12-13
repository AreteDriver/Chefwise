# Analytics & Privacy Guide

ChefWise uses Firebase Analytics to understand how users interact with the app and improve the experience.

## What We Track

### User Interactions
- Recipe generations (diet type, ingredient count)
- Meal plan creations (number of days)
- Pantry actions (add, remove, update)
- Recipe saves and favorites
- Search queries (anonymized)
- Feature usage patterns

### Performance Metrics
- Page load times
- API response times
- Error rates
- Cache hit rates

### User Properties
- Subscription tier (free/premium)
- Dietary preferences
- Language preference
- Activity level

## What We DON'T Track

❌ **Never Tracked:**
- Personal identifying information (PII)
- Recipe content or ingredients
- Payment information
- User credentials
- Private messages or notes
- Exact location data

## Privacy Controls

### Opt-Out

You can disable analytics tracking:

1. Go to Profile → Privacy Settings
2. Toggle "Analytics" off
3. Reload the page

This will prevent all future tracking, though some essential error reporting may continue for app stability.

### Data Retention

- **Analytics Data**: 14 months
- **Error Logs**: 90 days
- **Performance Data**: 30 days

After these periods, data is automatically deleted from Firebase.

### GDPR Compliance

ChefWise is GDPR compliant:
- Data minimization (only essential data collected)
- Right to access your data
- Right to deletion
- Data portability
- Transparent privacy policy

To request your data or deletion:
1. Profile → Privacy → Download My Data
2. Or email: privacy@chefwise.app

## How We Use Analytics

### Improving Features
- Identify popular features
- Discover pain points
- Optimize user flows
- Prioritize development

### Performance Optimization
- Detect slow pages
- Identify bottlenecks
- Monitor API health
- Track cache efficiency

### Error Detection
- Catch bugs early
- Prioritize fixes
- Improve stability
- Better error messages

## Third-Party Services

ChefWise uses these analytics services:
- **Firebase Analytics**: User behavior tracking
- **Firebase Performance**: Performance monitoring
- **Firebase Crashlytics**: Error reporting (optional)

All services comply with privacy regulations (GDPR, CCPA).

## For Developers

### Adding Custom Events

```javascript
import { logEvent } from '@/utils/analytics';

// Track custom event
logEvent('custom_event_name', {
  param1: 'value1',
  param2: 'value2',
});
```

### Tracking Page Views

```javascript
import { trackPageView } from '@/utils/analytics';

// In your page component
useEffect(() => {
  trackPageView('page_name', 'Page Title');
}, []);
```

### Error Tracking

```javascript
import { trackError } from '@/utils/analytics';

try {
  // Your code
} catch (error) {
  trackError(error, 'context_description');
}
```

## Data Security

All analytics data is:
- Encrypted in transit (HTTPS)
- Encrypted at rest
- Stored in secure Firebase infrastructure
- Access-controlled (limited team members)
- Regularly audited

## Questions?

For privacy concerns or questions:
- Email: privacy@chefwise.app
- Privacy Policy: [Link]
- Terms of Service: [Link]

Last updated: December 2024
