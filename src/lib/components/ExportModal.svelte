<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let { isOpen = false, activeTab = null, isDarkMode = false, onExport, onClose } = $props();
	let selectedFormat = $state('html');
	let isExporting = $state(false);

	function handleExport() {
		if (!activeTab) {
			console.log('No active tab for export');
			return;
		}
		
		console.log('ExportModal: Starting export', { 
			format: selectedFormat, 
			filename: activeTab.name, 
			contentLength: activeTab.content?.length || 0 
		});
		
		isExporting = true;
		
		// Call the onExport prop function directly
		if (onExport) {
			onExport({
				detail: {
					format: selectedFormat,
					content: activeTab.content,
					filename: activeTab.name,
					path: activeTab.path
				}
			});
		}
		
		// Also dispatch the event for backward compatibility
		dispatch('export', {
			format: selectedFormat,
			content: activeTab.content,
			filename: activeTab.name,
			path: activeTab.path
		});
	}

	function handleClose() {
		// Call the onClose prop function directly
		if (onClose) {
			onClose();
		}
		
		// Also dispatch the event for backward compatibility
		dispatch('close');
		selectedFormat = 'html';
		isExporting = false;
	}

	// Reset exporting state when modal closes
	$effect(() => {
		if (!isOpen) {
			isExporting = false;
		}
	});

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			handleClose();
		} else if (event.key === 'Enter') {
			handleExport();
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div 
			class="w-96 rounded-lg bg-white p-6 shadow-xl"
			class:bg-gray-800={isDarkMode}
			class:text-gray-100={isDarkMode}
			role="dialog"
			aria-modal="true"
			aria-labelledby="export-title"
		>
			<h3 id="export-title" class="mb-4 text-lg font-semibold">Export Document</h3>
			
			{#if activeTab}
				<div class="mb-4">
					<p class="mb-2 text-sm text-gray-600" class:text-gray-400={isDarkMode}>
						Exporting: <span class="font-medium">{activeTab.name}</span>
					</p>
				</div>

				<div class="mb-6">
					<label class="mb-2 block text-sm font-medium">Choose format:</label>
					<div class="space-y-3">
						<label class="flex items-start">
							<input
								type="radio"
								name="format"
								value="html"
								bind:group={selectedFormat}
								class="mr-2 mt-1"
								disabled={isExporting}
							/>
							<div>
								<div>HTML (.html)</div>
								<div class="text-xs text-gray-500" class:text-gray-400={isDarkMode}>
									File will be saved to Downloads folder
								</div>
							</div>
						</label>
						<label class="flex items-start">
							<input
								type="radio"
								name="format"
								value="pdf"
								bind:group={selectedFormat}
								class="mr-2 mt-1"
								disabled={isExporting}
							/>
							<div>
								<div>PDF (.pdf)</div>
								<div class="text-xs text-gray-500" class:text-gray-400={isDarkMode}>
									File will be opened in browser
								</div>
							</div>
						</label>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<button
						class="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
						class:text-gray-400={isDarkMode}
						class:hover:bg-gray-700={isDarkMode}
						onclick={handleClose}
						disabled={isExporting}
					>
						Cancel
					</button>
					<button
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
						class:bg-blue-600={isDarkMode}
						class:hover:bg-blue-700={isDarkMode}
						onclick={handleExport}
						disabled={isExporting}
					>
						{isExporting ? 'Exporting...' : 'Export'}
					</button>
				</div>
			{:else}
				<div class="mb-4">
					<p class="text-sm text-gray-600" class:text-gray-400={isDarkMode}>
						No document is currently open.
					</p>
				</div>
				<div class="flex justify-end">
					<button
						class="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
						class:text-gray-400={isDarkMode}
						class:hover:bg-gray-700={isDarkMode}
						onclick={handleClose}
					>
						Close
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<svelte:window onkeydown={handleKeydown} />