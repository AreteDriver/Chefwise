# ADR 0001: Initial Architecture

**Status**: Accepted
**Date**: 2025-01-01
**Decision Makers**: James C. Young

## Context

ChefWise needs to provide AI-powered recipe generation and meal planning with strict dietary restriction enforcement. The system must support:

- Natural language recipe requests
- Multi-day meal planning with macro targeting
- Strict allergen avoidance for safety-critical users (NAFLD, allergies)
- Freemium model with usage limits
- Real-time data sync across devices

## Decision

We will implement a serverless architecture with:

1. **Frontend**: Next.js 14 with React 18 and Tailwind CSS
2. **Backend**: Firebase Cloud Functions (Node.js 18)
3. **Database**: Firestore with user-scoped security rules
4. **AI**: OpenAI GPT-4 with `response_format: { type: 'json_object' }`

Usage limits will be enforced server-side in Cloud Functions, not client-side.

## Alternatives Considered

### Alternative 1: Traditional server backend (Express/FastAPI)
- **Pros**: More control, easier local development
- **Cons**: Requires server management, manual scaling, infrastructure cost
- **Rejected**: Serverless provides auto-scaling and zero ops overhead

### Alternative 2: Client-side OpenAI calls
- **Pros**: Simpler architecture, no backend needed
- **Cons**: Exposes API key, can't enforce usage limits, no audit trail
- **Rejected**: Security and billing risks unacceptable

### Alternative 3: Custom LLM prompts without JSON schema
- **Pros**: More flexible output format
- **Cons**: Parsing failures, inconsistent structure, more tokens for format instructions
- **Rejected**: `response_format` eliminates parsing issues entirely

### Alternative 4: Client-side freemium enforcement
- **Pros**: Simpler backend
- **Cons**: Trivially bypassable, no protection against abuse
- **Rejected**: Must enforce limits server-side

## Consequences

### Positive
- Zero infrastructure management with Firebase
- Auto-scaling handles traffic spikes
- JSON schema enforcement eliminates parsing failures
- Firestore security rules prevent data manipulation
- Real-time sync without polling

### Negative
- Vendor lock-in to Firebase ecosystem
- Cold starts on Cloud Functions add latency
- Firestore query limitations vs. SQL

### Risks
- Firebase pricing changes could affect unit economics
- Cold start latency may frustrate users (mitigate with min instances)

## Follow-up Actions

1. Implement minimum instances for Cloud Functions to reduce cold starts
2. Add usage analytics for freemium conversion optimization
3. Create offline mode with Service Workers for core features
