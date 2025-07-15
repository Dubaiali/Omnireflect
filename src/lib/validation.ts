import { z } from 'zod'

// Role Context Schema
export const roleContextSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  workAreas: z.array(z.string().min(1).max(100)).min(1).max(10),
  functions: z.array(z.string().min(1).max(100)).min(1).max(10),
  experienceYears: z.string().min(1).max(50),
  customerContact: z.string().min(1).max(100),
  dailyTasks: z.string().max(500).optional(),
})

// Login Schema
export const loginSchema = z.object({
  hashId: z.string().min(3).max(50).regex(/^[a-zA-Z0-9]+$/),
  password: z.string().min(6).max(100),
})

// Question Schema
export const questionSchema = z.object({
  id: z.string().min(1).max(50),
  question: z.string().min(10).max(500),
  category: z.string().min(1).max(100),
})

// Answer Schema
export const answerSchema = z.object({
  questionId: z.string().min(1).max(50),
  answer: z.string().min(1).max(2000),
})

// Follow-up Schema
export const followUpSchema = z.object({
  question: z.string().min(10).max(500),
  answer: z.string().min(1).max(2000),
  roleContext: roleContextSchema.optional(),
})

// Summary Schema
export const summarySchema = z.object({
  answers: z.record(z.string().min(1).max(50), z.string().min(1).max(2000)),
  followUpQuestions: z.record(z.string().min(1).max(50), z.array(z.string().min(1).max(200))).optional(),
  roleContext: roleContextSchema.optional(),
})

// Admin Login Schema
export const adminLoginSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(100),
})

// Sanitize HTML Input
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Entferne < und >
    .replace(/javascript:/gi, '') // Entferne javascript: URLs
    .replace(/on\w+=/gi, '') // Entferne Event-Handler
    .trim()
}

// Validate and sanitize input
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const validated = schema.parse(data)
  
  // Sanitize string fields
  if (typeof validated === 'object' && validated !== null) {
    const sanitized = { ...validated } as Record<string, any>
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value)
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeInput(item) : item
        )
      }
    }
    return sanitized as T
  }
  
  return validated
} 