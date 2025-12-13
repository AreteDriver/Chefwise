# Offline Mode Guide

ChefWise supports offline functionality to ensure you can access your recipes and pantry even without an internet connection.

## How It Works

ChefWise uses a service worker to cache:
- Static assets (HTML, CSS, JavaScript)
- Previously loaded pages
- API responses (recipes, meal plans)
- Your pantry inventory

## Features

### Automatic Caching
- First time you visit a page, it's cached for offline access
- Recipe searches are cached for 24 hours
- Meal plans are stored locally

### Background Sync
When you make changes to your pantry while offline:
1. Changes are stored locally in IndexedDB
2. When connection is restored, changes sync automatically
3. No data loss even if you close the browser

## What Works Offline

✅ **Available Offline:**
- View cached recipes
- Browse your pantry
- View saved meal plans
- Track macros (stored locally)

❌ **Requires Internet:**
- Generate new AI recipes
- Create new meal plans
- AI ingredient substitutions

## Best Practices

1. Pre-cache important recipes by starring them
2. Connect to internet regularly for sync
3. Monitor storage usage in Settings

For more information, see the [Technical Documentation](../ARCHITECTURE.md).
