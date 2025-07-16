# Product Requirements Document: Local-First Markdown Note-Taking App

**Document Version:** 1.0
**Date:** July 16, 2025

---

## 1. Introduction

This Product Requirements Document (PRD) details the specifications for a local-first markdown note-taking application. The application aims to provide a robust, intuitive, and efficient environment for users to manage their notes directly on their local file system, leveraging modern web technologies packaged as a desktop application.

## 2. Product Overview

The application is a desktop note-taking tool that operates on markdown files stored locally. It features a file explorer on the left sidebar to navigate and manage notes and folders, and a main content area on the right for viewing and editing markdown files. Key principles include local-first storage, full user control over data, and a clean, performant user interface.

## 3. Goals

*   **Primary Goal:** Enable users to easily create, organize, edit, and view markdown notes stored on their local file system.
*   **Secondary Goal:** Provide a fast and responsive user experience that integrates seamlessly with the local file system.
*   **Tertiary Goal:** Ensure data privacy and ownership by keeping all user data strictly local.

## 4. Target Audience

*   **Primary:** Developers, writers, students, and professionals who prioritize local data storage, use markdown extensively, and prefer a minimalist, efficient interface.
*   **Secondary:** Users seeking an alternative to cloud-based note-taking solutions due to privacy concerns or offline work requirements.

## 5. User Stories

### 5.1. File & Folder Management

*   **As a user, I want to see my local file system's folder and markdown file structure in the left sidebar, so I can easily navigate my notes.**
    *   **Acceptance Criteria:**
        *   The left sidebar accurately reflects the folder and `.md` file structure of the designated root directory.
        *   Changes made to the file system outside the app (e.g., creating a folder in Explorer) are reflected in the app's sidebar.
*   **As a user, I want to create a new folder from within the app, so I can organize my notes hierarchically.**
    *   **Acceptance Criteria:**
        *   Right-clicking a folder in the sidebar presents an "Add Folder" option.
        *   Selecting "Add Folder" opens a modal to input the new folder name.
        *   Upon confirmation, the new folder is created on the file system and immediately appears in the sidebar.
        *   Validation ensures folder names are valid for the operating system (e.g., no illegal characters).
*   **As a user, I want to create a new markdown document from within the app, so I can start a new note.**
    *   **Acceptance Criteria:**
        *   Right-clicking a folder in the sidebar presents an "Add Document" option.
        *   Selecting "Add Document" opens a modal to input the new document name (which will become the file name).
        *   Upon confirmation, a new `.md` file is created within the selected folder, appears in the sidebar, and opens in a new tab in the main content area.
        *   Validation ensures document names are valid for the operating system and defaults to `.md` extension.
*   **As a user, I want to delete a folder from within the app, so I can remove unneeded organizational structures.**
    *   **Acceptance Criteria:**
        *   Right-clicking a folder in the sidebar presents a "Delete" option.
        *   If the folder is non-empty, a confirmation prompt appears *if* the user has the "Ask before deleting non-empty folder" setting enabled.
        *   Upon confirmation (or if the setting is disabled/folder is empty), the folder and its contents are permanently deleted from the file system and removed from the UI.
*   **As a user, I want to delete a markdown document, so I can remove unneeded notes.**
    *   **Acceptance Criteria:**
        *   Right-clicking a document in the sidebar (or an open tab) presents a "Delete" option.
        *   Upon confirmation, the document is permanently deleted from the file system. If open, its tab is closed.

### 5.2. Note Editing & Viewing

*   **As a user, I want to open a markdown file by clicking it in the sidebar, so I can view or edit its content.**
    *   **Acceptance Criteria:**
        *   Clicking an `.md` file in the sidebar opens it in a new tab in the main content area.
        *   If the file is already open, the existing tab becomes active.
*   **As a user, I want to switch between open notes using tabs at the top of the main content area, so I can quickly navigate between my active documents.**
    *   **Acceptance Criteria:**
        *   Tabs are clearly labeled with the document's filename.
        *   Clicking a tab activates that document in the editor/viewer.
*   **As a user, I want to see an indicator on tabs that have unsaved changes, so I know which notes need saving.**
    *   **Acceptance Criteria:**
        *   An asterisk, dot, or similar clear visual cue appears on the tab when the document has unsaved changes.
