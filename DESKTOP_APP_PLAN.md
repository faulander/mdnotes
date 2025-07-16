# Desktop App Conversion Plan

## Overview

This document outlines the plan to convert the Markdown Notes web application into a native desktop application using either Electron or Tauri.

## Technology Comparison

### Option 1: Electron
**Pros:**
- Mature ecosystem with extensive documentation
- Large community and plugin ecosystem
- Easy to package and distribute
- Cross-platform (Windows, macOS, Linux)
- Direct access to Node.js APIs
- Existing SvelteKit integration examples

**Cons:**
- Larger bundle size (~100-150MB)
- Higher memory usage
- Security considerations with Node.js access
- Chromium dependency

### Option 2: Tauri
**Pros:**
- Smaller bundle size (~10-20MB)
- Better performance and memory efficiency
- Rust-based backend for security
- Uses system webview (WebKit/WebView2/WebkitGTK)
- Built-in security features
- Growing ecosystem

**Cons:**
- Newer technology, smaller community
- Learning curve for Rust APIs
- Limited plugin ecosystem
- Requires Rust toolchain for development

## Recommended Choice: Tauri

**Recommendation:** Tauri is the better choice for this project because:
1. **Size matters:** Markdown editor should be lightweight
2. **Security:** File system access with better sandboxing
3. **Performance:** Better for text editing and file operations
4. **Future-proof:** Modern architecture and growing adoption

## Implementation Plan

### Phase 1: Setup and Basic Conversion (Week 1)

#### 1.1 Environment Setup
```bash
# Install Rust and Tauri CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install tauri-cli

# Initialize Tauri in existing project
cargo tauri init
```

#### 1.2 Project Structure Changes
```
src-tauri/          # Rust backend
├── src/
│   ├── main.rs     # Main Tauri app
│   ├── commands.rs # Custom commands
│   └── menu.rs     # Application menu
├── Cargo.toml      # Rust dependencies
└── tauri.conf.json # Tauri configuration

src/                # Frontend (unchanged)
├── routes/
├── lib/
└── app.html
```

#### 1.3 Basic Migration Tasks
- [ ] Configure `tauri.conf.json` for app metadata
- [ ] Set up build pipeline for SvelteKit + Tauri
- [ ] Create basic Rust backend structure
- [ ] Test basic app compilation and launch

### Phase 2: File System Integration (Week 2)

#### 2.1 Replace Web APIs with Tauri APIs
Replace current file operations with Tauri commands:

**Current (Web):**
```javascript
// src/routes/api/files/+server.js
const response = await fetch('/api/files', { ... });
```

**New (Tauri):**
```javascript
// src/lib/api/files.js
import { invoke } from '@tauri-apps/api/tauri';

export async function listFiles(rootPath) {
  return await invoke('list_files', { rootPath });
}
```

#### 2.2 Rust Backend Commands
```rust
// src-tauri/src/commands.rs
#[tauri::command]
async fn list_files(root_path: String) -> Result<Vec<FileItem>, String> {
    // Implementation
}

#[tauri::command]
async fn read_file(file_path: String) -> Result<String, String> {
    // Implementation
}

#[tauri::command]
async fn write_file(file_path: String, content: String) -> Result<(), String> {
    // Implementation
}
```

#### 2.3 Migration Tasks
- [ ] Create Tauri commands for all file operations
- [ ] Replace API routes with Tauri invoke calls
- [ ] Update FileTree component to use Tauri APIs
- [ ] Update file save/load functionality
- [ ] Test file operations across platforms

### Phase 3: Native Features Integration (Week 3)

#### 3.1 Native Menu System
```rust
// src-tauri/src/menu.rs
use tauri::{Menu, MenuItem, Submenu};

pub fn create_menu() -> Menu {
    Menu::new()
        .add_submenu(Submenu::new("File", Menu::new()
            .add_item(MenuItem::new("New File").accelerator("CmdOrCtrl+N"))
            .add_item(MenuItem::new("Open Folder").accelerator("CmdOrCtrl+O"))
            .add_item(MenuItem::new("Save").accelerator("CmdOrCtrl+S"))
        ))
        .add_submenu(Submenu::new("Edit", Menu::new()
            .add_item(MenuItem::new("Copy").accelerator("CmdOrCtrl+C"))
            .add_item(MenuItem::new("Paste").accelerator("CmdOrCtrl+V"))
        ))
}
```

#### 3.2 System Integration Features
- [ ] Native file dialogs for folder selection
- [ ] System tray integration
- [ ] Native notifications
- [ ] File associations (.md files)
- [ ] Recent files list
- [ ] Auto-updater setup

