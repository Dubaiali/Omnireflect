import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  hashId: string | null
  isAuthenticated: boolean
  progress: {
    currentStep: number
    answers: Record<string, string>
    followUpQuestions: Record<string, string[]>
    summary: string | null
  }
  setHashId: (hashId: string) => void
  login: (hashId: string) => void
  logout: () => void
  saveAnswer: (questionId: string, answer: string) => void
  saveFollowUpQuestions: (questionId: string, questions: string[]) => void
  saveSummary: (summary: string) => void
  nextStep: () => void
  resetProgress: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      hashId: null,
      isAuthenticated: false,
      progress: {
        currentStep: 0,
        answers: {},
        followUpQuestions: {},
        summary: null,
      },

      setHashId: (hashId: string) => set({ hashId }),
      
      login: (hashId: string) => set({ 
        hashId, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        hashId: null, 
        isAuthenticated: false,
        progress: {
          currentStep: 0,
          answers: {},
          followUpQuestions: {},
          summary: null,
        }
      }),

      saveAnswer: (questionId: string, answer: string) => 
        set((state) => ({
          progress: {
            ...state.progress,
            answers: {
              ...state.progress.answers,
              [questionId]: answer
            }
          }
        })),

      saveFollowUpQuestions: (questionId: string, questions: string[]) =>
        set((state) => ({
          progress: {
            ...state.progress,
            followUpQuestions: {
              ...state.progress.followUpQuestions,
              [questionId]: questions
            }
          }
        })),

      saveSummary: (summary: string) =>
        set((state) => ({
          progress: {
            ...state.progress,
            summary
          }
        })),

      nextStep: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            currentStep: state.progress.currentStep + 1
          }
        })),

      resetProgress: () =>
        set((state) => ({
          progress: {
            currentStep: 0,
            answers: {},
            followUpQuestions: {},
            summary: null,
          }
        })),
    }),
    {
      name: 'session-storage',
      partialize: (state) => ({
        hashId: state.hashId,
        isAuthenticated: state.isAuthenticated,
        progress: state.progress,
      }),
    }
  )
) 