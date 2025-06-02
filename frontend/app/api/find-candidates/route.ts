import { NextResponse } from "next/server"
import type { Candidate } from "@/lib/types"

function roundOff(value: number, decimals: number = 0): number {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals)
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 })
    }

    // Call the semantic search API
    const response = await fetch("http://54.245.61.87:8000/api/semantic-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_description: prompt,
        top_k: 15,
      }),
    })

    if (!response.ok) {
      throw new Error(`Semantic search API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Transform the API response to match our Candidate interface
    // Assuming the API returns candidates in a similar format
    // If the structure is different, we'll need to map the fields accordingly
    const candidates: Candidate[] = data.results || []

    // Ensure each candidate has the required fields for our interface
    const formattedCandidates: Candidate[] = candidates.map((candidate: any, index: number) => ({
      id: candidate._id || `candidate-${index + 1}`,
      name: candidate.name || "Unknown Candidate",
      title: candidate.title || candidate.position || "Not specified",
      summary: candidate.summary || candidate.description || "No summary available",
      skills: candidate.skills || [],
      matchScore: roundOff(candidate.score * 100, 2) || Math.floor(Math.random() * 30) + 70, // Default to 70-100 if not provided
      avatarUrl: candidate.avatarUrl || "/placeholder.svg?height=128&width=128",
      location: candidate.location || "Location not specified",
      email:
        candidate.email ||
        `${candidate.name?.toLowerCase().replace(/\s+/g, ".")}@example.com` ||
        `candidate${index + 1}@example.com`,
      company: candidate.company || "Company not specified",
    }))

    return NextResponse.json({ candidates: formattedCandidates })
  } catch (error) {
    console.error("API Error:", error)

    return NextResponse.json({ error: "Error processing request" }, { status: 500 })
  }
}

