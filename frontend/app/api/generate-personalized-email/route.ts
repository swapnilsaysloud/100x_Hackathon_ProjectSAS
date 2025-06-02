import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface PersonalizedEmailRequest {
  candidates: Array<{
    name: string
    title: string
    company: string
    skills: string[]
    location?: string
    summary: string
  }>
  jobDescription: string
  senderName: string
}

export async function POST(request: NextRequest) {
  try {
    const { candidates, jobDescription, senderName }: PersonalizedEmailRequest = await request.json()

    // Validation
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    if (!candidates?.length || !jobDescription || !senderName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Create a comprehensive prompt for generating personalized emails
    const prompt = `
You are an expert recruiter writing personalized outreach emails. Generate a professional, engaging email template that can be personalized for multiple candidates.

Job Description:
${jobDescription}

Sender: ${senderName}

Selected Candidates:
${candidates
  .map(
    (c, i) => `
${i + 1}. ${c.name}
   - Current Role: ${c.title} at ${c.company}
   - Location: ${c.location || "Not specified"}
   - Key Skills: ${c.skills.join(", ")}
   - Summary: ${c.summary}
`,
  )
  .join("\n")}

Requirements:
1. Create ONE email template that works for all candidates
2. Use placeholders like [Candidate Name], [Current Company], [Current Title] that will be replaced for each candidate
3. Make it professional but warm and engaging
4. Highlight how their skills align with the opportunity
5. Include a clear call-to-action
6. Keep it concise (300-500 words)
7. Format as HTML with proper structure
8. Don't use overly salesy language
9. Make it feel personal and genuine

Also suggest an appropriate email subject line.

Return the response in this exact JSON format:
{
  "subject": "Your suggested subject line",
  "emailTemplate": "Your HTML email template with placeholders"
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Try to parse the JSON response
    let parsedResponse
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text)
      return NextResponse.json(
        {
          error: "Failed to parse AI response. Please try again.",
        },
        { status: 500 },
      )
    }

    // Validate the response structure
    if (!parsedResponse.subject || !parsedResponse.emailTemplate) {
      return NextResponse.json(
        {
          error: "Invalid AI response format. Please try again.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      subject: parsedResponse.subject,
      emailTemplate: parsedResponse.emailTemplate,
    })
  } catch (error) {
    console.error("Gemini API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate personalized email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
