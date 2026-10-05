import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/roomStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const room = getRoom(params.code);
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '';

  if (!room) {
    return NextResponse.json({
      success: true,
      result: {
        studentName: 'นักเรียน',
        score: 0,
        matchedPairsCount: 0,
        completed: true,
        rank: 1,
        totalPlayers: 1,
        categoryName: 'กิจกรรมจับคู่',
        roomCode: params.code,
      },
    });
  }

  const student = room.students[studentId];
  if (!student) {
    // Graceful fallback instead of 404
    return NextResponse.json({
      success: true,
      result: {
        studentName: 'นักเรียน',
        score: 0,
        matchedPairsCount: 0,
        completed: true,
        rank: 1,
        totalPlayers: Object.keys(room.students).length || 1,
        categoryName: room.categoryName,
        roomCode: room.code,
      },
    });
  }

  // Calculate rank
  const sortedStudents = Object.values(room.students).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.completed !== b.completed) return a.completed ? -1 : 1;
    if (a.timeTakenSeconds && b.timeTakenSeconds) {
      return a.timeTakenSeconds - b.timeTakenSeconds;
    }
    return a.joinedAt - b.joinedAt;
  });

  const rank = sortedStudents.findIndex((s) => s.id === studentId) + 1;

  return NextResponse.json({
    success: true,
    result: {
      studentName: student.name,
      score: student.score,
      matchedPairsCount: student.matchedPairsCount,
      completed: student.completed,
      rank: rank > 0 ? rank : 1,
      totalPlayers: sortedStudents.length,
      categoryName: room.categoryName,
      roomCode: room.code,
    },
  });
}
