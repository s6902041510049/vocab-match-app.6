'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  PlayCircle,
  FolderPlus,
  BookOpen,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface WordPair {
  id: string;
  term: string;
  meaning: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-science', name: 'คำศัพท์วิทยาศาสตร์' },
  { id: 'cat-tech', name: 'คำศัพท์เทคโนโลยี & คอมพิวเตอร์' },
  { id: 'cat-daily', name: 'คำศัพท์ภาษาอังกฤษทั่วไป' },
];

const DEFAULT_WORDS: WordPair[] = [
  // Science
  { id: 'w-sci-1', term: 'Photosynthesis', meaning: 'การสังเคราะห์ด้วยแสง', categoryId: 'cat-science' },
  { id: 'w-sci-2', term: 'Gravity', meaning: 'แรงโน้มถ่วง', categoryId: 'cat-science' },
  { id: 'w-sci-3', term: 'Evaporation', meaning: 'การกลายเป็นไอ', categoryId: 'cat-science' },
  { id: 'w-sci-4', term: 'Atmosphere', meaning: 'ชั้นบรรยากาศ', categoryId: 'cat-science' },
  { id: 'w-sci-5', term: 'Ecosystem', meaning: 'ระบบนิเวศ', categoryId: 'cat-science' },
  { id: 'w-sci-6', term: 'Molecule', meaning: 'โมเลกุล', categoryId: 'cat-science' },

  // Tech
  { id: 'w-tech-1', term: 'Algorithm', meaning: 'ขั้นตอนวิธี', categoryId: 'cat-tech' },
  { id: 'w-tech-2', term: 'Database', meaning: 'ฐานข้อมูล', categoryId: 'cat-tech' },
  { id: 'w-tech-3', term: 'Network', meaning: 'เครือข่าย', categoryId: 'cat-tech' },
  { id: 'w-tech-4', term: 'Firewall', meaning: 'ระบบป้องกันเครือข่าย', categoryId: 'cat-tech' },
  { id: 'w-tech-5', term: 'Encryption', meaning: 'การเข้ารหัสลับ', categoryId: 'cat-tech' },
  { id: 'w-tech-6', term: 'Cloud Computing', meaning: 'การประมวลผลบนคลาวด์', categoryId: 'cat-tech' },

  // Daily
  { id: 'w-eng-1', term: 'Delicious', meaning: 'อร่อย', categoryId: 'cat-daily' },
  { id: 'w-eng-2', term: 'Opportunity', meaning: 'โอกาส', categoryId: 'cat-daily' },
  { id: 'w-eng-3', term: 'Journey', meaning: 'การเดินทาง', categoryId: 'cat-daily' },
  { id: 'w-eng-4', term: 'Confidence', meaning: 'ความมั่นใจ', categoryId: 'cat-daily' },
  { id: 'w-eng-5', term: 'Cooperation', meaning: 'ความร่วมมือ', categoryId: 'cat-daily' },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [words, setWords] = useState<WordPair[]>(DEFAULT_WORDS);
  const [selectedCat, setSelectedCat] = useState<string>('cat-science');

  const [newTerm, setNewTerm] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newCatName, setNewCatName] = useState('');

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const auth = localStorage.getItem('teacher_auth');
    if (!auth) {
      router.push('/login');
      return;
    }

    try {
      const savedCats = localStorage.getItem('vocab_categories');
      const savedWords = localStorage.getItem('vocab_words');

      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          setSelectedCat(parsed[0].id);
        }
      }
      if (savedWords) {
        const parsed = JSON.parse(savedWords);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWords(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load stored categories/words', e);
    }
  }, [router]);

  // Persist to localStorage
  const saveToStorage = (updatedCats: Category[], updatedWords: WordPair[]) => {
    try {
      localStorage.setItem('vocab_categories', JSON.stringify(updatedCats));
      localStorage.setItem('vocab_words', JSON.stringify(updatedWords));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Add new category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      showNotification('error', 'ชื่อหมวดหมู่นี้มีอยู่แล้ว');
      return;
    }

    const newCat: Category = { id: `cat-${Date.now()}`, name };
    const updatedCats = [...categories, newCat];
    setCategories(updatedCats);
    setSelectedCat(newCat.id);
    setNewCatName('');
    saveToStorage(updatedCats, words);
    showNotification('success', `เพิ่มหมวดหมู่ "${name}" สำเร็จ`);
  };

  // Delete category
  const handleDeleteCategory = (catId: string) => {
    const catToDelete = categories.find((c) => c.id === catId);
    if (!catToDelete) return;

    if (categories.length <= 1) {
      showNotification('error', 'ต้องมีหมวดหมู่อย่างน้อย 1 หมวดหมู่เสมอ');
      return;
    }

    if (
      confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${catToDelete.name}"?\n(คำศัพท์ทั้งหมดในหมวดนี้จะถูกลบไปด้วย)`
      )
    ) {
      const updatedCats = categories.filter((c) => c.id !== catId);
      const updatedWords = words.filter((w) => w.categoryId !== catId);

      setCategories(updatedCats);
      setWords(updatedWords);
      saveToStorage(updatedCats, updatedWords);

      if (selectedCat === catId) {
        setSelectedCat(updatedCats[0]?.id || '');
      }
      showNotification('success', `ลบหมวดหมู่ "${catToDelete.name}" เรียบร้อยแล้ว`);
    }
  };

  // Add word
  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const term = newTerm.trim();
    const meaning = newMeaning.trim();

    if (!term || !meaning) {
      showNotification('error', 'กรุณากรอกทั้งคำศัพท์และความหมาย');
      return;
    }

    if (!selectedCat) {
      showNotification('error', 'กรุณาเลือกหมวดหมู่ก่อนเพิ่มคำศัพท์');
      return;
    }

    const newEntry: WordPair = {
      id: `w-${Date.now()}`,
      term,
      meaning,
      categoryId: selectedCat,
    };

    const updatedWords = [...words, newEntry];
    setWords(updatedWords);
    setNewTerm('');
    setNewMeaning('');
    saveToStorage(categories, updatedWords);
    showNotification('success', `เพิ่มคำศัพท์ "${term}" เรียบร้อย`);
  };

  // Delete word
  const handleDeleteWord = (id: string) => {
    const wordToDelete = words.find((w) => w.id === id);
    if (!wordToDelete) return;

    const updatedWords = words.filter((w) => w.id !== id);
    setWords(updatedWords);
    saveToStorage(categories, updatedWords);
    showNotification('success', `ลบคำศัพท์ "${wordToDelete.term}" เรียบร้อย`);
  };

  // Create real room
  const handleCreateRoom = async () => {
    const currentCategory = categories.find((c) => c.id === selectedCat);
    const categoryWords = words.filter((w) => w.categoryId === selectedCat);

    if (categoryWords.length < 2) {
      showNotification(
        'error',
        'หมวดหมู่นี้ต้องมีคำศัพท์อย่างน้อย 2 คำเพื่อใช้สำหรับจับคู่แข่งขัน'
      );
      return;
    }

    setIsCreatingRoom(true);

    try {
      const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          categoryId: selectedCat,
          categoryName: currentCategory?.name || 'หมวดหมู่ทั่วไป',
          words: categoryWords,
        }),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถสร้างห้องได้');
      }

      router.push(`/teacher/room/${roomCode}`);
    } catch (err) {
      console.error(err);
      showNotification('error', 'เกิดข้อผิดพลาดในการสร้างห้อง กรุณาลองใหม่อีกครั้ง');
      setIsCreatingRoom(false);
    }
  };

  const activeCategory = categories.find((c) => c.id === selectedCat);
  const activeWords = words.filter((w) => w.categoryId === selectedCat);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/60 text-slate-800 font-sans pb-16">
      <Navbar userRole="teacher" userName="ครู mon" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Alerts / Feedback Message */}
        {feedbackMsg && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-fade-in shadow-sm ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            )}
            <span className="text-sm font-bold">{feedbackMsg.text}</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white border border-purple-100 p-6 rounded-3xl shadow-lg shadow-purple-500/5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>แดชบอร์ดจัดการคลังคำศัพท์</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
              ระบบจัดการคำศัพท์ & หมวดหมู่
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              เพิ่ม ลบ หรือแก้ไขคำศัพท์ เพื่อนำไปเปิดห้องแข่งขันจับคู่แบบเรียลไทม์
            </p>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isCreatingRoom || activeWords.length < 2}
            className={`flex items-center gap-2.5 font-black px-6 py-3.5 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer ${
              activeWords.length < 2
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-emerald-500/25'
            }`}
          >
            {isCreatingRoom ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังสร้างห้อง...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>เปิดห้องเล่นเกมเรียลไทม์</span>
              </>
            )}
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Column 1: Manage Categories */}
          <div className="bg-white border border-purple-100 p-5 sm:p-6 rounded-3xl h-fit shadow-md shadow-slate-200/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-violet-800">
                <FolderPlus className="w-5 h-5 text-violet-600" />
                <span>หมวดหมู่คำศัพท์</span>
              </h2>
              <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-bold">
                {categories.length} หมวด
              </span>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="ชื่อหมวดหมู่ใหม่..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-violet-500 transition font-medium placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition active:scale-95 flex items-center gap-1 cursor-pointer shadow-md shadow-violet-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่ม</span>
              </button>
            </form>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const count = words.filter((w) => w.categoryId === cat.id).length;
                const isSelected = selectedCat === cat.id;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`flex justify-between items-center p-3 rounded-2xl cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'bg-violet-50 border-violet-500 text-violet-950 font-bold shadow-md shadow-violet-500/10'
                        : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <BookOpen
                        className={`w-4 h-4 flex-shrink-0 ${
                          isSelected ? 'text-violet-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate text-sm">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isSelected
                            ? 'bg-violet-200/80 text-violet-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count} คำ
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                        className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="ลบหมวดหมู่"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Manage Words in Selected Category */}
          <div className="md:col-span-2 bg-white border border-purple-100 p-5 sm:p-6 rounded-3xl flex flex-col shadow-md shadow-slate-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span>หมวด:</span>
                  <span className="text-violet-600">
                    {activeCategory?.name || 'กรุณาเลือกหมวดหมู่'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  คำศัพท์ในหมวดนี้จะถูกนำไปสุ่มเป็นการ์ดจับคู่ในห้องเล่นเกม
                </p>
              </div>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl w-fit">
                {activeWords.length} คู่คำศัพท์
              </span>
            </div>

            {/* Add Word Form */}
            <form onSubmit={handleAddWord} className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
              <input
                type="text"
                placeholder="คำศัพท์ (เช่น Photosynthesis)"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                className="sm:col-span-2 bg-slate-50 border-2 border-slate-200 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-violet-500 transition placeholder:text-slate-400"
              />
              <input
                type="text"
                placeholder="ความหมาย (เช่น การสังเคราะห์ด้วยแสง)"
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                className="sm:col-span-2 bg-slate-50 border-2 border-slate-200 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-violet-500 transition placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 font-bold text-white rounded-xl py-2.5 flex justify-center items-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-violet-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มคำ</span>
              </button>
            </form>

            {/* Words List */}
            {activeWords.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-bold">ยังไม่มีคำศัพท์ในหมวดหมู่นี้</p>
                <p className="text-slate-500 text-sm mt-1">
                  กรอกคำศัพท์และความหมายด้านบนเพื่อเพิ่มคู่คำศัพท์แรก
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                {activeWords.map((word, idx) => (
                  <div
                    key={word.id}
                    className="flex justify-between items-center bg-slate-50 hover:bg-violet-50/50 border border-slate-200 hover:border-violet-300 p-4 rounded-2xl transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-extrabold text-emerald-700 text-base sm:text-lg">
                          {word.term}
                        </p>
                        <p className="text-slate-600 text-sm font-medium mt-0.5">{word.meaning}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteWord(word.id)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                      title="ลบคำศัพท์"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}