# Community Recipes Firestore Schema

This document defines the Firestore data model for community recipe sharing in Chefwise.

---

## Overview

Community recipes enable users to share recipes publicly, browse others' creations, rate/review, save favorites, and follow other home cooks. This is an additive feature that does not modify existing private collections.

### Design Principles

1. **Additive** — New collections alongside existing private ones
2. **Backward Compatible** — Existing `recipes` collection unchanged
3. **Performant** — Denormalized for common query patterns
4. **Secure** — Public read, owner write for shared content

---

## New Collections

### `communityRecipes`

Public recipe directory. Recipes shared by users for community access.

```typescript
interface CommunityRecipe {
  // Identity
  id: string;                    // Auto-generated document ID

  // Content
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  prepTime: number;              // Minutes
  cookTime: number;              // Minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';

  // Nutrition (optional)
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };

  // Categorization
  tags: string[];                // ['quick', 'healthy', 'budget']
  dietType?: string;             // 'vegetarian', 'vegan', 'keto', etc.
  cuisineType?: string;          // 'italian', 'mexican', 'asian', etc.
  costLevel?: 'budget' | 'moderate' | 'premium';

  // Author
  authorId: string;              // Firebase UID
  authorName: string;            // Display name (denormalized)
  authorPhotoUrl?: string;       // Profile photo (denormalized)

  // Visibility
  visibility: 'public' | 'private' | 'unlisted';

  // Engagement (counters)
  likes: number;
  saves: number;
  views: number;
  rating: number;                // Average 1-5
  ratingCount: number;
  commentCount: number;

  // Media
  imageUrl?: string;             // Primary recipe photo
  imageStoragePath?: string;     // Firebase Storage path

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Import source (for URL-imported recipes)
  sourceUrl?: string;
  sourceDomain?: string;
}

interface Ingredient {
  item: string;
  amount: number | string;
  unit: string;
  notes?: string;                // 'diced', 'room temperature', etc.
}
```

### `recipeRatings`

User ratings and reviews for community recipes.

```typescript
interface RecipeRating {
  id: string;                    // Auto-generated
  recipeId: string;              // Reference to communityRecipes
  userId: string;                // Reviewer's Firebase UID
  userName: string;              // Denormalized for display
  userPhotoUrl?: string;         // Denormalized

  rating: number;                // 1-5 stars
  review?: string;               // Optional text review

  // Engagement
  helpful: number;               // "Was this helpful?" count
  reported: boolean;             // Flagged for moderation

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `recipeSaves`

User bookmarks/favorites. Private to each user.

```typescript
interface RecipeSave {
  id: string;                    // Auto-generated
  userId: string;                // Owner's Firebase UID
  recipeId: string;              // Reference to communityRecipes

  // Organization
  collection?: string;           // Custom collection name ('weeknight dinners')
  notes?: string;                // Personal notes

  // Metadata
  savedAt: Timestamp;
}
```

### `recipeComments`

Discussion threads on recipes.

```typescript
interface RecipeComment {
  id: string;                    // Auto-generated
  recipeId: string;              // Reference to communityRecipes
  userId: string;                // Commenter's Firebase UID
  userName: string;              // Denormalized
  userPhotoUrl?: string;         // Denormalized

  content: string;               // Comment text
  likes: number;                 // Upvotes

  // Threading
  parentCommentId?: string;      // For nested replies
  replyCount: number;            // Count of direct replies

