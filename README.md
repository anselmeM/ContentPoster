# ContentPoster: Social Media Content Planner

A web-based social media scheduling and task management application designed for content creators and marketers to plan their social media posts and manage related tasks.

## Live Demo

You can view a live demo of the application here: [https://anselmem.github.io/ContentPoster/](https://anselmem.github.io/ContentPoster/)

## Table of Contents

*   [About The Project](#about-the-project)
*   [Features](#features)
*   [Technology Stack](#technology-stack)
*   [Future Roadmap](#future-roadmap)
*   [Getting Started](#getting-started)
*   [Contributing](#contributing)
*   [License](#license)

## About The Project

ContentPoster started as a UI clone and is being progressively enhanced with full-stack functionality. Its primary goal is to provide a clean, intuitive, and dynamic interface for planning social media content. The long-term vision is to develop this into a commercial SaaS product.

## Features

The application currently operates as a single-page, client-side tool with the following features:

*   **Full Post Management (CRUD):** Create, Update, and Delete social media posts via a reusable modal form. Post data includes title, image URL, date, time, platform, and a completion status.
*   **Dynamic Calendar & Filtering:** An interactive calendar allows filtering posts by a specific day. Top navigation filters posts by social media platform (Instagram, LinkedIn, etc.).
*   **Task Management (CRUD):** A separate view for creating, reading, updating (marking as complete), and deleting tasks.
*   **Dynamic Statistics Panel:** Stats widgets (Completed, Total Post, In Progress, Out of Scheduled) are calculated in real-time based on the current date and post status.
*   **View Switching:** Users can toggle between the main "Scheduler" view and the "Tasks" view.

## Technology Stack

*   **Frontend:** HTML5, Tailwind CSS, vanilla JavaScript (ES6+)
*   **Charts:** Chart.js for the "Post Stats" graph
*   **Icons:** Font Awesome
*   **Planned Backend:** Firebase (Firestore for database, Firebase Auth for users, Firebase Storage for uploads)

## Future Roadmap

The immediate next steps involve transforming this from a client-side prototype into a full-stack application.

*   **Backend & Database Integration (Priority 1):** Replace local JavaScript arrays with data fetched from Firestore. Implement user authentication for persistent and private user data.
*   **Advanced SaaS Features (Phase 2):** Analytics Dashboard, Media Library, Direct API Publishing.
*   **Team & Collaboration Features (Phase 3):** Workspaces, user roles, and approval workflows.

## Getting Started

To get a local copy up and running, simply open the `index.html` file in your web browser.

```bash
# Clone the repository
git clone https://github.com/anselmem/ContentPoster.git

# Navigate to the project directory
cd ContentPoster

# Open index.html in your browser
# (e.g., by double-clicking the file or using a command like 'start index.html' on Windows)
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
