# Admin Scripts

This directory contains utility scripts for managing the Benzard Sports Management platform.

## Available Scripts

### 1. `createAdmin.js`

Creates a new admin user and sets up admin privileges.

**What it does:**

- Creates a new Firebase Authentication user with email/password
- Sets the `role: 'admin'` custom claim on the user
- Adds the user to the Firestore `users` collection

**Usage:**

```bash
node scripts/createAdmin.js
```

**When to use:**

- Setting up your first admin user
- Creating additional admin accounts

---

### 2. `cleanMockData.js` ⭐ (Updated)

Removes mock/sample programs and events from Firestore.

**What it does:**

- Deletes mock programs: "Mobile App Development", "Web Development Bootcamp", "Data Science Fundamentals"
- Deletes mock events: "Benzard FC Youth Tournament", "Football Tournament 2024", "Youth Training Camp"
- Displays summary of cleaned data

**Usage:**

```bash
node scripts/cleanMockData.js
```

**When to use:**

- After testing with sample data
- Before going to production
- To make the dashboard show only real/live data
- **To fix the "Recent Sports Activity" section showing test programs**

**After running:**

- The dashboard will automatically update to show only real data
- If there's no real data yet, it will display "No recent activity found."

---

### 3. `seedBasicData.js`

Seeds initial basic data structures.

**Usage:**

```bash
node scripts/seedBasicData.js
```

---

### 4. `updateDashboardStats.js`

Computes aggregate dashboard statistics and updates Firestore.

**Why:**

- Keeps client rules tight by reading a single aggregated document instead of broad collection reads

**Usage:**

```bash
pnpm --filter client update:dashboard
```

**Notes:**

- Can be run on a schedule (cron) or triggered by Cloud Functions

---

## Environment Setup

All scripts require Firebase credentials via environment variables in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

For admin scripts, also set:

```
FIREBASE_ADMIN_PROJECT_ID=xxx
FIREBASE_ADMIN_CLIENT_EMAIL=xxx
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## Quick Start Checklist

1. ✅ Set up `.env.local` with Firebase credentials
2. ✅ Run `node scripts/createAdmin.js` to create admin user
3. ✅ Run `node scripts/cleanMockData.js` to remove test data (optional)
4. ✅ Dashboard will now show real/live data only

---

## Notes

- Scripts use the Firebase Admin SDK and require proper service account setup
- Always test in a development environment before running on production
- Check script output for confirmation of successful operations
