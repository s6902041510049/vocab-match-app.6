'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Trophy,
  CheckCircle2,
  Home,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { listenToRoomEvents } from '@/lib/realtime';

interface MyResultData {
  studentName: string;
  score: number;
  matchedPairsCount: number;
  completed: boolean;
  rank: number;
  totalPlayers: number;
  categoryName: string;
  roomCode: string;
}

function StudentResultContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = params.code as string;

  const [result, setResult] = useState<MyResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('นักเรียน');
  const [finalScore, setFinalScore] = useState<number>(0);

  // Initialize score from URL params and localStorage immediately
  useEffect(() => {
    let localScore = 0;

    // 1. From URL param ?score=...
    const urlScoreParam = searchParams.get('score');
    if (urlScoreParam) {
      const parsed = parseInt(urlScoreParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        localScore = parsed;
      }
    }

    // 2. From student_last_score in localStorage
    if (localScore === 0) {
      try {
        const lastScoreStr = localStorage.getItem('student_last_score');
        if (lastScoreStr) {
          const parsedLast = JSON.parse(lastScoreStr);
          if (parsedLast.roomCode === roomCode && typeof parsedLast.score === 'number') {
            localScore = parsedLast.score;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // 3. From student_session in localStorage
    if (localScore === 0) {
      try {
        const sessionStr = localStorage.getItem('student_session');
        if (sessionStr) {
          const parsedSession = JSON.parse(sessionStr);
          if (typeof parsedSession.lastScore === 'number') {
            localScore = parsedSession.lastScore;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (localScore > 0) {
      setFinalScore(localScore);
    }
  }, [searchParams, roomCode]);

  const fetchMyResult = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/my-result?studentId=${sid}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          setResult(data.result);
          // Only update finalScore if server score is > 0, otherwise keep local score
          if (typeof data.result.score === 'number' && data.result.score > 0) {
            setFinalScore(data.result.score);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching result:', e);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    const session = localStorage.getItem('student_session');
    if (!session) {
      router.replace('/student/join');
      return;
    }

    try {
      const parsed = JSON.parse(session);
      if (parsed.studentName) {
        setStudentName(parsed.studentName);
      }
      if (parsed.studentId) {
        fetchMyResult(parsed.studentId);

        // Keep updating rank if other students finish
        const interval = setInterval(() => {
          fetchMyResult(parsed.studentId);
        }, 2000);

        const unsubscribe = listenToRoomEvents(roomCode, (event) => {
          if (event === 'room_reset') {
            router.push(`/student/room/${roomCode}`);
          } else {
            fetchMyResult(parsed.studentId);
          }
        });

        return () => {
          clearInterval(interval);
          unsubscribe();
        };
      } else {
        router.replace('/student/join');
      }
    } catch (e) {
      router.replace('/student/join');
    }
  }, [roomCode, router, fetchMyResult]);

  // Display score is whichever is highest between server result and localScore
  const displayScore = Math.max(finalScore, result?.score || 0);

  if (loading && displayScore === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        <Navbar userRole="student" userName={studentName} />
        <div className="flex-1 flex flex-col justify-center items-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">กำลังคำนวณคะแนนของคุณ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/70 text-slate-800 font-sans flex flex-col pb-16">
      <Navbar userRole="student" userName={studentName} roomCode={roomCode} />

      <main className="max-w-md mx-auto px-4 sm:px-6 py-10 w-full flex-1 flex flex-col justify-center">
        {/* กล่องสรุปผลเฉพาะตัวของนักเรียน (คะแนนใครคะแนนมัน 100%) */}
        <div className="bg-white border-2 border-purple-200 p-8 sm:p-10 rounded-3xl text-center shadow-xl shadow-purple-500/10 relative overflow-hidden backdrop-blur-md">
          {/* Header Icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-orange-500/30 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>จบกิจกรรมเรียบร้อยแล้ว</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-1">
            สรุปผลคะแนนของคุณ
          </h1>
          <p className="text-slate-500 font-bold text-sm mb-6">
            ผู้เล่น: <span className="text-violet-700 font-extrabold">{result?.studentName || studentName}</span>
          </p>

          {/* แสดงแค่ "อันดับ" และ "คะแนน" ของตนเองเท่านั้น */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* อันดับ */}
            <div className="bg-violet-50/90 border-2 border-violet-200 p-5 rounded-3xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-xs font-extrabold text-violet-600 uppercase tracking-wider mb-1">
                อันดับที่
              </span>
              <span className="text-4xl sm:text-5xl font-black text-violet-800 font-mono">
                #{result?.rank || 1}
              </span>
            </div>

            {/* คะแนน */}
            <div className="bg-emerald-50/90 border-2 border-emerald-200 p-5 rounded-3xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider mb-1">
                คะแนนที่ได้
              </span>
              <span className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono">
                {displayScore}
              </span>
              <span className="text-xs font-bold text-emerald-700 mt-1">แต้ม</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ระบบผลคะแนนเฉพาะบุคคล (คะแนนใครคะแนนมัน)</span>
          </div>

          {/* ปุ่มสำหรับนักเรียนเท่านั้น */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/student/join')}
              className="w-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer text-center text-sm"
            >
              เข้าร่วมห้องกิจกรรมใหม่
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl border-2 border-slate-200 transition cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>กลับสู่หน้าหลัก</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StudentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
        </div>
      }
    >
      <StudentResultContent />
    </Suspense>
  );
}
