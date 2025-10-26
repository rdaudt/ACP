const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function checkPDF() {
  const pdfBytes = fs.readFileSync('/home/user/ACP/client/public/myvoice-advancecareplanningguideForEditing.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);

  console.log('Total pages:', pdfDoc.getPageCount());

  // Check for form fields
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log('\nForm fields found:', fields.length);
  fields.forEach(field => {
    console.log('  -', field.getName(), '(', field.constructor.name, ')');
  });

  // Check if we can extract and manipulate text
  console.log('\nTrying to read PDF content...');

  // Get catalog
  const catalog = pdfDoc.catalog;
  console.log('Catalog exists:', !!catalog);
}

checkPDF().catch(console.error);
