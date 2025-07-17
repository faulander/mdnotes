import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const DEFAULT_ROOT = process.cwd();

export async function GET({ url }) {
	const rootPath = url.searchParams.get('root') || DEFAULT_ROOT;
	const relativePath = url.searchParams.get('path') || '';

	try {
		const fullPath = path.resolve(rootPath, relativePath);

		// Security check: ensure we're not accessing files outside the root
		if (!fullPath.startsWith(path.resolve(rootPath))) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		const stats = await fs.promises.stat(fullPath);

		if (stats.isDirectory()) {
			const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
			const items = [];

			// Helper function to check if a directory contains .md files (recursively)
			async function hasMarkdownFiles(dirPath) {
				try {
					const dirEntries = await fs.promises.readdir(dirPath, { withFileTypes: true });

					for (const dirEntry of dirEntries) {
						if (dirEntry.isFile() && dirEntry.name.endsWith('.md')) {
							return true;
						}
						if (dirEntry.isDirectory()) {
							const subDirPath = path.join(dirPath, dirEntry.name);
							if (await hasMarkdownFiles(subDirPath)) {
								return true;
							}
						}
					}
					return false;
				} catch (error) {
					return false;
				}
			}

			for (const entry of entries) {
				const entryPath = path.join(fullPath, entry.name);
				const entryStats = await fs.promises.stat(entryPath);

				if (entry.isDirectory()) {
					// Include all directories (not just those with .md files)
					items.push({
						name: entry.name,
						type: 'directory',
						path: path.relative(rootPath, entryPath),
						modified: entryStats.mtime
					});
				} else if (entry.isFile() && entry.name.endsWith('.md')) {
					items.push({
						name: entry.name,
						type: 'file',
						path: path.relative(rootPath, entryPath),
						modified: entryStats.mtime,
						size: entryStats.size
					});
				}
			}

			// Sort: directories first, then files, both alphabetically
			items.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === 'directory' ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			});

			return json({ items });
		} else {
			// Return file content
			const content = await fs.promises.readFile(fullPath, 'utf-8');
			return json({
				content,
				name: path.basename(fullPath),
				path: path.relative(rootPath, fullPath),
				modified: stats.mtime,
				size: stats.size
			});
		}
	} catch (error) {
		console.error('File system error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}

export async function POST({ request }) {
	const { action, path: filePath, content, name, rootPath = DEFAULT_ROOT } = await request.json();

	console.log('POST request:', { action, filePath, name, rootPath });

	try {
		const fullPath = path.resolve(rootPath, filePath || '');

		// Security check
		if (!fullPath.startsWith(path.resolve(rootPath))) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		switch (action) {
			case 'create_file': {
				const fileName = name.endsWith('.md') ? name : `${name}.md`;
				const newFilePath = path.join(fullPath, fileName);

				console.log('Creating file:', { fileName, newFilePath, fullPath });

				// Check if file already exists
				if (fs.existsSync(newFilePath)) {
					console.log('File already exists:', newFilePath);
					return json({ error: 'File already exists' }, { status: 409 });
				}

				await fs.promises.writeFile(newFilePath, content || '');
				console.log('File created successfully:', newFilePath);

				return json({
					success: true,
					path: path.relative(rootPath, newFilePath),
					name: fileName
				});
			}

			case 'create_directory': {
				const newDirPath = path.join(fullPath, name);

				if (fs.existsSync(newDirPath)) {
					return json({ error: 'Directory already exists' }, { status: 409 });
				}

				await fs.promises.mkdir(newDirPath, { recursive: true });
				return json({
					success: true,
					path: path.relative(rootPath, newDirPath),
					name
				});
			}

			case 'save_file': {
				const targetPath = path.resolve(rootPath, filePath);
				await fs.promises.writeFile(targetPath, content, 'utf8');
				return json({ success: true });
			}

			case 'delete': {
				const targetPath = path.resolve(rootPath, filePath);
				const stats = await fs.promises.stat(targetPath);

				if (stats.isDirectory()) {
					await fs.promises.rm(targetPath, { recursive: true });
				} else {
					await fs.promises.unlink(targetPath);
				}

				return json({ success: true });
			}

			default:
				return json({ error: 'Unknown action' }, { status: 400 });
		}
	} catch (error) {
		console.error('File operation error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