*   **As a user, I want to close an open tab, so I can manage my workspace.**
    *   **Acceptance Criteria:**
        *   Each tab has a "close" button (e.g., 'x' icon).
        *   If the document has unsaved changes, a confirmation prompt appears *if* the user has the "Ask before closing unsaved tab" setting enabled.
        *   Upon confirmation (or if the setting is disabled/no unsaved changes), the tab closes.
*   **As a user, I want to toggle between a markdown editor and a rendered view, so I can either write/edit or easily read my notes.**
    *   **Acceptance Criteria:**
        *   A keyboard shortcut (`Ctrl+Shift+E` / `Cmd+Shift+E` by default, configurable) toggles the display mode.
        *   Editor mode shows raw markdown text for editing.
        *   Viewer mode displays the rendered markdown cleanly and accurately.
*   **As a user, I want to save my current note with a keyboard shortcut, so I can quickly persist my changes.**
    *   **Acceptance Criteria:**
        *   `Ctrl+S` / `Cmd+S` saves the content of the active tab to its corresponding file.
        *   The unsaved changes indicator disappears upon saving.

### 5.3. Application Layout & Settings

*   **As a user, I want to hide and show the left sidebar, so I can maximize my editing space when needed.**
    *   **Acceptance Criteria:**
        *   A keyboard shortcut (`Ctrl+B` / `Cmd+B` by default) toggles the visibility of the left sidebar.
        *   The main content area expands to fill the space when the sidebar is hidden.
*   **As a user, I want to configure basic application behavior, such as confirmation prompts, so I can tailor the app to my workflow.**
    *   **Acceptance Criteria:**
        *   A "Settings" or "Preferences" area is accessible.
        *   Options exist to enable/disable:
            *   "Ask before closing a tab with unsaved changes" (default: enabled).
            *   "Ask before deleting a non-empty folder" (default: enabled).
*   **As a user, I want to set the root directory for my notes, so the app always displays the correct folder structure.**
    *   **Acceptance Criteria:**
        *   A setting is available to select a base directory.
        *   The app's file explorer reflects the content of this chosen directory.
*   **As a user, I want the application to respect my system's dark mode preference or allow me to manually switch, so it integrates well with my operating system's aesthetic.**
    *   **Acceptance Criteria:**
        *   The UI adopts a dark theme by default if the OS is in dark mode.
        *   A user setting allows overriding the system preference to force light or dark mode.

## 6. Functional Specifications

### 6.1. File System Interaction

*   **Path Management:** All file system operations (creation, deletion, read, write) **MUST** internally use full, absolute file paths. This applies to both Node.js file system calls and any internal data structures managing file references.
    *   *Example:* When creating a file in `Notes/Projects/MyProject`, the internal operation will use `C:\Users\User\Documents\Notes\Projects\MyProject\NewFile.md` (or equivalent for macOS/Linux).
*   **Real-time File System Monitoring:** The application **SHALL** implement a file system watcher (e.g., using Node.js `fs.watch` or a more robust library like `chokidar`) to detect external changes (creation, deletion, rename) within the configured root directory and dynamically update the sidebar UI.
*   **File Name Validation:** When creating new folders or documents, input names **SHALL** be validated against operating system restrictions for file/folder naming (e.g., disallowing `/\?%*:|"<>` characters on Windows). An error message will be displayed for invalid input.
*   **Markdown File Extension:** All newly created documents **SHALL** default to the `.md` extension.

### 6.2. UI Components & Behavior

*   **Left Sidebar:**
    *   Displays a tree-view of folders and `.md` files.
    *   Expandable/collapsible folders.
    *   Context menu on right-click for folders: "Add Folder", "Add Document", "Delete".
    *   Context menu on right-click for `.md` files: "Delete".
    *   Visual distinction between folders and files (e.g., icons).
*   **Tabbed Interface:**
    *   Tabs at the top of the content area.
    *   Each tab shows the file's base name (e.g., `My Note` for `My Note.md`).
    *   Unsaved changes indicator: A small, easily noticeable icon (e.g., `*` or `●`) next to the filename on the tab.
    *   Close button (`x`) on each tab.
*   **Markdown Editor/Viewer:**
    *   A single pane that dynamically switches between a text area for editing and a rendered HTML view.
    *   Editor mode: Syntax highlighting for markdown **SHOULD** be implemented.
    *   Viewer mode: Renders standard markdown elements (headings, bold, italics, lists, links, images, code blocks, tables, etc.).
