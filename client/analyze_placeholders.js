const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function analyzePDF() {
  const pdfBytes = fs.readFileSync('/home/user/ACP/client/public/myvoice-advancecareplanningguideForEditing.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);

  console.log('Total pages:', pdfDoc.getPageCount());
  console.log('\nSearching for placeholder patterns...\n');

  // Get the raw PDF data
  const pages = pdfDoc.getPages();

  // Check each page for content
  for (let i = 0; i < Math.min(pages.length, 40); i++) {
    const page = pages[i];
    try {
      const contentStream = page.node.Contents();
      if (contentStream) {
        const content = contentStream.toString();

        // Check for placeholders
        const hasA = content.includes('aaaa');
        const hasB = content.includes('bbbb');
        const hasC = content.includes('cccc');

        if (hasA || hasB || hasC) {
          console.log(`Page ${i + 1}:`);
          if (hasA) console.log('  - Contains "aaaa" (beliefs placeholder)');
          if (hasB) console.log('  - Contains "bbbb" (values placeholder)');
          if (hasC) console.log('  - Contains "cccc" (wishes placeholder)');
        }
      }
    } catch (e) {
      // Skip if we can't read content
    }
  }
}

analyzePDF().catch(console.error);
