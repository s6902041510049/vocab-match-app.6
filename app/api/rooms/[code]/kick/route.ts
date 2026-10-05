import { NextRequest, NextResponse } from 'next/server';
import { kickStudent } from '@/lib/roomStore';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const ok = kickStudent(params.code, studentId);
    if (!ok) {
      return NextResponse.json(
        { error: 'ไม่พบนักเรียนหรือห้องนี้' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error kicking student:', error);
    return NextResponse.json(
      { error: 'Failed to kick student' },
      { status: 500 }
    );
  }
}
