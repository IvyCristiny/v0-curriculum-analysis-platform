import { getSupabaseServerClient } from "@/lib/supabase/server"

const RATE_LIMIT = {
  requestsPerMinute: 30, // Groq free tier limit
  delayBetweenRequests: 2000, // 2 seconds between requests
}

export async function POST(request: Request) {
  try {
    const { jobId, resumeIds } = await request.json()

    if (!jobId && !resumeIds) {
      return Response.json({ error: "Job ID or Resume IDs required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    let resumes
    if (resumeIds && resumeIds.length > 0) {
      const { data } = await supabase.from("resumes").select("id").in("id", resumeIds).eq("status", "pending")
      resumes = data
    } else {
      const { data } = await supabase.from("resumes").select("id").eq("job_id", jobId).eq("status", "pending")
      resumes = data
    }

    if (!resumes || resumes.length === 0) {
      return Response.json({ message: "No pending resumes to analyze" }, { status: 200 })
    }

    console.log(`[v0] Starting batch analysis of ${resumes.length} resumes with rate limiting`)

    const results = []
    const totalResumes = resumes.length
    const estimatedTime = Math.ceil((totalResumes * RATE_LIMIT.delayBetweenRequests) / 1000 / 60)

    console.log(`[v0] Estimated completion time: ${estimatedTime} minutes`)

    for (let i = 0; i < resumes.length; i++) {
      const resume = resumes[i]

      try {
        console.log(`[v0] Analyzing resume ${i + 1}/${totalResumes} (ID: ${resume.id})`)

        const response = await fetch(`${request.url.replace("/batch-analyze", "/analyze-resume")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: resume.id }),
        })

        const result = await response.json()
        results.push({
          resumeId: resume.id,
          success: response.ok,
          result,
          processedAt: new Date().toISOString(),
        })

        console.log(`[v0] Resume ${i + 1}/${totalResumes} completed: ${response.ok ? "success" : "failed"}`)

        if (i < resumes.length - 1) {
          console.log(`[v0] Waiting ${RATE_LIMIT.delayBetweenRequests}ms before next request...`)
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests))
        }
      } catch (error: any) {
        console.error(`[v0] Error analyzing resume ${resume.id}:`, error)
        results.push({
          resumeId: resume.id,
          success: false,
          error: error.message,
          processedAt: new Date().toISOString(),
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failedCount = results.filter((r) => !r.success).length

    console.log(`[v0] Batch analysis complete: ${successCount} succeeded, ${failedCount} failed`)

    return Response.json({
      success: true,
      total: totalResumes,
      succeeded: successCount,
      failed: failedCount,
      results,
      estimatedTime: `${estimatedTime} minutes`,
    })
  } catch (error: any) {
    console.error("[v0] Batch analysis error:", error)
    return Response.json({ error: error.message || "Failed to batch analyze resumes" }, { status: 500 })
  }
}
