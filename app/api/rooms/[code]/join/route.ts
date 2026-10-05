import { NextRequest, NextResponse } from 'next/server';
import { getRoom, joinRoom } from '@/lib/roomStore';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const { studentName } = body;

    if (!studentName || !studentName.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อนักเรียน' },
        { status: 400 }
      );
    }

    const room = getRoom(params.code);
    if (!room) {
      return NextResponse.json(
        { error: 'ไม่พบรหัสห้องนี้ กรุณาตรวจสอบรหัสห้องอีกครั้ง' },
        { status: 404 }
      );
    }

    if (room.status === 'ended') {
      return NextResponse.json(
        { error: 'ห้องกิจกรรมนี้สิ้นสุดลงแล้ว' },
        { status: 400 }
      );
    }

    const result = joinRoom(params.code, studentName.trim());
    if (!result) {
      return NextResponse.json(
        { error: 'ไม่สามารถเข้าร่วมห้องได้' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      student: result.student,
      room: {
        code: result.room.code,
        categoryName: result.room.categoryName,
        status: result.room.status,
      },
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าร่วมห้อง' },
      { status: 500 }
    );
  }
}
