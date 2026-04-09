# Firestore Security Rules

Below is the Firestore rules configuration to protect all collections and restrict access by user role. These rules enable the Reports dashboard, analytics, and other admin components to function properly while maintaining security.

Rules (add to your Firestore rules in the Firebase console):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - for analytics and user management
    match /users/{userId} {
      allow read: if request.auth != null && (
        request.auth.token.role in ['admin', 'manager'] ||
        request.auth.uid == userId
      );
      allow create, update, delete: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Programs collection - for program management and analytics
    match /programs/{programId} {
      allow read: if request.auth != null && (
        request.auth.token.role in ['admin', 'manager']
      );
      allow create, update, delete: if request.auth != null && request.auth.token.role == 'admin';

      // Enrollments subcollection
      match /enrollments/{enrollmentId} {
        allow read: if request.auth != null && (
          request.auth.token.role in ['admin', 'manager']
        );
        allow create: if request.auth != null && (
          request.auth.token.role in ['admin', 'manager']
        );
      }

      // Completions subcollection
      match /completions/{completionId} {
        allow read: if request.auth != null && (
          request.auth.token.role in ['admin', 'manager']
        );
        allow create: if request.auth != null && (
          request.auth.token.role in ['admin', 'manager']
        );
      }
    }

    // Events collection - for event analytics
    match /events/{eventId} {
      allow read: if request.auth != null && (
        request.auth.token.role in ['admin', 'manager']
      );
      allow create, update, delete: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Tasks collection - for task analytics and completion rates
    match /tasks/{taskId} {
      allow read: if request.auth != null && (
        request.auth.token.role in ['admin', 'manager']
      );
      allow create, update, delete: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Sessions collection - for engagement metrics
    match /sessions/{sessionId} {
      allow read: if request.auth != null && (
        request.auth.token.role in ['admin', 'manager']
      );
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Notifications collection - for notifications
    match /notifications/{notifId} {
      allow create: if request.auth != null && (
        request.auth.token.role in ['admin','manager','media']
      );

      allow read: if request.auth != null && (
        // admins can read all
        request.auth.token.role == 'admin' ||
        // managers & media can read types relevant to them
        (
          request.auth.token.role == 'manager' && resource.data.recipientRole in ['manager','admin','all']
        ) ||
        (
          request.auth.token.role == 'media' && resource.data.recipientRole in ['media','admin','all']
        )
      );

      allow update, delete: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

## Collections Covered

- **users**: User profiles and activity data (read by admin/manager for analytics)
- **programs**: Training programs with enrollments and completions tracking
- **events**: Events data for analytics
- **tasks**: Task completion metrics for reports
- **sessions**: User engagement sessions
- **notifications**: Notifications with role-based access

## Setup Instructions

### Step 1: Set Custom Claims for Admin User

Your admin user needs a `role` custom claim set to `'admin'`. Use the admin creation script:

```bash
# From the client directory
node scripts/createAdmin.js
```

This script will:

- Create an admin user with email/password
- Automatically set the `role: 'admin'` custom claim
- Add the user to the Firestore `users` collection

If you already have an admin user, you can also update their claims via Firebase console:

- Go to Authentication → Users
- Select your admin user → Custom Claims
- Set the claims JSON: `{"role": "admin"}`

### Step 2: Copy Rules to Firebase Console

1. Go to **Firebase Console** → **Firestore Database** → **Rules tab**
2. Replace **all existing rules** with the code block above
3. Click **Publish**

### Step 3: Clear Mock/Seeded Data (Optional)

If you want to remove the sample programs that were seeded when testing, go to:

1. **Firebase Console** → **Firestore Database** → **Data tab**
2. Find the `programs` collection
3. Select and delete these mock programs:
   - "Mobile App Development"
   - "Web Development Bootcamp"
   - "Data Science Fundamentals"

## Troubleshooting

**Still getting "Missing or insufficient permissions" error?**

1. ✅ Ensure custom claims are set correctly:
   - Go to Firebase Authentication → Users
   - Click your admin user → Custom Claims
   - Verify it shows: `{"role": "admin"}`

2. ✅ Clear browser cache and log out/login again (custom claims are cached locally)

3. ✅ Verify the Firestore rules were published (look for green checkmark in Firebase console)

4. ✅ If you created the admin user with the script, the claims should be set automatically

## Key Points

- **Admins**: Full read/write access to all collections for complete dashboard and analytics functionality
- **Managers**: Read access to analytics data (users, programs, events, tasks, sessions)
- **Users**: Can read/write their own user data and create sessions for engagement tracking
- **Custom Claims Required**: The `role` claim must be set in Firebase Authentication for these rules to take effect
- **Cache Consideration**: After setting custom claims, users may need to clear cache or re-login for changes to take effect
