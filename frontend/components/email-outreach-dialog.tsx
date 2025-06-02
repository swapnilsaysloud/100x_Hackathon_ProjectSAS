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
import { Switch } from "@/components/ui/switch"
import { Send, X, Loader2, Info, Sparkles, Wand2, Edit3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Candidate } from "@/lib/types"

interface EmailOutreachDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selectedCount: number
  selectedCandidates: Candidate[]
  onSubmit: (details: {
    replyToEmail: string
    senderName?: string
    subject: string
    body: string
    isPersonalized: boolean
  }) => void
  isLoading?: boolean
}

const defaultEmailBodyTemplate = `Dear [Candidate Name],

Hope you're doing well.

I came across your profile and was very impressed with your skills and experience. We have an exciting opportunity that I believe aligns well with your background.

We are looking for talented individuals like yourself to join our innovative team. The role offers:

• Competitive compensation package
• Flexible working arrangements
• Opportunity to work with cutting-edge technologies
• Strong career growth potential

Would you be open to a brief chat sometime next week to discuss this further?

Best regards,

[Your Name]`

export function EmailOutreachDialog({
  isOpen,
  onOpenChange,
  selectedCount,
  selectedCandidates,
  onSubmit,
  isLoading = false,
}: EmailOutreachDialogProps) {
  const [replyToEmail, setReplyToEmail] = useState("")
  const [senderName, setSenderName] = useState("")
  const [subject, setSubject] = useState("Exciting Career Opportunity")
  const [body, setBody] = useState(defaultEmailBodyTemplate)
  const [isPersonalized, setIsPersonalized] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [jobDescription, setJobDescription] = useState("")
  const [errors, setErrors] = useState<{
    replyToEmail?: string
    subject?: string
    body?: string
    jobDescription?: string
  }>({})

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setReplyToEmail("")
      setSenderName("")
      setSubject("Exciting Career Opportunity")
      setBody(defaultEmailBodyTemplate)
      setIsPersonalized(false)
      setHasGenerated(false)
      setJobDescription("")
      setErrors({})
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: {
      replyToEmail?: string
      subject?: string
      body?: string
      jobDescription?: string
    } = {}

    if (!replyToEmail.trim()) {
      newErrors.replyToEmail = "Reply-to email is required."
    } else if (!/\S+@\S+\.\S+/.test(replyToEmail)) {
      newErrors.replyToEmail = "Invalid email format."
    }

    if (!subject.trim()) {
      newErrors.subject = "Subject is required."
    } else if (subject.length > 100) {
      newErrors.subject = "Subject should be less than 100 characters."
    }

    if (!body.trim()) {
      newErrors.body = "Email body cannot be empty."
    } else if (body.length < 50) {
      newErrors.body = "Email body should be at least 50 characters."
    }

    if (isPersonalized && !hasGenerated && !jobDescription.trim()) {
      newErrors.jobDescription = "Job description is required for AI email generation."
    } else if (isPersonalized && !hasGenerated && jobDescription.length < 50) {
      newErrors.jobDescription = "Job description should be at least 50 characters."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateEmailTemplate = async () => {
    if (!jobDescription.trim()) {
      setErrors({ jobDescription: "Job description is required for AI email generation." })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-email-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          senderName: senderName || replyToEmail.split("@")[0],
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate email template")
      }

      setBody(result.emailTemplate)
      setSubject(result.subject || subject)
      setHasGenerated(true)
      setErrors({}) // Clear any previous errors
    } catch (error) {
      console.error("Failed to generate email template:", error)
      setErrors({
        jobDescription: error instanceof Error ? error.message : "Failed to generate email template",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePersonalizedToggle = (checked: boolean) => {
    setIsPersonalized(checked)
    if (!checked) {
      // Reset to default template when turning off AI
      setBody(defaultEmailBodyTemplate)
      setSubject("Exciting Career Opportunity")
      setHasGenerated(false)
      setJobDescription("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm() && !isLoading) {
      onSubmit({
        replyToEmail,
        senderName: senderName.trim() || undefined,
        subject,
        body,
        isPersonalized,
      })
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-white border-slate-200 text-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sky-700 text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Compose Outreach Email
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            You are about to send emails to {selectedCount} selected candidate(s).
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>How this works:</strong> Emails will be sent from HireAI Platform, but candidates will reply
            directly to your email address.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="replyToEmail" className="text-right text-slate-600 col-span-1">
                Your Email *
              </Label>
              <div className="col-span-3">
                <Input
                  id="replyToEmail"
                  type="email"
                  value={replyToEmail}
                  onChange={(e) => setReplyToEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  className="bg-white border-slate-300 focus:ring-sky-500 focus:border-sky-500"
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 mt-1">Candidate replies will be sent to this address</p>
                {errors.replyToEmail && <p className="text-red-600 text-xs mt-1">{errors.replyToEmail}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="senderName" className="text-right text-slate-600 col-span-1">
                Your Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="senderName"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="John Doe (optional - will use email if empty)"
                  className="bg-white border-slate-300 focus:ring-sky-500 focus:border-sky-500"
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 mt-1">This will appear as the sender name in the email</p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="personalized" className="text-right text-slate-600 col-span-1">
                AI Email Template
              </Label>
              <div className="col-span-3 flex items-center space-x-3">
                <Switch
                  id="personalized"
                  checked={isPersonalized}
                  onCheckedChange={handlePersonalizedToggle}
                  disabled={isLoading}
                />
                <Label htmlFor="personalized" className="text-sm text-slate-600 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Generate email template using AI
                </Label>
              </div>
            </div>

            {isPersonalized && !hasGenerated && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="jobDescription" className="text-right text-slate-600 col-span-1 pt-2">
                  Job Description *
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the role, requirements, company culture, benefits, etc. AI will use this to generate a professional email template."
                    className="bg-white border-slate-300 focus:ring-sky-500 focus:border-sky-500"
                    disabled={isLoading || isGenerating}
                  />
                  <div className="flex justify-between items-center mt-2">
                    {errors.jobDescription && <p className="text-red-600 text-xs">{errors.jobDescription}</p>}
                    <Button
                      type="button"
                      onClick={generateEmailTemplate}
                      disabled={isGenerating || !jobDescription.trim() || isLoading}
                      className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      size="sm"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Email Template with AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isPersonalized && hasGenerated && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1"></div>
                <div className="col-span-3">
                  <Alert className="bg-green-50 border-green-200">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm flex items-center justify-between">
                      <span>
                        <strong>Template generated successfully!</strong> You can now edit the content below.
                      </span>
                      <Button
                        type="button"
                        onClick={() => {
                          setHasGenerated(false)
                          setBody(defaultEmailBodyTemplate)
                          setSubject("Exciting Career Opportunity")
                        }}
                        variant="outline"
                        size="sm"
                        className="ml-2 border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <Wand2 className="mr-1 h-3 w-3" />
                        Regenerate
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right text-slate-600 col-span-1">
                Subject *
              </Label>
              <div className="col-span-3">
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-white border-slate-300 focus:ring-sky-500 focus:border-sky-500"
                  disabled={isLoading}
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.subject && <p className="text-red-600 text-xs">{errors.subject}</p>}
                  <p className="text-xs text-slate-500 ml-auto">{subject.length}/100</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="body" className="text-right text-slate-600 col-span-1 pt-2">
                Email Body *
              </Label>
              <div className="col-span-3">
                <div className="relative">
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    className="bg-white border-slate-300 focus:ring-sky-500 focus:border-sky-500 min-h-[250px]"
                    disabled={isLoading || (isPersonalized && !hasGenerated)}
                    placeholder={
                      isPersonalized && !hasGenerated ? "Generate AI template first..." : "Enter your email content..."
                    }
                  />
                  {hasGenerated && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                        <Edit3 className="h-3 w-3" />
                        AI Generated - Editable
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  {errors.body && <p className="text-red-600 text-xs">{errors.body}</p>}
                  <p className="text-xs text-slate-500 ml-auto">{body.length} characters</p>
                </div>
                {isPersonalized && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Template will be personalized with candidate names and details when sent
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white"
              disabled={selectedCount === 0 || isLoading || isGenerating || (isPersonalized && !hasGenerated)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Emails...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedCount} Candidate{selectedCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
