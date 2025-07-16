<script>
	import { onMount } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { markdown } from '@codemirror/lang-markdown';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { EditorState } from '@codemirror/state';

	let { value = '', onChange = () => {}, darkMode = false, showToolbar = true } = $props();

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

	function createEditor() {
		if (editorView) {
			editorView.destroy();
		}

		const extensions = [
			basicSetup,
			markdown(),
			EditorView.lineWrapping,
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					onChange(update.state.doc.toString());
				}
			}),
			EditorView.theme({
				'&': {
					height: '100%',
					fontSize: '14px'
				},
				'.cm-content': {
					padding: '12px',
					fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
				},
				'.cm-editor': {
					height: '100%'
				},
				'.cm-scroller': {
					height: '100%'
				}
			})
		];

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

	// Recreate editor when dark mode changes
	$effect(() => {
		if (editorElement) {
			createEditor();
		}
	});

	// Update editor content when value prop changes
	$effect(() => {
		if (editorView && value !== editorView.state.doc.toString()) {
			editorView.dispatch({
				changes: {
					from: 0,
					to: editorView.state.doc.length,
					insert: value
				}
			});
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
			<div class="flex items-center gap-1">
				<button
					class="rounded px-2 py-1 text-sm font-medium hover:bg-gray-200"
					class:hover:bg-gray-700={darkMode}
					class:text-gray-100={darkMode}
					onclick={() => insertHeading(1)}
					title="Heading 1">H1</button
				>
				<button
					class="rounded px-2 py-1 text-sm font-medium hover:bg-gray-200"
					class:hover:bg-gray-700={darkMode}
					class:text-gray-100={darkMode}
					onclick={() => insertHeading(2)}
					title="Heading 2">H2</button
				>
				<button
					class="rounded px-2 py-1 text-sm font-medium hover:bg-gray-200"
					class:hover:bg-gray-700={darkMode}
					class:text-gray-100={darkMode}
					onclick={() => insertHeading(3)}
					title="Heading 3">H3</button
				>
			</div>

			<div class="mx-1 h-6 w-px bg-gray-300" class:bg-gray-600={darkMode}></div>

			<!-- Text formatting -->
			<button
				class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200"
				class:hover:bg-gray-700={darkMode}
				class:text-gray-100={darkMode}
				onclick={insertBold}
				title="Bold">B</button
			>
			<button
				class="rounded px-2 py-1 text-sm italic hover:bg-gray-200"
				class:hover:bg-gray-700={darkMode}
				class:text-gray-100={darkMode}
				onclick={insertItalic}
				title="Italic">I</button
			>
			<button
				class="rounded px-2 py-1 font-mono text-sm hover:bg-gray-200"
				class:hover:bg-gray-700={darkMode}
				class:text-gray-100={darkMode}
				onclick={insertCode}
				title="Inline code">`</button
			>

			<div class="mx-1 h-6 w-px bg-gray-300" class:bg-gray-600={darkMode}></div>

			<!-- Lists -->
			<button
				class="rounded px-2 py-1 text-sm hover:bg-gray-200"
				class:hover:bg-gray-700={darkMode}
				class:text-gray-100={darkMode}
				onclick={insertList}
				title="Bullet list">• List</button
			>
			<button
				class="rounded px-2 py-1 text-sm hover:bg-gray-200"
				class:hover:bg-gray-700={darkMode}
				class:text-gray-100={darkMode}
				onclick={insertOrderedList}
				title="Numbered list">1. List</button
			>

			<div class="mx-1 h-6 w-px bg-gray-300" class:bg-gray-600={darkMode}></div>

			<!-- Other -->
			<button
				class="rounded px-2 py-1 text-sm hover:bg-gray-200"
				class:hover:bg-gray-700={darkMode}
				class:text-gray-100={darkMode}
				onclick={insertLink}
				title="Link">Link</button
			>
			<button
				class="rounded px-2 py-1 text-sm hover:bg-gray-200"
				class:hover:bg-gray-700={darkMode}
				class:text-gray-100={darkMode}
				onclick={insertQuote}
				title="Quote">" Quote</button
			>
			<button
				class="rounded px-2 py-1 text-sm hover:bg-gray-200"
				class:hover:bg-gray-700={darkMode}
				class:text-gray-100={darkMode}
				onclick={insertCodeBlock}
				title="Code block">```</button
			>
		</div>
	{/if}

	<!-- Editor -->
	<div class="flex-1" bind:this={editorElement}></div>
</div>

<style>
	:global(.cm-editor) {
		height: 100%;
	}

	:global(.cm-scroller) {
		height: 100%;
	}
</style>
