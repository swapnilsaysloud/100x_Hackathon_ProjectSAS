"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowLeft, FileText, User, Loader2 } from "lucide-react"

const uploadResume = async (formData: FormData) => {
  try {
    const response = await fetch("https://a96c-2405-201-5c0d-19cb-6017-9627-c753-d3e0.ngrok-free.app//extract_resume", {
      method: "POST",
      body: formData,
    })
    return await response.json()
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export default function CandidateUploadPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null as File | null,
  })
  const [loading, setLoading] = useState(false)
  const [responseMessage, setResponseMessage] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.resume) {
      alert("Please upload your resume.")
      return
    }

    setLoading(true)
    setResponseMessage("")

    const data = new FormData()
    data.append("name", formData.name)
    data.append("email", formData.email)
    data.append("phone", formData.phone)
    data.append("resume_pdf", formData.resume)

    try {
      const response = await uploadResume(data)
      setResponseMessage("Resume uploaded successfully!")
      console.log("Response:", response)
    } catch (error) {
      setResponseMessage("Error uploading resume. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="mb-6 bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Platform
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-green-100/70 p-3 rounded-lg mb-4">
            <User className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-sky-700 mb-2">Join Our Talent Pool</h1>
          <p className="text-lg text-slate-600">Upload your details and get discovered by top recruiters</p>
        </div>

        {/* Form Card */}
        <Card className="bg-white shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-sky-700 mb-2 uppercase tracking-wide flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              Job Application Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="block text-sm font-semibold text-slate-600">Full Name *</Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all bg-slate-50"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="block text-sm font-semibold text-slate-600">Email Address *</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all bg-slate-50"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="block text-sm font-semibold text-slate-600">Phone Number *</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all bg-slate-50"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="block text-sm font-semibold text-slate-600">Resume (PDF) *</Label>
                <div className="relative">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="w-full h-12 rounded-lg border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all bg-slate-50 
                    file:absolute file:left-1/2 file:top-1/2 file:-translate-x-1/2 file:-translate-y-1/2 
                    file:h-8 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold 
                    file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 file:cursor-pointer
                    text-center text-transparent cursor-pointer"
                    required
                  />
                </div>
                {formData.resume && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-center">{formData.resume.name}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all transform hover:-translate-y-0.5 ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-sky-600 to-green-600 hover:from-sky-700 hover:to-green-700 shadow-md hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>

              {responseMessage && (
                <div
                  className={`text-center font-semibold p-3 rounded-lg ${
                    responseMessage.includes("Error")
                      ? "text-red-700 bg-red-50 border border-red-200"
                      : "text-green-700 bg-green-50 border border-green-200"
                  }`}
                >
                  {responseMessage}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
