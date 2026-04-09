Firebase Cloud Functions for BSM

Files:

- index.js: example functions that create Firestore notifications and send FCM pushes on new athlete or blog comment.

Setup & Deploy

1. Install Firebase CLI: https://firebase.google.com/docs/cli
2. From this folder run:
   pnpm install
3. Initialize firebase in the project root (if not already):
   firebase init functions
   - choose existing project
   - select JavaScript
4. Deploy
   pnpm deploy

Notes

- This code expects a Firestore collection `fcmTokens` where documents have fields: token (string), uid (string), role (string). Populate these from your client when requesting FCM tokens.
- Adjust recipient selection logic as needed (topic vs tokens).
- Make sure to set appropriate IAM/roles for Cloud Functions if needed.
