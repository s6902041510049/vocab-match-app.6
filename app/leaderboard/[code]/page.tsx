'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Trophy,
  Medal,
  Star,
  Loader2,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { broadcastRoomEvent, listenToRoomEvents } from '@/lib/realtime';

interface StudentMember {
  id: string;
  name: string;
  score: number;
  matchedPairsCount: number;
  completed: boolean;
  timeTakenSeconds?: number;
}

interface RoomData {
  code: string;
  categoryName: string;
  status: string;
  studentsList: StudentMember[];
}

export default function TeacherLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // STRICT ACCESS CONTROL: Only teacher can view this summary page
  useEffect(() => {
    const teacherAuth = localStorage.getItem('teacher_auth');
    if (teacherAuth !== 'true') {
      // If student tries to open this teacher page, immediately redirect them to their own result!
      const studentSession = localStorage.getItem('student_session');
      if (studentSession) {
        router.replace(`/student/result/${roomCode}`);
      } else {
        router.replace('/login');
      }
      return;
    }
    setIsAuthorized(true);
  }, [roomCode, router]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!isAuthorized) return;

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 1500);

    const unsubscribe = listenToRoomEvents(roomCode, () => {
      fetchLeaderboard();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [roomCode, isAuthorized, fetchLeaderboard]);

  const handleRestartRoom = async () => {
    if (confirm('คุณต้องการรีเซ็ตคะแนนและเริ่มกิจกรรมรอบใหม่สำหรับนักเรียนทุกคนใช่หรือไม่?')) {
      setIsResetting(true);
      try {
        await fetch(`/api/rooms/${roomCode}/reset`, { method: 'POST' });
        broadcastRoomEvent(roomCode, 'room_reset');
        router.push(`/teacher/room/${roomCode}`);
      } catch (e) {
        console.error(e);
        setIsResetting(false);
      }
    }
  };

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        <Navbar userRole="teacher" userName="ครู mon" />
        <div className="flex-1 flex flex-col justify-center items-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">กำลังประมวลผลกระดานคะแนนสำหรับคุณครู...</p>
        </div>
      </div>
    );
  }

  const studentsList = room?.studentsList || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/60 text-slate-800 font-sans flex flex-col pb-16">
      <Navbar userRole="teacher" userName="ครู mon" roomCode={roomCode} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-amber-100 border-2 border-amber-300 rounded-3xl text-amber-600 mb-3 shadow-md shadow-amber-500/10 animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-amber-500 via-pink-600 to-violet-600 bg-clip-text text-transparent">
            สรุปผลคะแนน REALTIME (มุมมองครู)
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 font-medium">
            ห้อง: <span className="font-mono font-bold text-slate-800">{roomCode}</span> • หมวดหมู่:{' '}
            <span className="text-violet-700 font-bold">{room?.categoryName}</span>
          </p>
        </div>

        {/* Teacher Control Card */}
        <div className="bg-white border-2 border-purple-100 p-5 rounded-3xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md shadow-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base">แผงควบคุมคุณครู</h3>
              <p className="text-xs text-slate-500 font-medium">
                มีผู้เข้าร่วมทั้งหมด {studentsList.length} คน • สรุปผลสดอัตโนมัติสำหรับฉายหน้าห้อง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleRestartRoom}
              disabled={isResetting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black px-6 py-3 rounded-2xl text-sm transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span>เริ่มรอบใหม่ (Play Again)</span>
            </button>

            <button
              onClick={() => router.push('/teacher/dashboard')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-sm font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับแดชบอร์ด</span>
            </button>
          </div>
        </div>

        {/* Real Leaderboard List for Teacher */}
        <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-500/5">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>อันดับคะแนนของผู้เล่นจริง ({studentsList.length} คน)</span>
            </h2>
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>อัปเดตสด</span>
            </span>
          </div>

          {studentsList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              <p>ยังไม่มีข้อมูลผู้เข้าร่วมในห้องนี้</p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentsList.map((student, idx) => {
                const rank = idx + 1;

                return (
                  <div
                    key={student.id}
                    className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${
                      rank === 1
                        ? 'bg-amber-50/80 border-amber-300 text-slate-900'
                        : rank === 2
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : rank === 3
                        ? 'bg-orange-50/80 border-orange-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 border-2 shadow-sm ${
                          rank === 1
                            ? 'bg-amber-400 border-amber-500 text-white'
                            : rank === 2
                            ? 'bg-slate-300 border-slate-400 text-slate-800'
                            : rank === 3
                            ? 'bg-orange-400 border-orange-500 text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {rank <= 3 ? <Medal className="w-5 h-5" /> : rank}
                      </span>

                      <div className="min-w-0">
                        <span className="text-base sm:text-lg font-black block truncate text-slate-800">
                          {student.name}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                          {student.completed ? (
                            <span className="text-emerald-700 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> จบเกมแล้ว
                            </span>
                          ) : (
                            <span className="text-cyan-700 font-semibold">กำลังเล่น...</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 text-right">
                      <div className="flex items-center gap-1.5 font-black text-emerald-600 text-xl sm:text-2xl">
                        <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                        <span>{student.score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}