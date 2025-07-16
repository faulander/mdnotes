import { json } from '@sveltejs/kit';

export async function GET() {
	return json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		version: process.env.npm_package_version || '1.0.0'
	});
}