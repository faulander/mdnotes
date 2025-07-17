<script>
	import { onMount, onDestroy } from 'svelte';
	import { marked } from 'marked';
	import { markedHighlight } from 'marked-highlight';
	import hljs from 'highlight.js';
	import FileTree from '$lib/components/FileTree.svelte';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';
	import Footer from '$lib/components/Footer.svelte';

	// Configure marked to support GitHub Flavored Markdown (GFM) with syntax highlighting
	marked.use(markedHighlight({
		langPrefix: 'hljs language-',
		highlight(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	}));

	marked.setOptions({
		gfm: true,
		breaks: true
	});
	import { FileWatcher } from '$lib/fileWatcher.js';
	import { settings } from '$lib/stores/settings.js';
	import { applyTheme, watchSystemTheme } from '$lib/theme.js';

	let sidebarVisible = $state(true);
	let openTabs = $state([]);
	let activeTab = $state(null);
	let isEditing = $state(true);
	let rootPath = $state('');
	let showModal = $state(false);
	let modalType = $state('');
	let modalTitle = $state('');
	let modalInput = $state('');
	let modalContext = $state(null);
	let fileWatcher = $state(null);
	let fileTreeComponent = $state(null);
	let showSettings = $state(false);
	let currentSettings = $state({});
	let isDarkMode = $state(false);
	let recentlySavedFiles = $state(new Set());
	let sidebarWidth = $state(250);
	let isResizing = $state(false);
	let expandedFolders = $state(new Set());
	let pinnedFiles = $state(new Set());
	let recentFiles = $state([]);
	let showExportModal = $state(false);

	function toggleSidebar() {
		sidebarVisible = !sidebarVisible;
	}

	function openExportModal() {
		if (activeTab) {
			showExportModal = true;
		}
	}

	function downloadFile(blob, filename) {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}

	async function handleExport(event) {
		const { format, content, filename, path } = event.detail;
		
		console.log('Export started:', { format, filename, contentLength: content.length });
		
		try {
			const response = await fetch('/api/export', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					format,
					content,
					filename,
					path,
					rootPath
				})
			});

			console.log('Export response status:', response.status);
			console.log('Export response headers:', Object.fromEntries(response.headers.entries()));

			if (response.ok) {
				const blob = await response.blob();
				console.log('Export blob size:', blob.size, 'type:', blob.type);
				
				const suggestedName = `${filename.replace(/\.md$/, '')}.${format}`;
				downloadFile(blob, suggestedName);
				
				console.log('Export completed successfully');
				showExportModal = false;
			} else {
				const error = await response.json();
				console.error('Export failed:', error);
				alert(`Export failed: ${error.error || 'Unknown error'}`);
				showExportModal = false;
			}
		} catch (error) {
			console.error('Export error:', error);
			alert('Export failed. Please try again.');
			showExportModal = false;
		}
	}

	function startResize(event) {
		event.preventDefault();
		isResizing = true;
		const startX = event.clientX;
		const startWidth = sidebarWidth;

		// Prevent text selection while dragging
		document.body.style.userSelect = 'none';
		document.body.style.cursor = 'col-resize';

		function handleMouseMove(e) {
			if (!isResizing) return;
			e.preventDefault();
			const deltaX = e.clientX - startX;
			const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));
			sidebarWidth = newWidth;
		}

		function handleMouseUp() {
			isResizing = false;
			document.body.style.userSelect = '';
			document.body.style.cursor = '';
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		}

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleKeydown(event) {
		try {
			if (event.ctrlKey || event.metaKey) {
				if (event.key === 'b') {
					event.preventDefault();
					toggleSidebar();
				} else if (event.key === 's') {
					event.preventDefault();
					saveCurrentFile().catch((error) => {
						console.error('Error in saveCurrentFile:', error);
					});
				} else if (event.key === 'E' && event.shiftKey) {
					event.preventDefault();
					isEditing = !isEditing;
				} else if (event.key === 'p') {
					event.preventDefault();
					openExportModal();
				}
			}
		} catch (error) {
			console.error('Error in handleKeydown:', error);
		}
	}

	async function saveCurrentFile() {
		if (!activeTab) {
			return;
		}

		try {
			const response = await fetch('/api/files', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'save_file',
					path: activeTab.path,
					content: activeTab.content,
					rootPath
				})
			});

			if (response.ok) {
				// Normalize once for performance
				const normalizedContent = activeTab.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
				
				// Create updated tab object to ensure reactivity
				const updatedTab = {
					...activeTab,
					hasUnsavedChanges: false,
					originalContent: normalizedContent
				};
				
				// Update the tab in the array
				const tabIndex = openTabs.findIndex(tab => tab.path === activeTab.path);
				if (tabIndex !== -1) {
					openTabs[tabIndex] = updatedTab;
					activeTab = updatedTab;
					openTabs = [...openTabs];
				}

				// Mark file as recently saved to prevent auto-reload
				recentlySavedFiles.add(activeTab.path);
				setTimeout(() => {
					recentlySavedFiles.delete(activeTab.path);
					recentlySavedFiles = new Set(recentlySavedFiles);
				}, 2000); // Clear after 2 seconds
			} else {
				const error = await response.json();
				console.error('Save failed with error:', error);
			}
		} catch (error) {
			console.error('Save threw exception:', error);
		}
	}

	async function openFile(fileItem) {
		// Check if file is already open
		const existingTab = openTabs.find((tab) => tab.path === fileItem.path);
		if (existingTab) {
			activeTab = existingTab;
			// Still add to recent files even if already open
			addToRecentFiles(fileItem);
			return;
		}

		try {
			const response = await fetch(
				`/api/files?root=${encodeURIComponent(rootPath)}&path=${encodeURIComponent(fileItem.path)}`
			);
			const data = await response.json();

			if (data.error) {
				console.error('Error loading file:', data.error);
				return;
			}

			// Normalize line endings to ensure consistent comparison
			const normalizedContent = (data.content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

			const newTab = {
				name: fileItem.name,
				path: fileItem.path,
				content: normalizedContent,
				originalContent: normalizedContent,
				hasUnsavedChanges: false,
				renderedContent: marked(normalizedContent)
			};

			openTabs = [...openTabs, newTab];
			activeTab = newTab;

			// Add to recent files
			addToRecentFiles(fileItem);
		} catch (error) {
			console.error('Error opening file:', error);
		}
	}

	function closeTab(tab) {
		const index = openTabs.indexOf(tab);
		openTabs = openTabs.filter((t) => t !== tab);

		// Use path comparison instead of object equality to avoid Svelte 5 proxy issues
		if (activeTab && activeTab.path === tab.path) {
			if (openTabs.length > 0) {
				activeTab = openTabs[Math.max(0, index - 1)];
			} else {
				activeTab = null;
			}
		}
	}

	function handleFileSelect(fileItem) {
		openFile(fileItem);
	}

	function pinFile(fileItem) {
		pinnedFiles.add(fileItem.path);
		pinnedFiles = new Set(pinnedFiles); // Trigger reactivity
		savePinnedFiles();
	}

	function unpinFile(fileItem) {
		pinnedFiles.delete(fileItem.path);
		pinnedFiles = new Set(pinnedFiles); // Trigger reactivity
		savePinnedFiles();
	}

	function savePinnedFiles() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('markdown-notes-pinned-files', JSON.stringify(Array.from(pinnedFiles)));
		}
	}

	function loadRecentFiles() {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('markdown-notes-recent-files');
			if (stored) {
				try {
					recentFiles = JSON.parse(stored);
				} catch (error) {
					console.error('Error loading recent files:', error);
					recentFiles = [];
				}
			}
		}
	}

	function saveRecentFiles() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('markdown-notes-recent-files', JSON.stringify(recentFiles));
		}
	}

	function addToRecentFiles(fileItem) {
		// Remove if already exists
		recentFiles = recentFiles.filter((file) => file.path !== fileItem.path);

		// Add to beginning - create a plain object to avoid proxy issues
		const recentFile = {
			name: String(fileItem.name),
			path: String(fileItem.path),
			timestamp: Date.now()
		};

		recentFiles.unshift(recentFile);

		// Keep only the number specified in settings
		const maxFiles = currentSettings.recentFilesCount || 5;
		recentFiles = recentFiles.slice(0, maxFiles);

		// Trigger reactivity
		recentFiles = [...recentFiles];

		// Save to localStorage
		saveRecentFiles();
	}

	async function openRecentFile(recentFile) {
		// Create a file item object like the one from FileTree
		const fileItem = {
			name: recentFile.name,
			path: recentFile.path,
			type: 'file'
		};

		// Navigate to the file's directory in the tree
		if (fileTreeComponent && fileTreeComponent.navigateToFile) {
			fileTreeComponent.navigateToFile(recentFile.path);
		}

		// Open the file without adding to recent files (to maintain order)
		await openFileWithoutRecentTracking(fileItem);
	}

	async function openFileWithoutRecentTracking(fileItem) {
		// Check if file is already open
		const existingTab = openTabs.find((tab) => tab.path === fileItem.path);
		if (existingTab) {
			activeTab = existingTab;
			return;
		}

		try {
			const response = await fetch(
				`/api/files?root=${encodeURIComponent(rootPath)}&path=${encodeURIComponent(fileItem.path)}`
			);
			const data = await response.json();

			if (data.error) {
				console.error('Error loading file:', data.error);
				return;
			}

			// Normalize line endings to ensure consistent comparison
			const normalizedContent = (data.content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

			const newTab = {
				name: fileItem.name,
				path: fileItem.path,
				content: normalizedContent,
				originalContent: normalizedContent,
				hasUnsavedChanges: false,
				renderedContent: marked(normalizedContent)
			};

			openTabs = [...openTabs, newTab];
			activeTab = newTab;

			// Don't add to recent files when opening from recent files list
		} catch (error) {
			console.error('Error opening file:', error);
		}
	}

	function loadPinnedFiles() {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('markdown-notes-pinned-files');
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					pinnedFiles = new Set(parsed);
				} catch (error) {
					console.error('Error loading pinned files:', error);
					pinnedFiles = new Set();
				}
			}
		}
	}

	function handleContextMenu(action, item) {
		modalContext = item;
		modalInput = '';

		switch (action) {
			case 'create_file':
				modalType = 'create_file';
				modalTitle = 'Create New Document';
				showModal = true;
				break;
			case 'create_folder':
			case 'create_folder_root':
				modalType = 'create_folder';
				modalTitle = 'Create New Folder';
				showModal = true;
				break;
			case 'delete':
				if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
					deleteItem(item);
				}
				break;
		}
	}

	async function deleteItem(item) {
		try {
			const response = await fetch('/api/files', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'delete',
					path: item.path,
					rootPath
				})
			});

			if (response.ok) {
				// Close tab if file was open
				if (item.type === 'file') {
					const openTab = openTabs.find((tab) => tab.path === item.path);
					if (openTab) {
						closeTab(openTab);
					}
				}

				// Refresh file tree
				if (fileTreeComponent) {
					fileTreeComponent.refresh();
				}
			}
		} catch (error) {
			console.error('Error deleting item:', error);
		}
	}

	async function handleModalSubmit() {
		if (!modalInput.trim()) return;

		const requestData = {
			action: modalType === 'create_folder' ? 'create_directory' : modalType,
			path: modalContext.path,
			name: modalInput,
			content: modalType === 'create_file' ? '# New Document\n\nStart writing here...' : undefined,
			rootPath
		};

		try {
			const response = await fetch('/api/files', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestData)
			});

			if (response.ok) {
				const result = await response.json();
				showModal = false;
				modalInput = '';

				// Refresh file tree and expand parent folder
				if (fileTreeComponent) {
					await fileTreeComponent.refresh();

					// If creating in a subfolder, expand it
					if (modalContext.path) {
						fileTreeComponent.expandFolder(modalContext.path);
					}
				}

				// If creating a file, open it in a new tab
				if (modalType === 'create_file' && result.path) {
					const fileItem = {
						name: result.name,
						path: result.path,
						type: 'file'
					};
					await openFile(fileItem);
				}
			} else {
				const error = await response.json();
				console.error('Error creating item:', error);
				alert(`Error: ${error.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error creating item:', error);
		}
	}

	function handleContentChange(event) {
		if (activeTab) {
			activeTab.content = event.target.value;
			activeTab.hasUnsavedChanges = activeTab.content !== activeTab.originalContent;
			activeTab.renderedContent = marked(activeTab.content);
			openTabs = [...openTabs];
		}
	}

	// Debounce the markdown rendering to improve performance
	let renderTimeout;
	
	function handleEditorChange(newContent) {
		if (activeTab) {
			// Create a new tab object to ensure reactivity
			const updatedTab = {
				...activeTab,
				content: newContent,
				renderedContent: activeTab.renderedContent // Keep existing rendered content initially
			};

			// Normalize line endings for comparison to avoid false positives
			const normalizedContent = updatedTab.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
			const normalizedOriginal = updatedTab.originalContent
				.replace(/\r\n/g, '\n')
				.replace(/\r/g, '\n');

			updatedTab.hasUnsavedChanges = normalizedContent !== normalizedOriginal;
			
			// Update the tab in the array
			const tabIndex = openTabs.findIndex(tab => tab.path === activeTab.path);
			if (tabIndex !== -1) {
				openTabs[tabIndex] = updatedTab;
				activeTab = updatedTab;
				openTabs = [...openTabs];
			}
			
			// Debounce the markdown rendering to avoid blocking on every keystroke
			if (renderTimeout) {
				clearTimeout(renderTimeout);
			}
			renderTimeout = setTimeout(() => {
				if (activeTab && activeTab.path === updatedTab.path) {
					const renderedContent = marked(newContent);
					
					// Update rendered content
					const finalUpdatedTab = {
						...activeTab,
						renderedContent
					};
					
					const finalTabIndex = openTabs.findIndex(tab => tab.path === activeTab.path);
					if (finalTabIndex !== -1) {
						openTabs[finalTabIndex] = finalUpdatedTab;
						activeTab = finalUpdatedTab;
						openTabs = [...openTabs];
					}
				}
			}, 300); // 300ms delay for markdown rendering
		}
	}

	function handleFileChange(event) {
		// Delay to avoid race conditions with save operations
		setTimeout(() => {
			// Refresh file tree when files change
			if (fileTreeComponent) {
				fileTreeComponent.refresh();
			}
		}, 100);

		// Handle opened files that were modified externally
		if (event.type === 'change' && !event.isDirectory) {
			const openTab = openTabs.find((tab) => tab.path === event.path);
			if (openTab && !openTab.hasUnsavedChanges && !recentlySavedFiles.has(event.path)) {
				// Temporarily disabled to fix save issues
				// openFile({ path: event.path, name: openTab.name });
			}
		}

		// Handle deleted files
		if (event.type === 'unlink' && !event.isDirectory) {
			const openTab = openTabs.find((tab) => tab.path === event.path);
			if (openTab) {
				closeTab(openTab);
			}
		}
	}

	onMount(async () => {
		// Global error handler
		window.addEventListener('error', (event) => {
			console.error('Global error:', event.error);
			console.error('Error stack:', event.error.stack);
		});

		window.addEventListener('unhandledrejection', (event) => {
			console.error('Unhandled promise rejection:', event.reason);
		});

		document.addEventListener('keydown', handleKeydown);

		// Load pinned files from localStorage
		loadPinnedFiles();

		// Load recent files from localStorage
		loadRecentFiles();

		// Get current working directory from server
		try {
			const response = await fetch('/api/cwd');
			const data = await response.json();
			const serverCwd = data.cwd;

			// Load settings
			currentSettings = settings.load();

			// Use saved rootPath or default to server's cwd
			rootPath =
				currentSettings.rootPath && currentSettings.rootPath !== '/path/to/notes'
					? currentSettings.rootPath
					: serverCwd;

			// Update settings if we're using the server's cwd
			if (currentSettings.rootPath === '/path/to/notes') {
				settings.updateSetting('rootPath', serverCwd);
			}
		} catch (error) {
			console.error('Error getting cwd:', error);
			// Fallback to settings
			currentSettings = settings.load();
			rootPath = currentSettings.rootPath;
		}

		// Initialize file watcher only if we have a rootPath
		// TEMPORARILY DISABLED FOR DEBUGGING
		// if (rootPath) {
		// 	fileWatcher = new FileWatcher(rootPath, handleFileChange);
		// 	await fileWatcher.start();
		// }

		// Apply initial theme
		const actualTheme = applyTheme(currentSettings.theme);
		isDarkMode = actualTheme === 'dark';

		// Watch for system theme changes
		let stopWatchingSystem;
		if (currentSettings.theme === 'system') {
			stopWatchingSystem = watchSystemTheme((systemTheme) => {
				isDarkMode = systemTheme === 'dark';
				applyTheme('system');
			});
		}

		// Subscribe to settings changes
		const unsubscribe = settings.subscribe((newSettings) => {
			currentSettings = newSettings;
			if (newSettings.rootPath !== rootPath) {
				rootPath = newSettings.rootPath;

				// Clear open tabs since they're from the old root path
				openTabs = [];
				activeTab = null;

				// Restart file watcher with new root path
				if (fileWatcher) {
					fileWatcher.stop();
					fileWatcher = new FileWatcher(rootPath, handleFileChange);
					fileWatcher.start();
				}

				// Refresh file tree with new root path
				if (fileTreeComponent) {
					setTimeout(() => {
						fileTreeComponent.refresh();
					}, 100);
				}
			}

			// Apply theme changes
			const actualTheme = applyTheme(newSettings.theme);
			isDarkMode = actualTheme === 'dark';

			// Update system theme watcher
			if (stopWatchingSystem) {
				stopWatchingSystem();
				stopWatchingSystem = null;
			}

			if (newSettings.theme === 'system') {
				stopWatchingSystem = watchSystemTheme((systemTheme) => {
					isDarkMode = systemTheme === 'dark';
					applyTheme('system');
				});
			}
		});

		return () => {
			document.removeEventListener('keydown', handleKeydown);
			if (fileWatcher) {
				fileWatcher.stop();
			}
			if (stopWatchingSystem) {
				stopWatchingSystem();
			}
			unsubscribe();
		};
	});

	onDestroy(() => {
		if (fileWatcher) {
			fileWatcher.stop();
		}
	});
</script>

<div class="flex h-screen">
	<!-- Left Sidebar -->
	<div
		class="relative flex h-full flex-col overflow-hidden border-r border-gray-300 bg-gray-100 transition-all duration-300 ease-in-out"
		class:bg-gray-800={isDarkMode}
		class:border-gray-600={isDarkMode}
		style="width: {sidebarVisible ? sidebarWidth : 0}px;"
	>
		{#if sidebarVisible}
			<div
				class="flex flex-shrink-0 items-center justify-between border-b border-gray-300 p-4"
				class:border-gray-600={isDarkMode}
			>
				<h2
					class="mr-2 flex-1 truncate text-lg font-semibold text-gray-800"
					class:text-gray-100={isDarkMode}
					title={rootPath}
				>
					{rootPath ? rootPath.split('\\').pop() || rootPath.split('/').pop() || 'Files' : 'Files'}
				</h2>
				<button
					class="flex-shrink-0 rounded p-1 hover:bg-gray-200"
					class:hover:bg-gray-600={isDarkMode}
					onclick={() => (showSettings = true)}
					title="Settings"
				>
					⚙️
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-2">
				{#if rootPath}
					<FileTree
						bind:this={fileTreeComponent}
						{rootPath}
						{expandedFolders}
						{pinnedFiles}
						{recentFiles}
						activeFilePath={activeTab?.path}
						spacing={currentSettings.fileTreeSpacing}
						recentFilesCount={currentSettings.recentFilesCount}
						onFileSelect={handleFileSelect}
						onContextMenu={handleContextMenu}
						onExpandedFoldersChange={(folders) => (expandedFolders = folders)}
						onPinFile={pinFile}
						onUnpinFile={unpinFile}
						onRecentFileSelect={openRecentFile}
					/>
				{:else}
					<div class="p-4 text-sm text-gray-500">Loading...</div>
				{/if}
			</div>
		{/if}

		<!-- Resize Handle -->
		{#if sidebarVisible}
			<div
				class="absolute top-0 right-0 h-full w-2 cursor-col-resize bg-gray-300 transition-colors hover:bg-gray-400 active:bg-gray-500"
				class:bg-gray-600={isDarkMode}
				class:hover:bg-gray-500={isDarkMode}
				class:active:bg-gray-400={isDarkMode}
				onmousedown={startResize}
				style="right: -1px;"
			></div>
		{/if}
	</div>

	<!-- Show Sidebar Button (when sidebar is hidden) -->
	{#if !sidebarVisible}
		<div class="fixed top-4 left-4 z-10">
			<button
				class="rounded-md bg-gray-800 p-2 text-white shadow-lg transition-colors hover:bg-gray-700"
				class:bg-gray-700={isDarkMode}
				class:hover:bg-gray-600={isDarkMode}
				onclick={toggleSidebar}
				title="Show sidebar (Ctrl+B)"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					></path>
				</svg>
			</button>
		</div>
	{/if}

	<!-- Main Content Area -->
	<div class="flex h-full flex-1 flex-col">
		<!-- Tab Bar -->
		{#if openTabs.length > 0}
			<div class="flex min-h-[40px] border-b border-gray-300 bg-gray-50" class:bg-gray-800={isDarkMode} class:border-gray-600={isDarkMode}>
				{#each openTabs as tab, index}
					<div
						class="flex items-center gap-2 border-r border-gray-300 px-4 py-2 text-sm"
						class:border-gray-600={isDarkMode}
						class:bg-blue-500={activeTab?.path === tab.path && !isDarkMode}
						class:bg-blue-600={activeTab?.path === tab.path && isDarkMode}
						class:text-white={activeTab?.path === tab.path}
						class:bg-gray-50={activeTab?.path !== tab.path && !isDarkMode}
						class:text-gray-700={activeTab?.path !== tab.path && !isDarkMode}
						class:hover:bg-gray-100={activeTab?.path !== tab.path && !isDarkMode}
						class:bg-gray-800={activeTab?.path !== tab.path && isDarkMode}
						class:text-gray-200={activeTab?.path !== tab.path && isDarkMode}
						class:hover:bg-gray-700={activeTab?.path !== tab.path && isDarkMode}
					>
						<button class="flex flex-1 items-center gap-2" onclick={() => (activeTab = tab)}>
							<span>{tab.name}</span>
							{#if tab.hasUnsavedChanges}
								<span class="font-bold text-orange-500">●</span>
							{/if}
						</button>
						<button
							class="ml-1 flex-shrink-0 rounded px-1 hover:bg-gray-200"
							class:hover:bg-gray-600={isDarkMode}
							onclick={(e) => {
								e.stopPropagation();
								closeTab(tab);
							}}
						>
							×
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Content Area -->
		<div class="flex flex-1 overflow-hidden">
			{#if activeTab}
				<div class="flex-1 p-4 overflow-hidden">
					{#if isEditing}
						<!-- Editor Mode -->
						<div class="h-full rounded border border-gray-300">
							<MarkdownEditor
								value={activeTab.content}
								onChange={handleEditorChange}
								darkMode={isDarkMode}
								showToolbar={currentSettings.showToolbar}
								toolbarButtons={currentSettings.toolbarButtons}
							/>
						</div>
					{:else}
						<!-- Preview Mode -->
						<div class="h-full overflow-y-auto">
							<div
								class="github-markdown max-w-none rounded border border-gray-200 p-6"
								class:github-markdown-dark={isDarkMode}
								class:bg-white={!isDarkMode}
								class:bg-gray-800={isDarkMode}
								class:border-gray-600={isDarkMode}
								class:text-gray-100={isDarkMode}
							>
								{@html activeTab.renderedContent || '<p>No content to preview</p>'}
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Welcome Screen -->
				<div class="flex flex-1 items-center justify-center">
					<div class="text-center text-gray-500" class:text-gray-400={isDarkMode}>
						<h1 class="mb-4 text-2xl font-bold" class:text-gray-100={isDarkMode}>Markdown Notes</h1>
						<p class="mb-2">Select a file from the sidebar to get started</p>
						<p class="text-sm">
							<kbd
								class="rounded bg-gray-100 px-2 py-1 text-gray-800"
								class:bg-gray-700={isDarkMode}
								class:text-gray-100={isDarkMode}>Ctrl+B</kbd
							> Toggle sidebar
						</p>
						<p class="text-sm">
							<kbd
								class="rounded bg-gray-100 px-2 py-1 text-gray-800"
								class:bg-gray-700={isDarkMode}
								class:text-gray-100={isDarkMode}>Ctrl+Shift+E</kbd
							> Toggle editor/preview
						</p>
						<p class="text-sm">
							<kbd
								class="rounded bg-gray-100 px-2 py-1 text-gray-800"
								class:bg-gray-700={isDarkMode}
								class:text-gray-100={isDarkMode}>Ctrl+S</kbd
							> Save file
						</p>
						<p class="text-sm">
							<kbd
								class="rounded bg-gray-100 px-2 py-1 text-gray-800"
								class:bg-gray-700={isDarkMode}
								class:text-gray-100={isDarkMode}>Ctrl+P</kbd
							> Export to HTML/PDF
						</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		{#if currentSettings.showFooter}
			<Footer
				{activeTab}
				{isDarkMode}
				{isEditing}
				dateTimeFormat={currentSettings.dateTimeFormat}
				onModeToggle={() => (isEditing = !isEditing)}
			/>
		{/if}
	</div>
</div>

<!-- Modal -->
{#if showModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="w-96 rounded-lg bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold">{modalTitle}</h3>
			<input
				type="text"
				class="mb-4 w-full rounded border border-gray-300 p-2"
				placeholder="Enter name..."
				bind:value={modalInput}
				autofocus
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						handleModalSubmit();
					} else if (e.key === 'Escape') {
						showModal = false;
					}
				}}
			/>
			<div class="flex justify-end gap-2">
				<button
					class="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
					onclick={() => (showModal = false)}
				>
					Cancel
				</button>
				<button
					class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					onclick={handleModalSubmit}
				>
					Create
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Settings Modal -->
<SettingsModal isOpen={showSettings} onClose={() => (showSettings = false)} />

<!-- Export Modal -->
<ExportModal 
	isOpen={showExportModal} 
	{activeTab} 
	{isDarkMode}
	onClose={() => (showExportModal = false)}
	onExport={handleExport}
/>
