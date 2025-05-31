// No changes needed in lib/types.ts
export interface Candidate {
  id: string
  name: string
  title: string
  summary: string
  skills: string[]
  matchScore: number // Percentage from 0 to 100
  avatarUrl?: string
  location?: string
}
