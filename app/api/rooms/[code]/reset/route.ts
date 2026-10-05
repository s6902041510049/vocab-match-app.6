import { NextRequest, NextResponse } from 'next/server';
import { getRoom, resetRoomGame } from '@/lib/roomStore';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const room = getRoom(params.code);
  if (!room) {
    return NextResponse.json(
      { error: 'ไม่พบห้องกิจกรรมนี้' },
      { status: 404 }
    );
  }

  const updatedRoom = resetRoomGame(params.code);
  return NextResponse.json({
    success: true,
    room: updatedRoom,
  });
}
