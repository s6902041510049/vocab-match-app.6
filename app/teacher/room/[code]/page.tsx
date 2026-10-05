'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Users,
  Play,
  Copy,
  Check,
  Trophy,
  Loader2,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Link as LinkIcon,
  UserX,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { broadcastRoomEvent, listenToRoomEvents } from '@/lib/realtime';

interface StudentMember {
  id: string;
  name: string;
  joinedAt: number;
  score: number;
  matchedPairsCount: number;
  completed: boolean;
  timeTakenSeconds?: number;
}

interface RoomData {
  code: string;
  categoryName: string;
  words: { id: string; term: string; meaning: string }[];
  status: 'waiting' | 'playing' | 'ended';
  studentsList: StudentMember[];
}

const AVATAR_COLORS = [
  'bg-pink-100 text-pink-700 border-pink-300',
  'bg-purple-100 text-purple-700 border-purple-300',
  'bg-blue-100 text-blue-700 border-blue-300',
  'bg-cyan-100 text-cyan-700 border-cyan-300',
  'bg-emerald-100 text-emerald-700 border-emerald-300',
  'bg-amber-100 text-amber-700 border-amber-300',
  'bg-indigo-100 text-indigo-700 border-indigo-300',
];

export default function TeacherRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const isRecoveringRef = useRef(false);

  // Auto-heal: If server doesn't have the room yet, create it automatically from teacher's words
  const ensureRoomExistsOnServer = useCallback(async () => {
    if (isRecoveringRef.current) return;
    isRecoveringRef.current = true;

    try {
      let wordsToUse = [
        { id: 'w1', term: 'Photosynthesis', meaning: 'การสังเคราะห์ด้วยแสง' },
        { id: 'w2', term: 'Gravity', meaning: 'แรงโน้มถ่วง' },
        { id: 'w3', term: 'Evaporation', meaning: 'การกลายเป็นไอ' },
        { id: 'w4', term: 'Atmosphere', meaning: 'ชั้นบรรยากาศ' },
      ];
      let catName = 'คำศัพท์วิทยาศาสตร์';

      const savedWords = localStorage.getItem('vocab_words');
      const savedCats = localStorage.getItem('vocab_categories');
      if (savedWords) {
        try {
          const parsedW = JSON.parse(savedWords);
          if (Array.isArray(parsedW) && parsedW.length >= 2) {
            wordsToUse = parsedW.slice(0, 10);
          }
        } catch (e) {
          // ignore
        }
      }
      if (savedCats) {
        try {
          const parsedC = JSON.parse(savedCats);
          if (Array.isArray(parsedC) && parsedC.length > 0) {
            catName = parsedC[0].name;
          }
        } catch (e) {
          // ignore
        }
      }

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          categoryId: 'cat-default',
          categoryName: catName,
          words: wordsToUse,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          setRoom({
            ...data.room,
            studentsList: Object.values(data.room.students || {}),
          });
        }
      }
    } catch (e) {
      console.error('Error auto-creating room:', e);
    } finally {
      isRecoveringRef.current = false;
      setLoading(false);
    }
  }, [roomCode]);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 404) {
          // Room not found on server -> auto-create it immediately!
          await ensureRoomExistsOnServer();
        }
        return;
      }
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
      }
    } catch (err) {
      console.error('Error fetching room:', err);
    } finally {
      setLoading(false);
    }
  }, [roomCode, ensureRoomExistsOnServer]);

  useEffect(() => {
    const auth = localStorage.getItem('teacher_auth');
    if (auth !== 'true') {
      router.push('/login');
      return;
    }

    fetchRoom();

    const interval = setInterval(fetchRoom, 1000);

    const unsubscribe = listenToRoomEvents(roomCode, () => {
      fetchRoom();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [roomCode, router, fetchRoom]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyJoinLink = () => {
    const joinUrl = `${window.location.origin}/student/join?code=${roomCode}`;
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      // Optimistic update so UI immediately becomes playing
      setRoom((prev) => (prev ? { ...prev, status: 'playing' } : prev));

      const res = await fetch(`/api/rooms/${roomCode}/start`, { method: 'POST' });
      if (!res.ok && res.status === 404) {
        // Auto-heal then start
        await ensureRoomExistsOnServer();
        await fetch(`/api/rooms/${roomCode}/start`, { method: 'POST' });
      }

      broadcastRoomEvent(roomCode, 'game_started');
      fetchRoom();
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการเริ่มเกม');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndGame = async () => {
    if (confirm('คุณต้องการสิ้นสุดการแข่งขันและแสดงผลคะแนนสรุปใช่หรือไม่?')) {
      setIsEnding(true);
      try {
        await fetch(`/api/rooms/${roomCode}/end`, { method: 'POST' });
        broadcastRoomEvent(roomCode, 'game_ended');
        router.push(`/leaderboard/${roomCode}`);
      } catch (e) {
        console.error(e);
        setIsEnding(false);
      }
    }
  };

  const handleKickStudent = async (studentId: string, studentName: string) => {
    if (confirm(`คุณต้องการลบ "${studentName}" ออกจากห้องใช่หรือไม่?`)) {
      try {
        await fetch(`/api/rooms/${roomCode}/kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId }),
        });
        broadcastRoomEvent(roomCode, 'student_kicked', { studentId });
        fetchRoom();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        <Navbar userRole="teacher" userName="ครู mon" />
        <div className="flex-1 flex flex-col justify-center items-center">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">กำลังเตรียมห้องกิจกรรม...</p>
        </div>
      </div>
    );
  }

  const isPlaying = room?.status === 'playing';
  const students = room?.studentsList || [];
  const completedCount = students.filter((s) => s.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/60 text-slate-800 flex flex-col pb-16">
      <Navbar userRole="teacher" userName="ครู mon" roomCode={roomCode} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition text-sm bg-white border border-slate-200 px-4 py-2.5 rounded-2xl font-bold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-violet-600" />
            <span>กลับแดชบอร์ด</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-purple-100 px-4 py-2 rounded-2xl text-sm shadow-sm">
            <BookOpen className="w-4 h-4 text-violet-600" />
            <span className="text-slate-500 font-medium">หมวดหมู่:</span>
            <span className="font-extrabold text-slate-800">
              {room?.categoryName || 'คำศัพท์ทั่วไป'}
            </span>
            <span className="text-xs text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full font-bold ml-1">
              {room?.words?.length || 4} คู่คำศัพท์
            </span>
          </div>
        </div>

        {/* Room Code Card */}
        <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl shadow-purple-500/5 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-4 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {isPlaying
                ? 'กำลังแข่งขันเรียลไทม์ (Live Battle)'
                : 'ห้องเปิดแล้ว - รอนักเรียนเข้าร่วม'}
            </span>
          </div>

          <p className="text-violet-900 font-bold text-sm sm:text-base mb-3">
            รหัสเข้าร่วมห้องกิจกรรม (Room Code)
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 mb-5">
            <span className="text-5xl sm:text-7xl font-black tracking-widest text-emerald-600 bg-emerald-50 px-8 py-3.5 rounded-3xl border-2 border-emerald-200 shadow-inner font-mono">
              {roomCode}
            </span>
            <button
              onClick={copyCode}
              className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-sm"
              title="คัดลอกรหัสห้อง"
            >
              {copiedCode ? (
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
                  <Check className="w-5 h-5" />
                  <span className="hidden sm:inline">คัดลอกแล้ว</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  <Copy className="w-5 h-5 text-slate-500" />
                  <span className="hidden sm:inline">คัดลอกรหัส</span>
                </div>
              )}
            </button>
            <button
              onClick={copyJoinLink}
              className="p-4 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-2xl text-cyan-700 transition active:scale-95 cursor-pointer text-sm font-bold flex items-center gap-2 shadow-sm"
              title="คัดลอกลิงก์ให้นักเรียนคลิกเข้าทันที"
            >
              {copiedLink ? (
                <>
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5" />
                  <span>คัดลอกลิงก์เข้าห้อง</span>
                </>
              )}
            </button>
          </div>

          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            ให้นักเรียนเข้าเว็บที่เมนู <strong className="text-cyan-600">"เข้าเล่นสำหรับนักเรียน"</strong> แล้วกรอกรหัส 6 หลักนี้
          </p>
        </div>

        {/* Real-time Students Monitor Card */}
        <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 mb-8 shadow-xl shadow-purple-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-slate-800">
                <Users className="w-5 h-5 text-cyan-600" />
                <span>
                  {isPlaying ? 'คะแนนและสถานะนักเรียนสด' : 'รายชื่อนักเรียนที่เข้าร่วมจริง'}
                </span>
                <span className="text-sm bg-cyan-100 text-cyan-800 px-3 py-0.5 rounded-full font-extrabold ml-2">
                  {students.length} คน
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                รายชื่อนักเรียนทุกคนที่กดเข้าร่วมจากเครื่องจริงในห้องเรียนแบบเรียลไทม์
              </p>
            </div>

            {isPlaying && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-800">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>
                  เสร็จสิ้นแล้ว: {completedCount} / {students.length} คน
                </span>
              </div>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center mx-auto mb-3 animate-bounce text-cyan-600">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-slate-800 font-bold text-lg">ยังไม่มีนักเรียนเข้าร่วมห้อง</p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto font-medium">
                ให้นักเรียนเปิดเบราว์เซอร์แล้วกรอกรหัสห้อง{' '}
                <span className="text-emerald-600 font-mono font-bold text-base">{roomCode}</span>{' '}
                รายชื่อจะปรากฏที่นี่ทันทีแบบเรียลไทม์
              </p>
            </div>
          ) : isPlaying ? (
            /* Live Scoreboard during game */
            <div className="space-y-3">
              {students.map((student, idx) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    student.completed
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                        {student.name}
                        {student.completed && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> จบแล้ว ({student.timeTakenSeconds}s)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        จับคู่สำเร็จ {student.matchedPairsCount} / {room?.words?.length || 4} คู่
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600">
                      {student.score}
                    </span>
                    <span className="text-xs text-slate-400 block font-medium">คะแนน</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Waiting Lobby: Grid of Joined Real Students */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {students.map((student, idx) => {
                const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <div
                    key={student.id}
                    className="bg-slate-50 border-2 border-slate-200 hover:border-violet-300 p-3.5 rounded-2xl flex items-center justify-between gap-2 shadow-sm animate-fade-in transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs flex-shrink-0 ${colorClass}`}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-sm font-bold text-slate-800">
                        {student.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleKickStudent(student.id, student.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="ลบผู้เล่นนี้ออกจากห้อง"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {!isPlaying ? (
            <button
              onClick={handleStartGame}
              disabled={isStarting}
              className="w-full sm:w-auto font-black text-lg sm:text-xl px-12 py-4 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-emerald-500/30"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>กำลังเริ่มเกม...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-white" />
                  <span>เริ่มกิจกรรมการแข่งขัน</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleEndGame}
              disabled={isEnding}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-xl shadow-orange-500/25 active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isEnding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังสรุปผล...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-6 h-6 fill-white" />
                  <span>สิ้นสุดการแข่งขัน & สรุปผล TOP 10</span>
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}