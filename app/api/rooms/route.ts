import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/roomStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, categoryId, categoryName, words } = body;

    if (!roomCode) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    const room = createRoom(
      roomCode.toString(),
      categoryId || '',
      categoryName || '',
      words || []
    );

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
