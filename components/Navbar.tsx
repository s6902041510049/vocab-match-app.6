'use client';

import { useRouter } from 'next/navigation';
import { LogOut, UserCheck, Sparkles, Home, Hash } from 'lucide-react';

interface NavbarProps {
  userRole?: 'teacher' | 'student';
  userName?: string;
  roomCode?: string;
}

export default function Navbar({ userRole, userName, roomCode }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      if (userRole === 'teacher') {
        localStorage.removeItem('teacher_auth');
        router.push('/login');
      } else {
        localStorage.removeItem('student_session');
        router.push('/');
      }
      sessionStorage.clear();
      router.refresh();
    }
  };

  const handleHomeClick = () => {
    if (userRole === 'teacher') {
      router.push('/teacher/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md border-b border-purple-100 px-4 md:px-8 py-3.5 flex justify-between items-center text-slate-800 sticky top-0 z-50 shadow-sm">
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition select-none group"
        onClick={handleHomeClick}
        title="ไปหน้าหลัก"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent leading-none">
            VOCAB MATCH
          </span>
          <span className="text-[11px] text-violet-600 font-bold tracking-wider uppercase mt-0.5">
            ⚡ Realtime Classroom
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {roomCode && (
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-sm">
            <Hash className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-600 hidden sm:inline">ห้อง:</span>
            <span className="font-mono font-bold text-sm tracking-wider text-emerald-700">
              {roomCode}
            </span>
          </div>
        )}

        {userRole && (
          <>
            <div className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-200 text-sm shadow-sm">
              <UserCheck className="w-4 h-4 text-violet-600" />
              <span className="font-bold text-violet-800 text-xs md:text-sm max-w-[120px] md:max-w-none truncate">
                {userName || (userRole === 'teacher' ? 'ครู mon' : 'นักเรียน')}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 px-3.5 py-1.5 rounded-full font-bold text-xs md:text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-sm"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </>
        )}

        {!userRole && (
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition"
          >
            <Home className="w-4 h-4" />
            <span>หน้าแรก</span>
          </button>
        )}
      </div>
    </nav>
  );
}