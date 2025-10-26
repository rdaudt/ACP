const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function checkFormFields() {
  const pdfBytes = fs.readFileSync('/home/user/ACP/client/public/myvoice-advancecareplanningguide-fillable.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);

  console.log('Total pages:', pdfDoc.getPageCount());

  // Get form
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log('\nForm fields found:', fields.length);
  fields.forEach(field => {
    const type = field.constructor.name;
    const name = field.getName();
    console.log(`  - ${name} (${type})`);

    // If it's a text field, show max length
    if (type === 'PDFTextField') {
      try {
        const textField = form.getTextField(name);
        const maxLength = textField.getMaxLength();
        console.log(`    Max length: ${maxLength || 'unlimited'}`);
      } catch (e) {
        // ignore
      }
    }
  });
}

checkFormFields().catch(console.error);
