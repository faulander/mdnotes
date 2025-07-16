import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const currentPath = url.searchParams.get('path') || process.cwd();
	
	try {
		// Ensure the path exists and is a directory
		const stats = await fs.promises.stat(currentPath);
		if (!stats.isDirectory()) {
			return json({ error: 'Path is not a directory' }, { status: 400 });
		}
		
		const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
		const folders = [];
		
		// Get parent directory (if not root)
		const parentPath = path.dirname(currentPath);
		if (parentPath !== currentPath) {
			folders.push({
				name: '..',
				path: parentPath,
				isParent: true
			});
		}
		
		// Get all directories
		for (const entry of entries) {
			if (entry.isDirectory()) {
				const fullPath = path.join(currentPath, entry.name);
				folders.push({
					name: entry.name,
					path: fullPath,
					isParent: false
				});
			}
		}
		
		return json({
			currentPath,
			folders: folders.sort((a, b) => {
				// Parent directory first, then alphabetical
				if (a.isParent) return -1;
				if (b.isParent) return 1;
				return a.name.localeCompare(b.name);
			})
		});
	} catch (error) {
		console.error('Error browsing folder:', error);
		return json({ error: error.message }, { status: 500 });
	}
}