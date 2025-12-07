# Contributing to ChefWise

Thank you for your interest in contributing to ChefWise! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**: 
   ```bash
   git clone https://github.com/YOUR_USERNAME/Chefwise.git
   cd Chefwise
   ```
3. **Create a new branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies**: 
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```
5. **Set up your environment variables** (see `.env.example`):
   ```bash
   cp .env.example .env.local
   ```

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
OPENAI_API_KEY=your_openai_api_key
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, and Cloud Functions
3. Copy your Firebase configuration to `.env.local`
4. Deploy Firebase rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### OpenAI API Setup

1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Add the key to your `.env.local` and Firebase Functions config:
   ```bash
   firebase functions:config:set openai.key="YOUR_API_KEY"
   ```

## Development Workflow

### Running Locally

1. **Start the development server**:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)

2. **Run Firebase Functions locally** (optional):
   ```bash
   cd functions
   npm run serve
   ```

### Testing Your Changes

1. **Run linting**:
   ```bash
   npm run lint
   ```

2. **Run tests** (if available):
   ```bash
   npm run test
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Manual testing**: 
   - Test all affected features in the UI
   - Verify AI functions work correctly
   - Check error handling scenarios
   - Test with different dietary preferences and restrictions

## Working with AI Features

### Understanding the AI Architecture

ChefWise uses a modular AI service architecture:

```
User Request → useOpenAI Hook → Firebase Functions → OpenAI API → Response Processing → User
```

### Adding a New AI Feature

1. **Define the prompt** in `functions/index.js`:
   ```javascript
   function buildNewFeaturePrompt(params) {
     return `Your prompt template here...`;
   }
   ```

2. **Create the Cloud Function**:
   ```javascript
   exports.newAIFeature = functions.https.onCall(async (data, context) => {
     // Authentication check
     if (!context.auth) {
       throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
     }
     
     // Validate OpenAI availability
     if (!openai) {
       throw new functions.https.HttpsError('unavailable', 'AI service is not configured');
     }
     
     // Input validation
     // ... your validation logic
     
     try {
       const completion = await openai.chat.completions.create({
         model: 'gpt-4',
         messages: [
           { role: 'system', content: 'System prompt' },
           { role: 'user', content: buildNewFeaturePrompt(data) }
         ],
         temperature: 0.7,
         max_tokens: 2000,
       });
       
       const result = parseAIResponse(completion.choices[0].message.content);
       return result;
     } catch (error) {
       // Error handling
       throw new functions.https.HttpsError('internal', 'Failed: ' + error.message);
     }
   });
   ```

3. **Add hook method** in `src/hooks/useOpenAI.js`:
   ```javascript
   const newAIFeature = async (params) => {
     setLoading(true);
     setError(null);
     
     try {
       const newFeatureFunction = httpsCallable(functions, 'newAIFeature');
       const response = await newFeatureFunction(params);
       setResult(response.data);
       return response.data;
     } catch (err) {
       const errorMessage = err.message || 'Failed to execute feature';
       setError(errorMessage);
       console.error('Feature error:', err);
       throw err;
     } finally {
       setLoading(false);
     }
   };
   ```

4. **Export the new method**:
   ```javascript
   return {
     loading,
     error,
     result,
     generateRecipe,
     generateSubstitutions,
     generateMealPlan,
     getPantrySuggestions,
     newAIFeature, // Add your new feature
   };
   ```

### Best Practices for AI Features

- **Always validate input** before calling OpenAI API
- **Handle errors gracefully** with user-friendly messages
- **Parse responses safely** using the `parseAIResponse` helper
- **Set appropriate token limits** to control costs
- **Test with edge cases** (empty inputs, special characters, etc.)
- **Consider rate limiting** for resource-intensive features
- **Document your prompts** clearly for future maintenance

### Dietary Restrictions and Preferences

When working with dietary features:

- **Always respect allergen restrictions** - use "MUST avoid" language in prompts
- **Support multiple dietary types** simultaneously
- **Validate dietary combinations** for safety
- **Test with common allergens**: nuts, dairy, gluten, shellfish, soy
- **Consider cultural dietary restrictions**: halal, kosher, etc.

## Code Style

- Use ES6+ JavaScript syntax
- Follow React best practices and hooks patterns
- Use functional components over class components
- Keep components small and focused (< 300 lines)
- Write meaningful variable and function names
- Add JSDoc comments for functions
- Add comments for complex logic only

## Commit Messages

Use clear, descriptive commit messages following conventional commits:

- `feat: Add pantry-based recipe suggestions`
- `fix: Fix AI response parsing for markdown code blocks`
- `docs: Update AI feature documentation`
- `style: Format code with prettier`
- `refactor: Improve error handling in AI functions`
- `test: Add tests for recipe generation`
- `chore: Update dependencies`

## Pull Request Guidelines

### Before Submitting

- [ ] Code passes linting (`npm run lint`)
- [ ] All tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] Documentation updated (if needed)
- [ ] Environment variables documented (if added)

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots
Add screenshots for UI changes

## Checklist
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Manual testing completed
- [ ] Documentation updated
```

### PR Review Process

1. Automated CI/CD checks must pass
2. At least one maintainer review required
3. Address all feedback and requested changes
4. Maintain clean commit history (squash if needed)
5. Once approved, maintainer will merge

## CI/CD Pipeline

### Understanding the Pipeline

The CI/CD pipeline runs on every push and pull request:

1. **Linting**: ESLint checks code quality
2. **Testing**: Runs test suite (if configured)
3. **Build**: Validates successful build
4. **Functions Check**: Validates Cloud Functions
5. **Preview Deploy**: Creates preview for PRs
6. **Production Deploy**: Deploys to production (main branch only)

### Pipeline Requirements

- All status checks must pass before merging
- Build artifacts are saved for 7 days
- Failed jobs are reported in PR comments

### Local CI Validation

Run the same checks locally before pushing:

```bash
# Run all checks
npm run lint && npm run test && npm run build

# Check functions
cd functions && npm run lint && cd ..
```

## Firebase Functions Development

### Local Testing

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Run functions emulator**:
   ```bash
   firebase emulators:start --only functions
   ```

3. **Test functions locally** using the Firebase emulator

### Deploying Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:generateRecipe
```

## Common Issues and Solutions

### Build Failures

- **Issue**: Firebase auth error during build
  - **Solution**: Add default/test values for Firebase env vars in CI

- **Issue**: OpenAI API errors
  - **Solution**: Check API key is configured correctly

### AI Function Issues

- **Issue**: JSON parsing errors
  - **Solution**: Use `parseAIResponse()` helper to handle markdown code blocks

- **Issue**: Token limit exceeded
  - **Solution**: Adjust `max_tokens` parameter or simplify prompt

## Getting Help

- **Questions**: Open an issue with the `question` label
- **Bugs**: Open an issue with the `bug` label
- **Feature Requests**: Open an issue with the `enhancement` label
- **Discussions**: Use GitHub Discussions for general topics

## Code Review Process

1. Maintainers will review your PR within 2-3 business days
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited in release notes

## License

By contributing to ChefWise, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ChefWise! 🎉
