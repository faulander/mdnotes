import { writable } from 'svelte/store';

// Default settings
const defaultSettings = {
	rootPath: typeof process !== 'undefined' ? process.cwd() : '/path/to/notes',
	theme: 'system', // 'light', 'dark', 'system'
	askBeforeClosingUnsavedTab: true,
	askBeforeDeleteNonEmptyFolder: true,
	editorFontSize: 14,
	editorFontFamily: 'Fira Code, Consolas, Monaco, monospace',
	sidebarWidth: 250,
	autoSave: false,
	autoSaveDelay: 2000,
	dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
	showFooter: true,
	fileTreeSpacing: 'normal', // 'compact', 'normal', 'comfortable'
	showToolbar: true,
	recentFilesCount: 5, // 0-10, 0 hides the section
	editorLineWrap: true, // Enable line wrapping in the editor (no horizontal scroll)
	toolbarButtons: {
		headings: true,
		bold: true,
		italic: true,
		code: true,
		codeBlock: true,
		link: true,
		list: true,
		orderedList: true,
		quote: true,
		strikethrough: false,
		table: false,
		hr: false
	}
};

// Create settings store
function createSettingsStore() {
	const { subscribe, set, update } = writable(defaultSettings);

	return {
		subscribe,
		set,
		update,

		// Load settings from localStorage
		load() {
			if (typeof window !== 'undefined') {
				const stored = localStorage.getItem('markdown-notes-settings');
				if (stored) {
					try {
						const parsed = JSON.parse(stored);
						// Merge with defaults to ensure new settings are included
						const merged = { ...defaultSettings, ...parsed };
						// Ensure toolbarButtons object exists and is properly merged
						if (merged.toolbarButtons) {
							merged.toolbarButtons = { ...defaultSettings.toolbarButtons, ...merged.toolbarButtons };
						}
						set(merged);
						return merged;
					} catch (error) {
						console.error('Error loading settings:', error);
					}
				}
			}
			return defaultSettings;
		},

		// Save settings to localStorage
		save(settings) {
			if (typeof window !== 'undefined') {
				localStorage.setItem('markdown-notes-settings', JSON.stringify(settings));
			}
			set(settings);
		},

		// Update a specific setting
		updateSetting(key, value) {
			update((settings) => {
				const newSettings = { ...settings, [key]: value };
				if (typeof window !== 'undefined') {
					localStorage.setItem('markdown-notes-settings', JSON.stringify(newSettings));
				}
				return newSettings;
			});
		},

		// Reset to defaults
		reset() {
			if (typeof window !== 'undefined') {
				localStorage.removeItem('markdown-notes-settings');
			}
			set(defaultSettings);
		}
	};
}

export const settings = createSettingsStore();
