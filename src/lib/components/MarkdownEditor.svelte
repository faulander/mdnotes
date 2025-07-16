<script>
	import { onMount } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { markdown } from '@codemirror/lang-markdown';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { EditorState } from '@codemirror/state';
	
	let { 
		value = '', 
		onChange = () => {},
		darkMode = false
	} = $props();
	
	let editorElement;
	let editorView;
	
	onMount(() => {
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
				"&": {
					height: "100%",
					fontSize: "14px"
				},
				".cm-content": {
					padding: "12px",
					fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
				},
				".cm-editor": {
					height: "100%"
				},
				".cm-scroller": {
					height: "100%"
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
		
		return () => {
			if (editorView) {
				editorView.destroy();
			}
		};
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

<div class="h-full" bind:this={editorElement}></div>

<style>
	:global(.cm-editor) {
		height: 100%;
	}
	
	:global(.cm-scroller) {
		height: 100%;
	}
</style>