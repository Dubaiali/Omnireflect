import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalStorage } from '@/lib/storage'

interface RoleContext {
  firstName: string
  lastName: string
  workAreas: string[]
  functions: string[]
  experienceYears: string
  customerContact: string
  dailyTasks: string
}

interface SessionState {
  hashId: string | null
  isAuthenticated: boolean
  progress: {
    currentStep: number
    answers: Record<string, string>
    followUpQuestions: Record<string, string[]>
    summary: string | null
  }
  roleContext: RoleContext | null
  questions: any[] | null
  roleContextHash: string | null // Hash des Rollenkontexts für Änderungsprüfung
  setHashId: (hashId: string) => void
  login: (hashId: string) => void
  logout: () => void
  saveAnswer: (questionId: string, answer: string) => void
  saveFollowUpQuestions: (questionId: string, questions: string[]) => void
  saveSummary: (summary: string) => void
  saveRoleContext: (roleContext: RoleContext) => void
  saveQuestions: (questions: any[]) => void
  nextStep: () => void
  resetProgress: () => void
  hasRoleContextChanged: (newRoleContext: RoleContext) => boolean
  saveToStorage: () => void
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
      roleContext: null,
      questions: null,
      roleContextHash: null,

      setHashId: (hashId: string) => set({ hashId }),
      
      login: (hashId: string) => set((state) => ({ 
        hashId, 
        isAuthenticated: true,
        progress: {
          currentStep: 0,
          answers: {},
          followUpQuestions: {},
          summary: null,
        },
        // Behalte das roleContext bei, falls es bereits gesetzt ist
        roleContext: state.roleContext,
        questions: state.questions
      })),
      
      logout: () => set({ 
        hashId: null, 
        isAuthenticated: false,
        progress: {
          currentStep: 0,
          answers: {},
          followUpQuestions: {},
          summary: null,
        },
        roleContext: null,
        questions: null
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

      saveRoleContext: (roleContext: RoleContext) => {
        // Berechne Hash des neuen Rollenkontexts
        const newHash = JSON.stringify(roleContext)
        const state = get()
        
        // Speichere auch in localStorage für Admin-Zugriff
        if (state.hashId) {
          LocalStorage.saveRoleContext(state.hashId, roleContext)
        }
        
        set({ 
          roleContext,
          roleContextHash: newHash
        })
      },

      saveQuestions: (questions: any[]) =>
        set({ questions }),

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
          },
          // Behalte Authentifizierung und Rollenkontext bei
          hashId: state.hashId,
          isAuthenticated: state.isAuthenticated,
          roleContext: state.roleContext,
          questions: state.questions,
          roleContextHash: state.roleContextHash
        })),

      hasRoleContextChanged: (newRoleContext: RoleContext) => {
        const state = get()
        const newHash = JSON.stringify(newRoleContext)
        return state.roleContextHash !== newHash
      },

      saveToStorage: () => {
        const state = get()
        if (state.hashId) {
          const data = {
            hashId: state.hashId,
            answers: state.progress.answers,
            followUpQuestions: state.progress.followUpQuestions,
            summary: state.progress.summary,
            completedAt: state.progress.summary ? new Date().toISOString() : null,
            lastUpdated: new Date().toISOString(),
            roleContext: state.roleContext || undefined
          }
          LocalStorage.saveData(data)
        }
      },
    }),
    {
      name: 'session-storage',
      partialize: (state) => ({
        hashId: state.hashId,
        isAuthenticated: state.isAuthenticated,
        progress: state.progress,
        roleContext: state.roleContext,
        questions: state.questions,
        roleContextHash: state.roleContextHash,
      }),
    }
  )
) 