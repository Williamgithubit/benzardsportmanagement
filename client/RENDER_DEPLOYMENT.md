# Benzard Sports Management - Render.com Deployment Guide

## Prerequisites

1. **GitHub Repository**: Your code should be pushed to a GitHub repository
2. **Firebase Project**: Ensure your Firebase project is set up and configured
3. **Render.com Account**: Create an account at [render.com](https://render.com)

## Deployment Steps

### 1. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your Benzard Sports Management project

### 2. Configure Build Settings

**Basic Settings:**
- **Name**: `benzard-sports-management` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users (e.g., US East)
- **Branch**: `main` (or your production branch)
- **Root Directory**: repository root (recommended for the `pnpm` workspace)

**Build & Deploy Settings:**
- **Build Command**: `chmod +x ./client/render-build.sh && ./client/render-build.sh`
- **Start Command**: `pnpm --filter client start`
- **Node Version**: `18` (or latest LTS)

### 3. Environment Variables

Add these environment variables in Render's dashboard:

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=t-tech-initiative.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=t-tech-initiative
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=t-tech-initiative.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=267790992628
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Firebase Admin SDK
```
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_ESCAPED_PRIVATE_KEY\n-----END PRIVATE KEY-----\n
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password
```

#### Next.js Configuration
```
NEXTAUTH_SECRET=your_secure_random_string_here
NEXTAUTH_URL=https://your-app-name.onrender.com
NODE_ENV=production
```

### 4. Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Navigate to "Settings" → "Custom Domains"
3. Add your domain (e.g., `ttechinitiative.org`)
4. Update your DNS records as instructed by Render

### 5. SSL Certificate

Render automatically provides SSL certificates for both `.onrender.com` subdomains and custom domains.

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test user authentication (login/logout)
- [ ] Check Firebase integration (admin dashboard, user management)
- [ ] Test form submissions and API endpoints
- [ ] Verify favicon and branding display correctly
- [ ] Test responsive design on mobile devices

## Troubleshooting

### Build Failures
- Check build logs in Render dashboard
- Ensure all environment variables are set
- Verify Firebase configuration is correct

### Runtime Errors
- Check service logs in Render dashboard
- Verify API endpoints are accessible
- Check Firebase security rules

### Performance Issues
- Enable Next.js image optimization
- Check bundle size and optimize if needed
- Monitor Core Web Vitals

## Monitoring

- **Logs**: Available in Render dashboard under "Logs"
- **Metrics**: Monitor performance in Render dashboard
- **Uptime**: Render provides 99.9% uptime SLA

## Support

- Render Documentation: [render.com/docs](https://render.com/docs)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- Firebase Hosting: [firebase.google.com/docs/hosting](https://firebase.google.com/docs/hosting)

---

**Note**: Replace placeholder values with your actual configuration details before deployment.
