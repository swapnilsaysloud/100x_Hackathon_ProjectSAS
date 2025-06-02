import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface EmailTemplateRequest {
  jobDescription: string
  senderName: string
}

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, senderName }: EmailTemplateRequest = await request.json()

    // Validation
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    if (!jobDescription || !senderName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Create a prompt for generating a professional email template
    const prompt = `
You are an expert recruiter writing professional outreach emails. Generate a high-quality email template for the following job opportunity.

Job Description/Opportunity:
${jobDescription}

Sender: ${senderName}

Requirements:
1. Create a professional, engaging email template
2. Use placeholders like [Candidate Name], [Current Company], [Current Title] that will be replaced for each candidate
3. Make it warm, professional, and personable
4. Highlight the key aspects of the opportunity from the job description
5. Include a clear call-to-action
6. Keep it concise but comprehensive (300-500 words)
7. Format as clean HTML with proper structure and styling
8. Don't use overly salesy language - make it genuine and authentic
9. Include relevant benefits and selling points from the job description
10. Make it feel personal despite being a template

Also suggest an appropriate email subject line that would get good open rates.

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
        error: "Failed to generate email template",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
