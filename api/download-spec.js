const officegen = require('officegen');
require('dotenv').config();

// Generate spec endpoint
export default async function handler(req, res) {
  const { spec } = req.body;
  if (!spec) {
    return res.status(400).json({ error: "No spec data provided." });
  }
  try {
    const docx = officegen('docx');

    // Add title and timestamp
    const titleParagraph = docx.createP();
    titleParagraph.addText('Product Specification Document', {
      font_face: 'Arial',
      font_size: 16,
      bold: true
    });
    const dateParagraph = docx.createP();
    dateParagraph.addText(`Generated: ${new Date().toLocaleString()}`, {
      font_face: 'Arial',
      font_size: 10,
      italic: true
    });
    const separatorParagraph = docx.createP();
    separatorParagraph.addText('─'.repeat(50), { font_size: 11 });

    // Process content by line
    const lines = spec.split('\n');
    let currentParagraph = docx.createP();
    for (const line of lines) {
      if (line.startsWith('#') || line.startsWith('- ')) {
        currentParagraph = docx.createP();
        if (line.startsWith('##')) {
          currentParagraph.addText(line.replace(/^##\s*/, ''), {
            font_face: 'Arial',
            font_size: 14,
            bold: true
          });
        } else if (line.startsWith('#')) {
          currentParagraph.addText(line.replace(/^#\s*/, ''), {
            font_face: 'Arial',
            font_size: 16,
            bold: true
          });
        } else {
          currentParagraph.addText(line, { font_face: 'Arial', font_size: 11 });
        }
      } else if (line.trim() === '') {
        currentParagraph = docx.createP();
      } else {
        currentParagraph.addText(line, { font_face: 'Arial', font_size: 11 });
        currentParagraph = docx.createP();
      }
    }

    res.setHeader('Content-Disposition', `attachment; filename=SpecBar_Spec_${Date.now()}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    docx.generate(res);
  } catch (error) {
    console.error("Document Generation Error:", error);
    res.status(500).json({ error: 'Could not generate document', details: error.message });
  }
};