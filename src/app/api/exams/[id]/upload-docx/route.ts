import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { parseDocxExam } from '@/lib/docx-parser';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = params.id;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.docx')) {
      return NextResponse.json({ error: 'Only .docx Word documents are supported' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const parseResult = await parseDocxExam(buffer);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: parseResult.errors?.join(', ') || 'Failed to parse questions from document',
          rawTextPreview: parseResult.rawTextPreview,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      examId,
      fileName: file.name,
      fileSize: file.size,
      totalParsed: parseResult.totalParsed,
      stagingQuestions: parseResult.questions,
      rawTextPreview: parseResult.rawTextPreview,
      message: `Successfully extracted ${parseResult.totalParsed} questions. Review and confirm to save to examination.`,
    });
  } catch (error: any) {
    console.error('DOCX upload error:', error);
    return NextResponse.json({ error: 'Document extraction error: ' + error.message }, { status: 500 });
  }
}
