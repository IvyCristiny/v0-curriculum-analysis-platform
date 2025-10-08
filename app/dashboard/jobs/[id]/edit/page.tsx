import { getSupabaseServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { JobForm } from "@/components/job-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()

  const { data: job } = await supabase
    .from("jobs")
    .select(
      `
      *,
      criteria:job_criteria(*)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!job) {
    notFound()
  }

  async function updateJob(formData: FormData) {
    "use server"
    const supabase = await getSupabaseServerClient()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const requirements = formData.get("requirements") as string
    const location = formData.get("location") as string
    const salary_range = formData.get("salary_range") as string
    const employment_type = formData.get("employment_type") as string

    const { error: jobError } = await supabase
      .from("jobs")
      .update({
        title,
        description,
        requirements,
        location,
        salary_range,
        employment_type,
      })
      .eq("id", params.id)

    if (jobError) throw jobError

    await supabase.from("job_criteria").delete().eq("job_id", params.id)

    const criteriaData = []
    let criteriaIndex = 0
    while (formData.has(`criteria[${criteriaIndex}][name]`)) {
      const name = formData.get(`criteria[${criteriaIndex}][name]`) as string
      const description = formData.get(`criteria[${criteriaIndex}][description]`) as string
      const weight = Number.parseInt(formData.get(`criteria[${criteriaIndex}][weight]`) as string)

      if (name && weight) {
        criteriaData.push({
          job_id: params.id,
          name,
          description,
          weight,
        })
      }
      criteriaIndex++
    }

    if (criteriaData.length > 0) {
      const { error: criteriaError } = await supabase.from("job_criteria").insert(criteriaData)
      if (criteriaError) throw criteriaError
    }

    const { data: resumes } = await supabase.from("resumes").select("id").eq("job_id", params.id)

    if (resumes && resumes.length > 0) {
      await supabase
        .from("resumes")
        .update({ status: "pending" })
        .in(
          "id",
          resumes.map((r) => r.id),
        )

      await supabase
        .from("analyses")
        .delete()
        .in(
          "resume_id",
          resumes.map((r) => r.id),
        )
    }

    redirect(`/dashboard/jobs/${params.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/jobs/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Vaga</h2>
          <p className="text-muted-foreground">
            Atualize os detalhes da vaga. Todos os currículos serão reanalisados após a edição.
          </p>
        </div>
      </div>

      <JobForm action={updateJob} initialData={job} />
    </div>
  )
}
