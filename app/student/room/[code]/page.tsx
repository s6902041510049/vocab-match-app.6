'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Sparkles,
  Loader2,
  Trophy,
  Users,
  Flame,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import { broadcastRoomEvent, listenToRoomEvents } from '@/lib/realtime';

interface WordPair {
  id: string;
  term: string;
  meaning: string;
}

interface CardItem {
  id: string;
  text: string;
  pairId: string;
  type: 'term' | 'meaning';
}

interface StudentMember {
  id: string;
  name: string;
  score: number;
  matchedPairsCount: number;
  completed: boolean;
}

interface RoomData {
  code: string;
  categoryName: string;
  words: WordPair[];
  status: 'waiting' | 'playing' | 'ended';
  studentsList: StudentMember[];
}

const DEFAULT_FALLBACK_WORDS: WordPair[] = [
  { id: 'w1', term: 'Photosynthesis', meaning: 'การสังเคราะห์ด้วยแสง' },
  { id: 'w2', term: 'Gravity', meaning: 'แรงโน้มถ่วง' },
  { id: 'w3', term: 'Evaporation', meaning: 'การกลายเป็นไอ' },
  { id: 'w4', term: 'Atmosphere', meaning: 'ชั้นบรรยากาศ' },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function StudentRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('นักเรียน');
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mismatchedIds, setMismatchedIds] = useState<string[]>([]);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const failCountRef = useRef(0);

  // Initialize cards from room words
  const initGameCards = useCallback((wordsList?: WordPair[]) => {
    const list = wordsList && wordsList.length >= 2 ? wordsList : DEFAULT_FALLBACK_WORDS;
    const newCards: CardItem[] = [];
    list.forEach((word) => {
      newCards.push({
        id: `${word.id}-term`,
        text: word.term,
        pairId: word.id,
        type: 'term',
      });
      newCards.push({
        id: `${word.id}-meaning`,
        text: word.meaning,
        pairId: word.id,
        type: 'meaning',
      });
    });

    const shuffled = shuffleArray(newCards);
    setCards(shuffled);
    setSelectedCards([]);
    setMatchedPairs([]);
    setMismatchedIds([]);
    setScore(0);
    setStreak(0);
    setIsFinished(false);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
  }, []);

  // Sync room state from API
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}`, { cache: 'no-store' });
      if (!res.ok) {
        failCountRef.current++;
        // Do NOT bounce out on first failure! Only after multiple consecutive failures if session is invalid
        if (failCountRef.current > 5) {
          const session = localStorage.getItem('student_session');
          if (!session) {
            router.push('/student/join');
          }
        }
        return;
      }

      failCountRef.current = 0;
      const data = await res.json();
      if (data.success && data.room) {
        const r: RoomData = data.room;
        setRoom(r);

        // If teacher started the game and student hasn't started playing yet
        if (r.status === 'playing') {
          setIsPlaying((prev) => {
            if (!prev) {
              initGameCards(r.words);
              return true;
            }
            return prev;
          });
        }

        // If teacher ended the room, route to student private result
        if (r.status === 'ended') {
          router.push(`/student/result/${roomCode}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [roomCode, router, initGameCards]);

  useEffect(() => {
    const session = localStorage.getItem('student_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.roomCode === roomCode) {
          setStudentName(parsed.studentName || 'นักเรียน');
          setStudentId(parsed.studentId || '');
        } else {
          router.push(`/student/join?code=${roomCode}`);
          return;
        }
      } catch (e) {
        router.push('/student/join');
        return;
      }
    } else {
      router.push(`/student/join?code=${roomCode}`);
      return;
    }

    fetchRoom();

    const interval = setInterval(fetchRoom, 1000);

    const unsubscribe = listenToRoomEvents(roomCode, (event) => {
      if (event === 'game_started') {
        setIsPlaying(true);
        initGameCards(room?.words);
        fetchRoom();
      } else if (event === 'game_ended') {
        router.push(`/student/result/${roomCode}`);
      } else {
        fetchRoom();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [roomCode, router, fetchRoom, initGameCards, room?.words]);

  // Timer loop when playing
  useEffect(() => {
    if (isPlaying && !isFinished) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isFinished]);

  // Send score to server
  const sendScoreUpdate = async (
    currentScore: number,
    matchedCount: number,
    completed: boolean,
    seconds: number
  ) => {
    // Save to localStorage immediately so result page ALWAYS has the latest score
    try {
      localStorage.setItem('student_last_score', JSON.stringify({
        roomCode,
        studentId,
        studentName,
        score: currentScore,
        matchedCount,
        completed,
        timeTakenSeconds: seconds,
      }));
      const session = localStorage.getItem('student_session');
      if (session) {
        const p = JSON.parse(session);
        localStorage.setItem('student_session', JSON.stringify({
          ...p,
          lastScore: currentScore,
        }));
      }
    } catch (e) {
      // ignore
    }

    if (!studentId) return;

    try {
      await fetch(`/api/rooms/${roomCode}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName,
          score: currentScore,
          matchedPairsCount: matchedCount,
          completed,
          timeTakenSeconds: seconds,
        }),
      });

      broadcastRoomEvent(roomCode, 'score_updated', {
        studentId,
        score: currentScore,
        completed,
      });
    } catch (e) {
      console.error('Error sending score update:', e);
    }
  };

  // Card click handler
  const handleSelectCard = (card: CardItem) => {
    if (
      selectedCards.length >= 2 ||
      matchedPairs.includes(card.pairId) ||
      mismatchedIds.length > 0
    ) {
      return;
    }

    if (selectedCards.some((c) => c.id === card.id)) {
      return;
    }

    const updatedSelected = [...selectedCards, card];
    setSelectedCards(updatedSelected);

    if (updatedSelected.length === 2) {
      const [first, second] = updatedSelected;

      // Check if match
      if (first.pairId === second.pairId) {
        const nextMatched = [...matchedPairs, first.pairId];
        const newStreak = streak + 1;
        const streakBonus = Math.min((newStreak - 1) * 20, 100);
        const pointsEarned = 100 + streakBonus;
        const newScore = score + pointsEarned;

        setMatchedPairs(nextMatched);
        setStreak(newStreak);
        setScore(newScore);
        setSelectedCards([]);

        const totalPairs = cards.length / 2;
        const isGameFinished = nextMatched.length >= totalPairs;

        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

        sendScoreUpdate(newScore, nextMatched.length, isGameFinished, timeTaken);

        if (isGameFinished) {
          setIsFinished(true);
          setTimeout(() => {
            // Strictly route to student private result page WITH score param
            router.push(`/student/result/${roomCode}?score=${newScore}`);
          }, 1200);
        }
      } else {
        // Wrong match
        setStreak(0);
        setMismatchedIds([first.id, second.id]);
        setTimeout(() => {
          setSelectedCards([]);
          setMismatchedIds([]);
        }, 700);
      }
    }
  };

  const handleManualStart = () => {
    initGameCards(room?.words);
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        <Navbar userRole="student" userName={studentName} />
        <div className="flex-1 flex flex-col justify-center items-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">กำลังเชื่อมต่อกับห้องกิจกรรม...</p>
        </div>
      </div>
    );
  }

  const myRank = room
    ? (room.studentsList || []).findIndex((s) => s.id === studentId) + 1 || 1
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/60 text-slate-800 flex flex-col pb-12">
      <Navbar userRole="student" userName={studentName} roomCode={roomCode} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col justify-center">
        {!isPlaying ? (
          /* WAITING SCREEN */
          <div className="bg-white border-2 border-purple-100 p-6 sm:p-10 rounded-3xl text-center shadow-xl shadow-purple-500/5 backdrop-blur-md">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-cyan-500/30 animate-bounce">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></span>
              <span>เชื่อมต่อห้องสำเร็จแล้ว พร้อมแข่งขัน</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black mb-2 text-slate-800">
              หน้ารอเริ่มการแข่งขัน
            </h1>
            <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto font-medium">
              ห้องรหัส <span className="font-mono font-bold text-emerald-600 text-base">{roomCode}</span> • หมวดหมู่:{' '}
              <span className="font-bold text-violet-700">{room?.categoryName || 'คำศัพท์ทั่วไป'}</span>
              <br />
              กรุณารอคุณครูกดเริ่มกิจกรรมจากหน้าจอหลัก ระบบจะเริ่มเล่นให้อัตโนมัติทันที
            </p>

            {/* List of other joined students */}
            <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 mb-6 text-left">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-600 font-bold">
                <span className="flex items-center gap-1.5 text-cyan-800">
                  <Users className="w-4 h-4 text-cyan-600" /> เพื่อนที่เข้าร่วมในห้องนี้ ({room?.studentsList?.length || 1} คน)
                </span>
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">สด</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {room?.studentsList?.map((std) => (
                  <span
                    key={std.id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      std.id === studentId
                        ? 'bg-cyan-100 border-cyan-300 text-cyan-900 ring-2 ring-cyan-400/50 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {std.name} {std.id === studentId ? ' (คุณ)' : ''}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleManualStart}
              className="bg-slate-100 hover:bg-violet-50 border-2 border-slate-200 hover:border-violet-300 text-violet-700 font-bold px-6 py-3 rounded-2xl text-sm transition cursor-pointer flex items-center gap-2 mx-auto active:scale-95 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>เริ่มเล่นเกมทันที (โหมดฝึกซ้อมเดี่ยว)</span>
            </button>
          </div>
        ) : (
          /* ACTIVE GAMEPLAY SCREEN */
          <div>
            {/* Top Score & Status Header */}
            <div className="grid grid-cols-3 gap-3 bg-white p-4 sm:p-5 rounded-3xl border-2 border-purple-100 mb-6 shadow-md shadow-purple-500/5">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-bold">คะแนนสะสม</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {score} แต้ม
                </span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                  <Timer className="w-3.5 h-3.5 text-cyan-600" />
                  <span>เวลา</span>
                </div>
                <span className="text-xl sm:text-2xl font-black font-mono text-cyan-700">
                  {elapsedSeconds}s
                </span>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 px-3 py-1 rounded-xl text-violet-800 text-xs shadow-sm">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold">อันดับ #{myRank}</span>
                </div>
                {streak > 1 && (
                  <span className="text-xs text-orange-600 font-extrabold flex items-center gap-1 mt-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> Combo x{streak} (+{Math.min((streak - 1) * 20, 100)})
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 mb-6 overflow-hidden p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(matchedPairs.length / (cards.length / 2 || 1)) * 100}%`,
                }}
              ></div>
            </div>

            {/* Matching Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {cards.map((card) => {
                const isMatched = matchedPairs.includes(card.pairId);
                const isSelected = selectedCards.some((c) => c.id === card.id);
                const isMismatched = mismatchedIds.includes(card.id);

                return (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    disabled={isMatched || isFinished}
                    className={`min-h-[95px] sm:min-h-[115px] p-4 rounded-3xl font-extrabold text-center flex flex-col justify-center items-center border-2 transition-all duration-200 select-none cursor-pointer ${
                      isMatched
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 cursor-not-allowed opacity-60 scale-95 shadow-none'
                        : isMismatched
                        ? 'bg-rose-50 border-rose-400 text-rose-800 animate-pulse'
                        : isSelected
                        ? 'bg-violet-600 border-violet-700 text-white shadow-xl shadow-violet-500/40 scale-105'
                        : 'bg-white border-slate-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10 text-slate-800'
                    }`}
                  >
                    <span className="text-base sm:text-lg leading-snug">
                      {card.text}
                    </span>
                    {isMatched && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Victory Celebration Modal */}
            {isFinished && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
                <div className="bg-white border-2 border-purple-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                  <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-500 mx-auto mb-4 animate-bounce shadow-md">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-1">ยินดีด้วย! จับคู่ครบแล้ว 🎉</h2>
                  <p className="text-emerald-600 font-black text-4xl my-3">{score} แต้ม</p>
                  <p className="text-slate-500 text-xs font-semibold mb-6">กำลังนำคุณไปยังหน้าสรุปผลคะแนน...</p>
                  <div className="flex items-center justify-center gap-2 text-violet-700 text-sm font-bold">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                    <span>กำลังโหลดผลคะแนนของคุณ...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}