export interface Quiz {
  type: 'mcq' | 'fib';
  q: string;
  options?: string[];
  correct: string | number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Video {
  title: string;
  url: string;
  xp: number;
}

export interface Material {
  name: string;
  type: 'pdf' | 'doc' | 'ppt';
  url: string;
  storagePath?: string;
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  theory: string;
  quizzes: Quiz[];
  videos: Video[];
  sort_order?: number;
}

export interface Materials {
  [topicId: string]: Material[];
}

export interface AppUser {
  uid: string;
  email: string;
  role: 'student' | 'admin';
  name: string;
}

export interface StudentProgress {
  xp: number;
  level: number;
  streak: number;
  progress: { [topicId: string]: number };
  topicXP: { [topicId: string]: number };
  watchedVideos: { [videoKey: string]: boolean };
  unlockedTopics: string[];
  examBestScores: { [examId: string]: number };
  unlockedExams: string[];
  name: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  topicId: string;           // topic id or 'all'
  questionCount: number;
  timeLimitMinutes: number;
  passingScore: number;      // percentage 0-100
  sort_order: number;
  created_at?: string;
}

export interface ExamResult {
  id?: string;
  examId: string;
  studentId: string;
  score: number;
  total: number;
  passed: boolean;
  timeTakenSeconds: number;
  xpEarned: number;
  created_at?: string;
}
