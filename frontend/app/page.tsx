"use client"

import { useState, useMemo } from "react"
import { PromptForm } from "@/components/prompt-form"
import { CandidateCard } from "@/components/candidate-card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import type { Candidate } from "@/lib/types"
import {
  UserSearch,
  MessageSquareText,
  CheckCircle,
  XCircle,
  Users,
  Briefcase,
  AlertTriangle,
  UserPlus,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/pagination-controls"
import { BulkOutreachSelect } from "@/components/bulk-outreach-select"
import { EmailOutreachDialog } from "@/components/email-outreach-dialog"
import { useRouter } from "next/navigation"

const CANDIDATES_PER_PAGE = 6

export default function HireAiPage() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(allCandidates.length / CANDIDATES_PER_PAGE)

  const [isOutreachDialogOpen, setIsOutreachDialogOpen] = useState(false)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const router = useRouter()

  const currentCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * CANDIDATES_PER_PAGE
    const endIndex = startIndex + CANDIDATES_PER_PAGE
    return allCandidates.slice(startIndex, endIndex)
  }, [allCandidates, currentPage])

  const selectedCandidateObjects = useMemo(() => {
    return allCandidates.filter((c) => selectedCandidates.has(c.id))
  }, [allCandidates, selectedCandidates])

  const handleSearch = async (prompt: string) => {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setCurrentPage(1)
    setSelectedCandidates(new Set())
    try {
      const response = await fetch("/api/find-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      const data = await response.json()
      setAllCandidates(data.candidates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
      setAllCandidates([])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates((prevSelected) => {
      const newSelected = new Set(prevSelected)
      if (newSelected.has(candidateId)) {
        newSelected.delete(candidateId)
      } else {
        newSelected.add(candidateId)
      }
      return newSelected
    })
  }

  const handleBulkSelect = (count: number) => {
    if (count === 0) {
      setSelectedCandidates(new Set())
      return
    }
    const topNIds = allCandidates.slice(0, count).map((c) => c.id)
    setSelectedCandidates(new Set(topNIds))
    toast({
      title: `Selected Top ${count} Candidates`,
      description: `The top ${count} candidates from your search results have been selected.`,
    })
  }

  const handleOpenOutreachDialog = () => {
    if (selectedCandidates.size === 0) {
      toast({
        variant: "destructive",
        title: "No Candidates Selected",
        description: "Please select candidates to outreach.",
      })
      return
    }
    setIsOutreachDialogOpen(true)
  }

  const handleSendOutreachEmails = async ({
    replyToEmail,
    senderName,
    subject,
    body,
    isPersonalized,
  }: {
    replyToEmail: string
    senderName?: string
    subject: string
    body: string
    isPersonalized: boolean
  }) => {
    setIsSendingEmails(true)

    // Pass complete candidate objects instead of just basic info
    const selectedCandidateDetails = selectedCandidateObjects

    try {
      const response = await fetch("/api/send-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyToEmail,
          senderName,
          subject,
          body,
          candidates: selectedCandidateDetails, // Send full candidate objects
          isPersonalized,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send emails")
      }

      // Show detailed results
      if (result.totalFailed > 0) {
        toast({
          title: "Emails Sent with Some Issues",
          description: `${result.totalSent} emails sent successfully. ${result.totalFailed} failed to send.`,
          action: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        })
      } else {
        toast({
          title: "All Emails Sent Successfully!",
          description: `Successfully sent ${result.totalSent} ${isPersonalized ? "personalized" : ""} emails to candidates.`,
          action: <CheckCircle className="h-5 w-5 text-green-600" />,
        })
      }

      // Log detailed results for debugging
      console.log("Email sending results:", result)
      if (result.failed.length > 0) {
        console.log("Failed emails:", result.failed)
      }

      setIsOutreachDialogOpen(false)

      // Clear selection after successful send
      setSelectedCandidates(new Set())
    } catch (error) {
      console.error("Failed to send emails:", error)
      toast({
        variant: "destructive",
        title: "Failed to Send Emails",
        description: error instanceof Error ? error.message : "An unknown error occurred while sending emails.",
      })
    } finally {
      setIsSendingEmails(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 p-4 md:p-8">
      <header className="mb-6 md:mb-8 text-center">
        <div className="inline-flex items-center bg-sky-100/70 p-2 sm:p-3 rounded-lg mb-2 sm:mb-4">
          <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-sky-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-sky-700">HireAI Platform</h1>
        <p className="mt-1 sm:mt-2 text-md sm:text-lg text-slate-600">Find top talent, faster.</p>

        {/* Candidate Upload Button */}
        <div className="mt-4">
          <Button
            onClick={() => router.push("/candidate-upload")}
            variant="outline"
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 font-semibold"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Join as Candidate
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <PromptForm onSubmit={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="mt-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
            <XCircle className="h-5 w-5 mr-2" /> <p>Error: {error}</p>
          </div>
        )}

        {isLoading && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(CANDIDATES_PER_PAGE)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
                <div className="flex items-center mb-3">
                  <Skeleton className="h-12 w-12 rounded-full bg-slate-200" />
                  <div className="ml-3 space-y-1">
                    <Skeleton className="h-4 w-32 bg-slate-200" />
                    <Skeleton className="h-3 w-24 bg-slate-200" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full bg-slate-200 mb-1" />
                <Skeleton className="h-3 w-5/6 bg-slate-200 mb-3" />
                <div className="flex flex-wrap gap-2 mb-3">
                  <Skeleton className="h-6 w-16 rounded-full bg-slate-200" />
                  <Skeleton className="h-6 w-20 rounded-full bg-slate-200" />
                  <Skeleton className="h-6 w-12 rounded-full bg-slate-200" />
                </div>
                <Skeleton className="h-8 w-full bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && hasSearched && allCandidates.length === 0 && !error && (
          <div className="mt-8 text-center text-slate-500 py-10 bg-slate-50 rounded-lg border border-slate-200">
            <Users className="h-16 w-16 mx-auto mb-4 text-sky-600" />
            <h2 className="text-2xl font-semibold text-slate-700">No Candidates Found</h2>
            <p>Try refining your search prompt for better results.</p>
          </div>
        )}

        {!isLoading && !hasSearched && !error && allCandidates.length === 0 && (
          <div className="mt-8 text-center text-slate-500 py-10 bg-slate-50/50 rounded-lg border border-slate-200">
            <UserSearch className="h-16 w-16 mx-auto mb-4 text-sky-700" />
            <h2 className="text-2xl font-semibold text-slate-700">Ready to Find Talent?</h2>
            <p>Enter your requirements above to discover top candidates.</p>
          </div>
        )}

        {!isLoading && allCandidates.length > 0 && (
          <>
            <div className="mt-8 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-semibold text-slate-700">
                {`Showing ${currentCandidates.length} of ${allCandidates.length} Candidates`}
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <BulkOutreachSelect onSelect={handleBulkSelect} disabled={allCandidates.length === 0} />
                <Button
                  onClick={handleOpenOutreachDialog}
                  disabled={selectedCandidates.size === 0 || isSendingEmails}
                  className="bg-sky-600 hover:bg-sky-700 text-white transition-all duration-150 ease-in-out group w-full sm:w-auto"
                >
                  <MessageSquareText className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  {isSendingEmails
                    ? "Sending..."
                    : `Outreach ${selectedCandidates.size > 0 ? `(${selectedCandidates.size})` : "Selected"}`}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedCandidates.has(candidate.id)}
                  onToggleSelect={toggleCandidateSelection}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </>
        )}
      </main>

      <EmailOutreachDialog
        isOpen={isOutreachDialogOpen}
        onOpenChange={setIsOutreachDialogOpen}
        selectedCount={selectedCandidates.size}
        selectedCandidates={selectedCandidateObjects}
        onSubmit={handleSendOutreachEmails}
        isLoading={isSendingEmails}
      />

      <footer className="text-center mt-12 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} HireAI Platform. All rights reserved.</p>
        <p className="text-xs mt-1">📧 Real email functionality powered by Resend</p>
      </footer>
    </div>
  )
}
