import { create } from 'zustand';
import type { Question } from '@/lib/gpt';

interface QuestionsState {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  reset: () => void;
}

export const useQuestionsStore = create<QuestionsState>((set) => ({
  questions: [],
  setQuestions: (questions) => set({ questions }),
  reset: () => set({ questions: [] }),
})); 