"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, X } from "lucide-react"

interface EmailOutreachDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selectedCount: number
  onSubmit: (details: { senderEmail: string; subject: string; body: string }) => void
}

const defaultEmailBodyTemplate = `Dear Candidate,

Hope you're doing well.

I came across your profile and was very impressed with your skills and experience. We have an exciting opportunity that I believe aligns well with your background.

We are looking for talented individuals like yourself to join our innovative team.

Would you be open to a brief chat sometime next week to discuss this further?

Best regards,

[Your Name/Company Name]`

export function EmailOutreachDialog({ isOpen, onOpenChange, selectedCount, onSubmit }: EmailOutreachDialogProps) {
  const [senderEmail, setSenderEmail] = useState("")
  const [subject, setSubject] = useState("Exciting Opportunity")
  const [body, setBody] = useState(defaultEmailBodyTemplate)
  const [errors, setErrors] = useState<{ senderEmail?: string; subject?: string; body?: string }>({})

  useEffect(() => {
    if (isOpen) {
      setSenderEmail("")
      setSubject("Exciting Opportunity")
      setBody(defaultEmailBodyTemplate)
      setErrors({})
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: { senderEmail?: string; subject?: string; body?: string } = {}
    if (!senderEmail.trim()) {
      newErrors.senderEmail = "Sender email is required."
    } else if (!/\S+@\S+\.\S+/.test(senderEmail)) {
      newErrors.senderEmail = "Invalid email format."
    }
    if (!subject.trim()) {
      newErrors.subject = "Subject is required."
    }
    if (!body.trim()) {
      newErrors.body = "Email body cannot be empty."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({ senderEmail, subject, body })
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border-slate-200 text-slate-800">
        <DialogHeader>
          <DialogTitle className="text-sky-700 text-2xl">Compose Outreach Email</DialogTitle>
          <DialogDescription className="text-slate-500">
            You are about to send an email to {selectedCount} selected candidate(s).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="senderEmail" className="text-right text-slate-600 col-span-1">
                Your Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="senderEmail"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="bg-white border-slate-300 focus:ring-sky-500 focus:border-sky-500"
                />
                {errors.senderEmail && <p className="text-red-600 text-xs mt-1">{errors.senderEmail}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right text-slate-600 col-span-1">
                Subject
              </Label>
              <div className="col-span-3">
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-white border-slate-300 focus:ring-sky-500 focus:border-sky-500"
                />
                {errors.subject && <p className="text-red-600 text-xs mt-1">{errors.subject}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="body" className="text-right text-slate-600 col-span-1 pt-2">
                Body
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="bg-white border-slate-300 focus:ring-sky-500 focus:border-sky-500 min-h-[200px]"
                />
                {errors.body && <p className="text-red-600 text-xs mt-1">{errors.body}</p>}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white" disabled={selectedCount === 0}>
              <Send className="mr-2 h-4 w-4" /> Send to {selectedCount} Candidate(s)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
