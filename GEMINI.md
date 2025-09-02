Project: "Scheduler" - Social Media Content Planner
1. Project Overview
This project is a web-based social media scheduling and task management application. Its primary goal is to provide a clean, intuitive, and dynamic interface for content creators and marketers to plan their social media posts and manage related tasks. The application started as a UI clone and is being progressively enhanced with full-stack functionality. The long-term vision is to develop this into a commercial SaaS product.

The user, Anselme Motcho, is a digital marketer and web developer proficient in the MERN/FERN stack. The development process is iterative, focusing on adding one major feature set at a time.

2. Core Features Implemented
The application currently operates as a single-page, client-side tool with the following features managed by JavaScript arrays:

Full Post Management (CRUD):

Create, Update, and Delete social media posts via a reusable modal form.

Post data includes title, image URL, date, time, platform, and a completion status.

Dynamic Calendar & Filtering:

A fully interactive calendar allows filtering posts by a specific day.

Top navigation filters posts by social media platform (Instagram, LinkedIn, etc.).

Task Management (CRUD):

A separate view for creating, reading, updating (marking as complete), and deleting tasks.

Dynamic Statistics Panel:

The stats widgets (Completed, Total Post, In Progress, Out of Scheduled) are calculated in real-time based on the current date and the status of the posts in the data array.

View Switching:

Users can toggle between the main "Scheduler" view and the "Tasks" view.

3. Future Roadmap & Development Goals
The immediate next steps involve transforming this from a client-side prototype into a full-stack application.

Backend & Database Integration (Priority 1):

Technology: Use Firebase (Firestore for database, Firebase Auth for users, Firebase Storage for uploads).

Goal: Replace the local JavaScript arrays (posts, tasks) with data fetched from Firestore. Implement user authentication so that data is persistent and private to each user.

Advanced SaaS Features (Phase 2):

Analytics Dashboard: A dedicated page to track post-performance metrics.

Media Library: A central repository for users to manage their content assets.

Direct API Publishing: Connect to social media APIs to enable automatic posting.

Team & Collaboration Features (Phase 3):

Implement workspaces, user roles, and approval workflows.

4. Technology Stack
Frontend: HTML5, Tailwind CSS, vanilla JavaScript (ES6+).

Charts: Chart.js for the "Post Stats" graph.

Icons: Font Awesome.

Planned Backend: Firebase.

5. Code Architecture & Style
Single-File Structure: All HTML, CSS (via <style> tag), and JavaScript are contained within a single index.html file. Please maintain this structure.

State Management: Application state is managed by top-level JavaScript arrays (posts, tasks) and variables (selectedDate, selectedPlatform).

Functional Approach: The JavaScript is organized into functions, each with a clear responsibility (e.g., renderPosts(), updateStats(), renderCalendar()).

Event Delegation: Event listeners are attached to parent elements (e.g., postsGrid, taskList, sidebarNav) to manage events for dynamically created child elements.

6. How to Assist
Maintain Existing Patterns: When adding new features, follow the existing coding style and architectural patterns (e.g., create new render... and handle... functions as needed).

Focus on the Roadmap: Prioritize suggestions that align with the next steps outlined in the "Future Roadmap," especially the upcoming Firebase integration.

Explain Changes Clearly: When providing updated code, clearly explain what was added or changed and why it aligns with the project goals.