#### 3.3 Enhanced Functionality
- [ ] Global hotkeys for quick access
- [ ] Window state persistence
- [ ] Multiple window support
- [ ] Print functionality
- [ ] Export to PDF/HTML

### Phase 4: Security and Performance (Week 4)

#### 4.1 Security Configuration
```json
// tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "removeFile": true,
        "removeDir": true
      },
      "dialog": {
        "open": true,
        "save": true
      },
      "notification": {
        "all": true
      }
    }
  }
}
```

#### 4.2 Performance Optimizations
- [ ] Bundle size optimization
- [ ] Lazy loading for large file trees
- [ ] Virtual scrolling for performance
- [ ] Background file indexing
- [ ] Memory management improvements

### Phase 5: Distribution and Packaging (Week 5)

#### 5.1 Build Configuration
```json
// tauri.conf.json
{
  "bundle": {
    "identifier": "com.faulander.markdownnotes",
    "icon": ["icons/icon.icns", "icons/icon.ico"],
    "targets": ["msi", "deb", "dmg", "appimage"]
  }
}
```

#### 5.2 Distribution Tasks
- [ ] Icon design for all platforms
- [ ] Code signing setup (Windows/macOS)
- [ ] Auto-updater configuration
- [ ] GitHub Actions for automated builds
- [ ] Distribution through GitHub Releases
- [ ] Consider app stores (Microsoft Store, Mac App Store)

## Detailed Implementation Guide

### 1. File System API Migration

**Before (SvelteKit API routes):**
```javascript
// src/routes/api/files/+server.js
export async function GET({ url }) {
  const rootPath = url.searchParams.get('root');
  const entries = await fs.promises.readdir(rootPath);
  return json({ items: entries });
}
```

**After (Tauri commands):**
```rust
// src-tauri/src/commands.rs
#[tauri::command]
async fn list_files(root_path: String, path: String) -> Result<FileListResponse, String> {
    let full_path = Path::new(&root_path).join(&path);
    let entries = fs::read_dir(full_path)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            // Only include .md files and directories
            if path.is_dir() || path.extension()? == "md" {
                Some(FileItem {
                    name: path.file_name()?.to_string_lossy().into_owned(),
                    path: path.to_string_lossy().into_owned(),
                    is_dir: path.is_dir(),
                })
            } else {
                None
            }
        })
        .collect();
    
    Ok(FileListResponse { items: entries })
}
```

### 2. Settings Migration

**Current (localStorage):**
```javascript
// src/lib/stores/settings.js
localStorage.setItem('markdown-notes-settings', JSON.stringify(settings));
```

**New (Tauri app data):**
```rust
// src-tauri/src/settings.rs
use tauri::api::path;

#[tauri::command]
async fn save_settings(settings: Settings) -> Result<(), String> {
    let app_dir = path::app_data_dir(&config).ok_or("Failed to get app data dir")?;
    let settings_path = app_dir.join("settings.json");
    let settings_json = serde_json::to_string_pretty(&settings)
        .map_err(|e| e.to_string())?;
    fs::write(settings_path, settings_json)
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

### 3. Build Scripts

**Package.json updates:**
```json
{
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "tauri": "tauri"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.0.0"
  },
  "dependencies": {
    "@tauri-apps/api": "^1.0.0"
  }
}
```

## Benefits of Desktop App

### For Users
1. **Better Performance:** Native file system access
2. **Offline First:** No need for local server
3. **System Integration:** File associations, context menus
4. **Security:** Sandboxed file access
5. **Native Feel:** Platform-specific UI elements

### For Developers
1. **Simplified Distribution:** Single executable
2. **No Server Required:** Eliminates Node.js server complexity
3. **Better File Watching:** Native file system events
4. **Platform APIs:** Access to system notifications, etc.

## Migration Timeline

| Week | Focus | Deliverables |
|------|-------|-------------|
| 1 | Setup & Basic Conversion | Working Tauri app with basic UI |
| 2 | File System Integration | All file operations working |
| 3 | Native Features | Menus, dialogs, system integration |
| 4 | Security & Performance | Optimized and secure app |
| 5 | Distribution | Packaged apps for all platforms |

## Post-Migration Features

After successful migration, consider these desktop-specific features:

1. **Plugin System:** Allow community extensions
2. **Multiple Vaults:** Support for multiple note directories
3. **Sync Integration:** Cloud storage integration
4. **Advanced Search:** Full-text search with indexing
5. **Themes:** More desktop-appropriate themes
6. **Workspace Management:** Save/restore window layouts

## Conclusion

Converting to Tauri will provide a superior user experience while maintaining the current web-based UI. The migration can be done incrementally, ensuring the app remains functional throughout the process.

The estimated timeline is 4-5 weeks for a complete migration, with the ability to release beta versions after week 2 for community testing.