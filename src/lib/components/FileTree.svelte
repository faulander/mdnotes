<script>
	import { onMount } from 'svelte';
	import { Filemanager } from 'wx-svelte-filemanager';

	let {
		rootPath = '',
		expandedFolders = new Set(),
		pinnedFiles = new Set(),
		recentFiles = [],
		activeFilePath = null,
		spacing = 'normal',
		recentFilesCount = 5,
		onFileSelect = () => {},
		onContextMenu = () => {},
		onExpandedFoldersChange = () => {},
		onPinFile = () => {},
		onUnpinFile = () => {},
		onRecentFileSelect = () => {}
	} = $props();

	let fileTree = $state([]);
	let fileManagerData = $state([]);
	let contextMenu = $state(null);
	let contextMenuPos = $state({ x: 0, y: 0 });
	let selectedItem = $state(null);
	let fileManagerRef = $state(null);

	// Cache for directory contents
	let directoryCache = $state(new Map());
	let loadingFolders = $state(new Set());
	let refreshTimeout = null;

	// Spacing configuration
	function getSpacingConfig(spacing) {
		switch (spacing) {
			case 'compact':
				return {
					verticalPadding: 'py-0.5',
					horizontalPadding: 'px-2',
					indentSize: 12,
					iconSize: 'w-3 h-3',
					fontSize: 'text-xs'
				};
			case 'comfortable':
				return {
					verticalPadding: 'py-2',
					horizontalPadding: 'px-3',
					indentSize: 20,
					iconSize: 'w-4 h-4',
					fontSize: 'text-sm'
				};
			default: // normal
				return {
					verticalPadding: 'py-1',
					horizontalPadding: 'px-2',
					indentSize: 16,
					iconSize: 'w-4 h-4',
					fontSize: 'text-sm'
				};
		}
	}

	let spacingConfig = $derived(getSpacingConfig(spacing));

	// Helper function to recursively find all files in the tree
	function getAllFilesFromTree(items) {
		let allFiles = [];

		function traverse(items) {
			for (const item of items) {
				if (item.type === 'file') {
					allFiles.push(item);
				} else if (item.type === 'directory' && item.children) {
					traverse(item.children);
				}
			}
		}

		traverse(items);
		return allFiles;
	}

	// Simple pinned files list - just store path and name
	let pinnedFilesInTree = $state([]);
	
	// Update pinned files list when pinnedFiles changes
	$effect(() => {
		pinnedFilesInTree = Array.from(pinnedFiles).map(filePath => {
			const normalizedPath = filePath.replace(/\\/g, '/');
			const fileName = normalizedPath.split('/').pop();
			return {
				path: filePath,
				name: fileName,
				type: 'file'
			};
		});
	});

	// Convert internal file tree to filemanager format
	function convertToFileManagerFormat(items) {
		return items.map((item) => ({
			id: item.path,
			name: item.name,
			type: item.type === 'directory' ? 'folder' : 'file',
			size: item.size || 0,
			date: new Date(item.modified || Date.now()),
			...(item.children && { children: convertToFileManagerFormat(item.children) })
		}));
	}

	// Convert filemanager format back to internal format
	function convertFromFileManagerFormat(items) {
		return items.map((item) => ({
			path: item.id,
			name: item.name,
			type: item.type === 'folder' ? 'directory' : 'file',
			size: item.size,
			modified: item.date?.getTime() || Date.now(),
			...(item.children && { children: convertFromFileManagerFormat(item.children) })
		}));
	}


	async function loadDirectory(path = '') {
		// Check cache first
		const cacheKey = `${rootPath}:${path}`;
		if (directoryCache.has(cacheKey)) {
			return directoryCache.get(cacheKey);
		}

		// Check if already loading
		if (loadingFolders.has(path)) {
			return [];
		}

		try {
			loadingFolders.add(path);

			const response = await fetch(
				`/api/files?root=${encodeURIComponent(rootPath)}&path=${encodeURIComponent(path)}`
			);
			const data = await response.json();

			loadingFolders.delete(path);

			if (data.error) {
				console.error('Error loading directory:', data.error);
				return [];
			}

			const items = data.items || [];
			// Cache the result for 30 seconds
			directoryCache.set(cacheKey, items);
			setTimeout(() => {
				directoryCache.delete(cacheKey);
			}, 30000);

			return items;
		} catch (error) {
			console.error('Error loading directory:', error);
			loadingFolders.delete(path);
			return [];
		}
	}

	async function loadFileTree() {
		const items = await loadDirectory();
		fileTree = items;
		fileManagerData = convertToFileManagerFormat(items);
	}

	async function toggleFolder(folderPath) {
		const newExpandedFolders = new Set(expandedFolders);

		if (newExpandedFolders.has(folderPath)) {
			newExpandedFolders.delete(folderPath);
		} else {
			newExpandedFolders.add(folderPath);

			// Load subdirectory if not already loaded
			const folder = findItemByPath(fileTree, folderPath);
			if (folder && !folder.children) {
				folder.children = await loadDirectory(folderPath);
				fileTree = [...fileTree];
				fileManagerData = convertToFileManagerFormat(fileTree);
			}
		}

		// Notify parent of the change
		onExpandedFoldersChange(newExpandedFolders);
	}

	function findItemByPath(items, targetPath) {
		for (const item of items) {
			if (item.path === targetPath) {
				return item;
			}
			if (item.children) {
				const found = findItemByPath(item.children, targetPath);
				if (found) return found;
			}
		}
		return null;
	}

	function handleItemClick(item) {
		if (item.type === 'file') {
			onFileSelect(item);
		} else if (item.type === 'directory') {
			toggleFolder(item.path);
		}
	}

	function handleContextMenu(event, item) {
		event.preventDefault();
		contextMenu = item;
		contextMenuPos = { x: event.clientX, y: event.clientY };
		selectedItem = item;
	}

	function closeContextMenu() {
		contextMenu = null;
		selectedItem = null;
	}

	function handleContextMenuAction(action) {
		if (action === 'create_folder_root') {
			// Create a root-level folder (no parent item)
			onContextMenu(action, { type: 'directory', path: '', name: 'Root' });
		} else if (selectedItem) {
			onContextMenu(action, selectedItem);
		}
		closeContextMenu();
	}

	// Handle file manager events
	function handleFileManagerEvent(event) {
		const { action, data } = event.detail;
		
		switch (action) {
			case 'select-file':
				if (data.type === 'file') {
					const internalItem = convertFromFileManagerFormat([data])[0];
					onFileSelect(internalItem);
				}
				break;
			case 'open-file':
				if (data.type === 'file') {
					const internalItem = convertFromFileManagerFormat([data])[0];
					onFileSelect(internalItem);
				}
				break;
			case 'create-file':
				onContextMenu('create_file', { type: 'directory', path: data.parent || '', name: 'Parent' });
				break;
			case 'create-folder':
				onContextMenu('create_folder', { type: 'directory', path: data.parent || '', name: 'Parent' });
				break;
			case 'delete-files':
				if (data.length > 0) {
					const internalItem = convertFromFileManagerFormat([data[0]])[0];
					onContextMenu('delete', internalItem);
				}
				break;
		}
	}

	// Expose loadFileTree method with debouncing
	export async function refresh() {
		// Clear existing timeout
		if (refreshTimeout) {
			clearTimeout(refreshTimeout);
		}

		// Debounce refresh calls
		refreshTimeout = setTimeout(async () => {
			// Clear cache to force fresh data
			directoryCache.clear();

			const previouslyExpanded = new Set(expandedFolders);
			await loadFileTree();

			// Restore expanded folders in the correct order (parent to child)
			const sortedExpandedFolders = Array.from(previouslyExpanded).sort((a, b) => {
				// Sort by path depth (fewer slashes = higher priority)
				return a.split('/').length - b.split('/').length;
			});

			const newExpandedFolders = new Set(expandedFolders);

			// Restore folders sequentially to ensure parent folders are loaded first
			for (const folderPath of sortedExpandedFolders) {
				try {
					const folder = findItemByPath(fileTree, folderPath);
					if (folder) {
						folder.children = await loadDirectory(folderPath);
						fileTree = [...fileTree]; // Update the tree after each folder is loaded
						fileManagerData = convertToFileManagerFormat(fileTree);
					} else {
						// Folder no longer exists, remove from expanded folders
						newExpandedFolders.delete(folderPath);
					}
				} catch (error) {
					console.error('Error restoring folder:', folderPath, error);
					newExpandedFolders.delete(folderPath);
				}
			}

			// Update expanded folders in parent if changed
			if (newExpandedFolders.size !== expandedFolders.size) {
				onExpandedFoldersChange(newExpandedFolders);
			}

		}, 100); // 100ms debounce
	}

	// Helper function to restore expanded folders
	async function restoreExpandedFolders() {
		if (expandedFolders.size === 0) return;

		// Sort folders by depth (parent folders first)
		const sortedFolders = Array.from(expandedFolders).sort((a, b) => {
			return a.split('/').length - b.split('/').length;
		});

		// Sequential restoration to ensure parent folders are loaded first
		for (const folderPath of sortedFolders) {
			try {
				const folder = findItemByPath(fileTree, folderPath);
				if (folder && !folder.children) {
					folder.children = await loadDirectory(folderPath);
					fileTree = [...fileTree]; // Update tree after each folder
					fileManagerData = convertToFileManagerFormat(fileTree);
				}
			} catch (error) {
				console.error('Error restoring folder:', folderPath, error);
			}
		}
	}

	// Method to expand a folder by path
	export function expandFolder(folderPath) {
		if (folderPath && !expandedFolders.has(folderPath)) {
			const newExpandedFolders = new Set(expandedFolders);
			newExpandedFolders.add(folderPath);
			onExpandedFoldersChange(newExpandedFolders);

			// Load the directory content if needed
			loadDirectory(folderPath).then((items) => {
				const folder = findItemByPath(fileTree, folderPath);
				if (folder) {
					folder.children = items;
					fileTree = [...fileTree];
					fileManagerData = convertToFileManagerFormat(fileTree);
				}
			});
		}
	}

	// Method to navigate to a file and expand its parent directories
	export function navigateToFile(filePath) {
		// Normalize path separators - handle both Windows (\) and Unix (/) separators
		const normalizedPath = filePath.replace(/\\/g, '/');
		const pathParts = normalizedPath.split('/');
		const fileName = pathParts.pop();

		// Expand all parent directories
		let currentPath = '';
		for (const part of pathParts) {
			if (part) {
				currentPath = currentPath ? `${currentPath}/${part}` : part;
				expandFolder(currentPath);
			}
		}
	}

	// Track previous rootPath to detect actual changes
	let previousRootPath = $state(rootPath);

	// React to rootPath changes
	$effect(() => {
		if (rootPath && rootPath !== previousRootPath) {
			// Clear cache and state when root path changes
			directoryCache.clear();
			// Clear expanded folders when root path changes
			onExpandedFoldersChange(new Set());
			loadFileTree();
			previousRootPath = rootPath;
		} else if (rootPath && !previousRootPath) {
			// Handle case where rootPath becomes available for the first time
			loadFileTree();
			previousRootPath = rootPath;
		}
	});


	onMount(async () => {
		// Don't load if rootPath is not set
		if (!rootPath) {
			return;
		}

		await loadFileTree();

		// If there are expanded folders, restore them
		if (expandedFolders.size > 0) {
			await restoreExpandedFolders();
		}

		// Close context menu when clicking outside
		function handleClickOutside(event) {
			if (contextMenu && !event.target.closest('.context-menu')) {
				closeContextMenu();
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="file-tree">
	<!-- New Folder Button -->
	<div class="new-folder-button mb-2 border-b border-gray-200 p-2">
		<button
			type="button"
			class="flex w-full cursor-pointer items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm transition-colors hover:bg-gray-100 hover:shadow-md active:shadow-sm"
			onclick={() => handleContextMenuAction('create_folder_root')}
		>
			<svg class="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
				<path d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
			</svg>
			<span>New Rootfolder</span>
		</button>
	</div>

	<!-- Recent Files Section -->
	{#if recentFilesCount > 0 && recentFiles.length > 0}
		<div class="recent-files-section mb-2 border-b border-gray-200 dark:border-gray-600">
			<div class="px-2 py-1 text-xs font-semibold tracking-wider text-gray-700 dark:text-gray-400 uppercase">
				Recent Files
			</div>
			<div class="px-2 pb-2">
				{#each recentFiles.slice(0, recentFilesCount) as recentFile}
					<div
						class="flex items-center gap-2 {spacingConfig.verticalPadding} {spacingConfig.horizontalPadding} group cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700"
						onclick={() => onRecentFileSelect(recentFile)}
					>
						<svg
							class="{spacingConfig.iconSize} flex-shrink-0 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<span class="recent-file-name flex-1 truncate {spacingConfig.fontSize}">
							{recentFile.name}
						</span>
						<span class="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100">
							{new Date(recentFile.timestamp).toLocaleTimeString()}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Pinned Files Section -->
	{#if pinnedFilesInTree.length > 0}
		<div class="pinned-files-section mb-2 border-b border-gray-200">
			<div class="px-2 py-1 text-xs font-semibold tracking-wider text-gray-600 uppercase">
				Pinned Files ({pinnedFilesInTree.length})
			</div>
			<div class="px-2 pb-2">
				{#each pinnedFilesInTree as item}
					{@render renderPinnedFile(item)}
				{/each}
			</div>
		</div>
	{/if}

	<!-- File Tree Display -->
	{#if fileTree.length > 0}
		{#each fileTree as item}
			{@render renderTreeItem(item, 0)}
		{/each}
	{:else}
		<div class="p-4 text-gray-500 {spacingConfig.fontSize}">No markdown files found</div>
	{/if}
	
	<!-- File Manager Component (disabled due to errors) -->
	<!-- 
	<div class="filemanager-container" style="display: none;">
		{#if fileManagerData.length > 0}
			<Filemanager 
				bind:this={fileManagerRef}
				data={fileManagerData}
				mode={{
					tree: true,
					view: false,
					preview: false,
					search: false,
					breadcrumb: false
				}}
				on:select-file={handleFileManagerEvent}
				on:open-file={handleFileManagerEvent}
				on:create-file={handleFileManagerEvent}
				on:create-folder={handleFileManagerEvent}
				on:delete-files={handleFileManagerEvent}
			/>
		{/if}
	</div>
	-->
</div>

{#snippet renderTreeItem(item, depth)}
	<div class="file-item-container">
		<div
			class="file-item group flex cursor-pointer items-center select-none hover:bg-gray-200 {spacingConfig.verticalPadding} {spacingConfig.horizontalPadding}"
			class:expanded={item.type === 'directory' && expandedFolders.has(item.path)}
			class:active-file={item.type === 'file' && item.path === activeFilePath}
			style="padding-left: {depth * spacingConfig.indentSize + 8}px"
			onclick={() => handleItemClick(item)}
			oncontextmenu={(e) => handleContextMenu(e, item)}
		>
			{#if item.type === 'directory'}
				<span class="arrow-indicator mr-2 text-gray-500 {spacingConfig.fontSize}">
					{#if expandedFolders.has(item.path)}
						<!-- Down arrow -->
						<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 12 12">
							<path d="M2 4 L6 8 L10 4 Z" />
						</svg>
					{:else}
						<!-- Right arrow -->
						<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 12 12">
							<path d="M4 2 L8 6 L4 10 Z" />
						</svg>
					{/if}
				</span>
				<span class="mr-2 text-blue-500">
					{#if expandedFolders.has(item.path)}
						<!-- Open folder icon -->
						<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						<!-- Closed folder icon -->
						<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 20 20">
							<path d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
						</svg>
					{/if}
				</span>
			{:else}
				<span class="mr-2 text-gray-600" style="margin-left: {spacingConfig.indentSize}px">
					<!-- Document icon -->
					<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>
			{/if}
			<span class="text-gray-800 {spacingConfig.fontSize} flex-1">{item.name}</span>

			<!-- Pin/Unpin icon for files -->
			{#if item.type === 'file'}
				<button
					class="pin-button ml-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-300"
					onclick={(e) => {
						e.stopPropagation();
						if (pinnedFiles.has(item.path)) {
							onUnpinFile(item);
						} else {
							onPinFile(item);
						}
					}}
					title={pinnedFiles.has(item.path) ? 'Unpin file' : 'Pin file'}
				>
					{#if pinnedFiles.has(item.path)}
						<!-- Unpin icon (filled pin) -->
						<svg class="h-3 w-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
							/>
						</svg>
					{:else}
						<!-- Pin icon (outline pin) -->
						<svg
							class="h-3 w-3 text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
							/>
						</svg>
					{/if}
				</button>
			{/if}
		</div>

		{#if item.type === 'directory' && expandedFolders.has(item.path) && item.children}
			{#each item.children as child}
				{@render renderTreeItem(child, depth + 1)}
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet renderPinnedFile(item)}
	<div class="file-item-container">
		<div
			class="file-item group flex cursor-pointer items-center select-none hover:bg-blue-50 {spacingConfig.verticalPadding} {spacingConfig.horizontalPadding} mb-1 rounded"
			onclick={() => handleItemClick(item)}
		>
			<span class="mr-2 text-blue-500">
				<!-- Document icon -->
				<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
						clip-rule="evenodd"
					/>
				</svg>
			</span>
			<span class="text-gray-800 {spacingConfig.fontSize} flex-1">{item.name}</span>

			<!-- Unpin icon -->
			<button
				class="pin-button ml-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-300"
				onclick={(e) => {
					e.stopPropagation();
					onUnpinFile(item);
				}}
				title="Unpin file"
			>
				<!-- Unpin icon (filled pin) -->
				<svg class="h-3 w-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
					/>
				</svg>
			</button>
		</div>
	</div>
{/snippet}

<!-- Context Menu -->
{#if contextMenu}
	<div
		class="context-menu fixed z-50 rounded border border-gray-300 bg-white py-1 shadow-lg"
		style="left: {contextMenuPos.x}px; top: {contextMenuPos.y}px;"
	>
		{#if contextMenu.type === 'directory'}
			<button
				class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
				onclick={() => handleContextMenuAction('create_file')}
			>
				Add Document
			</button>
			<button
				class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
				onclick={() => handleContextMenuAction('create_folder')}
			>
				Add Folder
			</button>
			<hr class="my-1" />
			<button
				class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
				onclick={() => handleContextMenuAction('delete')}
			>
				Delete
			</button>
		{:else}
			<button
				class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
				onclick={() => handleContextMenuAction('delete')}
			>
				Delete
			</button>
		{/if}
	</div>
{/if}

<style>
	.file-tree {
		user-select: none;
	}

	.filemanager-container {
		/* Override filemanager styles to fit our design */
		min-height: 200px;
	}

	.filemanager-container :global(.wx-filemanager) {
		background: transparent;
		border: none;
	}

	.filemanager-container :global(.wx-filemanager-tree) {
		background: transparent;
		border: none;
		padding: 0;
	}

	.file-item:hover {
		background-color: #f3f4f6;
	}

	.file-item.active-file {
		background-color: #3b82f6;
		color: white;
	}

	.file-item.active-file:hover {
		background-color: #2563eb;
	}

	:global(.dark) .file-item:hover {
		background-color: var(--bg-tertiary);
	}

	:global(.dark) .file-item.active-file {
		background-color: #1d4ed8;
		color: white;
	}

	:global(.dark) .file-item.active-file:hover {
		background-color: #1e40af;
	}

	:global(.dark) .file-item:hover .text-gray-800 {
		color: var(--text-primary);
	}

	.context-menu {
		min-width: 120px;
	}

	:global(.dark) .context-menu {
		background-color: var(--bg-primary);
		border-color: var(--border-color);
		color: var(--text-primary);
	}

	:global(.dark) .context-menu button:hover {
		background-color: var(--bg-secondary);
	}

	/* Recent file name styling */
	.recent-file-name {
		color: #000000 !important;
	}

	:global(.dark) .recent-file-name {
		color: #f3f4f6 !important;
	}

	/* Fix hover state text color in light mode to be light on dark background */
	.recent-files-section .group:hover .recent-file-name {
		color: #ffffff !important;
	}

	:global(.dark) .recent-files-section .group:hover .recent-file-name {
		color: #f3f4f6 !important;
	}

	/* Dark mode support for new folder button */
	:global(.dark) .new-folder-button {
		border-color: var(--border-color);
	}

	:global(.dark) .new-folder-button button {
		color: var(--text-primary);
		background-color: var(--bg-primary);
		border-color: var(--border-color);
	}

	:global(.dark) .new-folder-button button:hover {
		background-color: var(--bg-secondary);
		border-color: var(--border-color);
	}

	/* FileManager dark mode support */
	:global(.dark) .filemanager-container .wx-filemanager {
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	:global(.dark) .filemanager-container .wx-filemanager-tree {
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	:global(.dark) .filemanager-container .wx-filemanager-tree .wx-item {
		color: var(--text-primary);
	}

	:global(.dark) .filemanager-container .wx-filemanager-tree .wx-item:hover {
		background-color: var(--bg-secondary);
	}
</style>