# MDNOTES

A local-first markdown note-taking application built with SvelteKit and Tailwind CSS. Create, edit, and organize your markdown documents with a clean, intuitive interface featuring a file explorer, tabbed editing, and real-time preview.

## Features

### 📁 File Management

- **File Explorer Sidebar**: Navigate through your markdown files and folders
- **Recent Files**: Quick access to recently opened files at the top of the sidebar
- **Pinned Files**: Pin frequently used files for easy access
- **Context Menu Operations**: Right-click to create, rename, or delete files and folders
- **Drag-to-Resize Sidebar**: Adjust the sidebar width to your preference (200px - 500px)
- **Persistent Folder State**: Expanded folders remain open when toggling the sidebar

### ✏️ Editor & Preview

- **Tabbed Interface**: Open multiple documents simultaneously
- **Split View**: Toggle between editor and preview modes
- **Customizable Formatting Toolbar**: Quick access to markdown formatting with customizable button selection
- **Syntax Highlighting**: Markdown syntax highlighting in the editor
- **Line Wrapping**: No horizontal scrolling - text wraps naturally
- **Unsaved Changes Indicator**: Visual indicator (●) shows unsaved changes in tabs
- **Export Functionality**: Export documents to HTML or PDF formats with preserved formatting
- **Editor Line Wrapping**: Toggle line wrapping in the markdown editor

### 🎨 Themes & Customization

- **Dark Mode Support**: Toggle between light and dark themes
- **System Theme Detection**: Automatically follow your system's theme preference
- **Customizable Settings**: Adjust editor font size, font family, and behavior options

### ⌨️ Keyboard Shortcuts

- `Ctrl+B` (Windows/Linux) or `Cmd+B` (Mac): Toggle sidebar
- `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac): Save current file
- `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac): Toggle editor/preview mode
- `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac): Export to HTML/PDF

### 🔧 Settings

- **Root Directory**: Choose your notes folder location
- **Editor Preferences**: Customize font size and font family
- **Interface Options**: Configure toolbar visibility, customize toolbar buttons, file tree spacing, and recent files count
- **Editor Settings**: Enable or disable line wrapping in the markdown editor
- **Auto-save**: Optional automatic saving with configurable delay
- **Behavior Options**: Configure confirmation dialogs and other preferences

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/faulander/markdown-notes.git
   cd markdown-notes
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

### Docker Deployment

For easy deployment with Docker:

1. **Quick setup with Docker**

   ```bash
   ./docker-setup.sh
   ```

2. **Manual Docker setup**

   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   Navigate to `http://localhost:3000`

Your notes will be stored in the `./notes` directory, and settings are persisted in a Docker volume. See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

## Usage Guide

### Getting Started

1. **Set Your Notes Directory**
   - Click the gear icon (⚙️) in the sidebar to open Settings
   - Click "Browse" next to "Root Directory"
   - Select your preferred folder for storing markdown files
   - Click "Save"

2. **Create Your First Note**
   - Right-click in the file explorer (or on a folder)
   - Select "Add Document"
   - Enter a filename (`.md` extension is added automatically)
   - Start writing!

### File Operations

#### Creating Files and Folders

- **New File**: Right-click in the sidebar → "Add Document"
- **New Folder**: Right-click in the sidebar → "Add Folder"
- Files are automatically saved with `.md` extension

#### Managing Files

- **Open File**: Click on any `.md` file in the sidebar
- **Recent Files**: Access recently opened files from the top of the sidebar
- **Pin Files**: Hover over files in the tree and click the pin icon for quick access
- **Delete**: Right-click on file/folder → "Delete"
- **Navigate**: Click folder arrows to expand/collapse directories

#### Recent Files Feature

- **Quick Access**: Recently opened files appear at the top of the sidebar
- **Configurable Count**: Set how many recent files to show (0-10) in Settings
- **Auto-Navigation**: Clicking a recent file automatically expands the tree to show its location
- **Order Preservation**: Recent files maintain their chronological order when accessed

### Editor Features

#### Writing and Editing

