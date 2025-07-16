<script>
	import { settings } from '$lib/stores/settings.js';
	import FolderPicker from './FolderPicker.svelte';
	
	let { 
		isOpen = false, 
		onClose = () => {} 
	} = $props();
	
	let currentSettings = $state({});
	let showFolderPicker = $state(false);
	
	// Load current settings when modal opens
	$effect(() => {
		if (isOpen) {
			currentSettings = { ...$settings };
		}
	});
	
	function handleSave() {
		settings.save(currentSettings);
		onClose();
	}
	
	function handleCancel() {
		onClose();
	}
	
	function handleReset() {
		if (confirm('Are you sure you want to reset all settings to defaults?')) {
			settings.reset();
			onClose();
		}
	}
	
	function selectRootPath() {
		showFolderPicker = true;
	}
	
	function handleFolderSelected(path) {
		currentSettings.rootPath = path;
		showFolderPicker = false;
	}
	
	function handleFolderPickerCancel() {
		showFolderPicker = false;
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-xl font-bold">Settings</h2>
				<button
					class="text-gray-500 hover:text-gray-700 text-2xl"
					onclick={handleCancel}
				>
					×
				</button>
			</div>
			
			<div class="space-y-6">
				<!-- Root Path -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Root Directory
					</label>
					<div class="flex gap-2">
						<input
							type="text"
							class="flex-1 p-2 border border-gray-300 rounded"
							bind:value={currentSettings.rootPath}
							readonly
						/>
						<button
							class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							onclick={selectRootPath}
						>
							Browse
						</button>
					</div>
				</div>
				
				<!-- Theme -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Theme
					</label>
					<select
						class="w-full p-2 border border-gray-300 rounded"
						bind:value={currentSettings.theme}
					>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
						<option value="system">System</option>
					</select>
				</div>
				
				<!-- Editor Settings -->
				<div>
					<h3 class="text-lg font-semibold mb-3">Editor</h3>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Font Size
							</label>
							<input
								type="number"
								class="w-full p-2 border border-gray-300 rounded"
								bind:value={currentSettings.editorFontSize}
								min="8"
								max="24"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Font Family
							</label>
							<input
								type="text"
								class="w-full p-2 border border-gray-300 rounded"
								bind:value={currentSettings.editorFontFamily}
							/>
						</div>
					</div>
				</div>
				
				<!-- Behavior Settings -->
				<div>
					<h3 class="text-lg font-semibold mb-3">Behavior</h3>
					
					<div class="space-y-4">
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								bind:checked={currentSettings.askBeforeClosingUnsavedTab}
							/>
							<span class="text-sm">Ask before closing tabs with unsaved changes</span>
						</label>
						
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								bind:checked={currentSettings.askBeforeDeleteNonEmptyFolder}
							/>
							<span class="text-sm">Ask before deleting non-empty folders</span>
						</label>
						
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								bind:checked={currentSettings.autoSave}
							/>
							<span class="text-sm">Auto-save changes</span>
						</label>
						
						{#if currentSettings.autoSave}
							<div class="ml-6">
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Auto-save delay (ms)
								</label>
								<input
									type="number"
									class="w-full p-2 border border-gray-300 rounded"
									bind:value={currentSettings.autoSaveDelay}
									min="500"
									max="10000"
									step="500"
								/>
							</div>
						{/if}
					</div>
				</div>
				
				<!-- Interface Settings -->
				<div>
					<h3 class="text-lg font-semibold mb-3">Interface</h3>
					
					<div class="space-y-4">
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								bind:checked={currentSettings.showFooter}
							/>
							<span class="text-sm">Show footer with file statistics</span>
						</label>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Date/Time Format
							</label>
							<select
								class="w-full p-2 border border-gray-300 rounded"
								bind:value={currentSettings.dateTimeFormat}
							>
								<option value="YYYY-MM-DD HH:mm:ss">2024-12-01 14:30:45</option>
								<option value="DD/MM/YYYY HH:mm">01/12/2024 14:30</option>
								<option value="MM/DD/YYYY HH:mm">12/01/2024 14:30</option>
								<option value="YYYY-MM-DD">2024-12-01</option>
								<option value="HH:mm:ss">14:30:45</option>
								<option value="HH:mm">14:30</option>
							</select>
						</div>
					</div>
				</div>
			</div>
			
			<div class="flex justify-between mt-8">
				<button
					class="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
					onclick={handleReset}
				>
					Reset to Defaults
				</button>
				
				<div class="flex gap-2">
					<button
						class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
						onclick={handleCancel}
					>
						Cancel
					</button>
					<button
						class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
						onclick={handleSave}
					>
						Save
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Folder Picker Modal -->
<FolderPicker
	isOpen={showFolderPicker}
	initialPath={currentSettings.rootPath}
	onSelect={handleFolderSelected}
	onCancel={handleFolderPickerCancel}
/>