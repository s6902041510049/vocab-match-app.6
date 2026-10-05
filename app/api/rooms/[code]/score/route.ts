import { NextRequest, NextResponse } from 'next/server';
import { updateStudentScore } from '@/lib/roomStore';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const { studentId, studentName, score, matchedPairsCount, completed, timeTakenSeconds } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const result = updateStudentScore(params.code, studentId, {
      score: typeof score === 'number' ? score : 0,
      studentName: studentName || '',
      matchedPairsCount,
      completed,
      timeTakenSeconds,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to record score' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      student: result.student,
    });
  } catch (error) {
    console.error('Error updating score:', error);
    return NextResponse.json(
      { error: 'Failed to update score' },
      { status: 500 }
    );
  }
}
