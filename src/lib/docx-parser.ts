import mammoth from 'mammoth';
import { QuestionType, StagedQuestion, QuestionOption } from './types';

export interface ParseResult {
  success: boolean;
  totalParsed: number;
  questions: StagedQuestion[];
  rawTextPreview: string;
  errors?: string[];
}

/**
 * Extracts raw text from DOCX buffer and parses questions into structured format
 * Handles standard Nigerian collegiate examination structures:
 * - Numbering: "1.", "1)", "Question 1:", "Q1."
 * - Options: "A.", "B.", "(a)", "(b)", "[ ]", "[*]"
 * - Answers: "Answer: B", "Ans: C", "Correct: A, C", marked "[*] Option text"
 */
export async function parseDocxExam(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = [];
  let rawText = '';

  try {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value || '';
  } catch (err: any) {
    return {
      success: false,
      totalParsed: 0,
      questions: [],
      rawTextPreview: '',
      errors: [`Failed to extract text from DOCX file: ${err.message}`],
    };
  }

  if (!rawText.trim()) {
    return {
      success: false,
      totalParsed: 0,
      questions: [],
      rawTextPreview: '',
      errors: ['The uploaded document appears to be empty.'],
    };
  }

  const questions = parseExamText(rawText);

  return {
    success: questions.length > 0,
    totalParsed: questions.length,
    questions,
    rawTextPreview: rawText.substring(0, 1000),
    errors: questions.length === 0 ? ['Could not detect any valid exam questions. Please verify document formatting.'] : undefined,
  };
}

/**
 * Pure parsing function that splits text into question blocks and extracts fields
 */
export function parseExamText(rawText: string): StagedQuestion[] {
  // Normalize line endings and whitespace
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .trim();

  // Regex to split questions by standard question numbering headers:
  // e.g.:
  // 1. What is ...
  // 1) Which of ...
  // Question 1: What is ...
  // Q1. Explain ...
  // Q1: State ...
  const lines = normalized.split('\n');
  const questionBlocks: string[][] = [];
  let currentBlock: string[] = [];

  const questionHeaderRegex = /^(?:Question\s*\d+[:.]?|Q\d+[:.]?|\d+[\.\)])\s+/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (questionHeaderRegex.test(trimmed)) {
      if (currentBlock.length > 0) {
        questionBlocks.push(currentBlock);
      }
      currentBlock = [trimmed];
    } else {
      if (currentBlock.length > 0) {
        currentBlock.push(trimmed);
      } else {
        // Preamble or header before first question, ignored or start block
      }
    }
  }

  if (currentBlock.length > 0) {
    questionBlocks.push(currentBlock);
  }

  const parsedQuestions: StagedQuestion[] = [];

  for (let idx = 0; idx < questionBlocks.length; idx++) {
    const blockLines = questionBlocks[idx];
    const fullBlockText = blockLines.join('\n');

    // Extract prompt from initial line(s)
    let firstLine = blockLines[0];
    // Remove the question prefix (e.g., "1. ", "Question 1: ")
    let promptFirstLine = firstLine.replace(questionHeaderRegex, '').trim();

    let promptLines: string[] = [promptFirstLine];
    const options: QuestionOption[] = [];
    const detectedAnswers: string[] = [];
    let readingOptions = false;

    // Regex for options:
    // A. Option text
    // A) Option text
    // (A) Option text
    // [ ] Option text
    // [*] Option text (indicates marked answer)
    // [x] Option text (indicates marked answer)
    const optionRegex = /^(?:([A-Ea-e])[\.\)]|\(([A-Ea-e])\)|\[([\*\sXx])\])\s+(.+)$/;
    const answerLineRegex = /^(?:Answer|Ans|Correct(?:\s+Answer)?)\s*[:=-]\s*([A-Ea-e\s,;]+|.+)$/i;

    for (let i = 1; i < blockLines.length; i++) {
      const line = blockLines[i].trim();
      if (!line) continue;

      const ansMatch = line.match(answerLineRegex);
      if (ansMatch) {
        const rawAns = ansMatch[1].trim();
        // Check if answer specifies options (e.g. "B" or "A, C" or "A; C")
        const letters = rawAns.match(/[A-Ea-e]/g);
        if (letters && letters.length > 0) {
          for (const l of letters) {
            const upper = l.toUpperCase();
            if (!detectedAnswers.includes(upper)) {
              detectedAnswers.push(upper);
            }
          }
        } else {
          // It's a text reference answer for short answer
          detectedAnswers.push(rawAns);
        }
        continue;
      }

      const optMatch = line.match(optionRegex);
      if (optMatch) {
        readingOptions = true;
        let optId = (optMatch[1] || optMatch[2] || '').toUpperCase();
        const checkboxIndicator = optMatch[3]; // '*' or 'x' or ' '
        const optText = optMatch[4].trim();

        // If no letter was provided (e.g. checkbox list "[ ] option"), assign sequentially
        if (!optId) {
          const charCode = 65 + options.length; // 'A' = 65
          optId = String.fromCharCode(charCode);
        }

        if (checkboxIndicator === '*' || checkboxIndicator?.toLowerCase() === 'x') {
          if (!detectedAnswers.includes(optId)) {
            detectedAnswers.push(optId);
          }
        }

        options.push({
          id: optId,
          text: optText,
        });
      } else {
        if (!readingOptions) {
          // Multiline prompt
          promptLines.push(line);
        } else {
          // Option continuation line
          if (options.length > 0) {
            options[options.length - 1].text += ` ${line}`;
          }
        }
      }
    }

    const fullPrompt = promptLines.join(' ').trim();

    // Determine Question Type:
    let type: QuestionType = 'SINGLE_CHOICE';

    if (options.length === 0) {
      type = 'SHORT_ANSWER';
    } else if (detectedAnswers.length > 1) {
      type = 'MULTIPLE_CHOICE';
    } else if (options.length >= 2) {
      type = 'SINGLE_CHOICE';
    }

    // Default answer if not detected: for single choice with options, default to 'A' if missing to allow instructor edit
    let finalAnswers = detectedAnswers;
    if (finalAnswers.length === 0) {
      if (type === 'SINGLE_CHOICE' && options.length > 0) {
        finalAnswers = [options[0].id];
      } else if (type === 'SHORT_ANSWER') {
        finalAnswers = [''];
      }
    }

    parsedQuestions.push({
      orderIndex: idx + 1,
      prompt: fullPrompt || `Question ${idx + 1}`,
      type,
      options,
      correctAnswers: finalAnswers,
      points: 1.0,
      rawText: fullBlockText,
    });
  }

  return parsedQuestions;
}
