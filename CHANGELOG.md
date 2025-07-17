# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **REVERTED**: Temporarily reverted FileTree component to use original custom implementation
  - @svar/filemanager integration encountered display issues with tree view
  - Reverted to original custom FileTree component while maintaining full functionality
  - All existing features preserved: pinned files, recent files, context menus, and file operations
  - Maintained dark mode support and existing styling integration
  - File tree now displays correctly with proper root path configuration

### Fixed
- Fixed "no markdown files found" issue when files were present
- Restored proper file tree display functionality
- Fixed pinned files section not showing properly
- Ensured root path configuration from settings is properly respected
- Fixed pinned files icon color inconsistency - now uses blue color to match recent files
- Simplified pinned files implementation to be independent of tree expansion state

### Technical Details
- **Simplified pinned files functionality**: Removed complex tree expansion logic for pinned files
  - Pinned files now display immediately without requiring parent directories to be expanded
  - Improved performance by eliminating unnecessary directory traversal
  - Pinned files list is now generated directly from the pinnedFiles set with just path and name
- Maintained data format conversion utilities for future @svar/filemanager integration
- Preserved all existing methods: `refresh()`, `expandFolder()`, `navigateToFile()`
- Removed excessive debugging console logs for cleaner output
- @svar/filemanager component kept hidden for future implementation
- All existing props and functionality maintained for seamless operation

### Dependencies
- Kept: `wx-svelte-filemanager@^2.1.0` (for future use)

## [0.4.1] - 2024-07-17

### Added
- File explorer with context menus
- Tabbed markdown editor
- Real-time preview mode
- Dark mode support
- Resizable sidebar
- Settings management
- Keyboard shortcuts
- Persistent folder states
- Auto-save functionality
- Recent files section with configurable count
- Pinned files for quick access
- Formatting toolbar with markdown shortcuts
- Customizable toolbar buttons - choose which formatting options to display
- Enhanced hover effects for better user interaction
- Strikethrough support in markdown preview
- Syntax highlighting for 190+ programming languages in code blocks
- Docker containerization support

### Technical Features
- Built with SvelteKit and Svelte 5
- Tailwind CSS for styling
- CodeMirror 6 for editing
- marked.js for markdown rendering with GitHub Flavored Markdown support
- highlight.js for syntax highlighting
- chokidar for file watching
- Comprehensive API endpoints for file operations
- Reactive state management with Svelte 5 runes
- Local storage persistence for settings

### Performance
- Application startup within 3 seconds
- File loading under 500ms for files up to 100KB
- File operations complete within 100ms
- Responsive UI with no perceptible lag
- Efficient caching and debouncing mechanisms