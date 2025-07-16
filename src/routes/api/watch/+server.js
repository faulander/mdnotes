import chokidar from 'chokidar';
import { json } from '@sveltejs/kit';

let watchers = new Map();

export async function POST({ request }) {
	const { action, rootPath, clientId } = await request.json();
	
	if (action === 'start') {
		// Stop existing watcher if any
		if (watchers.has(clientId)) {
			watchers.get(clientId).close();
		}
		
		// Start new watcher
		const watcher = chokidar.watch(rootPath, {
			ignored: /[\/\\]\./,
			persistent: true,
			depth: 10,
			ignoreInitial: true
		});
		
		watchers.set(clientId, watcher);
		
		return json({ success: true });
	} else if (action === 'stop') {
		if (watchers.has(clientId)) {
			watchers.get(clientId).close();
			watchers.delete(clientId);
		}
		
		return json({ success: true });
	}
	
	return json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET({ url }) {
	const clientId = url.searchParams.get('clientId');
	
	if (!clientId || !watchers.has(clientId)) {
		return json({ error: 'No active watcher' }, { status: 404 });
	}
	
	const watcher = watchers.get(clientId);
	
	// Set up Server-Sent Events
	const stream = new ReadableStream({
		start(controller) {
			const sendEvent = (data) => {
				controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
			};
			
			watcher.on('add', (path) => {
				sendEvent({ type: 'add', path });
			});
			
			watcher.on('change', (path) => {
				sendEvent({ type: 'change', path });
			});
			
			watcher.on('unlink', (path) => {
				sendEvent({ type: 'unlink', path });
			});
			
			watcher.on('addDir', (path) => {
				sendEvent({ type: 'addDir', path });
			});
			
			watcher.on('unlinkDir', (path) => {
				sendEvent({ type: 'unlinkDir', path });
			});
			
			watcher.on('error', (error) => {
				sendEvent({ type: 'error', error: error.message });
			});
		}
	});
	
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Cache-Control'
		}
	});
}