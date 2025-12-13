# Repository Setup Guide

This guide helps repository administrators configure GitHub settings for optimal discoverability and organization.

## Adding Repository Topics

Repository topics help users discover your project when searching GitHub. Add these recommended topics to maximize visibility:

### How to Add Topics

1. Navigate to the repository homepage on GitHub
2. Click the ⚙️ (gear/settings) icon next to "About" in the right sidebar
3. In the "Topics" field, add the following topics one by one:
   - `ai`
   - `cooking-assistant`
   - `meal-planning`
   - `dietary-coaching`
   - `nutrient-analysis`
   - `recipe-generator`
   - `nextjs`
   - `firebase`
   - `openai`
   - `react`
   - `nutrition-tracking`
   - `meal-planner`
   - `gpt-4`
   - `typescript`
   - `tailwindcss`

4. Add a description (optional but recommended):
   ```
   AI-powered cooking assistant for personalized recipes, meal planning, and dietary coaching using OpenAI GPT-4
   ```

5. Add a website URL (if you have a deployed version):
   ```
   https://your-app-domain.com
   ```

6. Click "Save changes"

### Why These Topics?

- **Primary Topics**: `ai`, `cooking-assistant`, `meal-planning`, `dietary-coaching`, `nutrient-analysis`
  - These reflect the core functionality and help users find exactly what they need

- **Technical Topics**: `nextjs`, `firebase`, `openai`, `react`, `typescript`, `tailwindcss`
  - These help developers find projects using specific technologies

- **Feature Topics**: `recipe-generator`, `nutrition-tracking`, `meal-planner`, `gpt-4`
  - These highlight specific features users might be searching for

## Repository Settings

### About Section

Configure the "About" section with:
- **Description**: AI-powered cooking assistant for personalized recipes, meal planning, and dietary coaching
- **Website**: Your deployment URL (if available)
- **Topics**: Add all topics listed above
- **Check "Releases"**: If you plan to create versioned releases
- **Check "Packages"**: If you publish npm packages
- **Uncheck "Environments"**: Unless you use GitHub Environments feature

### Branch Protection

For production-grade projects, set up branch protection on `main`:

1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (at least 1)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging
4. Save changes

### GitHub Actions

Ensure GitHub Actions is enabled:
1. Go to Settings → Actions → General
2. Select "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select "Read and write permissions"
4. Save

### Secrets Configuration

Add these secrets for CI/CD and deployment:

**Firebase Secrets** (Settings → Secrets and variables → Actions):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT` (JSON service account key)

**Deployment Secrets** (if using Vercel):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**AI Service Secrets**:
- `OPENAI_API_KEY`

**Payment Secrets** (when ready):
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Issue Templates

Consider creating issue templates for:
- Bug reports
- Feature requests
- Documentation improvements

Create `.github/ISSUE_TEMPLATE/` directory with templates.

### Pull Request Template

Create `.github/pull_request_template.md`:

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

## Social Preview

Upload a social preview image:
1. Create a 1280×640 px image showcasing your app
2. Go to Settings → Options → Social preview
3. Upload your image

This image appears when sharing your repository on social media.

## README Badge

Add status badges to your README for:
- Build status
- License
- Version
- Dependencies status

Example badges are already included in the README.

## Repository Insights

Enable useful features:
1. Go to Settings → Features
2. Enable:
   - ✅ Wikis (for detailed documentation)
   - ✅ Issues
   - ✅ Sponsorships (if accepting donations)
   - ✅ Discussions (for community Q&A)
   - ❌ Projects (unless needed)

## License

The repository includes an MIT License. Ensure it's properly displayed:
1. GitHub should auto-detect the LICENSE file
2. Verify it appears in the right sidebar
3. The license should show as "MIT License"

## Verification Steps

After setup, verify:
- [ ] Topics are visible on repository homepage
- [ ] About section shows correct description
- [ ] CI/CD workflows run successfully
- [ ] All secrets are configured correctly
- [ ] Branch protection is active on main
- [ ] README badges display correctly
- [ ] License is detected

## Maintenance

Regularly:
- Update topics as new features are added
- Review and respond to issues
- Update documentation as the project evolves
- Monitor security advisories for dependencies
- Keep secrets rotated for security

---

For questions or issues with repository setup, consult GitHub's documentation or open an issue.
