import fs from 'fs';
import path from 'path';
import os from 'os';

export interface WordPair {
  id: string;
  term: string;
  meaning: string;
  categoryId?: string;
}

export interface StudentMember {
  id: string;
  name: string;
  joinedAt: number;
  score: number;
  matchedPairsCount: number;
  completed: boolean;
  timeTakenSeconds?: number;
  finishedAt?: number;
}

export interface Room {
  code: string;
  categoryId: string;
  categoryName: string;
  words: WordPair[];
  status: 'waiting' | 'playing' | 'ended';
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  students: Record<string, StudentMember>;
}

// Support both local development and Vercel serverless /tmp
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'vocab_match_data')
  : path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'rooms.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Ignore error
  }
}

function loadRoomsFromFile(): Record<string, Room> {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    // Non-fatal
  }
  return {};
}

function saveRoomsToFile(roomsToSave: Record<string, Room>) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(roomsToSave, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save rooms to disk (in-memory will be used):', e);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __VOCAB_ROOMS__: Record<string, Room> | undefined;
}

if (!globalThis.__VOCAB_ROOMS__) {
  globalThis.__VOCAB_ROOMS__ = loadRoomsFromFile();
}

function getMemoryRooms(): Record<string, Room> {
  if (!globalThis.__VOCAB_ROOMS__) {
    globalThis.__VOCAB_ROOMS__ = loadRoomsFromFile();
  }
  return globalThis.__VOCAB_ROOMS__;
}

export function createRoom(
  code: string,
  categoryId: string,
  categoryName: string,
  words: WordPair[]
): Room {
  const rooms = getMemoryRooms();
  const existing = rooms[code];

  const newRoom: Room = {
    code,
    categoryId: categoryId || (existing?.categoryId ?? ''),
    categoryName: categoryName || (existing?.categoryName ?? 'หมวดหมู่ทั่วไป'),
    words: words && words.length > 0 ? words : (existing?.words ?? []),
    status: existing?.status ?? 'waiting',
    createdAt: existing?.createdAt ?? Date.now(),
    students: existing?.students ?? {},
  };

  rooms[code] = newRoom;
  saveRoomsToFile(rooms);
  return newRoom;
}

export function getRoom(code: string): Room | null {
  const rooms = getMemoryRooms();
  if (rooms[code]) {
    return rooms[code];
  }

  // Fallback: reload from file if not in memory
  const fileRooms = loadRoomsFromFile();
  if (fileRooms[code]) {
    rooms[code] = fileRooms[code];
    return rooms[code];
  }

  return null;
}

export function joinRoom(code: string, studentName: string): { student: StudentMember; room: Room } | null {
  const room = getRoom(code);
  if (!room) return null;

  const trimmedName = studentName.trim();
  const existing = Object.values(room.students).find(
    (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (existing) {
    return { student: existing, room };
  }

  const studentId = `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newStudent: StudentMember = {
    id: studentId,
    name: trimmedName,
    joinedAt: Date.now(),
    score: 0,
    matchedPairsCount: 0,
    completed: false,
  };

  room.students[studentId] = newStudent;
  saveRoomsToFile(getMemoryRooms());
  return { student: newStudent, room };
}

export function startRoomGame(code: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;

  room.status = 'playing';
  room.startedAt = Date.now();
  saveRoomsToFile(getMemoryRooms());
  return room;
}

export function updateStudentScore(
  code: string,
  studentId: string,
  data: {
    score: number;
    studentName?: string;
    matchedPairsCount?: number;
    completed?: boolean;
    timeTakenSeconds?: number;
  }
): { room: Room; student: StudentMember } | null {
  let room = getRoom(code);
  if (!room) {
    // If room is missing, auto-create it so score is never lost
    room = createRoom(code, 'cat-auto', 'กิจกรรมจับคู่', []);
  }

  let student = room.students[studentId];
  if (!student) {
    // Create student on-the-fly if missing
    student = {
      id: studentId,
      name: data.studentName || 'นักเรียน',
      joinedAt: Date.now(),
      score: data.score,
      matchedPairsCount: data.matchedPairsCount || 0,
      completed: !!data.completed,
      timeTakenSeconds: data.timeTakenSeconds,
    };
    room.students[studentId] = student;
  } else {
    if (typeof data.score === 'number') {
      student.score = data.score;
    }
    if (data.studentName) {
      student.name = data.studentName;
    }
    if (typeof data.matchedPairsCount === 'number') {
      student.matchedPairsCount = data.matchedPairsCount;
    }
    if (data.completed !== undefined) {
      student.completed = data.completed;
      if (data.completed && !student.finishedAt) {
        student.finishedAt = Date.now();
      }
    }
    if (typeof data.timeTakenSeconds === 'number') {
      student.timeTakenSeconds = data.timeTakenSeconds;
    }
  }

  saveRoomsToFile(getMemoryRooms());
  return { room, student };
}

export function endRoomGame(code: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;

  room.status = 'ended';
  room.endedAt = Date.now();
  saveRoomsToFile(getMemoryRooms());
  return room;
}

export function resetRoomGame(code: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;

  room.status = 'waiting';
  room.startedAt = undefined;
  room.endedAt = undefined;
  Object.values(room.students).forEach((s) => {
    s.score = 0;
    s.matchedPairsCount = 0;
    s.completed = false;
    s.timeTakenSeconds = undefined;
    s.finishedAt = undefined;
  });

  saveRoomsToFile(getMemoryRooms());
  return room;
}

export function kickStudent(code: string, studentId: string): boolean {
  const room = getRoom(code);
  if (!room || !room.students[studentId]) return false;

  delete room.students[studentId];
  saveRoomsToFile(getMemoryRooms());
  return true;
}
