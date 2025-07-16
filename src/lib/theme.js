export function applyTheme(theme) {
	if (typeof window === 'undefined') return;

	const root = document.documentElement;

	// Remove existing theme classes
	root.classList.remove('dark', 'light');

	let actualTheme = theme;

	if (theme === 'system') {
		// Check system preference
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		actualTheme = prefersDark ? 'dark' : 'light';
	}

	// Apply theme class
	root.classList.add(actualTheme);

	// Update meta theme-color
	const metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (metaThemeColor) {
		metaThemeColor.content = actualTheme === 'dark' ? '#1f2937' : '#ffffff';
	}

	return actualTheme;
}

export function watchSystemTheme(callback) {
	if (typeof window === 'undefined') return () => {};

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	function handleChange(e) {
		callback(e.matches ? 'dark' : 'light');
	}

	mediaQuery.addEventListener('change', handleChange);

	return () => {
		mediaQuery.removeEventListener('change', handleChange);
	};
}
