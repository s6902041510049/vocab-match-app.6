'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Lock, User, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'mon' && password.trim() === '1234') {
      localStorage.setItem('teacher_auth', 'true');
      router.push('/teacher/dashboard');
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (user: mon / pass: 1234)');
    }
  };

  const handleAutoFill = () => {
    setUsername('mon');
    setPassword('1234');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/90 flex flex-col">
      <Navbar />
      <div className="flex-1 flex justify-center items-center px-6 py-12">
        <div className="w-full max-w-md bg-white border-2 border-purple-100 p-8 sm:p-10 rounded-3xl shadow-xl shadow-purple-500/5 backdrop-blur-md">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-violet-500 to-pink-500 text-white mb-4 shadow-lg shadow-purple-500/25">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">เข้าสู่ระบบสำหรับครู</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              เข้าสู่ระบบเพื่อจัดการคำศัพท์และเริ่มกิจกรรมในห้องเรียน
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3.5 rounded-2xl text-sm mb-6 text-center font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-1.5 block">ชื่อผู้ใช้งาน (Username)</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="mon"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-violet-500 rounded-2xl pl-11 pr-4 py-3 text-slate-800 font-semibold focus:outline-none transition shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 mb-1.5 block">รหัสผ่าน (Password)</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-violet-500 rounded-2xl pl-11 pr-4 py-3 text-slate-800 font-semibold focus:outline-none transition shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-purple-600/30 transition active:scale-95 mt-3 cursor-pointer"
            >
              เข้าสู่ระบบ
            </button>

            <div className="mt-5 p-3.5 bg-violet-50/80 rounded-2xl border border-violet-100 text-xs text-violet-800 flex items-center justify-between font-medium">
              <span>บัญชีทดสอบ: <strong className="font-bold text-violet-900">mon</strong> / รหัส: <strong className="font-bold text-violet-900">1234</strong></span>
              <button
                type="button"
                onClick={handleAutoFill}
                className="bg-white hover:bg-violet-100 text-violet-700 px-3 py-1 rounded-xl font-bold border border-violet-200 shadow-sm cursor-pointer flex items-center gap-1 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>กรอกทันที</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}