<script>
	import { settings } from '$lib/stores/settings.js';
	import FolderPicker from './FolderPicker.svelte';

	let { isOpen = false, onClose = () => {} } = $props();

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
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="max-h-[80vh] w-[500px] overflow-y-auto rounded-lg bg-white p-6">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-bold">Settings</h2>
				<button class="text-2xl text-gray-500 hover:text-gray-700" onclick={handleCancel}>
					×
				</button>
			</div>

			<div class="space-y-6">
				<!-- Root Path -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Root Directory </label>
					<div class="flex gap-2">
						<input
							type="text"
							class="flex-1 rounded border border-gray-300 p-2"
							bind:value={currentSettings.rootPath}
							readonly
						/>
						<button
							class="rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
							onclick={selectRootPath}
						>
							Browse
						</button>
					</div>
				</div>

				<!-- Theme -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Theme </label>
					<select
						class="w-full rounded border border-gray-300 p-2"
						bind:value={currentSettings.theme}
					>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
						<option value="system">System</option>
					</select>
				</div>

				<!-- Editor Settings -->
				<div>
					<h3 class="mb-3 text-lg font-semibold">Editor</h3>

					<div class="space-y-4">
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700"> Font Size </label>
							<input
								type="number"
								class="w-full rounded border border-gray-300 p-2"
								bind:value={currentSettings.editorFontSize}
								min="8"
								max="24"
							/>
						</div>

						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700"> Font Family </label>
							<input
								type="text"
								class="w-full rounded border border-gray-300 p-2"
								bind:value={currentSettings.editorFontFamily}
							/>
						</div>
					</div>
				</div>

				<!-- Behavior Settings -->
				<div>
					<h3 class="mb-3 text-lg font-semibold">Behavior</h3>

					<div class="space-y-4">
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={currentSettings.askBeforeClosingUnsavedTab} />
							<span class="text-sm">Ask before closing tabs with unsaved changes</span>
						</label>

						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={currentSettings.askBeforeDeleteNonEmptyFolder} />
							<span class="text-sm">Ask before deleting non-empty folders</span>
						</label>

						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={currentSettings.autoSave} />
							<span class="text-sm">Auto-save changes</span>
						</label>

						{#if currentSettings.autoSave}
							<div class="ml-6">
								<label class="mb-2 block text-sm font-medium text-gray-700">
									Auto-save delay (ms)
								</label>
								<input
									type="number"
									class="w-full rounded border border-gray-300 p-2"
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
					<h3 class="mb-3 text-lg font-semibold">Interface</h3>

					<div class="space-y-4">
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={currentSettings.showFooter} />
							<span class="text-sm">Show footer with file statistics</span>
						</label>

						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={currentSettings.showToolbar} />
							<span class="text-sm">Show editor toolbar for markdown formatting</span>
						</label>

						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700"> Date/Time Format </label>
							<select
								class="w-full rounded border border-gray-300 p-2"
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

						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700">
								File Tree Spacing
							</label>
							<select
								class="w-full rounded border border-gray-300 p-2"
								bind:value={currentSettings.fileTreeSpacing}
							>
								<option value="compact">Compact (for large directories)</option>
								<option value="normal">Normal (default)</option>
								<option value="comfortable">Comfortable (more space)</option>
							</select>
						</div>

						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700">
								Recent Files Count
							</label>
							<input
								type="number"
								class="w-full rounded border border-gray-300 p-2"
								bind:value={currentSettings.recentFilesCount}
								min="0"
								max="10"
							/>
							<p class="mt-1 text-xs text-gray-500">
								Number of recently opened files to show (0 to hide section)
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-8 flex justify-between">
				<button class="rounded px-4 py-2 text-red-600 hover:bg-red-50" onclick={handleReset}>
					Reset to Defaults
				</button>

				<div class="flex gap-2">
					<button class="rounded px-4 py-2 text-gray-600 hover:bg-gray-100" onclick={handleCancel}>
						Cancel
					</button>
					<button
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
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
