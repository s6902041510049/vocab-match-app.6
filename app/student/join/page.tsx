'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Hash, User, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { broadcastRoomEvent } from '@/lib/realtime';

function StudentJoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomCode, setRoomCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setRoomCode(codeParam.trim());
    }

    const existingSession = localStorage.getItem('student_session');
    if (existingSession) {
      try {
        const parsed = JSON.parse(existingSession);
        if (parsed.studentName) {
          setStudentName(parsed.studentName);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = roomCode.trim();
    const cleanName = studentName.trim();

    if (!cleanCode) {
      setErrorMessage('กรุณากรอกรหัสห้อง 6 หลัก');
      return;
    }

    if (!cleanName) {
      setErrorMessage('กรุณากรอกชื่อของคุณ');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: cleanName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถเข้าร่วมห้องได้');
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem(
        'student_session',
        JSON.stringify({
          roomCode: cleanCode,
          studentId: data.student.id,
          studentName: data.student.name,
        })
      );

      broadcastRoomEvent(cleanCode, 'student_joined', {
        student: data.student,
      });

      router.push(`/student/room/${cleanCode}`);
    } catch (err) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border-2 border-cyan-100 p-8 sm:p-10 rounded-3xl shadow-xl shadow-cyan-500/5 backdrop-blur-md">
      <div className="text-center mb-8">
        <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 text-white mb-4 shadow-lg shadow-cyan-500/25">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">เข้าร่วมกิจกรรมจับคู่</h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          กรอกรหัสห้องที่คุณครูให้ และชื่อเล่นของคุณเพื่อเริ่มเล่น
        </p>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3.5 rounded-2xl text-sm mb-6 flex items-center gap-2.5 font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1.5 block">
            รหัสห้อง (Room Code)
          </label>
          <div className="relative">
            <Hash className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              maxLength={6}
              placeholder="เช่น 123456"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white rounded-2xl pl-11 pr-4 py-3 text-slate-900 text-xl font-bold font-mono tracking-widest focus:outline-none focus:border-cyan-500 transition shadow-sm"
              autoFocus={!roomCode}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-1.5 block">
            ชื่อนักเรียน
          </label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ชื่อ หรือ ชื่อเล่นของคุณ"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white rounded-2xl pl-11 pr-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-cyan-500 transition shadow-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-cyan-500/25 transition active:scale-95 flex justify-center items-center gap-2 cursor-pointer mt-3 disabled:opacity-50 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังตรวจสอบห้อง...</span>
            </>
          ) : (
            <>
              <span>เข้าห้องกิจกรรม</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function StudentJoinPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/90 flex flex-col">
      <Navbar />
      <div className="flex-1 flex justify-center items-center px-6 py-10">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              <span>กำลังโหลด...</span>
            </div>
          }
        >
          <StudentJoinForm />
        </Suspense>
      </div>
    </div>
  );
}