- The editor provides syntax highlighting for markdown
- **Customizable Formatting Toolbar**: Quick access to markdown formatting functions
- Text automatically wraps - no horizontal scrolling
- Unsaved changes are indicated with an orange dot (●) in the tab

#### Toolbar Customization

The formatting toolbar can be fully customized through Settings:

**Available Toolbar Buttons:**

- **Headings**: H1, H2, H3 buttons for different heading levels
- **Text Formatting**: Bold, italic, strikethrough, inline code
- **Code Blocks**: Insert code blocks with syntax highlighting
- **Lists**: Bullet lists and numbered lists
- **Links**: Insert markdown links
- **Quotes**: Blockquote formatting
- **Tables**: Insert formatted tables (advanced)
- **Horizontal Rule**: Insert divider lines (advanced)

**How to Customize:**

1. Open Settings (⚙️ icon in sidebar)
2. Navigate to "Interface" section
3. Ensure "Show editor toolbar" is enabled
4. Select/deselect specific toolbar buttons you want to display
5. Click "Save" to apply changes

**Default Configuration:**

- Most commonly used buttons are enabled by default (headings, bold, italic, code, links, lists, quotes)
- Advanced features like tables and horizontal rules are disabled by default but can be enabled as needed

#### Preview Mode

- Toggle between edit and preview modes with `Ctrl+Shift+E`
- Preview renders your markdown in real-time with GitHub-like styling
- Supports all standard markdown features including tables, strikethrough, and task lists
- **Syntax Highlighting**: Code blocks support syntax highlighting for 190+ programming languages
- **Supported Languages**: JavaScript, Python, TypeScript, Java, C#, C++, C, PHP, Ruby, Go, Rust, Kotlin, Swift, SQL, Bash, JSON, YAML, XML, HTML, CSS, and many more

### Tabs and Navigation

- **Multiple Files**: Open multiple documents in tabs
- **Switch Tabs**: Click on tab headers to switch between files
- **Close Tabs**: Click the × button on each tab
- **Unsaved Indicators**: Orange dot shows unsaved changes

### Export Documents

Export your markdown documents to HTML or PDF formats:

- **Quick Export**: Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac) to open the export dialog
- **Format Selection**: Choose between HTML (.html) or PDF (.pdf) formats
- **Preserved Formatting**: All markdown formatting, syntax highlighting, and styling are preserved
- **Automatic Download**: Files are automatically downloaded to your default download location

**Export Features:**

- **HTML Export**: Creates a standalone HTML file with embedded CSS and syntax highlighting
- **PDF Export**: Generates a high-quality PDF with proper formatting and print optimization
- **GitHub-like Styling**: Exported documents maintain the same clean, readable styling as the preview
- **Syntax Highlighting**: Code blocks retain their syntax highlighting in exported documents

### Editor Line Wrapping

Control how long lines are displayed in the markdown editor:

- **Quick Toggle**: Click the "Wrap: ON/OFF" button in the footer to instantly toggle line wrapping
- **Settings Control**: Access the line wrapping setting in the Settings modal under Interface options
- **Real-time Editor Updates**: Changes are applied immediately to the editor
- **Persistent Setting**: Your line wrapping preference is saved and remembered across sessions

**How it works:**
- **Wrap: ON** - Long lines wrap to the next line within the editor window (default, no horizontal scrolling)
- **Wrap: OFF** - Long lines extend horizontally, requiring horizontal scrolling to see the full line

### Customization

#### Themes

- **Light Mode**: Default clean interface
- **Dark Mode**: Easy on the eyes for low-light environments
- **System Theme**: Automatically matches your OS theme preference

#### Editor Settings

- **Font Size**: Adjust from 8px to 24px
- **Font Family**: Choose your preferred monospace font
- **Toolbar Visibility**: Show/hide the formatting toolbar
- **Toolbar Customization**: Select which formatting buttons to display (headings, bold, italic, code, links, lists, quotes, strikethrough, tables, horizontal rules)
- **Recent Files Count**: Configure how many recent files to display (0-10)
- **File Tree Spacing**: Choose between compact, normal, or comfortable spacing
- **Auto-save**: Enable automatic saving with customizable delay

## Development

### Tech Stack

