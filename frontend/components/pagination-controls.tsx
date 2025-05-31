"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    const halfMax = Math.floor(maxPagesToShow / 2)

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      pageNumbers.push(1)
      if (currentPage > 2 + halfMax - 1 && totalPages > maxPagesToShow) {
        pageNumbers.push("...")
      }

      let startPage = Math.max(2, currentPage - halfMax + 1)
      let endPage = Math.min(totalPages - 1, currentPage + halfMax - 1)

      if (currentPage <= halfMax) {
        startPage = 2
        endPage = maxPagesToShow - 1
      } else if (currentPage >= totalPages - halfMax) {
        startPage = totalPages - maxPagesToShow + 2
        endPage = totalPages - 1
      }

      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) pageNumbers.push(i)
      }

      if (currentPage < totalPages - 1 - halfMax + 1 && totalPages > maxPagesToShow) {
        pageNumbers.push("...")
      }
      pageNumbers.push(totalPages)
    }
    // Deduplicate and ensure correct order
    const uniquePageNumbers = []
    let lastPushed = null
    for (const p of pageNumbers) {
      if (p === "..." && lastPushed === "...") continue
      if (typeof p === "number" && typeof lastPushed === "number" && p <= lastPushed) continue
      uniquePageNumbers.push(p)
      lastPushed = p
    }
    return uniquePageNumbers
  }

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="bg-white hover:bg-slate-100 border-slate-300 text-slate-600"
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {getPageNumbers().map((page, index) =>
        typeof page === "number" ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page)}
            className={
              currentPage === page
                ? "bg-sky-600 hover:bg-sky-700 text-white"
                : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600"
            }
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="px-2 py-1 text-slate-500">
            {page}
          </span>
        ),
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="bg-white hover:bg-slate-100 border-slate-300 text-slate-600"
        aria-label="Go to next page"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
