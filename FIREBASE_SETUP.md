# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** or **Create a project**
3. Enter project name: `school-referral-system` (or your preferred name)
4. **Disable Google Analytics** for now (can enable later)
5. Click **Create Project**

---

## Step 2: Set Up Firebase Authentication

1. In your Firebase project, click **Authentication** in the left menu
2. Click **Get Started**
3. Enable sign-in methods:
   - **Email/Password**: Click, toggle **Enable**, Save
   - **Google**: Click, toggle **Enable**, select support email, Save

---

## Step 3: Create Firestore Database

1. Click **Firestore Database** in the left menu
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select location closest to your users (e.g., `us-central1` for USA)
5. Click **Enable**

---

## Step 4: Set Up Cloud Storage

1. Click **Storage** in the left menu
2. Click **Get started**
3. Choose **Start in test mode**
4. Use same location as Firestore
5. Click **Done**

---

## Step 5: Register Web App

1. In Project Overview, click the **</>** (web) icon
2. Enter app nickname: `School Referral Platform`
3. **Check** "Also set up Firebase Hosting"
4. Click **Register app**
5. **Copy** the Firebase configuration object - you'll need this next

The config will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Click **Continue to console**

---

##Step 6: Get Service Account for Admin SDK

1. Click **⚙️ (gear icon)** > **Project settings**
2. Go to **Service accounts** tab
3. Click **Generate new private key**
4. Click **Generate key** - this downloads a JSON file
5. **Save this file securely** - you'll need it for Cloud Functions

---

## Step 7: Provide Configuration to Developer

After completing the above steps, provide me with:

1. **Web app config object** (from Step 5)
2. **Service account JSON** (from Step 6) - we'll store this in a `.env.local` file (which is gitignored)

Once I have these, I'll:
- Create `.env.local` with your Firebase credentials
- Initialize Firebase in the Next.js app
- Set up authentication
- Start building the first features

---

## Security Note

**Never commit the service account JSON or .env.local to Git!** These files contain sensitive credentials. They're already in `.gitignore`.

---

## What's Next?

Once you provide the configuration:
1. I'll set up Firebase connection
2. Create initial authentication screens (login, register)
3. Set up role-based access control with custom claims
4. Begin building the school/teacher management screens
5. Deploy Firestore security rules

Let me know when you have the Firebase config ready!
