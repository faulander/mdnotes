<script>
	import { onMount, onDestroy } from 'svelte';
	import { marked } from 'marked';
	import FileTree from '$lib/components/FileTree.svelte';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import Footer from '$lib/components/Footer.svelte';
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
	
	function toggleSidebar() {
		console.log('Toggling sidebar. Current expanded folders:', Array.from(expandedFolders));
		sidebarVisible = !sidebarVisible;
		console.log('Sidebar visible:', sidebarVisible);
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
					console.log('Ctrl+S pressed, calling saveCurrentFile');
					saveCurrentFile().catch(error => {
						console.error('Error in saveCurrentFile:', error);
					});
				} else if (event.key === 'E' && event.shiftKey) {
					event.preventDefault();
					isEditing = !isEditing;
				}
			}
		} catch (error) {
			console.error('Error in handleKeydown:', error);
		}
	}
	
	async function saveCurrentFile() {
		console.log('=== SAVE FUNCTION CALLED ===');
		console.log('Active tab:', activeTab);
		console.log('Open tabs:', openTabs);
		
		if (!activeTab) {
			console.log('No active tab to save');
			return;
		}
		
		console.log('Saving file:', activeTab.path, 'hasUnsavedChanges:', activeTab.hasUnsavedChanges);
		console.log('Content length:', activeTab.content.length);
		console.log('Original content length:', activeTab.originalContent.length);
		
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
			
			console.log('Save response status:', response.status);
			
			if (response.ok) {
				console.log('Save successful, updating tab state');
				activeTab.hasUnsavedChanges = false;
				// Normalize the content when saving to ensure consistency
				activeTab.originalContent = activeTab.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
				openTabs = [...openTabs];
				
				// Mark file as recently saved to prevent auto-reload
				recentlySavedFiles.add(activeTab.path);
				setTimeout(() => {
					recentlySavedFiles.delete(activeTab.path);
					recentlySavedFiles = new Set(recentlySavedFiles);
				}, 2000); // Clear after 2 seconds
				
				console.log('File saved successfully, activeTab after save:', activeTab);
				console.log('OpenTabs after save:', openTabs);
			} else {
				const error = await response.json();
				console.error('Save failed with error:', error);
			}
		} catch (error) {
			console.error('Save threw exception:', error);
		}
		
		console.log('=== SAVE FUNCTION COMPLETED ===');
	}
	
	async function openFile(fileItem) {
		console.time(`Opening file: ${fileItem.name}`);
		
		// Check if file is already open
		const existingTab = openTabs.find(tab => tab.path === fileItem.path);
		if (existingTab) {
			activeTab = existingTab;
			console.timeEnd(`Opening file: ${fileItem.name}`);
			return;
		}
		
		try {
			const response = await fetch(`/api/files?root=${encodeURIComponent(rootPath)}&path=${encodeURIComponent(fileItem.path)}`);
			const data = await response.json();
			
			if (data.error) {
				console.error('Error loading file:', data.error);
				console.timeEnd(`Opening file: ${fileItem.name}`);
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
			console.timeEnd(`Opening file: ${fileItem.name}`);
		} catch (error) {
			console.error('Error opening file:', error);
			console.timeEnd(`Opening file: ${fileItem.name}`);
		}
	}
	
	function closeTab(tab) {
		console.log('=== CLOSE TAB CALLED ===');
		console.log('Closing tab:', tab.name);
		console.log('Stack trace:', new Error().stack);
		
		const index = openTabs.indexOf(tab);
		openTabs = openTabs.filter(t => t !== tab);
		
		if (activeTab === tab) {
			if (openTabs.length > 0) {
				activeTab = openTabs[Math.max(0, index - 1)];
			} else {
				activeTab = null;
			}
		}
		
		console.log('Tab closed, remaining tabs:', openTabs.length);
		console.log('New active tab:', activeTab?.name || 'none');
	}
	
	function handleFileSelect(fileItem) {
		openFile(fileItem);
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
					const openTab = openTabs.find(tab => tab.path === item.path);
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
		
		console.log('Sending request:', requestData);
		
		try {
			const response = await fetch('/api/files', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestData)
			});
			
			if (response.ok) {
				const result = await response.json();
				console.log('API response:', result);
				console.log('File created successfully, closing modal');
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
				
				console.log('Modal should be closed now, showModal:', showModal);
			} else {
				const error = await response.json();
				console.error('Error creating item:', error);
				console.error('Response status:', response.status);
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
	
	function handleEditorChange(newContent) {
		if (activeTab) {
			const oldHasUnsavedChanges = activeTab.hasUnsavedChanges;
			activeTab.content = newContent;
			
			// Normalize line endings for comparison to avoid false positives
			const normalizedContent = activeTab.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
			const normalizedOriginal = activeTab.originalContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
			
			activeTab.hasUnsavedChanges = normalizedContent !== normalizedOriginal;
			activeTab.renderedContent = marked(activeTab.content);
			openTabs = [...openTabs];
			
			console.log('Editor change:', {
				name: activeTab.name,
				hasUnsavedChanges: activeTab.hasUnsavedChanges,
				oldHasUnsavedChanges,
				contentLength: activeTab.content.length,
				originalLength: activeTab.originalContent.length,
				normalizedContentLength: normalizedContent.length,
				normalizedOriginalLength: normalizedOriginal.length,
				openTabsLength: openTabs.length
			});
		}
	}
	
	function handleFileChange(event) {
		console.log('File change event:', event);
		
		// Delay to avoid race conditions with save operations
		setTimeout(() => {
			// Refresh file tree when files change
			if (fileTreeComponent) {
				fileTreeComponent.refresh();
			}
		}, 100);
		
		// Handle opened files that were modified externally
		if (event.type === 'change' && !event.isDirectory) {
			const openTab = openTabs.find(tab => tab.path === event.path);
			if (openTab && !openTab.hasUnsavedChanges && !recentlySavedFiles.has(event.path)) {
				console.log('File changed externally, but skipping reload to prevent save conflicts:', event.path);
				// Temporarily disabled to fix save issues
				// openFile({ path: event.path, name: openTab.name });
			}
		}
		
		// Handle deleted files
		if (event.type === 'unlink' && !event.isDirectory) {
			const openTab = openTabs.find(tab => tab.path === event.path);
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
		
		// Get current working directory from server
		try {
			const response = await fetch('/api/cwd');
			const data = await response.json();
			const serverCwd = data.cwd;
			
			// Load settings
			currentSettings = settings.load();
			
			// Use saved rootPath or default to server's cwd
			rootPath = currentSettings.rootPath && currentSettings.rootPath !== '/path/to/notes' 
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
		const unsubscribe = settings.subscribe(newSettings => {
			currentSettings = newSettings;
			if (newSettings.rootPath !== rootPath) {
				const oldRootPath = rootPath;
				rootPath = newSettings.rootPath;
				
				console.log('Root path changed from', oldRootPath, 'to', rootPath);
				
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
	{#if sidebarVisible}
		<div class="bg-gray-100 border-r border-gray-300 flex flex-col relative h-full" class:bg-gray-800={isDarkMode} class:border-gray-600={isDarkMode} style="width: {sidebarWidth}px;">
			<div class="p-4 border-b border-gray-300 flex justify-between items-center flex-shrink-0" class:border-gray-600={isDarkMode}>
				<h2 class="text-lg font-semibold text-gray-800 truncate flex-1 mr-2" class:text-gray-100={isDarkMode} title={rootPath}>
					{rootPath ? rootPath.split('\\').pop() || rootPath.split('/').pop() || 'Files' : 'Files'}
				</h2>
				<button
					class="p-1 hover:bg-gray-200 rounded flex-shrink-0"
					class:hover:bg-gray-600={isDarkMode}
					onclick={() => showSettings = true}
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
						activeFilePath={activeTab?.path}
						spacing={currentSettings.fileTreeSpacing}
						onFileSelect={handleFileSelect}
						onContextMenu={handleContextMenu}
						onExpandedFoldersChange={(folders) => expandedFolders = folders}
					/>
				{:else}
					<div class="text-sm text-gray-500 p-4">
						Loading...
					</div>
				{/if}
			</div>
			
			<!-- Resize Handle -->
			<div 
				class="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-gray-300 hover:bg-gray-400 transition-colors active:bg-gray-500"
				class:bg-gray-600={isDarkMode}
				class:hover:bg-gray-500={isDarkMode}
				class:active:bg-gray-400={isDarkMode}
				onmousedown={startResize}
				style="right: -1px;"
			></div>
		</div>
	{/if}
	
	<!-- Main Content Area -->
	<div class="flex-1 flex flex-col h-full">
		<!-- Tab Bar -->
		{#if openTabs.length > 0}
			<div class="flex bg-gray-50 border-b border-gray-300 min-h-[40px]">
				{#each openTabs as tab, index}
					<div
						class="flex items-center px-4 py-2 text-sm border-r border-gray-300 hover:bg-gray-100 gap-2"
						class:bg-white={activeTab === tab && !isDarkMode}
						class:bg-gray-50={activeTab !== tab && !isDarkMode}
						class:bg-blue-500={activeTab === tab && !isDarkMode}
						class:text-white={activeTab === tab && !isDarkMode}
						class:bg-gray-700={activeTab === tab && isDarkMode}
						class:bg-gray-800={activeTab !== tab && isDarkMode}
						class:text-gray-100={activeTab === tab && isDarkMode}
						class:border-blue-400={activeTab === tab}
					>
						<button
							class="flex items-center gap-2 flex-1"
							onclick={() => activeTab = tab}
						>
							<span>{tab.name}</span>
							{#if tab.hasUnsavedChanges}
								<span class="text-orange-500 font-bold">●</span>
							{/if}
						</button>
						<button
							class="ml-1 hover:bg-gray-200 rounded px-1 flex-shrink-0"
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
		<div class="flex-1 flex overflow-hidden">
			{#if activeTab}
				<div class="flex-1 p-4 overflow-hidden">
					{#if isEditing}
						<!-- Editor Mode -->
						<div class="h-full border border-gray-300 rounded">
							<MarkdownEditor
								value={activeTab.content}
								onChange={handleEditorChange}
								darkMode={isDarkMode}
							/>
						</div>
					{:else}
						<!-- Preview Mode -->
						<div class="h-full overflow-y-auto prose prose-sm max-w-none" class:prose-invert={isDarkMode}>
							<div class="p-4 border border-gray-200 rounded" class:bg-white={!isDarkMode} class:bg-gray-800={isDarkMode} class:border-gray-600={isDarkMode} class:text-gray-100={isDarkMode}>
								{@html activeTab.renderedContent || '<p>No content to preview</p>'}
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Welcome Screen -->
				<div class="flex-1 flex items-center justify-center">
					<div class="text-center text-gray-500">
						<h1 class="text-2xl font-bold mb-4">Markdown Notes</h1>
						<p class="mb-2">Select a file from the sidebar to get started</p>
						<p class="text-sm">
							<kbd class="bg-gray-100 px-2 py-1 rounded">Ctrl+B</kbd> Toggle sidebar
						</p>
						<p class="text-sm">
							<kbd class="bg-gray-100 px-2 py-1 rounded">Ctrl+Shift+E</kbd> Toggle editor/preview
						</p>
						<p class="text-sm">
							<kbd class="bg-gray-100 px-2 py-1 rounded">Ctrl+S</kbd> Save file
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
				onModeToggle={() => isEditing = !isEditing}
			/>
		{/if}
	</div>
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-96">
			<h3 class="text-lg font-semibold mb-4">{modalTitle}</h3>
			<input
				type="text"
				class="w-full p-2 border border-gray-300 rounded mb-4"
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
					class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
					onclick={() => showModal = false}
				>
					Cancel
				</button>
				<button
					class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
					onclick={handleModalSubmit}
				>
					Create
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Settings Modal -->
<SettingsModal 
	isOpen={showSettings}
	onClose={() => showSettings = false}
/>
