export class FileWatcher {
	constructor(rootPath, onFileChange) {
		this.rootPath = rootPath;
		this.onFileChange = onFileChange;
		this.clientId = Math.random().toString(36).substring(2, 15);
		this.eventSource = null;
		this.isActive = false;
	}

	async start() {
		if (this.isActive) return;

		try {
			// Start watcher on server
			const response = await fetch('/api/watch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'start',
					rootPath: this.rootPath,
					clientId: this.clientId
				})
			});

			if (!response.ok) {
				throw new Error('Failed to start file watcher');
			}

			// Set up event source for real-time updates
			this.eventSource = new EventSource(`/api/watch?clientId=${this.clientId}`);

			this.eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					this.handleFileEvent(data);
				} catch (error) {
					console.error('Error parsing file event:', error);
				}
			};

			this.eventSource.onerror = (error) => {
				console.error('File watcher error:', error);
			};

			this.isActive = true;
		} catch (error) {
			console.error('Error starting file watcher:', error);
		}
	}

	async stop() {
		if (!this.isActive) return;

		try {
			if (this.eventSource) {
				this.eventSource.close();
				this.eventSource = null;
			}

			await fetch('/api/watch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'stop',
					clientId: this.clientId
				})
			});

			this.isActive = false;
		} catch (error) {
			console.error('Error stopping file watcher:', error);
		}
	}

	handleFileEvent(data) {
		const { type, path } = data;

		// Convert absolute path to relative
		const relativePath = path.replace(this.rootPath, '').replace(/^[\\/]/, '');

		// Only handle markdown files and directories
		if (type === 'add' || type === 'change' || type === 'unlink') {
			if (path.endsWith('.md')) {
				this.onFileChange({
					type: type,
					path: relativePath,
					isDirectory: false
				});
			}
		} else if (type === 'addDir' || type === 'unlinkDir') {
			this.onFileChange({
				type: type === 'addDir' ? 'add' : 'unlink',
				path: relativePath,
				isDirectory: true
			});
		}
	}
}
