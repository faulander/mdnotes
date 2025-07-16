<script>
	import { onMount } from 'svelte';
	
	let { 
		rootPath = '', 
		expandedFolders = new Set(),
		activeFilePath = null,
		spacing = 'normal',
		onFileSelect = () => {}, 
		onContextMenu = () => {},
		onExpandedFoldersChange = () => {}
	} = $props();
	
	let fileTree = $state([]);
	let contextMenu = $state(null);
	let contextMenuPos = $state({ x: 0, y: 0 });
	let selectedItem = $state(null);
	
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
	
	async function loadDirectory(path = '') {
		// Check cache first
		const cacheKey = `${rootPath}:${path}`;
		if (directoryCache.has(cacheKey)) {
			console.log(`Using cached data for: ${path || 'root'}`);
			return directoryCache.get(cacheKey);
		}
		
		// Check if already loading
		if (loadingFolders.has(path)) {
			console.log(`Already loading: ${path || 'root'}`);
			return [];
		}
		
		try {
			loadingFolders.add(path);
			console.time(`Loading directory: ${path || 'root'}`);
			
			const response = await fetch(`/api/files?root=${encodeURIComponent(rootPath)}&path=${encodeURIComponent(path)}`);
			const data = await response.json();
			
			console.timeEnd(`Loading directory: ${path || 'root'}`);
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
		fileTree = await loadDirectory();
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
				console.log('Loading folder contents for:', folderPath);
				folder.children = await loadDirectory(folderPath);
				fileTree = [...fileTree];
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
		if (selectedItem) {
			onContextMenu(action, selectedItem);
		}
		closeContextMenu();
	}
	
	// Expose loadFileTree method with debouncing
	export async function refresh() {
		// Clear existing timeout
		if (refreshTimeout) {
			clearTimeout(refreshTimeout);
		}
		
		// Debounce refresh calls
		refreshTimeout = setTimeout(async () => {
			console.log('=== FILE TREE REFRESH CALLED ===');
			console.log('Previously expanded folders:', Array.from(expandedFolders));
			
			// Clear cache to force fresh data
			directoryCache.clear();
			
			const previouslyExpanded = new Set(expandedFolders);
			await loadFileTree();
			
			console.log('File tree reloaded, restoring expanded folders...');
			
			// Restore expanded folders more efficiently
			const loadPromises = [];
			const newExpandedFolders = new Set(expandedFolders);
			
			for (const folderPath of previouslyExpanded) {
				const folder = findItemByPath(fileTree, folderPath);
				if (folder) {
					console.log('Reloading children for folder:', folderPath);
					loadPromises.push(
						loadDirectory(folderPath).then(children => {
							folder.children = children;
						})
					);
				} else {
					// Folder no longer exists, remove from expanded folders
					console.log('Folder no longer exists, removing from expanded:', folderPath);
					newExpandedFolders.delete(folderPath);
				}
			}
			
			// Update expanded folders in parent if changed
			if (newExpandedFolders.size !== expandedFolders.size) {
				onExpandedFoldersChange(newExpandedFolders);
			}
			
			// Load all folders in parallel instead of sequentially
			if (loadPromises.length > 0) {
				await Promise.all(loadPromises);
				fileTree = [...fileTree];
			}
			
			console.log('File tree refresh completed');
			console.log('Expanded folders after refresh:', Array.from(expandedFolders));
		}, 100); // 100ms debounce
	}
	
	// Helper function to restore expanded folders
	async function restoreExpandedFolders() {
		if (expandedFolders.size === 0) return;
		
		console.log('Starting to restore expanded folders:', Array.from(expandedFolders));
		
		// Simple sequential restoration to avoid race conditions
		for (const folderPath of expandedFolders) {
			try {
				const folder = findItemByPath(fileTree, folderPath);
				if (folder && !folder.children) {
					console.log('Restoring folder:', folderPath);
					folder.children = await loadDirectory(folderPath);
				}
			} catch (error) {
				console.error('Error restoring folder:', folderPath, error);
			}
		}
		
		// Update the tree once at the end
		fileTree = [...fileTree];
		console.log('Finished restoring expanded folders');
	}

	// Method to expand a folder by path
	export function expandFolder(folderPath) {
		if (folderPath && !expandedFolders.has(folderPath)) {
			const newExpandedFolders = new Set(expandedFolders);
			newExpandedFolders.add(folderPath);
			onExpandedFoldersChange(newExpandedFolders);
			
			// Load the directory content if needed
			loadDirectory(folderPath).then(items => {
				const folder = findItemByPath(fileTree, folderPath);
				if (folder) {
					folder.children = items;
					fileTree = [...fileTree];
				}
			});
		}
	}
	
	// Track previous rootPath to detect actual changes
	let previousRootPath = $state(rootPath);
	
	// React to rootPath changes
	$effect(() => {
		if (rootPath && rootPath !== previousRootPath) {
			console.log('FileTree: rootPath changed from', previousRootPath, 'to', rootPath);
			// Clear cache and state when root path changes
			directoryCache.clear();
			// Clear expanded folders when root path changes
			onExpandedFoldersChange(new Set());
			loadFileTree();
			previousRootPath = rootPath;
		} else if (rootPath && !previousRootPath) {
			// Handle case where rootPath becomes available for the first time
			console.log('FileTree: rootPath became available:', rootPath);
			loadFileTree();
			previousRootPath = rootPath;
		}
	});

	// Remove the problematic effect that was causing infinite loops

	onMount(async () => {
		// Don't load if rootPath is not set
		if (!rootPath) {
			console.log('FileTree: rootPath not set, skipping initial load');
			return;
		}
		
		console.log('FileTree onMount: expandedFolders received:', Array.from(expandedFolders));
		
		await loadFileTree();
		
		// If there are expanded folders, restore them
		if (expandedFolders.size > 0) {
			console.log('Restoring expanded folders on mount:', Array.from(expandedFolders));
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
	{#each fileTree as item}
		{@render renderTreeItem(item, 0)}
	{/each}
	
	{#if fileTree.length === 0}
		<div class="text-gray-500 p-4 {spacingConfig.fontSize}">
			No markdown files found
		</div>
	{/if}
</div>

{#snippet renderTreeItem(item, depth)}
	<div class="file-item-container">
		<div
			class="file-item flex items-center hover:bg-gray-200 cursor-pointer select-none {spacingConfig.verticalPadding} {spacingConfig.horizontalPadding}"
			class:expanded={item.type === 'directory' && expandedFolders.has(item.path)}
			class:active-file={item.type === 'file' && item.path === activeFilePath}
			style="padding-left: {depth * spacingConfig.indentSize + 8}px"
			onclick={() => handleItemClick(item)}
			oncontextmenu={(e) => handleContextMenu(e, item)}
		>
			{#if item.type === 'directory'}
				<span class="mr-2 text-gray-500 arrow-indicator {spacingConfig.fontSize}">
					{#if expandedFolders.has(item.path)}
						<!-- Down arrow -->
						<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 12 12">
							<path d="M2 4 L6 8 L10 4 Z"/>
						</svg>
					{:else}
						<!-- Right arrow -->
						<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 12 12">
							<path d="M4 2 L8 6 L4 10 Z"/>
						</svg>
					{/if}
				</span>
				<span class="mr-2 text-blue-500">
					{#if expandedFolders.has(item.path)}
						<!-- Open folder icon -->
						<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/>
						</svg>
					{:else}
						<!-- Closed folder icon -->
						<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 20 20">
							<path d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
						</svg>
					{/if}
				</span>
			{:else}
				<span class="mr-2 text-gray-600" style="margin-left: {spacingConfig.indentSize}px">
					<!-- Document icon -->
					<svg class="{spacingConfig.iconSize} inline" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
					</svg>
				</span>
			{/if}
			<span class="text-gray-800 {spacingConfig.fontSize}">{item.name}</span>
		</div>
		
		{#if item.type === 'directory' && expandedFolders.has(item.path) && item.children}
			{#each item.children as child}
				{@render renderTreeItem(child, depth + 1)}
			{/each}
		{/if}
	</div>
{/snippet}

<!-- Context Menu -->
{#if contextMenu}
	<div
		class="context-menu fixed bg-white border border-gray-300 rounded shadow-lg py-1 z-50"
		style="left: {contextMenuPos.x}px; top: {contextMenuPos.y}px;"
	>
		{#if contextMenu.type === 'directory'}
			<button
				class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
				onclick={() => handleContextMenuAction('create_file')}
			>
				Add Document
			</button>
			<button
				class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
				onclick={() => handleContextMenuAction('create_folder')}
			>
				Add Folder
			</button>
			<hr class="my-1">
			<button
				class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
				onclick={() => handleContextMenuAction('delete')}
			>
				Delete
			</button>
		{:else}
			<button
				class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
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
	
	/* Fix directory icons in dark mode */
	:global(.dark) .file-item span {
		background-color: transparent !important;
		color: inherit !important;
	}
	
	/* More specific targeting for emoji spans */
	:global(.dark) .file-item span:first-child,
	:global(.dark) .file-item span:nth-child(2) {
		background-color: transparent !important;
		background: none !important;
	}
	
	/* Dark mode colors for icons */
	:global(.dark) .file-item .text-blue-500 {
		color: #60a5fa !important;
	}
	
	:global(.dark) .file-item .text-gray-600 {
		color: #d1d5db !important;
	}
	
	:global(.dark) .file-item .text-gray-500 {
		color: #9ca3af !important;
	}
	
	/* Fix arrow indicator backgrounds */
	.arrow-indicator {
		background-color: transparent !important;
		background: none !important;
		color: inherit !important;
	}
	
	.arrow-indicator svg {
		background-color: transparent !important;
		background: none !important;
	}
	
	/* More specific targeting for arrow indicators */
	.file-item .text-xs {
		background-color: transparent !important;
		background: none !important;
		color: inherit !important;
	}
	
	:global(.dark) .file-item .text-xs {
		background-color: transparent !important;
		background: none !important;
		color: inherit !important;
	}
	
	:global(.dark) .arrow-indicator {
		background-color: transparent !important;
		background: none !important;
		color: inherit !important;
	}
</style>