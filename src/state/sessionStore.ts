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
        // Erstelle eine normalisierte Version für den Hash
        const normalizedContext = {
          ...roleContext,
          workAreas: [...roleContext.workAreas].sort(),
          functions: [...roleContext.functions].sort()
        }
        const newHash = JSON.stringify(normalizedContext)
        const state = get()
        
        console.log('DEBUG: Speichere Rollenkontext mit Hash:', newHash)
        
        // Speichere auch in localStorage für Admin-Zugriff
        if (state.hashId) {
          LocalStorage.saveRoleContext(state.hashId, roleContext)
        }
        
        set({ 
          roleContext,
          roleContextHash: newHash
        })
      },

      saveQuestions: (questions: any[]) => {
        const state = get()
        console.log('DEBUG: saveQuestions aufgerufen', { 
          newQuestionsLength: questions.length, 
          currentQuestionsLength: state.questions?.length 
        })
        
        // Verhindere Überschreibung, wenn bereits Fragen vorhanden sind (außer bei explizitem Reset)
        if (state.questions && state.questions.length > 0 && questions.length === 0) {
          // Prüfe ob es ein expliziter Reset ist (forceRegenerate Flag)
          const forceRegenerate = typeof window !== 'undefined' && localStorage.getItem('forceRegenerateQuestions') === 'true'
          if (!forceRegenerate) {
            console.log('DEBUG: Verhindere Überschreibung vorhandener Fragen mit leerem Array')
            return
          } else {
            console.log('DEBUG: Force-Regenerate erlaubt - überschreibe Fragen')
          }
        }
        
        set({ questions })
        console.log('DEBUG: Fragen erfolgreich im Store gespeichert')
      },

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
        
        // Erstelle eine normalisierte Version des neuen Rollenkontexts
        const normalizedNewContext = {
          ...newRoleContext,
          workAreas: [...newRoleContext.workAreas].sort(),
          functions: [...newRoleContext.functions].sort()
        }
        
        // Erstelle eine normalisierte Version des aktuellen Rollenkontexts
        const currentContext = state.roleContext
        if (!currentContext) {
          return true // Wenn kein aktueller Kontext vorhanden ist, hat sich etwas geändert
        }
        
        const normalizedCurrentContext = {
          ...currentContext,
          workAreas: [...currentContext.workAreas].sort(),
          functions: [...currentContext.functions].sort()
        }
        
        const newHash = JSON.stringify(normalizedNewContext)
        const currentHash = JSON.stringify(normalizedCurrentContext)
        
        console.log('DEBUG: Rollenkontext-Vergleich:', {
          newHash,
          currentHash,
          changed: newHash !== currentHash
        })
        
        return newHash !== currentHash
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