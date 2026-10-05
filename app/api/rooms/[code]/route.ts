import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/roomStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const room = getRoom(params.code);
  if (!room) {
    return NextResponse.json(
      { error: 'ไม่พบห้องกิจกรรมนี้ หรือห้องอาจจะถูกปิดไปแล้ว' },
      { status: 404 }
    );
  }

  // Convert students map to sorted array
  const studentList = Object.values(room.students).sort((a, b) => {
    // 1. Highest score first
    if (b.score !== a.score) return b.score - a.score;
    // 2. Completed before uncompleted
    if (a.completed !== b.completed) return a.completed ? -1 : 1;
    // 3. Lowest time taken
    if (a.timeTakenSeconds && b.timeTakenSeconds) {
      return a.timeTakenSeconds - b.timeTakenSeconds;
    }
    // 4. Joined earlier
    return a.joinedAt - b.joinedAt;
  });

  return NextResponse.json({
    success: true,
    room: {
      ...room,
      studentsList: studentList,
    },
  });
}
