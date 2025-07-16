<script>
	import { onMount } from 'svelte';
	
	let { 
		isOpen = false,
		initialPath = '',
		onSelect = () => {},
		onCancel = () => {}
	} = $props();
	
	let currentPath = $state(initialPath || '');
	let folders = $state([]);
	let loading = $state(false);
	let error = $state('');
	
	async function loadFolders(path) {
		loading = true;
		error = '';
		
		try {
			const response = await fetch(`/api/browse-folder?path=${encodeURIComponent(path)}`);
			const data = await response.json();
			
			if (data.error) {
				error = data.error;
				return;
			}
			
			currentPath = data.currentPath;
			folders = data.folders;
		} catch (err) {
			error = 'Failed to load folders: ' + err.message;
		} finally {
			loading = false;
		}
	}
	
	function handleFolderClick(folder) {
		loadFolders(folder.path);
	}
	
	function handleSelect() {
		onSelect(currentPath);
	}
	
	function handleCancel() {
		onCancel();
	}
	
	async function getCwd() {
		try {
			const response = await fetch('/api/cwd');
			const data = await response.json();
			return data.cwd || '';
		} catch (error) {
			console.error('Error getting cwd:', error);
			return '';
		}
	}

	onMount(async () => {
		if (isOpen) {
			const cwd = await getCwd();
			loadFolders(currentPath || cwd);
		}
	});
	
	// Load folders when modal opens
	$effect(async () => {
		if (isOpen && !folders.length) {
			const cwd = await getCwd();
			loadFolders(currentPath || cwd);
		}
	});
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] flex flex-col">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-bold">Select Folder</h2>
				<button
					class="text-gray-500 hover:text-gray-700 text-2xl"
					onclick={handleCancel}
				>
					×
				</button>
			</div>
			
			<!-- Current Path Display -->
			<div class="mb-4 p-3 bg-gray-100 rounded border">
				<label class="block text-sm font-medium text-gray-700 mb-1">
					Current Path:
				</label>
				<div class="font-mono text-sm text-gray-800 break-all">
					{currentPath}
				</div>
			</div>
			
			<!-- Folder List -->
			<div class="flex-1 overflow-y-auto border border-gray-300 rounded mb-4">
				{#if loading}
					<div class="p-4 text-center text-gray-500">
						Loading folders...
					</div>
				{:else if error}
					<div class="p-4 text-center text-red-500">
						{error}
					</div>
				{:else if folders.length === 0}
					<div class="p-4 text-center text-gray-500">
						No folders found
					</div>
				{:else}
					{#each folders as folder}
						<button
							class="w-full text-left p-3 hover:bg-gray-100 border-b border-gray-200 flex items-center gap-3"
							onclick={() => handleFolderClick(folder)}
						>
							<span class="text-blue-500">
								{#if folder.isParent}
									<!-- Up arrow icon -->
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
									</svg>
								{:else}
									<!-- Folder icon -->
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
									</svg>
								{/if}
							</span>
							<span class="font-medium">
								{folder.name}
							</span>
						</button>
					{/each}
				{/if}
			</div>
			
			<!-- Actions -->
			<div class="flex justify-end gap-2">
				<button
					class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
					onclick={handleCancel}
				>
					Cancel
				</button>
				<button
					class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
					onclick={handleSelect}
					disabled={loading}
				>
					Select This Folder
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Dark mode support */
	:global(.dark) .bg-white {
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}
	
	:global(.dark) .bg-gray-100 {
		background-color: var(--bg-secondary);
	}
	
	:global(.dark) .border-gray-300,
	:global(.dark) .border-gray-200 {
		border-color: var(--border-color);
	}
	
	:global(.dark) .text-gray-700,
	:global(.dark) .text-gray-800 {
		color: var(--text-primary);
	}
	
	:global(.dark) .text-gray-500 {
		color: var(--text-secondary);
	}
	
	:global(.dark) .hover\:bg-gray-100:hover {
		background-color: var(--bg-tertiary);
	}
</style>