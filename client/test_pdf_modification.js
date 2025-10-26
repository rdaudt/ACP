const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function testPDFModification() {
  console.log('Starting PDF modification test...\n');

  // Read the template PDF
  const pdfBytes = fs.readFileSync('/home/user/ACP/client/public/myvoice-advancecareplanningguideForEditing.pdf');
  console.log(`PDF loaded: ${pdfBytes.length} bytes`);

  // Load PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  console.log(`Pages: ${pdfDoc.getPageCount()}`);

  // Embed font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const lineHeight = 12;

  // Test text
  const testBeliefs = "This is a test of the beliefs section. It should appear on page 33 where the placeholder was.";
  const testValues = "This is a test of the values section. It should appear on page 34 in the upper area.";
  const testWishes = "This is a test of the wishes section. It should appear on page 34 in the lower area.";

  // Helper function to wrap text
  function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  const pages = pdfDoc.getPages();

  // Page 33 (index 32): Beliefs
  if (pages.length > 32) {
    console.log('\nModifying page 33 (beliefs)...');
    const page = pages[32];
    const { width, height } = page.getSize();
    console.log(`  Page size: ${width} x ${height}`);

    // Draw white rectangle
    page.drawRectangle({
      x: 50,
      y: height - 700,
      width: width - 100,
      height: 500,
      color: rgb(1, 1, 1),
    });
    console.log('  White rectangle drawn');

    // Draw beliefs text
    const maxWidth = width - 120;
    const beliefsLines = wrapText(testBeliefs, maxWidth);
    console.log(`  Text wrapped into ${beliefsLines.length} lines`);

    beliefsLines.forEach((line, index) => {
      page.drawText(line, {
        x: 70,
        y: height - 250 - (index * lineHeight),
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    });
    console.log('  Beliefs text drawn');
  }

  // Page 34 (index 33): Values and Wishes
  if (pages.length > 33) {
    console.log('\nModifying page 34 (values & wishes)...');
    const page = pages[33];
    const { width, height } = page.getSize();
    console.log(`  Page size: ${width} x ${height}`);
    const maxWidth = width - 120;

    // Draw white rectangle
    page.drawRectangle({
      x: 50,
      y: 50,
      width: width - 100,
      height: height - 100,
      color: rgb(1, 1, 1),
    });
    console.log('  White rectangle drawn');

    // Draw values text
    const valuesLines = wrapText(testValues, maxWidth);
    console.log(`  Values wrapped into ${valuesLines.length} lines`);

    valuesLines.forEach((line, index) => {
      page.drawText(line, {
        x: 70,
        y: height - 250 - (index * lineHeight),
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    });
    console.log('  Values text drawn');

    // Draw wishes text
    const wishesLines = wrapText(testWishes, maxWidth);
    console.log(`  Wishes wrapped into ${wishesLines.length} lines`);

    wishesLines.forEach((line, index) => {
      page.drawText(line, {
        x: 70,
        y: height - 550 - (index * lineHeight),
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    });
    console.log('  Wishes text drawn');
  }

  // Save the modified PDF
  console.log('\nSaving modified PDF...');
  const modifiedPdfBytes = await pdfDoc.save();
  fs.writeFileSync('/tmp/test-output.pdf', modifiedPdfBytes);
  console.log(`Modified PDF saved: ${modifiedPdfBytes.length} bytes`);
  console.log('Output file: /tmp/test-output.pdf');
  console.log('\nYou can download this file to verify the text appears correctly.');
}

testPDFModification().catch(console.error);
