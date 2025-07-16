<script>
	import { onMount, onDestroy } from 'svelte';
	import { version } from '../../../package.json';

	let {
		activeTab = null,
		dateTimeFormat = 'YYYY-MM-DD HH:mm:ss',
		isDarkMode = false,
		isEditing = true,
		onModeToggle = () => {}
	} = $props();

	let currentTime = $state(new Date());
	let timeInterval;

	// Calculate text statistics
	function getTextStats(content) {
		if (!content) return { words: 0, characters: 0, charactersNoSpaces: 0, readingTime: 0 };

		const words = content
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0).length;
		const characters = content.length;
		const charactersNoSpaces = content.replace(/\s/g, '').length;

		// Average reading speed is about 200 words per minute
		const readingTime = Math.ceil(words / 200);

		return { words, characters, charactersNoSpaces, readingTime };
	}

	// Format date/time based on user preference
	function formatDateTime(date, format) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		return format
			.replace('YYYY', year)
			.replace('MM', month)
			.replace('DD', day)
			.replace('HH', hours)
			.replace('mm', minutes)
			.replace('ss', seconds);
	}

	onMount(() => {
		// Update time every second
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		return () => {
			if (timeInterval) clearInterval(timeInterval);
		};
	});

	onDestroy(() => {
		if (timeInterval) clearInterval(timeInterval);
	});

	let textStats = $derived(
		activeTab
			? getTextStats(activeTab.content)
			: { words: 0, characters: 0, charactersNoSpaces: 0, readingTime: 0 }
	);
	let formattedTime = $derived(formatDateTime(currentTime, dateTimeFormat));
</script>

<footer
	class="flex flex-shrink-0 items-center justify-between border-t border-gray-300 bg-gray-50 px-4 py-2 text-xs text-gray-600"
	class:bg-gray-800={isDarkMode}
	class:border-gray-600={isDarkMode}
	class:text-gray-300={isDarkMode}
>
	<div class="flex items-center gap-4">
		<!-- File Status -->
		{#if activeTab}
			<span class="flex items-center gap-1">
				<span class="font-medium">{activeTab.name}</span>
				{#if activeTab.hasUnsavedChanges === true}
					<span class="text-orange-500" title="Unsaved changes">●</span>
					<span class="text-orange-500">Unsaved</span>
				{:else}
					<span class="text-green-500" title="Saved">✓</span>
					<span class="text-green-500">Saved</span>
				{/if}
			</span>

			<!-- Text Statistics -->
			<span class="text-gray-500">|</span>
			<span title="Word count">{textStats.words} words</span>
			<span title="Character count (with spaces)">{textStats.characters} chars</span>
			<span title="Character count (no spaces)"
				>{textStats.charactersNoSpaces} chars (no spaces)</span
			>
			{#if textStats.readingTime > 0}
				<span title="Estimated reading time">{textStats.readingTime} min read</span>
			{/if}
		{:else}
			<span class="text-gray-500">No file open</span>
		{/if}
	</div>

	<div class="flex items-center gap-4">
		<!-- Current Time -->
		<span title="Current date and time">{formattedTime}</span>

		<!-- Editor Mode -->
		{#if activeTab}
			<span class="text-gray-500">|</span>
			<button
				class="cursor-pointer rounded px-2 py-1 font-medium transition-colors hover:bg-gray-200"
				title="Click to toggle between Editor and Preview mode"
				onclick={onModeToggle}
			>
				{#if isEditing}Editor{:else}Preview{/if}
			</button>
		{/if}

		<!-- Version -->
		<span class="text-gray-500">|</span>
		<span title="Application version">v{version}</span>
	</div>
</footer>

<style>
	footer {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	:global(.dark) footer {
		background-color: var(--bg-secondary);
		border-color: var(--border-color);
		color: var(--text-secondary);
	}

	/* Dark mode support for mode toggle button */
	:global(.dark) footer button {
		color: var(--text-primary) !important;
		background-color: transparent !important;
	}

	:global(.dark) footer button:hover {
		background-color: var(--bg-tertiary) !important;
		color: var(--text-primary) !important;
	}
</style>
