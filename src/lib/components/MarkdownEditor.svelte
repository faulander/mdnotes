<script>
	import { onMount } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { markdown } from '@codemirror/lang-markdown';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { EditorState } from '@codemirror/state';

	let { 
		value = '', 
		onChange = () => {}, 
		darkMode = false, 
		showToolbar = true,
		toolbarButtons = {},
		lineWrap = true
	} = $props();

	let editorElement;
	let editorView;

	// Toolbar actions
	function insertText(before, after = '') {
		if (!editorView) return;

		const state = editorView.state;
		const selection = state.selection.main;
		const selectedText = state.doc.sliceString(selection.from, selection.to);

		editorView.dispatch({
			changes: {
				from: selection.from,
				to: selection.to,
				insert: `${before}${selectedText}${after}`
			},
			selection: {
				anchor: selection.from + before.length,
				head: selection.from + before.length + selectedText.length
			}
		});

		editorView.focus();
	}

	function insertHeading(level) {
		insertText('#'.repeat(level) + ' ');
	}

	function insertBold() {
		insertText('**', '**');
	}

	function insertItalic() {
		insertText('*', '*');
	}

	function insertCode() {
		insertText('`', '`');
	}

	function insertCodeBlock() {
		insertText('```\n', '\n```');
	}

	function insertLink() {
		insertText('[', '](url)');
	}

	function insertList() {
		insertText('- ');
	}

	function insertOrderedList() {
		insertText('1. ');
	}

	function insertQuote() {
		insertText('> ');
	}

	function insertStrikethrough() {
		insertText('~~', '~~');
	}

	function insertTable() {
		insertText('| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n');
	}

	function insertHr() {
		insertText('\n---\n\n');
	}

	function createEditor() {
		if (editorView) {
			editorView.destroy();
		}

		const extensions = [
			basicSetup,
			markdown(),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					const newContent = update.state.doc.toString();
					// Update tracking variable to prevent unnecessary updates
					lastFileContent = newContent;
					onChange(newContent);
				}
			}),
			EditorView.theme({
				'&': {
					fontSize: '14px',
					height: '100%'
				},
				'.cm-content': {
					padding: '12px',
					fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
				},
				'.cm-editor': {
					height: '100%'
				},
				'.cm-scroller': {
					fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
					overflow: 'auto'
				},
				// Ensure horizontal scrolling works when line wrap is disabled
				...(!lineWrap && {
					'.cm-editor .cm-scroller': {
						overflowX: 'auto',
						overflowY: 'auto'
					}
				})
			})
		];

		// Add line wrapping conditionally
		if (lineWrap) {
			extensions.push(EditorView.lineWrapping);
		}

		if (darkMode) {
			extensions.push(oneDark);
		}

		editorView = new EditorView({
			doc: value,
			extensions,
			parent: editorElement
		});
	}

	onMount(() => {
		createEditor();

		return () => {
			if (editorView) {
				editorView.destroy();
			}
		};
	});

	// Recreate editor when dark mode or line wrap changes
	let previousDarkMode = darkMode;
	let previousLineWrap = lineWrap;
	$effect(() => {
		if (editorElement && (darkMode !== previousDarkMode || lineWrap !== previousLineWrap)) {
			createEditor();
			previousDarkMode = darkMode;
			previousLineWrap = lineWrap;
		}
	});

	// Track the last file content to detect file switches
	let lastFileContent = value;
	
	// Only update editor when switching to a different file
	let updateTimeout;
	$effect(() => {
		if (editorView) {
			// Only update if the new value is significantly different (likely a file switch)
			const currentContent = editorView.state.doc.toString();
			
			// If the value prop is very different from current editor content, it's likely a file switch
			if (value !== currentContent && value !== lastFileContent) {
				// Clear any pending updates
				if (updateTimeout) {
					clearTimeout(updateTimeout);
				}
				
				// Use immediate update for better performance
				editorView.dispatch({
					changes: {
						from: 0,
						to: editorView.state.doc.length,
						insert: value
					},
					// Reset scroll position to top for new file
					selection: { anchor: 0, head: 0 }
				});
				lastFileContent = value;
			}
		}
	});
</script>

