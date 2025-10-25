const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function analyzePDF() {
  const pdfBytes = fs.readFileSync('/home/user/ACP/client/public/myvoice-advancecareplanningguide.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);

  console.log('Total pages:', pdfDoc.getPageCount());

  // Analyze pages 33, 34, 35 (indices 32, 33, 34)
  for (let i = 32; i <= 34; i++) {
    if (i < pdfDoc.getPageCount()) {
      const page = pdfDoc.getPages()[i];
      const { width, height } = page.getSize();
      console.log(`\nPage ${i + 1} (index ${i}):`);
      console.log(`  Width: ${width}, Height: ${height}`);
      console.log(`  Suggested Y positions:`);
      console.log(`    Top area (y=${Math.round(height - 150)}): for text near top`);
      console.log(`    Upper area (y=${Math.round(height - 250)}): current setting`);
      console.log(`    Middle area (y=${Math.round(height - 400)}): halfway down`);
      console.log(`    Lower area (y=${Math.round(height - 550)}): lower section`);
    }
  }
}

analyzePDF().catch(console.error);
