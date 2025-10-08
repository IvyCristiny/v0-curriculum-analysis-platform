import { getSupabaseServerClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { resumeId } = await request.json()

    console.log("[v0] Analyzing resume:", resumeId)

    if (!resumeId) {
      return Response.json({ error: "Resume ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    const { data: resume } = await supabase.from("resumes").select("*, job:jobs(*)").eq("id", resumeId).single()

    if (!resume) {
      console.log("[v0] Resume not found:", resumeId)
      return Response.json({ error: "Resume not found" }, { status: 404 })
    }

    if (!resume.job) {
      console.log("[v0] Job not found for resume:", resumeId)
      return Response.json({ error: "Job not found for this resume" }, { status: 404 })
    }

    console.log("[v0] Resume found, fetching criteria...")
    const { data: criteria } = await supabase.from("job_criteria").select("*").eq("job_id", resume.job_id)

    console.log("[v0] Updating status to processing...")
    await supabase.from("resumes").update({ status: "processing" }).eq("id", resumeId)

    console.log("[v0] Starting AI extraction...")
    const extractionPrompt = `
You are an expert HR assistant analyzing a resume. Extract the following information from the resume and return it as JSON:

{
  "name": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number",
  "education": "Educational background summary",
  "experience": "Work experience summary",
  "skills": "Technical and professional skills",
  "languages": "Languages spoken",
  "summary": "Brief professional summary"
}

Resume file: ${resume.file_url}
Job title: ${resume.job.title}
Job description: ${resume.job.description}

Extract the data accurately. If information is not available, use null.
`

    const { text: extractedDataText } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt: extractionPrompt,
    })

    console.log("[v0] Extraction complete, parsing data...")
    let extractedData
    try {
      extractedData = JSON.parse(extractedDataText)
    } catch {
      extractedData = {
        name: null,
        email: null,
        phone: null,
        education: null,
        experience: null,
        skills: null,
        languages: null,
        summary: extractedDataText,
      }
    }

    console.log("[v0] Creating candidate record...")
    const { data: candidate } = await supabase
      .from("candidates")
      .insert({
        resume_id: resumeId,
        name: extractedData.name,
        email: extractedData.email,
        phone: extractedData.phone,
        education: extractedData.education,
        experience: extractedData.experience,
        skills: extractedData.skills,
        languages: extractedData.languages,
        summary: extractedData.summary,
        extracted_data: extractedData,
        is_validated: false,
      })
      .select()
      .single()

    const criteriaText = criteria
      ?.map((c) => `- ${c.criterion_name} (weight: ${c.weight}/5): ${c.description}`)
      .join("\n")

    console.log("[v0] Starting AI analysis...")
    const analysisPrompt = `
You are an expert HR analyst. Analyze this candidate against the job requirements and criteria.

JOB INFORMATION:
Title: ${resume.job.title}
Description: ${resume.job.description}
Requirements: ${resume.job.requirements}

EVALUATION CRITERIA:
${criteriaText}

CANDIDATE DATA:
Name: ${extractedData.name || "Not provided"}
Education: ${extractedData.education || "Not provided"}
Experience: ${extractedData.experience || "Not provided"}
Skills: ${extractedData.skills || "Not provided"}
Languages: ${extractedData.languages || "Not provided"}
Summary: ${extractedData.summary || "Not provided"}

Provide a detailed analysis in JSON format:
{
  "overall_score": <number 0-100>,
  "criteria_scores": {
    ${criteria?.map((c) => `"${c.criterion_name}": <number 0-100>`).join(",\n    ")}
  },
  "strengths": "List of candidate's strengths",
  "weaknesses": "List of areas for improvement",
  "observations": "Detailed observations about the candidate",
  "recommendation": "hire" | "interview" | "reject",
  "reasoning": "Explanation of the recommendation"
}

Be objective and thorough in your analysis.
`

    const { text: analysisText } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt: analysisPrompt,
    })

    console.log("[v0] Analysis complete, parsing results...")
    let analysisData
    try {
      analysisData = JSON.parse(analysisText)
    } catch {
      analysisData = {
        overall_score: 50,
        criteria_scores: {},
        strengths: "Unable to parse analysis",
        weaknesses: "Unable to parse analysis",
        observations: analysisText,
        recommendation: "interview",
        reasoning: "Analysis needs manual review",
      }
    }

    console.log("[v0] Saving analysis to database...")
    const { data: analysis } = await supabase
      .from("analyses")
      .insert({
        resume_id: resumeId,
        job_id: resume.job_id,
        overall_score: analysisData.overall_score,
        criteria_scores: analysisData.criteria_scores,
        observations: analysisData.observations,
        strengths: analysisData.strengths,
        weaknesses: analysisData.weaknesses,
        recommendation: analysisData.recommendation,
        is_priority: analysisData.overall_score >= 80,
      })
      .select()
      .single()

    console.log("[v0] Updating status to completed...")
    await supabase.from("resumes").update({ status: "completed" }).eq("id", resumeId)

    console.log("[v0] Analysis complete successfully!")
    return Response.json({
      success: true,
      candidate,
      analysis,
    })
  } catch (error: any) {
    console.error("[v0] Analysis error:", error)

    try {
      const { resumeId } = await request.json()
      const supabase = await getSupabaseServerClient()
      await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId)
    } catch {}

    return Response.json({ error: error.message || "Failed to analyze resume" }, { status: 500 })
  }
}