<div class="flex h-full flex-col">
	<!-- Toolbar -->
	{#if showToolbar}
		<div
			class="flex flex-shrink-0 items-center gap-1 border-b border-gray-200 bg-gray-50 p-2"
			class:bg-gray-800={darkMode}
			class:border-gray-600={darkMode}
		>
			<!-- Headings -->
			{#if toolbarButtons.headings}
				<div class="flex items-center gap-1">
					<button
						class="rounded px-2 py-1 text-sm font-medium transition-all hover:shadow-sm hover:scale-105"
						class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
						class:text-gray-100={darkMode}
						onclick={() => insertHeading(1)}
						title="Heading 1">H1</button
					>
					<button
						class="rounded px-2 py-1 text-sm font-medium transition-all hover:shadow-sm hover:scale-105"
						class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
						class:text-gray-100={darkMode}
						onclick={() => insertHeading(2)}
						title="Heading 2">H2</button
					>
					<button
						class="rounded px-2 py-1 text-sm font-medium transition-all hover:shadow-sm hover:scale-105"
						class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
						class:text-gray-100={darkMode}
						onclick={() => insertHeading(3)}
						title="Heading 3">H3</button
					>
				</div>
				<div class="mx-1 h-6 w-px bg-gray-300" class:bg-gray-600={darkMode}></div>
			{/if}

			<!-- Text formatting -->
			{#if toolbarButtons.bold}
				<button
					class="rounded px-2 py-1 text-sm font-bold transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertBold}
					title="Bold">B</button
				>
			{/if}
			{#if toolbarButtons.italic}
				<button
					class="rounded px-2 py-1 text-sm italic transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertItalic}
					title="Italic">I</button
				>
			{/if}
			{#if toolbarButtons.strikethrough}
				<button
					class="rounded px-2 py-1 text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertStrikethrough}
					title="Strikethrough">~~</button
				>
			{/if}
			{#if toolbarButtons.code}
				<button
					class="rounded px-2 py-1 font-mono text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertCode}
					title="Inline code">`</button
				>
			{/if}
			{#if toolbarButtons.codeBlock}
				<button
					class="rounded px-2 py-1 text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertCodeBlock}
					title="Code block">```</button
				>
			{/if}
			
			{#if toolbarButtons.bold || toolbarButtons.italic || toolbarButtons.strikethrough || toolbarButtons.code || toolbarButtons.codeBlock}
				<div class="mx-1 h-6 w-px bg-gray-300" class:bg-gray-600={darkMode}></div>
			{/if}

			<!-- Lists -->
			{#if toolbarButtons.list}
				<button
					class="rounded px-2 py-1 text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertList}
					title="Bullet list">• List</button
				>
			{/if}
			{#if toolbarButtons.orderedList}
				<button
					class="rounded px-2 py-1 text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertOrderedList}
					title="Numbered list">1. List</button
				>
			{/if}
			
			{#if toolbarButtons.list || toolbarButtons.orderedList}
				<div class="mx-1 h-6 w-px bg-gray-300" class:bg-gray-600={darkMode}></div>
			{/if}

			<!-- Other -->
			{#if toolbarButtons.link}
				<button
					class="rounded px-2 py-1 text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertLink}
					title="Link">Link</button
				>
			{/if}
			{#if toolbarButtons.quote}
				<button
					class="rounded px-2 py-1 text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertQuote}
					title="Quote">" Quote</button
				>
			{/if}
			{#if toolbarButtons.table}
				<button
					class="rounded px-2 py-1 text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertTable}
					title="Table">Table</button
				>
			{/if}
			{#if toolbarButtons.hr}
				<button
					class="rounded px-2 py-1 text-sm transition-all hover:shadow-sm hover:scale-105"
					class:hover:bg-gray-200={!darkMode} class:hover:bg-blue-500={darkMode} class:hover:text-gray-100={darkMode}
					class:text-gray-100={darkMode}
					onclick={insertHr}
					title="Horizontal rule">---</button
				>
			{/if}
		</div>
	{/if}

	<!-- Editor -->
	<div class="flex-1" class:overflow-hidden={lineWrap} class:overflow-auto={!lineWrap} bind:this={editorElement}></div>
</div>

<style>
	:global(.cm-editor.cm-focused) {
		outline: none;
	}
	
	:global(.cm-editor) {
		height: 100% !important;
	}
	
	:global(.cm-scroller) {
		height: 100% !important;
		overflow-y: auto !important;
	}
</style>
