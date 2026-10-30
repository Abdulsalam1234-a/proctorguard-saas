import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';
import { generateExamExcelWorkbook, generateExamCSV } from '@/lib/export-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx';

    const exam = await dbService.getExamById(params.id);
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const attempts = exam.attempts || [];
    const sanitizedTitle = exam.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'csv') {
      const csv = generateExamCSV({ exam, attempts });
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${sanitizedTitle}_Results.csv"`,
        },
      });
    }

    // Default: XLSX
    const buffer = generateExamExcelWorkbook({ exam, attempts });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${sanitizedTitle}_Master_Grading_Report.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
