# ContentPoster: Social Media Content Planner

A modern React-based social media scheduling and task management application designed for content creators and marketers to plan their social media posts and manage related tasks.

## Table of Contents

*   [About The Project](#about-the-project)
*   [Features](#features)
*   [Technology Stack](#technology-stack)
*   [Getting Started](#getting-started)
*   [Project Structure](#project-structure)
*   [License](#license)

## About The Project

ContentPoster is a full-stack web application built with React that enables users to schedule, manage, and analyze their social media content. The application provides a clean, intuitive interface for planning posts across multiple platforms with real-time analytics and media management capabilities.

## Features

### Core Functionality

*   **User Authentication:** Secure sign up and login with Firebase Authentication (email/password)
*   **Post Management (CRUD):** Create, read, update, and delete social media posts via a modal form
*   **Multi-Platform Support:** Schedule posts for Twitter/X, Instagram, LinkedIn, TikTok, Dribbble, and Facebook
*   **Calendar View:** Interactive calendar for visualizing and filtering posts by date
*   **Task Management:** Separate task view for creating and tracking content-related tasks
*   **Templates:** Save and reuse post templates for quick content creation

### Advanced Features

*   **Media Library:** Upload and manage images/videos for posts using Firebase Storage
*   **Analytics Dashboard:** Real-time statistics showing completed, scheduled, and in-progress posts
*   **Dark/Light Theme:** Toggle between light and dark modes for comfortable viewing
*   **Search & Filter:** Filter posts by platform, date, or search query
*   **Sortable Posts:** Drag-and-drop reordering of post cards
*   **Timezone Support:** Configurable timezone settings for post scheduling
*   **Recurring Posts:** Schedule automated repeating posts with daily, weekly, monthly, or yearly intervals
*   **Best Time Suggestions:** AI-powered optimal posting time recommendations based on platform engagement patterns
*   **Conflict Detection:** Real-time alerts for overlapping or conflicting scheduled posts on the same platform
*   **Time Zone Grid:** Visual display of posting times across multiple timezones for global audience targeting
*   **Draft Scheduling:** Save and queue draft posts with conditional triggers for auto-publishing

### Technical Features

*   **Real-time Sync:** Firestore integration for real-time data synchronization
*   **Responsive Design:** Fully responsive UI with Tailwind CSS
*   **Accessibility:** Skip links and ARIA labels for screen reader support
*   **PWA Support:** Progressive Web App capabilities with service workers

## Technology Stack

*   **Frontend:** React 18, React Router DOM, Vite
*   **Styling:** Tailwind CSS 4, PostCSS
*   **Authentication:** Firebase Auth
*   **Database:** Firebase Firestore
*   **Storage:** Firebase Storage
*   **Charts:** Chart.js, react-chartjs-2
*   **Drag & Drop:** @dnd-kit/core, @dnd-kit/sortable
*   **Testing:** Vitest, React Testing Library, Cypress (E2E)
*   **Icons:** Font Awesome (via CDN)

## Getting Started

### Prerequisites

*   Node.js 18+ 
*   npm or yarn
*   Firebase project (for auth, firestore, and storage)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/anselmem/ContentPoster.git
    cd ContentPoster
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    
    Create a `.env` file in the project root with your Firebase configuration:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
    
    Or copy from `.env.example` and fill in your values.

4.  **Start development server**
    ```bash
    npm run dev
    ```

5.  **Build for production**
    ```bash
    npm run build
    ```

### Testing

Run unit tests:
```bash
npm run test
```

Run E2E tests:
```bash
npm run test:e2e
```

Open Cypress test runner:
```bash
npm run test:e2e:open
```

## Project Structure

```
ContentPoster/
├── src/
│   ├── components/
│   │   ├── Auth/           # Login and Signup forms
│   │   ├── Dashboard/      # Main dashboard layout
│   │   ├── Modals/         # Post and upload modals
│   │   ├── Posts/          # Post card and grid components
│   │   ├── UI/             # Reusable UI components
│   │   └── Views/          # Main view pages
│   ├── config/             # Platform configuration
│   ├── context/            # React contexts (Auth, Theme)
│   ├── services/           # Firebase services
│   ├── utils/              # Utility functions
│   └── test/               # Test setup and utilities
├── public/                 # Static assets
├── api/                    # Server-side API (if applicable)
├── components/             # Legacy components
├── pages/                 # Legacy pages
├── tests/                 # Additional tests
└── package.json
```

## License

Distributed under the MIT License. See `LICENSE` for more information.
