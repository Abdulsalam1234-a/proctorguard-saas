const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function generateSampleDocx() {
  const zip = new JSZip();

  // [Content_Types].xml
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypes);

  // _rels/.rels
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  zip.file('_rels/.rels', rels);

  // word/_rels/document.xml.rels
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;
  zip.file('word/_rels/document.xml.rels', docRels);

  // word/document.xml
  const examParagraphs = [
    'FACULTY OF LAW - DEPARTMENT OF COMMERCIAL LAW',
    'LAW 301: NIGERIAN CORPORATE LAW & GOVERNANCE',
    'FIRST SEMESTER CONTINUOUS ASSESSMENT CBT',
    '',
    '1. Under Section 18 of the Companies and Allied Matters Act (CAMA) 2020, what is the minimum number of persons legally required to form a private company in Nigeria?',
    'A. Two persons',
    'B. One person',
    'C. Seven persons',
    'D. Fifty persons',
    'Answer: B',
    '',
    '2. Which statutory regulatory body is vested with exclusive jurisdiction for registration and incorporation of corporate entities in Nigeria?',
    'A. Securities and Exchange Commission (SEC)',
    'B. Central Bank of Nigeria (CBN)',
    'C. Corporate Affairs Commission (CAC)',
    'D. Federal Inland Revenue Service (FIRS)',
    'Answer: C',
    '',
    '3. Which of the following are essential elements of a legally valid contract under Nigerian law?',
    'A. Lawful Offer',
    'B. Unconditional Acceptance',
    'C. Valuable Consideration',
    'D. Coercion and Duress',
    'Answer: A, B, C',
    '',
    '4. An ultra vires contract executed by company directors in contravention of the company objects clause is treated under modern Nigerian CAMA 2020 as:',
    'A. Automatically void ab initio without legal remedy',
    'B. Not invalid solely on the ground of lack of capacity',
    'C. Voidable exclusively by the Corporate Affairs Commission',
    'D. Criminal misconduct punishable by immediate dissolution',
    'Answer: B',
    '',
    '5. What legal doctrine was affirmed in the landmark decision of Salomon v Salomon & Co Ltd regarding corporate identity?',
    'Answer: Separate legal personality',
  ];

  let docXmlBody = '';
  for (const p of examParagraphs) {
    const escaped = p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    docXmlBody += `<w:p><w:r><w:t>${escaped}</w:t></w:r></w:p>`;
  }

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docXmlBody}
  </w:body>
</w:document>`;
  zip.file('word/document.xml', docXml);

  const outDocx = path.join(__dirname, '..', 'public', 'samples', 'LAW301_Sample_Exam_Paper.docx');
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  fs.writeFileSync(outDocx, buffer);
  console.log(`Successfully generated standard OpenXML DOCX (${buffer.length} bytes) at: ${outDocx}`);
}

generateSampleDocx().catch(console.error);
