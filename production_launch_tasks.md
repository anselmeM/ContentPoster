# Production Launch Tasks Checklist

This checklist tracks all remaining steps required to harden, secure, and deploy the **Content Cadence** (Social Media Content Planner) web app to a production-ready environment.

---

## 1. Firebase Hardening & Security (P0)

### [x] Firestore Security Rules
- [x] Create `firestore.rules` in the root directory.
- [x] Restrict access so users can only read/write their own document tree under `/databases/{database}/documents/artifacts/{appId}/users/{userId}/`.
- [x] Implement data-level validation (e.g., validate that `status` must be one of `draft`, `scheduled`, or `published`).
- [x] Deploy and verify security rules using `npx firebase deploy --only firestore` (requires CLI authentication via `npx firebase login`).

### [/] Firebase Authentication Constraints
- [ ] Go to Firebase Console -> Authentication -> Settings -> Authorized Domains (Manual).
- [ ] Remove default test domains and restrict access to the production domain and `localhost` (Manual).
- [x] Enable Email/Password registration verification email workflow in Firebase Auth Console.
- [x] Integrate client-side verification email dispatch on registration in [firebase.js](file:///c:/Users/amotc/Documents/GitHub/ContentPoster/src/services/firebase.js).

---

## 2. Server-Side Publish Triggering (P0)

### [x] Migrate Trigger Scheduler to Firebase Functions
- [x] Initialize cloud functions environment (`functions/` dir created with Node.js setup).
- [x] Migrate logic in [triggerScheduler.js](file:///c:/Users/amotc/Documents/GitHub/ContentPoster/src/services/triggerScheduler.js) into a cron-scheduled Firebase Cloud Function running every 5 minutes in [index.js](file:///c:/Users/amotc/Documents/GitHub/ContentPoster/functions/index.js).
- [x] Ensure that even when the user is offline, the cloud function evaluates `draft` posts with active triggers and publishes them.
- [x] Remove the client-side `setInterval` calls in [App.jsx](file:///c:/Users/amotc/Documents/GitHub/ContentPoster/src/App.jsx) to save client battery and avoid redundant API reads.

### [x] Secrets & API Keys Encryption
- [x] Configure backend architecture to support Google Cloud Secret Manager.
- [x] Create [functions/.secret.local](file:///c:/Users/amotc/Documents/GitHub/ContentPoster/functions/.secret.local) template for local testing.
- [x] Insert secure API publishing placeholders in the scheduled cloud function.

---

## 3. Environment Configurations & Builds (P1)

### [x] Production Environment Files
- [x] Create `.env.production` (cloning `.env.example`) with production database URLs, app IDs, and Firebase configurations.
- [x] Ensure `.env` is omitted from version control by verifying it in `.gitignore`.
- [x] Clean up window-level global config overrides in `firebase-config.js` and replace them with standard Vite env variables (`import.meta.env`).

### [x] Build Validation
- [x] Run `npm run build` locally to verify production assets bundle without warnings.
- [x] Run the test suite `npx vitest run` to ensure all 218 unit tests remain passing.

---

## 4. UI/UX Consistency & Feedback Overhaul (P1)

### [x] Settings Overhaul
- [x] Add a visual sidebar navigation menu in `SettingsView.jsx` to jump between categories (Account, Preferences, Data & Privacy, Connections, Security).
- [x] Implement a **Danger Zone** component at the bottom of Settings for cascading data deletion (wipe posts, tasks, templates, and Firebase account).
- [x] Replace inline disappearing status labels with standard, animated toast notifications.

### [x] Media Upload Progress & Indication
- [x] Implement an upload progress indicator (e.g., linear progress bar) in `MediaLibrary.jsx` to indicate firebase storage upload state.
- [x] Add drag-and-drop file upload capabilities directly to the media grid container.

---

## 5. Offline Capabilities & PWA (P2)

### [x] Service Worker Caching Policies
- [x] Configure `vite-plugin-pwa` in `vite.config.js` to cache the React bundle for offline loading.
- [x] Implement `enableMultiTabIndexedDbPersistence` for Firebase Firestore to allow offline reads and queue offline writes.
- [x] Add an "Offline Mode" global event listener and toast banner that appears when `navigator.onLine === false`.

---

## 6. Analytics & Crash Reporting (P2)

### [x] Telemetry & Performance Tracking
- [x] Connect Firebase Performance Monitoring and Google Analytics to track web page load times, asset weights, and network request latency.
- [x] Implement production error capturing natively via Firebase Analytics custom events to log error state stacktraces securely.
