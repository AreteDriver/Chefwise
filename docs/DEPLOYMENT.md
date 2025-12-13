# Deployment Guide

This guide covers deploying ChefWise to production.

## Prerequisites

- Firebase project created
- Vercel or Firebase Hosting account
- Environment variables configured
- API keys secured

## Environment Variables

Required environment variables:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI (Server-side only)
OPENAI_API_KEY=sk-...

# Stripe (Server-side only)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel login
   vercel link
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required variables
   - Set for Production, Preview, and Development

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Custom Domain** (Optional)
   - Vercel Dashboard → Domains
   - Add your custom domain
   - Update DNS records

### Option 2: Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```

3. **Build Project**
   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

### Option 3: Self-Hosted

Requirements:
- Node.js 18+ runtime
- Process manager (PM2 recommended)
- Reverse proxy (Nginx)

1. **Build Project**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

3. **PM2 Setup** (Recommended)
   ```bash
   npm install -g pm2
   pm2 start npm --name "chefwise" -- start
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Post-Deployment

### 1. Verify Deployment

- [ ] Homepage loads
- [ ] Authentication works
- [ ] AI recipe generation works
- [ ] Firestore reads/writes work
- [ ] Service worker registers
- [ ] Analytics tracking works

### 2. Configure Firestore Rules

Update production rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /recipes/{recipeId} {
      // Only allow the owner to read their own recipe
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      // Only allow the owner to create/update their own recipe
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

Deploy:
```bash
firebase deploy --only firestore:rules
```

### 3. Set Up Monitoring

- Enable Firebase Performance Monitoring
- Configure error alerts
- Set up uptime monitoring
- Review analytics dashboard

### 4. Enable HTTPS

All platforms above provide automatic HTTPS. Verify:
- Certificate is valid
- HTTP redirects to HTTPS
- Mixed content warnings resolved

## CI/CD Pipeline

GitHub Actions workflow (already configured):

```yaml
# .github/workflows/ci.yml
- Runs on: push to main/develop
- Steps: Install → Test → Lint → Build
- Auto-deploys to Vercel on merge to main
```

### Vercel Integration

1. Install Vercel GitHub App
2. Connect repository
3. Configure automatic deployments:
   - Production: `main` branch
   - Preview: PRs and `develop` branch

## Performance Optimization

### 1. Enable Compression

Vercel/Firebase enable this automatically. For self-hosted:

```javascript
// next.config.js
module.exports = {
  compress: true,
}
```

### 2. Configure Caching

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### 3. Image Optimization

Use Next.js Image component:

```jsx
import Image from 'next/image';

<Image 
  src="/recipe.jpg" 
  width={500} 
  height={300} 
  alt="Recipe"
  priority={false}
/>
```

## Monitoring & Logging

### Firebase Analytics
- Automatic page view tracking
- Custom event tracking
- User property tracking

### Error Tracking
- Firebase Crashlytics
- Error boundaries
- Sentry (optional)

### Performance Monitoring
- Firebase Performance
- Web Vitals tracking
- API response times

## Security Checklist

- [ ] API keys not exposed in client code
- [ ] Firestore rules properly configured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] SQL injection prevention (if using SQL)
- [ ] XSS protection enabled
- [ ] HTTPS enforced

## Rollback Procedure

### Vercel
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### Firebase
```bash
# View deployment history
firebase hosting:sites:list

# Rollback to previous version
firebase hosting:clone source-site-name:version target-site-name
```

### Self-Hosted
```bash
# PM2 rollback (if using ecosystem.config.js versioning)
git checkout <previous-commit>
npm run build
pm2 restart chefwise
```

## Scaling Considerations

### Horizontal Scaling
- Vercel: Automatic
- Firebase: Automatic
- Self-hosted: Use load balancer

### Database Scaling
- Monitor Firestore usage
- Add indexes for common queries
- Consider Firestore data partitioning

### CDN
- Vercel Edge Network (included)
- Firebase CDN (included)
- Self-hosted: CloudFlare or Fastly

## Cost Optimization

### Firebase
- Monitor usage dashboard
- Set budget alerts
- Optimize Firestore queries
- Cache frequently accessed data

### Vercel
- Free tier for hobby projects
- Pro tier for production apps
- Monitor bandwidth usage

### OpenAI API
- Implement caching (already done)
- Set rate limits per user
- Monitor token usage
- Consider fallback models

## Support

For deployment issues:
- Check [Firebase Status](https://status.firebase.google.com/)
- Check [Vercel Status](https://www.vercel-status.com/)
- Review deployment logs
- Contact support if needed

---

Last updated: December 2024
