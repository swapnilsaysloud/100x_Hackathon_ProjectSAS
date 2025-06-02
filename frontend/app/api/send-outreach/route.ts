import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import type { Candidate } from "@/lib/types"

const resend = new Resend(process.env.RESEND_API_KEY)

interface OutreachRequest {
  replyToEmail: string
  senderName?: string
  subject: string
  body: string
  candidates: Candidate[] // Now expects full candidate objects
  isPersonalized?: boolean
}

// Enhanced HTML email template
function createEmailTemplate(personalizedBody: string, senderName: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Opportunity</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 30px 20px; text-align: center;">
          <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-flex; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Opportunity</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">From ${senderName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          ${personalizedBody}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
            This email was sent via <strong style="color: #0ea5e9;">HireAI Platform</strong>
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            Reply directly to this email to contact the recruiter
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const { replyToEmail, senderName, subject, body, candidates, isPersonalized }: OutreachRequest =
      await request.json()

    // Validation
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    if (!replyToEmail || !subject || !body || !candidates?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(replyToEmail)) {
      return NextResponse.json({ error: "Invalid reply-to email format" }, { status: 400 })
    }

    // Rate limiting (simple implementation)
    if (candidates.length > 50) {
      return NextResponse.json({ error: "Cannot send to more than 50 candidates at once" }, { status: 400 })
    }

    const displayName = senderName || replyToEmail.split("@")[0]

    // Send emails to all candidates
    const emailPromises = candidates.map(async (candidate) => {
      // Validate candidate email
      if (!emailRegex.test(candidate.email)) {
        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          success: false,
          error: "Invalid email format",
        }
      }

      let personalizedBody = body

      // If personalized, replace placeholders with candidate data (already available!)
      if (isPersonalized) {
        personalizedBody = body
          .replace(/\[Candidate Name\]/g, candidate.name)
          .replace(/\[Current Company\]/g, candidate.company)
          .replace(/\[Current Title\]/g, candidate.title)
          .replace(/\[Your Name\]/g, displayName)
      } else {
        // For non-personalized emails, just replace basic placeholders
        personalizedBody = body.replace(/\[Candidate Name\]/g, candidate.name).replace(/\[Your Name\]/g, displayName)
      }

      try {
        const emailResult = await resend.emails.send({
          from: `${displayName} <noreply@resend.dev>`,
          to: [candidate.email],
          subject: subject,
          html: isPersonalized ? personalizedBody : createEmailTemplate(personalizedBody, displayName),
          text: personalizedBody.replace(/<[^>]*>/g, ""), // Strip HTML for plain text
          replyTo: replyToEmail,
        })

        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          success: true,
          emailId: emailResult.data?.id,
          personalized: isPersonalized,
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${candidate.email}:`, emailError)
        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          success: false,
          error: emailError instanceof Error ? emailError.message : "Unknown error",
        }
      }
    })

    const results = await Promise.all(emailPromises)
    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    return NextResponse.json({
      message: `Sent ${successful.length} ${isPersonalized ? "personalized " : ""}emails successfully${
        failed.length > 0 ? `, ${failed.length} failed` : ""
      }`,
      successful,
      failed,
      totalSent: successful.length,
      totalFailed: failed.length,
      personalized: isPersonalized,
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      {
        error: "Failed to send emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
