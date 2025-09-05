const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  try {
    console.log('🚀 Starting PDF generation...');
    
    // Read the markdown file
    const markdownPath = path.join(__dirname, '../docs/SOFTWARE_ANALYSIS_TABULAR.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');
    
    // Convert markdown to HTML
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IOMS Software Deep Root Analysis</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            
            h1 {
                color: #2563eb;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 10px;
                margin-bottom: 30px;
                font-size: 2.5em;
            }
            
            h2 {
                color: #1e40af;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 8px;
                margin-top: 40px;
                margin-bottom: 20px;
                font-size: 1.8em;
            }
            
            h3 {
                color: #374151;
                margin-top: 30px;
                margin-bottom: 15px;
                font-size: 1.4em;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 0.9em;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            
            th {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                font-size: 0.85em;
            }
            
            td {
                padding: 10px 8px;
                border-bottom: 1px solid #e5e7eb;
                vertical-align: top;
            }
            
            tr:nth-child(even) {
                background-color: #f8fafc;
            }
            
            tr:hover {
                background-color: #e0f2fe;
            }
            
            .metric-highlight {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                font-weight: bold;
                padding: 4px 8px;
                border-radius: 4px;
                display: inline-block;
            }
            
            .risk-high {
                background-color: #fef2f2;
                color: #dc2626;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .risk-medium {
                background-color: #fffbeb;
                color: #d97706;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .risk-low {
                background-color: #f0fdf4;
                color: #16a34a;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .priority-critical {
                background-color: #fef2f2;
                color: #dc2626;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .priority-high {
                background-color: #fffbeb;
                color: #d97706;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .priority-medium {
                background-color: #f0fdf4;
                color: #16a34a;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .emoji {
                font-size: 1.2em;
                margin-right: 8px;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            .footer {
                position: fixed;
                bottom: 20px;
                right: 20px;
                font-size: 0.8em;
                color: #6b7280;
            }
            
            @media print {
                body {
                    margin: 0;
                    padding: 15px;
                }
                
                h1 {
                    font-size: 2em;
                }
                
                h2 {
                    font-size: 1.5em;
                }
                
                table {
                    font-size: 0.8em;
                }
                
                th, td {
                    padding: 8px 6px;
                }
            }
        </style>
    </head>
    <body>
        ${convertMarkdownToHTML(markdownContent)}
        <div class="footer">
            Generated on ${new Date().toLocaleDateString()} | IOMS Software Analysis
        </div>
    </body>
    </html>
    `;
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfPath = path.join(__dirname, '../docs/IOMS_Software_Analysis.pdf');
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">IOMS Software Deep Root Analysis</div>',
        footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 File saved to: ${pdfPath}`);
    console.log(`📊 File size: ${(fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

function convertMarkdownToHTML(markdown) {
  // Simple markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // Wrap in paragraphs
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br><\/p>/g, '');
  
  return html;
}

// Run the script
generatePDF();



