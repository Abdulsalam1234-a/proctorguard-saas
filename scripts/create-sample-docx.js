const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// We can create a sample text and also generate a zip/docx using PowerShell's Compress-Archive!
const sampleDir = path.join(__dirname, '..', 'public', 'samples');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// Sample plain text format
const sampleExamText = `
FACULTY OF LAW - DEPARTMENT OF COMMERCIAL LAW
LAW 301: NIGERIAN CORPORATE LAW & GOVERNANCE
FIRST SEMESTER CONTINUOUS ASSESSMENT CBT

1. Under Section 18 of the Companies and Allied Matters Act (CAMA) 2020, what is the minimum number of persons legally required to form a private company in Nigeria?
A. Two persons
B. One person
C. Seven persons
D. Fifty persons
Answer: B

2. Which statutory regulatory body is vested with exclusive jurisdiction for registration and incorporation of corporate entities in Nigeria?
A. Securities and Exchange Commission (SEC)
B. Central Bank of Nigeria (CBN)
C. Corporate Affairs Commission (CAC)
D. Federal Inland Revenue Service (FIRS)
Answer: C

3. Which of the following are essential elements of a legally valid contract under Nigerian law?
A. Lawful Offer
B. Unconditional Acceptance
C. Valuable Consideration
D. Coercion and Duress
Answer: A, B, C

4. An ultra vires contract executed by company directors in contravention of the company objects clause is treated under modern Nigerian CAMA 2020 as:
A. Automatically void ab initio without legal remedy
B. Not invalid solely on the ground of lack of capacity
C. Voidable exclusively by the Corporate Affairs Commission
D. Criminal misconduct punishable by immediate dissolution
Answer: B

5. What legal doctrine was affirmed in the landmark decision of Salomon v Salomon & Co Ltd regarding corporate identity?
Answer: Separate legal personality
`;

fs.writeFileSync(path.join(sampleDir, 'sample_exam_questions.txt'), sampleExamText.trim());
console.log('Sample exam text created at public/samples/sample_exam_questions.txt');
