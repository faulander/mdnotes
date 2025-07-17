# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2024-07-17

### Added
- **Editor Line Wrapping Control**: New setting to control line wrapping in the markdown editor
  - Toggle button in footer shows current state (Wrap: ON/OFF)
  - Setting available in Settings modal under Interface options
  - Real-time editor updates when toggled
  - Persistent setting saved across sessions
  - When enabled (default): Long lines wrap within editor window, no horizontal scrolling
  - When disabled: Long lines extend horizontally, requiring horizontal scrolling

### Enhanced
- **Footer Interface**: Added line wrap toggle button next to editor/preview mode toggle
- **Settings Modal**: Added editor line wrapping checkbox setting
- **CodeMirror Integration**: Dynamic line wrapping configuration based on user preference
- **User Experience**: Instant feedback and real-time editor updates

## [0.5.1] - 2024-07-17

### Changed
- **Improved Sidebar Layout**: Moved action buttons from header to bottom of sidebar
  - Settings button now appears at the bottom with a clear "Settings" label
  - "New Rootfolder" button moved to bottom alongside settings
  - Provides more space for recent files, pinned files, and directory navigation
  - Better visual hierarchy and improved user experience

### Fixed
- **Syntax Highlighting**: Fixed HTML escaping issues in markdown preview
  - Code blocks now display properly with syntax highlighting
  - Resolved multiple HTML escaping that caused garbled output
  - Improved error handling for highlight.js integration
  - Enhanced markdown rendering stability

### UI/UX Improvements
- **Enhanced Sidebar Header**: Simplified header design with centered folder name
- **Bottom Action Panel**: Both "New Rootfolder" and "Settings" buttons now at bottom
- **Better Space Utilization**: Maximized content area for file tree navigation
- **Improved Accessibility**: Action buttons are more prominent and clearly labeled
- **Consistent Section Styling**: Fixed header styling between recent files and pinned files sections

## [0.5.0] - 2024-07-17

### Added
- **Export Functionality**: Export markdown documents to HTML and PDF formats
  - HTML export with embedded CSS and syntax highlighting
  - PDF export with proper formatting and print optimization
  - GitHub-like styling preserved in exported documents
  - Automatic file download functionality
- **New Keyboard Shortcut**: `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac) to open export dialog
- **Export Modal**: User-friendly interface for selecting export format
- **Export API**: Server-side export processing with Puppeteer for PDF generation

### Technical Features
- **Puppeteer Integration**: High-quality PDF generation with proper formatting
- **Standalone HTML Export**: Complete HTML documents with embedded styling
- **Syntax Highlighting in Exports**: Code blocks maintain their highlighting in exported formats
- **Responsive Export Styling**: Exported documents are optimized for both screen and print

### Dependencies
- Added: `puppeteer@^24.14.0` for PDF generation

## [0.4.2] - 2024-07-17

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