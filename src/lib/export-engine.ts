import * as XLSX from 'xlsx';
import { Exam, StudentAttempt } from './types';

export interface ExportDataPayload {
  exam: Exam;
  attempts: StudentAttempt[];
}

/**
 * Builds an Excel (.xlsx) workbook containing:
 * 1. Candidate Grading Sheet
 * 2. Detailed Answer Selections
 * 3. Malpractice & Proctoring Infraction Logs
 * 4. Aggregate Metrics & Performance Summary
 */
export function generateExamExcelWorkbook(payload: ExportDataPayload): Buffer {
  const { exam, attempts } = payload;
  const wb = XLSX.utils.book_new();

  // 1. Grading Sheet
  const gradingRows = attempts.map((att, idx) => ({
    'S/N': idx + 1,
    'Student Matric / ID': att.studentId,
    'Full Name': att.studentName,
    'Score Obtained': att.score ?? 0,
    'Total Points': att.totalPoints ?? 0,
    'Percentage (%)': att.percentage != null ? Number(att.percentage.toFixed(2)) : 0,
    'Outcome': (att.percentage ?? 0) >= exam.passMarkPercentage ? 'PASS' : 'FAIL',
    'Submission Status': att.status,
    'Tab Switches': att.tabSwitchCount,
    'Total Violations': att.violations?.length ?? 0,
    'Started At': att.startedAt ? new Date(att.startedAt).toLocaleString() : '',
    'Submitted At': att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '',
  }));

  const wsGrading = XLSX.utils.json_to_sheet(gradingRows);
  XLSX.utils.book_append_sheet(wb, wsGrading, 'Grading Sheet');

  // 2. Candidate Answer Selections
  const answerRows: any[] = [];
  attempts.forEach((att) => {
    (att.answers || []).forEach((ans) => {
      const q = exam.questions?.find((item) => item.id === ans.questionId);
      answerRows.push({
        'Student ID': att.studentId,
        'Student Name': att.studentName,
        'Question #': q?.orderIndex ?? '',
        'Question Prompt': q?.prompt ?? '',
        'Question Type': q?.type ?? '',
        'Candidate Selected Answer': Array.isArray(ans.selectedAnswer)
          ? ans.selectedAnswer.join(', ')
          : String(ans.selectedAnswer ?? ''),
        'Official Correct Answer': Array.isArray(q?.correctAnswers)
          ? q.correctAnswers.join(', ')
          : String(q?.correctAnswers ?? ''),
        'Is Correct': ans.isCorrect ? 'YES' : 'NO',
        'Points Awarded': ans.pointsAwarded ?? 0,
        'Timestamp': ans.savedAt ? new Date(ans.savedAt).toLocaleString() : '',
      });
    });
  });

  const wsAnswers = XLSX.utils.json_to_sheet(answerRows.length > 0 ? answerRows : [{ Notice: 'No answers recorded' }]);
  XLSX.utils.book_append_sheet(wb, wsAnswers, 'Candidate Answers');

  // 3. Proctoring Infractions Log
  const violationRows: any[] = [];
  attempts.forEach((att) => {
    (att.violations || []).forEach((v) => {
      violationRows.push({
        'Student ID': att.studentId,
        'Student Name': att.studentName,
        'Violation Type': v.type,
        'Details': v.details || 'N/A',
        'Recorded At': v.timestamp ? new Date(v.timestamp).toLocaleString() : '',
      });
    });
  });

  const wsViolations = XLSX.utils.json_to_sheet(
    violationRows.length > 0 ? violationRows : [{ Notice: 'No proctoring infractions recorded' }]
  );
  XLSX.utils.book_append_sheet(wb, wsViolations, 'Infraction Logs');

  // 4. Aggregate Summary
  const totalAttempts = attempts.length;
  const passed = attempts.filter((a) => (a.percentage ?? 0) >= exam.passMarkPercentage).length;
  const failed = totalAttempts - passed;
  const passRate = totalAttempts > 0 ? ((passed / totalAttempts) * 100).toFixed(2) : '0.00';
  const totalViolations = attempts.reduce((acc, a) => acc + (a.violations?.length || 0), 0);
  const avgScore =
    totalAttempts > 0
      ? (attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalAttempts).toFixed(2)
      : '0.00';

  const summaryRows = [
    { Parameter: 'Course Code & Title', Value: `${exam.course?.code || ''} - ${exam.course?.title || ''}` },
    { Parameter: 'Exam Title', Value: exam.title },
    { Parameter: 'Access Code', Value: exam.accessCode },
    { Parameter: 'Duration (Minutes)', Value: exam.durationMinutes },
    { Parameter: 'Pass Mark Required (%)', Value: `${exam.passMarkPercentage}%` },
    { Parameter: 'Total Registered Attempts', Value: totalAttempts },
    { Parameter: 'Candidates Passed', Value: passed },
    { Parameter: 'Candidates Failed', Value: failed },
    { Parameter: 'Pass Rate (%)', Value: `${passRate}%` },
    { Parameter: 'Mean Performance (%)', Value: `${avgScore}%` },
    { Parameter: 'Total Proctoring Flags', Value: totalViolations },
    { Parameter: 'Report Generated At', Value: new Date().toLocaleString() },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generates plain CSV for quick tabular ingestion
 */
export function generateExamCSV(payload: ExportDataPayload): string {
  const { exam, attempts } = payload;
  const rows = [
    [
      'Student Matric / ID',
      'Student Name',
      'Score',
      'Total Points',
      'Percentage (%)',
      'Pass Status',
      'Submission Status',
      'Tab Switches',
      'Violations Count',
      'Started At',
      'Submitted At',
    ].join(','),
  ];

  for (const att of attempts) {
    const passed = (att.percentage ?? 0) >= exam.passMarkPercentage ? 'PASS' : 'FAIL';
    const row = [
      `"${att.studentId.replace(/"/g, '""')}"`,
      `"${att.studentName.replace(/"/g, '""')}"`,
      att.score ?? 0,
      att.totalPoints ?? 0,
      att.percentage != null ? att.percentage.toFixed(2) : 0,
      passed,
      att.status,
      att.tabSwitchCount,
      att.violations?.length ?? 0,
      `"${att.startedAt ? new Date(att.startedAt).toISOString() : ''}"`,
      `"${att.submittedAt ? new Date(att.submittedAt).toISOString() : ''}"`,
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}
