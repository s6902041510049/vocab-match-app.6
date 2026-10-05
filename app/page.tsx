'use client';

import { useRouter } from 'next/navigation';
import { GraduationCap, Users, Sparkles, ArrowRight, Zap, Trophy, BookOpen } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/90 text-slate-800 relative overflow-hidden">
      {/* Decorative colorful blur spheres */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-purple-300/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-pink-300/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-60 h-60 bg-cyan-300/30 rounded-full blur-[90px] pointer-events-none"></div>

      <div className="text-center max-w-3xl mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-purple-200 text-purple-700 mb-6 text-sm font-bold shadow-md shadow-purple-500/5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>ระบบเรียนรู้คำศัพท์เรียลไทม์ สนุก สดใส สำหรับห้องเรียนยุคใหม่ ✨</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
          VOCAB MATCH
        </h1>

        <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          เกมจับคู่คำศัพท์ออนไลน์สุดมันส์สำหรับนักเรียน พร้อมระบบแข่งขันและคะแนนสดเรียลไทม์ TOP 10 สรุปผลทันใจ!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
        {/* Student Box */}
        <div
          onClick={() => router.push('/student/join')}
          className="group bg-white border-2 border-cyan-100 hover:border-cyan-400 p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-400/20 hover:-translate-y-1.5 flex flex-col items-center text-center shadow-lg shadow-slate-200/50"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">เข้าเล่นสำหรับนักเรียน</h2>
          <p className="text-slate-500 text-sm mb-6 font-medium">
            ใส่รหัสห้อง 6 หลักเพื่อเข้าร่วมกิจกรรมจับคู่กับเพื่อนๆ ในห้อง
          </p>
          <div className="w-full py-3.5 px-6 rounded-2xl bg-cyan-50 group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-600 text-cyan-700 group-hover:text-white font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm">
            <span>เข้าสู่ห้องกิจกรรม</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Teacher Box */}
        <div
          onClick={() => router.push('/login')}
          className="group bg-white border-2 border-purple-100 hover:border-purple-400 p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-purple-400/20 hover:-translate-y-1.5 flex flex-col items-center text-center shadow-lg shadow-slate-200/50"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-500 via-purple-600 to-pink-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">สำหรับคุณครู</h2>
          <p className="text-slate-500 text-sm mb-6 font-medium">
            จัดการคลังคำศัพท์ หมวดหมู่ และเปิดห้องเล่นเกมเรียลไทม์
          </p>
          <div className="w-full py-3.5 px-6 rounded-2xl bg-purple-50 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-pink-600 text-purple-700 group-hover:text-white font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm">
            <span>เข้าสู่ระบบครู</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center items-center gap-4 mt-12 text-xs font-bold text-slate-600 relative z-10">
        <span className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-4 py-2 rounded-full shadow-sm">
          <Zap className="w-4 h-4 text-amber-500" /> แข่งขันเรียลไทม์สด
        </span>
        <span className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-4 py-2 rounded-full shadow-sm">
          <Trophy className="w-4 h-4 text-yellow-500" /> กระดานจัดอันดับ TOP 10
        </span>
        <span className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-4 py-2 rounded-full shadow-sm">
          <BookOpen className="w-4 h-4 text-emerald-500" /> หมวดหมู่คำศัพท์ปรับแต่งได้
        </span>
      </div>
    </div>
  );
}