- **Framework**: SvelteKit with Svelte 5
- **Styling**: Tailwind CSS
- **Editor**: CodeMirror 6
- **Markdown**: marked.js for rendering with GitHub Flavored Markdown support
- **Syntax Highlighting**: highlight.js with support for 190+ programming languages
- **File Watching**: chokidar for real-time updates
- **Build Tool**: Vite

### Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main application component
│   └── api/                  # Server-side API routes
│       ├── files/            # File CRUD operations
│       ├── browse-folder/    # Directory browsing
│       └── cwd/              # Current working directory
├── lib/
│   ├── components/           # Reusable Svelte components
│   │   ├── FileTree.svelte   # File explorer tree
│   │   ├── MarkdownEditor.svelte  # CodeMirror editor
│   │   ├── SettingsModal.svelte   # Settings interface
│   │   └── FolderPicker.svelte    # Directory picker
│   ├── stores/               # Svelte stores
│   │   └── settings.js       # Settings management
│   ├── theme.js              # Theme management
│   └── fileWatcher.js        # File system monitoring
├── app.css                   # Global styles
└── app.html                  # HTML template
```

### Development Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/faulander/mdnotes.git
   cd mdnotes
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up development environment**

   ```bash
   # Install recommended VS Code extensions
   # - Svelte for VS Code
   # - Tailwind CSS IntelliSense
   # - Prettier - Code formatter
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Run tests** (if available)
   ```bash
   npm test
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### API Endpoints

The application uses several API endpoints for file operations:

- `GET /api/files` - List files and directories
- `POST /api/files` - Create, update, or delete files
- `GET /api/browse-folder` - Browse directories for folder picker
- `GET /api/cwd` - Get current working directory

### Key Components

#### FileTree Component

- Renders the file explorer sidebar
- Handles file/folder operations
- Manages expanded/collapsed state
- Supports context menus

#### MarkdownEditor Component

- CodeMirror 6 integration
- Syntax highlighting
- Line wrapping
- Dark mode support

#### SettingsModal Component

- User preferences interface
- Theme selection
- Directory picker integration
- Settings persistence

### State Management

The application uses Svelte 5's runes for state management:

- `$state()` - Reactive state variables
- `$effect()` - Side effects and reactive updates
- `$props()` - Component properties

Settings are persisted to localStorage and managed through a custom store.

## Contributing

We welcome contributions! Please follow these guidelines:

### Before You Start

1. **Check existing issues** to see if your feature/bug is already being worked on
2. **Create an issue** to discuss major changes before implementing
3. **Fork the repository** and create a feature branch

### Development Workflow

1. **Fork and clone**

   ```bash
   git clone https://github.com/faulander/mdnotes.git
   cd mdnotes
   git checkout -b feature/your-feature-name
   ```

2. **Set up development environment**

   ```bash
   npm install
   npm run dev
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation if needed

4. **Test your changes**

   ```bash
   npm run lint
   npm run build
   ```

5. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- **JavaScript/Svelte**: Use ESLint and Prettier configurations
- **CSS**: Use Tailwind CSS utilities, avoid custom CSS when possible
- **Naming**: Use descriptive variable and function names
- **Comments**: Add comments for complex logic
- **File Structure**: Keep components focused and reusable

### Commit Message Format

Use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

### Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Add tests** for new features
3. **Ensure all tests pass** and code lints successfully
4. **Update the README** if needed
5. **Create detailed PR description** explaining your changes

### Reporting Issues

When reporting bugs, please include:

- Operating system and version
- Node.js version
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Feature Requests

For new features:

- Explain the use case
- Describe the proposed solution
- Consider alternative approaches
- Discuss implementation complexity

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/faulander/mdnotes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/faulander/mdnotes/discussions)
- **Documentation**: This README and inline code comments

## Roadmap

### Planned Features

- [ ] Search functionality across all notes
- [ ] Tag system for organizing notes
- [x] Export to PDF/HTML
- [ ] Plugin system for extensions
- [ ] Mobile responsive design
- [ ] Collaboration features
- [ ] Cloud sync options

### Current Limitations

- Local file system only (no cloud sync)
- No search functionality
- No collaborative editing
- Desktop-focused UI (not mobile optimized)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.
