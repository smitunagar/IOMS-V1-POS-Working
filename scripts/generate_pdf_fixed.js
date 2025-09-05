const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  try {
    console.log('🚀 Starting PDF generation with fixed conversion...');
    
    // Read the markdown file
    const markdownPath = path.join(__dirname, '../docs/SOFTWARE_ANALYSIS_TABULAR.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');
    
    // Convert markdown to proper HTML
    const htmlContent = convertMarkdownToHTML(markdownContent);
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfPath = path.join(__dirname, '../docs/IOMS_Software_Analysis_Fixed.pdf');
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
  // Split content into lines
  const lines = markdown.split('\n');
  let html = '';
  let inTable = false;
  let tableRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (inTable && tableRows.length > 0) {
        html += generateTableHTML(tableRows);
        tableRows = [];
        inTable = false;
      }
      continue;
    }
    
    // Handle headers
    if (line.startsWith('# ')) {
      html += `<h1>${line.substring(2)}</h1>\n`;
    } else if (line.startsWith('## ')) {
      html += `<h2>${line.substring(3)}</h2>\n`;
    } else if (line.startsWith('### ')) {
      html += `<h3>${line.substring(4)}</h3>\n`;
    }
    // Handle table rows
    else if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
      }
      
      // Clean up the line and split by |
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
      tableRows.push(cells);
    }
    // Handle regular paragraphs
    else if (!inTable) {
      if (line.startsWith('**') && line.endsWith('**')) {
        html += `<p><strong>${line.substring(2, line.length - 2)}</strong></p>\n`;
      } else {
        html += `<p>${line}</p>\n`;
      }
    }
  }
  
  // Close any remaining table
  if (inTable && tableRows.length > 0) {
    html += generateTableHTML(tableRows);
  }
  
  return wrapInHTML(html);
}

function generateTableHTML(rows) {
  if (rows.length === 0) return '';
  
  let tableHTML = '<table>\n';
  
  // First row is header
  if (rows.length > 0) {
    tableHTML += '  <thead>\n    <tr>\n';
    rows[0].forEach(cell => {
      tableHTML += `      <th>${cell}</th>\n`;
    });
    tableHTML += '    </tr>\n  </thead>\n';
  }
  
  // Rest are body rows
  if (rows.length > 1) {
    tableHTML += '  <tbody>\n';
    for (let i = 1; i < rows.length; i++) {
      tableHTML += '    <tr>\n';
      rows[i].forEach(cell => {
        // Handle special formatting
        let cellContent = cell;
        if (cell.includes('Critical')) {
          cellContent = `<span class="priority-critical">${cell}</span>`;
        } else if (cell.includes('High')) {
          cellContent = `<span class="priority-high">${cell}</span>`;
        } else if (cell.includes('Medium')) {
          cellContent = `<span class="priority-medium">${cell}</span>`;
        } else if (cell.includes('Low')) {
          cellContent = `<span class="risk-low">${cell}</span>`;
        }
        
        tableHTML += `      <td>${cellContent}</td>\n`;
      });
      tableHTML += '    </tr>\n';
    }
    tableHTML += '  </tbody>\n';
  }
  
  tableHTML += '</table>\n';
  return tableHTML;
}

function wrapInHTML(content) {
  return `<!DOCTYPE html>
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
        
        .risk-low {
            background-color: #f0fdf4;
            color: #16a34a;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
        
        p {
            margin: 10px 0;
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
    ${content}
</body>
</html>`;
}

// Run the script
generatePDF();



