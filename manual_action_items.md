# Firebase Manual Action Items

Follow these steps to complete the Firebase CLI setup, deploy the security rules and indexes, and configure Authorized Domains in the Firebase Auth console.

---

## 1. Local Firebase CLI Deployment

Perform these steps in your terminal inside the project root directory (`c:\Users\amotc\Documents\GitHub\ContentPoster`):

### Step 1.1: Log in to Firebase CLI
Run the login command to authenticate the local Firebase CLI with your Google/Firebase account:
```bash
npx firebase login
```
*Follow the instructions in the browser window that opens to grant the required permissions.*

### Step 1.2: Deploy Firestore Security Rules & Indexes
Deploy the security policies ([firestore.rules](file:///c:/Users/amotc/Documents/GitHub/ContentPoster/firestore.rules)) and compound query configurations ([firestore.indexes.json](file:///c:/Users/amotc/Documents/GitHub/ContentPoster/firestore.indexes.json)) to your Firebase project:
```bash
npx firebase deploy --only firestore
```

---

## 2. Firebase Console Configurations (Manual)

Perform these steps in the [Firebase Web Console](https://console.firebase.google.com/):

### Step 2.1: Restrict Authorized Domains
1. Navigate to **Authentication** in the left sidebar.
2. Select the **Settings** tab at the top.
3. Click on **Authorized Domains** in the left sub-navigation.
4. Add your production domain name (e.g. `yourdomain.com`).
5. Remove/delete any unneeded default or staging test domains to block unauthorized authentication attempts.

### Step 2.2: Enable Registration Email Verification Template
1. In **Authentication** -> **Templates** tab.
2. Select **Email address verification**.
3. Ensure the email template is configured, customized with your app name, and enabled.
