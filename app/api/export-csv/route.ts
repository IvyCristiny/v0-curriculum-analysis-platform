import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return Response.json({ error: "Job ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    const { data: analyses } = await supabase
      .from("analyses")
      .select(
        `
        *,
        candidate:candidates(name, email, phone, education, experience, skills, languages),
        resume:resumes(file_name)
      `,
      )
      .eq("job_id", jobId)
      .order("overall_score", { ascending: false })

    if (!analyses || analyses.length === 0) {
      return Response.json({ error: "No data to export" }, { status: 404 })
    }

    const headers = [
      "Posição",
      "Nome",
      "Email",
      "Telefone",
      "Score Geral",
      "Recomendação",
      "Prioridade",
      "Formação",
      "Experiência",
      "Habilidades",
      "Idiomas",
      "Pontos Fortes",
      "Pontos de Atenção",
      "Observações",
    ]

    const rows = analyses.map((analysis, index) => [
      index + 1,
      analysis.candidate?.[0]?.name || analysis.resume?.[0]?.file_name || "N/A",
      analysis.candidate?.[0]?.email || "N/A",
      analysis.candidate?.[0]?.phone || "N/A",
      analysis.overall_score,
      analysis.recommendation,
      analysis.is_priority ? "Alta" : "Normal",
      analysis.candidate?.[0]?.education || "N/A",
      analysis.candidate?.[0]?.experience || "N/A",
      analysis.candidate?.[0]?.skills || "N/A",
      analysis.candidate?.[0]?.languages || "N/A",
      analysis.strengths || "N/A",
      analysis.weaknesses || "N/A",
      analysis.observations || "N/A",
    ])

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="candidatos-${jobId}-${Date.now()}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Export error:", error)
    return Response.json({ error: error.message || "Failed to export data" }, { status: 500 })
  }
}
