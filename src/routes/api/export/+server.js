import { json } from '@sveltejs/kit';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

// Configure marked for export with proper styling
marked.use(markedHighlight({
	langPrefix: 'hljs language-',
	highlight(code, lang) {
		if (!lang) return code;
		const language = hljs.getLanguage(lang) ? lang : 'plaintext';
		try {
			return hljs.highlight(code, { language }).value;
		} catch (error) {
			console.error('Highlight.js error:', error);
			return code;
		}
	}
}));

marked.setOptions({
	gfm: true,
	breaks: true
});

export async function POST({ request }) {
	try {
		console.log('Export API: Request received');
		const { format, content, filename, path, rootPath } = await request.json();

		console.log('Export API: Parsed request', { 
			format, 
			filename, 
			contentLength: content?.length || 0,
			path: path || 'undefined',
			rootPath: rootPath || 'undefined'
		});

		if (!format || !content) {
			console.log('Export API: Missing format or content');
			return json({ error: 'Format and content are required' }, { status: 400 });
		}

		if (format === 'html') {
			console.log('Export API: Generating HTML');
			return await generateHTML(content, filename);
		} else if (format === 'pdf') {
			console.log('Export API: Generating PDF');
			return await generatePDF(content, filename);
		} else {
			console.log('Export API: Unsupported format:', format);
			return json({ error: 'Unsupported format' }, { status: 400 });
		}
	} catch (error) {
		console.error('Export API: Error:', error);
		return json({ error: 'Export failed' }, { status: 500 });
	}
}

async function generateHTML(content, filename) {
	console.log('HTML Generation: Starting HTML generation');
	const htmlContent = marked(content);
	console.log('HTML Generation: Markdown converted to HTML, length:', htmlContent.length);
	
	// Create a complete HTML document with proper styling
	const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background-color: #fff;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
            line-height: 1.25;
        }
        
        h1 {
            font-size: 2rem;
            border-bottom: 1px solid #e1e4e8;
            padding-bottom: 0.5rem;
        }
        
        h2 {
            font-size: 1.5rem;
            border-bottom: 1px solid #e1e4e8;
            padding-bottom: 0.3rem;
        }
        
        h3 {
            font-size: 1.25rem;
        }
        
        p {
            margin-bottom: 1rem;
        }
        
        ul, ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
        }
        
        li {
            margin-bottom: 0.25rem;
        }
        
        blockquote {
            margin: 1rem 0;
            padding: 0 1rem;
            border-left: 4px solid #e1e4e8;
            color: #586069;
        }
        
        code {
            background-color: #f6f8fa;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
            font-size: 0.875rem;
        }
        
        pre {
            background-color: #f6f8fa;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        pre code {
            background-color: transparent;
            padding: 0;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        
        th, td {
            border: 1px solid #e1e4e8;
            padding: 0.5rem;
            text-align: left;
        }
        
        th {
            background-color: #f6f8fa;
            font-weight: 600;
        }
        
        a {
            color: #0366d6;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        img {
            max-width: 100%;
            height: auto;
        }
        
        hr {
            border: none;
            border-top: 1px solid #e1e4e8;
            margin: 2rem 0;
        }
        
        .task-list-item {
            list-style-type: none;
        }
        
        .task-list-item input[type="checkbox"] {
            margin-right: 0.5rem;
        }
        
        del {
            color: #586069;
        }
        
        @media print {
            body {
                padding: 1rem;
            }
            
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
            }
            
            pre, blockquote {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

	console.log('HTML Generation: Full HTML document length:', fullHtml.length);
	console.log('HTML Generation: Returning HTML response');
	
	return new Response(fullHtml, {
		headers: {
			'Content-Type': 'text/html',
			'Content-Disposition': `attachment; filename="${filename.replace(/\.md$/, '')}.html"`
		}
	});
}

async function generatePDF(content, filename) {
	try {
		console.log('PDF Generation: Starting PDF generation');
		
		// For PDF generation, we'll use Puppeteer
		console.log('PDF Generation: Importing Puppeteer');
		const puppeteer = await import('puppeteer');
		
		console.log('PDF Generation: Launching browser');
		const browser = await puppeteer.default.launch({
			headless: 'new'
		});
		
		console.log('PDF Generation: Creating new page');
		const page = await browser.newPage();
		
		// Generate HTML content first
		const htmlContent = marked(content);
		
		const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background-color: #fff;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
            line-height: 1.25;
        }
        
        h1 {
            font-size: 2rem;
            border-bottom: 1px solid #e1e4e8;
            padding-bottom: 0.5rem;
        }
        
        h2 {
            font-size: 1.5rem;
            border-bottom: 1px solid #e1e4e8;
            padding-bottom: 0.3rem;
        }
        
        h3 {
            font-size: 1.25rem;
        }
        
        p {
            margin-bottom: 1rem;
        }
        
        ul, ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
        }
        
        li {
            margin-bottom: 0.25rem;
        }
        
        blockquote {
            margin: 1rem 0;
            padding: 0 1rem;
            border-left: 4px solid #e1e4e8;
            color: #586069;
        }
        
        code {
            background-color: #f6f8fa;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
            font-size: 0.875rem;
        }
        
        pre {
            background-color: #f6f8fa;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        pre code {
            background-color: transparent;
            padding: 0;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        
        th, td {
            border: 1px solid #e1e4e8;
            padding: 0.5rem;
            text-align: left;
        }
        
        th {
            background-color: #f6f8fa;
            font-weight: 600;
        }
        
        a {
            color: #0366d6;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        img {
            max-width: 100%;
            height: auto;
        }
        
        hr {
            border: none;
            border-top: 1px solid #e1e4e8;
            margin: 2rem 0;
        }
        
        .task-list-item {
            list-style-type: none;
        }
        
        .task-list-item input[type="checkbox"] {
            margin-right: 0.5rem;
        }
        
        del {
            color: #586069;
        }
        
        @media print {
            body {
                padding: 1rem;
            }
            
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
            }
            
            pre, blockquote {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

		console.log('PDF Generation: Setting page content');
		await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
		
		console.log('PDF Generation: Generating PDF');
		const pdf = await page.pdf({
			format: 'A4',
			margin: {
				top: '1cm',
				right: '1cm',
				bottom: '1cm',
				left: '1cm'
			},
			printBackground: true
		});
		
		console.log('PDF Generation: Closing browser');
		await browser.close();
		
		console.log('PDF Generation: Returning PDF response, size:', pdf.length);
		return new Response(pdf, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${filename.replace(/\.md$/, '')}.pdf"`
			}
		});
	} catch (error) {
		console.error('PDF generation error:', error);
		
		// Fallback: return HTML if PDF generation fails
		console.log('Falling back to HTML export due to PDF generation error');
		return await generateHTML(content, filename);
	}
}