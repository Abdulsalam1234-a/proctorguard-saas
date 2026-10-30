import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Check if bulk creation
    if (body.bulk && Array.isArray(body.questions)) {
      const { examId, questions } = body;
      if (!examId || questions.length === 0) {
        return NextResponse.json({ error: 'examId and non-empty questions array required' }, { status: 400 });
      }

      const created = await dbService.bulkCreateQuestions(examId, questions);
      return NextResponse.json({
        success: true,
        count: created.length,
        questions: created,
        message: `${created.length} questions successfully committed to the examination.`,
      });
    }

    // Single Question creation
    const { examId, orderIndex, prompt, type, options, correctAnswers, points } = body;
    if (!examId || !prompt || !type) {
      return NextResponse.json({ error: 'Missing mandatory question fields' }, { status: 400 });
    }

    const question = await dbService.createQuestion({
      examId,
      orderIndex: Number(orderIndex || 1),
      prompt,
      type,
      options: options || [],
      correctAnswers: Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers],
      points: Number(points || 1.0),
    });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    console.error('Question creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
