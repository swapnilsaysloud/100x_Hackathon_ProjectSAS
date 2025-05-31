import type { Candidate } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Briefcase, MapPin, Check } from "lucide-react"

interface CandidateCardProps {
  candidate: Candidate
  isSelected: boolean
  onToggleSelect: (id: string) => void
}

export function CandidateCard({ candidate, isSelected, onToggleSelect }: CandidateCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card className="bg-white border-slate-200 text-slate-700 shadow-md hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 h-10 w-10 bg-sky-500/90 flex items-center justify-center rounded-bl-lg transition-all duration-300 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
      >
        <Check className="h-5 w-5 text-white" />
      </div>
      <CardHeader className="flex flex-row items-start space-x-4 p-4">
        <Avatar className="h-16 w-16 border-2 border-sky-500">
          <AvatarImage
            src={
              candidate.avatarUrl ||
              `https://avatar.vercel.sh/${candidate.name.split(" ").join("") || "placeholder"}.png?text=${getInitials(candidate.name)}`
            }
            alt={candidate.name}
          />
          <AvatarFallback className="bg-slate-200 text-sky-600">{getInitials(candidate.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl font-semibold text-sky-700">{candidate.name}</CardTitle>
          <CardDescription className="text-sm text-slate-500 flex items-center">
            <Briefcase className="h-4 w-4 mr-1.5 text-slate-400" /> {candidate.title}
          </CardDescription>
          {candidate.location && (
            <CardDescription className="text-sm text-slate-500 flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1.5 text-slate-400" /> {candidate.location}
            </CardDescription>
          )}
        </div>
        <Checkbox
          id={`select-${candidate.id}`}
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(candidate.id)} // This triggers the state update in parent
          className="border-slate-400 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white data-[state=checked]:border-sky-600 focus:ring-sky-500"
          aria-label={`Select ${candidate.name}`}
        />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-slate-600 mb-3 leading-relaxed line-clamp-3">{candidate.summary}</p>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-sky-600">Match Score</span>
            <span className="text-xs font-bold text-sky-700">{candidate.matchScore}%</span>
          </div>
          <Progress
            value={candidate.matchScore}
            className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-sky-500 [&>div]:to-cyan-400 bg-slate-200"
          />
        </div>

        <div className="mb-1">
          <h4 className="text-sm font-semibold text-slate-500 mb-1.5">Top Skills:</h4>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 4).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
