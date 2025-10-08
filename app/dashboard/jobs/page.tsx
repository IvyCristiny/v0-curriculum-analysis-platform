import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Briefcase, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function JobsPage() {
  const supabase = await getSupabaseServerClient()

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, description, status, created_at")
    .order("created_at", { ascending: false })

  const jobsWithCounts = await Promise.all(
    (jobs || []).map(async (job) => {
      const { count } = await supabase.from("resumes").select("*", { count: "exact", head: true }).eq("job_id", job.id)

      return { ...job, resumeCount: count || 0 }
    }),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vagas</h2>
          <p className="text-muted-foreground">Gerencie suas vagas e processos seletivos</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Vaga
          </Link>
        </Button>
      </div>

      {!jobsWithCounts || jobsWithCounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma vaga cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4">Comece criando sua primeira vaga</p>
            <Button asChild>
              <Link href="/dashboard/jobs/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Vaga
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobsWithCounts.map((job) => (
            <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl line-clamp-1">{job.title}</CardTitle>
                    <Badge variant={job.status === "active" ? "default" : "secondary"}>
                      {job.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Criada em {new Date(job.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{job.resumeCount} currículos recebidos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
