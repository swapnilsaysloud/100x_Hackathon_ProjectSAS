"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PaperPlaneIcon } from "@radix-ui/react-icons"
import { Loader2 } from "lucide-react"

interface PromptFormProps {
  onSubmit: (prompt: string) => void
  isLoading: boolean
}

export function PromptForm({ onSubmit, isLoading }: PromptFormProps) {
  const [prompt, setPrompt] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return
    onSubmit(prompt)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-6 rounded-xl shadow-lg border border-slate-200">
      <Textarea
        placeholder="e.g., 'Senior React Developer with 5+ years experience in FinTech, strong in TypeScript and GraphQL...'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className="bg-white border-slate-300 text-slate-700 placeholder-slate-400 focus:ring-sky-500 focus:border-sky-500 text-base"
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 text-base transition-all duration-150 ease-in-out group"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <PaperPlaneIcon className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            Find Candidates
          </>
        )}
      </Button>
    </form>
  )
}
