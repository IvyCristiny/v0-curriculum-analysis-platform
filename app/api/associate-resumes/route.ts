import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { resumeIds, jobId } = await request.json()

    if (!resumeIds || !Array.isArray(resumeIds) || resumeIds.length === 0) {
      return Response.json({ error: "Resume IDs array is required" }, { status: 400 })
    }

    if (!jobId) {
      return Response.json({ error: "Job ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Verify job exists
    const { data: job, error: jobError } = await supabase.from("jobs").select("id, title").eq("id", jobId).single()

    if (jobError || !job) {
      return Response.json({ error: "Job not found" }, { status: 404 })
    }

    // Update resumes to associate with new job
    const { data: updatedResumes, error: updateError } = await supabase
      .from("resumes")
      .update({ job_id: jobId, status: "pending" })
      .in("id", resumeIds)
      .select()

    if (updateError) {
      console.error("[v0] Error associating resumes:", updateError)
      return Response.json({ error: "Failed to associate resumes" }, { status: 500 })
    }

    console.log(`[v0] Successfully associated ${updatedResumes?.length} resumes to job ${job.title}`)

    return Response.json({
      success: true,
      count: updatedResumes?.length || 0,
      job: job.title,
      resumes: updatedResumes,
    })
  } catch (error: any) {
    console.error("[v0] Associate resumes error:", error)
    return Response.json({ error: error.message || "Failed to associate resumes" }, { status: 500 })
  }
}