  // Moderation
  reported: boolean;
  hidden: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `userFollows`

Social graph for following other users.

```typescript
interface UserFollow {
  id: string;                    // `${followerId}_${followingId}`
  followerId: string;            // User doing the following
  followingId: string;           // User being followed
  createdAt: Timestamp;
}
```

### `userProfiles` (extension to `users`)

Public profile data for community features.

```typescript
interface UserProfile {
  // Stored in existing users collection
  displayName: string;
  photoUrl?: string;
  bio?: string;

  // Community stats (denormalized counters)
  recipeCount: number;           // Public recipes shared
  followerCount: number;
  followingCount: number;

  // Preferences
  showInCommunity: boolean;      // Opt-out of public profile
}
```

---

## Firestore Security Rules

Add to existing `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... existing rules ...

    // ========================================
    // COMMUNITY RECIPES
    // ========================================

    match /communityRecipes/{recipeId} {
      // Anyone can read public recipes
      allow read: if resource.data.visibility == 'public' ||
                    (isAuthenticated() && resource.data.authorId == request.auth.uid);

      // Only authenticated users can create
      allow create: if isAuthenticated() &&
                      request.resource.data.authorId == request.auth.uid &&
                      validateRecipeData(request.resource.data);

      // Only author can update/delete
      allow update: if isAuthenticated() &&
                      resource.data.authorId == request.auth.uid &&
                      request.resource.data.authorId == request.auth.uid;
      allow delete: if isAuthenticated() &&
                      resource.data.authorId == request.auth.uid;
    }

    // ========================================
    // RECIPE RATINGS
    // ========================================

    match /recipeRatings/{ratingId} {
      // Anyone authenticated can read ratings
      allow read: if isAuthenticated();

      // Create: authenticated, own rating, one per user per recipe
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid &&
                      request.resource.data.rating >= 1 &&
                      request.resource.data.rating <= 5;

      // Update/delete: only own ratings
      allow update, delete: if isAuthenticated() &&
                              resource.data.userId == request.auth.uid;
    }

    // ========================================
    // RECIPE SAVES (BOOKMARKS)
    // ========================================

    match /recipeSaves/{saveId} {
      // Only owner can access their saves
      allow read, write: if isAuthenticated() &&
                           resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
    }

    // ========================================
    // RECIPE COMMENTS
    // ========================================

    match /recipeComments/{commentId} {
      // Anyone authenticated can read comments
      allow read: if isAuthenticated();

      // Create: authenticated, own comment
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid &&
                      request.resource.data.content.size() > 0 &&
                      request.resource.data.content.size() <= 2000;

      // Update/delete: only own comments
      allow update, delete: if isAuthenticated() &&
                              resource.data.userId == request.auth.uid;
    }

    // ========================================
    // USER FOLLOWS
    // ========================================

    match /userFollows/{followId} {
      // Anyone authenticated can read follows
      allow read: if isAuthenticated();

      // Create: authenticated, following as self
      allow create: if isAuthenticated() &&
                      request.resource.data.followerId == request.auth.uid &&
                      request.resource.data.followerId != request.resource.data.followingId;

      // Delete: only follower can unfollow
      allow delete: if isAuthenticated() &&
                      resource.data.followerId == request.auth.uid;
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    function validateRecipeData(data) {
      return data.title.size() > 0 &&
             data.title.size() <= 200 &&
             data.ingredients.size() > 0 &&
             data.steps.size() > 0 &&
             data.visibility in ['public', 'private', 'unlisted'];
    }
  }
}
```

---

## Firestore Indexes

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "communityRecipes",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "visibility", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "communityRecipes",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "visibility", "order": "ASCENDING"},
        {"fieldPath": "likes", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "communityRecipes",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "visibility", "order": "ASCENDING"},
        {"fieldPath": "rating", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "communityRecipes",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "dietType", "order": "ASCENDING"},
        {"fieldPath": "rating", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "communityRecipes",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "cuisineType", "order": "ASCENDING"},
        {"fieldPath": "rating", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "communityRecipes",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "authorId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "recipeSaves",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "savedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "recipeSaves",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "collection", "order": "ASCENDING"},
        {"fieldPath": "savedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "recipeRatings",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "recipeId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "recipeComments",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "recipeId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "userFollows",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "followerId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "userFollows",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "followingId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

---

## Common Queries

### Browse Public Recipes (newest)

```typescript
const recipes = await db.collection('communityRecipes')
  .where('visibility', '==', 'public')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();
```

### Browse by Cuisine (highest rated)

```typescript
const recipes = await db.collection('communityRecipes')
  .where('visibility', '==', 'public')
  .where('cuisineType', '==', 'italian')
  .orderBy('rating', 'desc')
  .limit(20)
  .get();
```

### Get User's Saved Recipes

```typescript
const saves = await db.collection('recipeSaves')
  .where('userId', '==', currentUserId)
  .orderBy('savedAt', 'desc')
  .get();

// Then fetch recipes by IDs
const recipeIds = saves.docs.map(d => d.data().recipeId);
```

### Get Recipe Ratings

```typescript
const ratings = await db.collection('recipeRatings')
  .where('recipeId', '==', recipeId)
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get();
```

### Check if User Saved Recipe

```typescript
const save = await db.collection('recipeSaves')
  .where('userId', '==', currentUserId)
  .where('recipeId', '==', recipeId)
  .limit(1)
  .get();

const isSaved = !save.empty;
```

### Get Author's Public Recipes

```typescript
const recipes = await db.collection('communityRecipes')
  .where('authorId', '==', authorId)
  .where('visibility', '==', 'public')
  .orderBy('createdAt', 'desc')
  .get();
```

---

## Counter Updates (Transactions)

Use transactions for counter updates to prevent race conditions:

### Like/Unlike Recipe

```typescript
async function toggleLike(recipeId: string, userId: string) {
  const likeRef = db.collection('recipeLikes').doc(`${userId}_${recipeId}`);
  const recipeRef = db.collection('communityRecipes').doc(recipeId);

  await db.runTransaction(async (tx) => {
    const likeDoc = await tx.get(likeRef);
    const recipeDoc = await tx.get(recipeRef);

    if (likeDoc.exists) {
      // Unlike
      tx.delete(likeRef);
      tx.update(recipeRef, { likes: recipeDoc.data().likes - 1 });
    } else {
      // Like
      tx.set(likeRef, { userId, recipeId, createdAt: serverTimestamp() });
      tx.update(recipeRef, { likes: recipeDoc.data().likes + 1 });
    }
  });
}
```

### Update Rating Average

```typescript
async function submitRating(recipeId: string, userId: string, rating: number) {
  const ratingRef = db.collection('recipeRatings').doc(`${userId}_${recipeId}`);
  const recipeRef = db.collection('communityRecipes').doc(recipeId);

  await db.runTransaction(async (tx) => {
    const existingRating = await tx.get(ratingRef);
    const recipe = await tx.get(recipeRef);
    const data = recipe.data();

    let newAvg, newCount;

    if (existingRating.exists) {
      // Update existing rating
      const oldRating = existingRating.data().rating;
      const totalStars = (data.rating * data.ratingCount) - oldRating + rating;
      newCount = data.ratingCount;
      newAvg = totalStars / newCount;
    } else {
      // New rating
      const totalStars = (data.rating * data.ratingCount) + rating;
      newCount = data.ratingCount + 1;
      newAvg = totalStars / newCount;
    }

    tx.set(ratingRef, { userId, recipeId, rating, createdAt: serverTimestamp() });
    tx.update(recipeRef, { rating: newAvg, ratingCount: newCount });
  });
}
```

---

## Migration: Publishing Private Recipe

When a user publishes their private recipe to the community:

```typescript
async function publishRecipe(privateRecipeId: string, userId: string) {
  const privateRef = db.collection('recipes').doc(privateRecipeId);
  const privateDoc = await privateRef.get();

  if (!privateDoc.exists || privateDoc.data().userId !== userId) {
    throw new Error('Recipe not found or unauthorized');
  }

  const privateData = privateDoc.data();
  const user = await db.collection('users').doc(userId).get();

  const communityRecipe = {
    ...privateData,
    authorId: userId,
    authorName: user.data().displayName || 'Anonymous',
    authorPhotoUrl: user.data().photoUrl || null,
    visibility: 'public',
    likes: 0,
    saves: 0,
    views: 0,
    rating: 0,
    ratingCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Remove private fields
  delete communityRecipe.userId;

  const communityRef = await db.collection('communityRecipes').add(communityRecipe);

  // Optionally link back to community version
  await privateRef.update({
    publishedId: communityRef.id,
    publishedAt: serverTimestamp()
  });

  return communityRef.id;
}
```

---

## Collection Summary

| Collection | Access | Purpose |
|------------|--------|---------|
| `users` | Owner only | User profiles (existing) |
| `recipes` | Owner only | Private recipes (existing) |
| `pantryItems` | Owner only | Pantry inventory (existing) |
| `mealPlans` | Owner only | Meal plans (existing) |
| **`communityRecipes`** | Public read, owner write | Shared recipes |
| **`recipeRatings`** | Authenticated read, owner write | Ratings/reviews |
| **`recipeSaves`** | Owner only | Bookmarks |
| **`recipeComments`** | Authenticated read, owner write | Comments |
| **`userFollows`** | Authenticated read, follower write | Social graph |
