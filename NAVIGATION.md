# ChefWise Navigation System

## Overview

The ChefWise navigation system is built using a centralized, reusable component architecture that provides consistent navigation across all pages with state preservation and mobile responsiveness.

## Architecture

### Component Structure

```
_app.js (Root)
    ↓
Layout.jsx (Wrapper)
    ↓
NavigationBar.jsx (Navigation)
    ↓
Page Content (index.js, pantry.js, etc.)
```

## Core Components

### 1. NavigationBar.jsx

The `NavigationBar` component is the main navigation interface that provides:

#### Features
- **Active State Management**: Automatically highlights the current page
- **Mobile Responsiveness**: Hamburger menu for mobile, full menu for desktop
- **Authentication Handling**: Different UI for authenticated vs guest users
- **Smooth Navigation**: Uses Next.js router for fast client-side transitions

#### Props
- `user` (object|null): Current authenticated user object from Firebase

#### Navigation Items
```javascript
const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Pantry', path: '/pantry' },
  { label: 'Planner', path: '/planner' },
  { label: 'Tracker', path: '/tracker' },
  { label: 'Profile', path: '/profile' },
];
```

#### Responsive Breakpoints
- **Mobile (< 768px)**: Hamburger menu with dropdown
- **Desktop (≥ 768px)**: Horizontal navigation bar

### 2. Layout.jsx

The `Layout` component wraps all pages and provides:

#### Features
- **Consistent Structure**: Ensures NavigationBar appears on all pages
- **State Preservation**: Maintains component state during navigation
- **Flexible Content**: Accepts any page content as children

#### Props
- `children` (ReactNode): Page content to render
- `user` (object|null): Current authenticated user object

### 3. _app.js Integration

The root `_app.js` file:
- Manages global authentication state
- Provides user object to all pages
- Wraps pages with Layout component using `getLayout` pattern
- Shows loading state while authenticating

## State Preservation

### How It Works

The application preserves state across navigation using:

1. **Next.js Client-side Routing**: Pages are not fully reloaded when navigating
2. **Layout Persistence**: The Layout component is not unmounted during navigation
3. **React Component Tree**: Components maintain their state as long as they're mounted

### Benefits

- ✅ Form inputs retain values when navigating away and back
- ✅ Scroll positions maintained on component state
- ✅ No flickering or re-initialization during navigation
- ✅ Faster navigation (no full page reload)

### Example

```javascript
// User fills out meal plan form on /planner
// Navigates to /pantry to check ingredients
// Returns to /planner
// Form data is still there!
```

## Mobile Responsiveness

### Desktop View (≥ 768px)
- Full horizontal navigation bar
- All menu items visible inline
- Logo on left, menu items and auth buttons on right

### Mobile View (< 768px)
- Hamburger menu icon (☰)
- Dropdown menu when tapped
- Full-screen navigation overlay
- Touch-optimized tap targets (minimum 44x44px)

### Hamburger Menu Behavior
```javascript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// Toggles between hamburger icon (☰) and close icon (✕)
// Closes automatically when navigation item is selected
```

## Authentication Integration

### Guest Users
- Shows "Sign In with Google" button
- No navigation menu items visible
- Redirected to home page when accessing protected routes

### Authenticated Users
- Full navigation menu access
- User-specific features (Pantry, Planner, Tracker, Profile)
- "Sign Out" button
- Automatic profile creation on first sign-in

### Sign In Flow
```javascript
handleSignIn()
  ↓
Google OAuth Popup
  ↓
Firebase Authentication
  ↓
Check/Create User Profile in Firestore
  ↓
Update Auth State
  ↓
Show Full Navigation
```

## Styling

### Tailwind CSS Classes

#### Active State
```javascript
isActive(item.path)
  ? 'text-primary bg-primary/10'  // Active: green text + light green bg
  : 'text-gray-700 hover:text-primary hover:bg-gray-50'  // Inactive: gray text
```

#### Mobile Menu
```css
- Hidden on desktop: `hidden md:flex`
- Visible on mobile: `md:hidden`
- Full width buttons: `w-full`
- Block layout: `block`
```

### Color Scheme
- **Primary**: #10B981 (Green) - Active states, CTAs
- **Gray**: Text and backgrounds
- **White**: Navigation bar background

## Adding New Navigation Items

To add a new page to the navigation:

1. **Create the page** in `src/pages/newpage.js`
2. **Add to navItems array** in `NavigationBar.jsx`:
```javascript
const navItems = [
  // ... existing items
  { label: 'New Page', path: '/newpage' },
];
```
3. **No other changes needed!** The NavigationBar will automatically:
   - Show the new item
   - Handle active state
   - Work on mobile and desktop

## Page Template

Use this template for new pages:

```javascript
import { useRouter } from 'next/router';

export default function NewPage({ user }) {
  const router = useRouter();

  // Redirect if user not authenticated (if needed)
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">New Page</h1>
      {/* Your page content */}
    </main>
  );
}
```

Note: The Layout and NavigationBar are automatically added by `_app.js`, so you don't need to include them in your page.

## Accessibility

### Features
- **ARIA Labels**: `aria-label="Toggle menu"` on hamburger button
- **Keyboard Navigation**: All buttons are keyboard accessible
- **Focus States**: Visible focus indicators on interactive elements
- **Semantic HTML**: Proper `<nav>`, `<button>` elements

### Screen Reader Support
- Logo button announced as "ChefWise"
- Navigation items clearly labeled
- Mobile menu state changes announced

## Performance Optimizations

1. **Code Splitting**: Navigation code is part of the main bundle (necessary)
2. **Client-side Routing**: No full page reloads
3. **State Preservation**: Components not remounted unnecessarily
4. **Minimal Re-renders**: Uses React.useState and useRouter efficiently

## Troubleshooting

### Issue: Navigation doesn't highlight current page
**Solution**: Ensure the path in `navItems` matches exactly with the page route

### Issue: Mobile menu stays open after navigation
**Solution**: The `setMobileMenuOpen(false)` is called on each nav item click

### Issue: User state not available in NavigationBar
**Solution**: Check that user prop is being passed from Layout to NavigationBar

### Issue: "Back to Home" button functionality
**Solution**: This was replaced with full navigation. Use the "Home" nav item instead

## Future Enhancements

Potential improvements to consider:

1. **Breadcrumbs**: Add breadcrumb navigation for deeper page hierarchies
2. **Search Bar**: Integrate search functionality in the navigation
3. **Notifications**: Add notification badges to nav items
4. **User Avatar**: Show user profile picture instead of just sign out button
5. **Theme Toggle**: Add dark mode toggle to navigation
6. **Keyboard Shortcuts**: Add keyboard shortcuts for navigation (e.g., Alt+1 for Home)

## Best Practices

1. **Keep Navigation Simple**: Don't overload with too many items
2. **Consistent Labeling**: Use clear, concise labels
3. **Visual Hierarchy**: Most important items first
4. **Mobile First**: Design for mobile, enhance for desktop
5. **State Management**: Keep navigation state minimal and predictable

---

For questions or issues with the navigation system, please open an issue on GitHub.
