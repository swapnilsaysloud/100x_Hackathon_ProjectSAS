"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users } from "lucide-react"

interface BulkOutreachSelectProps {
  onSelect: (count: number) => void
  disabled?: boolean
}

const outreachOptions = [
  { value: 0, label: "Clear Selection" },
  { value: 10, label: "Select Top 10" },
  { value: 20, label: "Select Top 20" },
  { value: 50, label: "Select Top 50" },
]

export function BulkOutreachSelect({ onSelect, disabled = false }: BulkOutreachSelectProps) {
  return (
    <div className="flex items-center space-x-2 w-full sm:w-auto">
      <Users className="h-5 w-5 text-sky-600 hidden sm:block" />
      <Select onValueChange={(value) => onSelect(Number.parseInt(value))} disabled={disabled} defaultValue="0">
        <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-300 text-slate-700 focus:ring-sky-500">
          <SelectValue placeholder="Bulk Select..." />
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-200 text-slate-700">
          {outreachOptions.map((option) => (
            <SelectItem key={option.value} value={String(option.value)} className="focus:bg-sky-100 focus:text-sky-700">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