*   **Modals:**
    *   All "Add", "Delete confirmation", and "Unsaved changes" prompts will be presented as distinct, dismissible modals.
    *   Modals will have clear titles, instructions, and actionable buttons (e.g., "Confirm", "Cancel", "Save & Close", "Discard & Close").

### 6.3. User Settings

*   **Persistence:** All user settings **MUST** be persisted locally (e.g., in Electron's user data directory, potentially using SQLite or a simple JSON file).
*   **Root Directory:** A file picker dialog will be used to allow users to select their desired notes root directory.

## 7. Non-Functional Requirements

### 7.1. Performance

*   **Application Startup:** The application **SHALL** launch and be ready for interaction within 3 seconds on a typical desktop system.
*   **File Loading:** Markdown files up to 100KB **SHALL** load and render/become editable within 500ms.
*   **File Operations:** Create, save, and delete file operations **SHALL** complete within 100ms.
*   **UI Responsiveness:** The UI **SHALL** remain responsive during file operations and file system monitoring, ensuring no perceptible lag.

### 7.2. Usability & User Experience (UX)

*   **Intuitive Design:** The UI **SHALL** be clean, minimalist, and easy to understand, following common desktop application conventions.
*   **Visual Feedback:** All user interactions (e.g., button clicks, file saving) **SHALL** provide immediate and clear visual feedback.
*   **Error Handling:** User-friendly error messages **SHALL** be displayed for invalid operations or file system issues (e.g., "Permission Denied," "Invalid File Name").
*   **Dark Mode:** The application **MUST** support a dark mode theme that can be toggled by the user or follow system preferences.
*   **Aesthetics:** The UI **SHALL** leverage Tailwind CSS to create a modern and visually appealing interface, focusing on readability and a smooth user experience.
*   **Accessibility:** Design and implementation **SHOULD** consider basic accessibility principles (e.g., keyboard navigation, sufficient color contrast).

### 7.3. Reliability

*   **Data Integrity:** The application **SHALL** prioritize data integrity, ensuring files are saved correctly and no data loss occurs during unexpected shutdowns or errors.
*   **Error Recovery:** The application **SHALL** gracefully handle file system errors (e.g., disk full, file locked) and inform the user appropriately.

### 7.4. Security

*   **Local Data Privacy:** All user notes and configurations **SHALL** remain strictly local to the user's machine. No data will be transmitted externally without explicit user action and consent.
*   **Electron Best Practices:** The Electron application **SHALL** follow recommended security guidelines to mitigate common vulnerabilities (e.g., disabling NodeIntegration in renderers unless necessary and properly sandboxed, context isolation).

### 7.5. Compatibility

*   **Operating Systems:** The application **SHALL** be compatible with the latest stable versions of Windows, macOS, and major Linux distributions.

## 8. Technical Considerations (High-Level)

*   **Frameworks:**
    *   **Electron:** For desktop application wrapping and access to Node.js APIs for file system interactions.
    *   **SvelteKit:** For the application's UI and business logic, leveraging its server-side capabilities for local operations where appropriate.
    *   **Svelte 5 (Runes Syntax):** For component development, ensuring highly reactive and performant UI.
    *   **Tailwind CSS:** For efficient and customizable styling.
*   **Database (Internal):** SQLite will be used for storing application settings and potentially future meta-data. It will **NOT** be used to store the content of markdown notes themselves, which remain as plain files.
*   **Markdown Parser:** A robust markdown parsing and rendering library (e.g., `marked`, `markdown-it`) will be selected and integrated.
*   **File System Operations:** Node.js `fs` module will be used directly for file and directory manipulation. `chokidar` or similar will be considered for robust file system watching.
*   **Local Storage:** `localStorage` or Electron's `app.getPath('userData')` will be used for settings persistence if not handled by SQLite.

## 9. Out of Scope (for initial release)

*   Cloud synchronization (Dropbox, Google Drive, OneDrive, etc.).
*   Advanced note-linking or graph views.
*   Tagging or advanced search beyond basic file name filtering.
*   Version control for notes.
*   Export to other formats (PDF, HTML).
*   Real-time collaboration.
*   Spell-checking integration.

---