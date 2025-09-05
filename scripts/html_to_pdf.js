const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertHTMLToPDF() {
  try {
    console.log('🚀 Converting HTML to PDF...');
    
    // Read the HTML file
    const htmlPath = path.join(__dirname, '../docs/SOFTWARE_ANALYSIS_HTML.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfPath = path.join(__dirname, '../docs/IOMS_Software_Analysis_Final.pdf');
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
    
    console.log('✅ PDF generated successfully from HTML!');
    console.log(`📄 File saved to: ${pdfPath}`);
    console.log(`📊 File size: ${(fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

// Run the script
convertHTMLToPDF();



