import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, ArrowLeft, Upload, TrendingUp } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()

  const { data: job } = await supabase.from("jobs").select("*").eq("id", params.id).single()

  if (!job) {
    notFound()
  }

  const { data: criteria } = await supabase.from("job_criteria").select("*").eq("job_id", params.id)

  const { count: resumesCount } = await supabase
    .from("resumes")
    .select("*", { count: "exact", head: true })
    .eq("job_id", params.id)

  const { count: analysesCount } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("job_id", params.id)

  const { data: recentResumes } = await supabase
    .from("resumes")
    .select(
      `
      *,
      candidate:candidates(name),
      analysis:analyses(overall_score)
    `,
    )
    .eq("job_id", params.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{job.title}</h2>
          <p className="text-muted-foreground">Detalhes da vaga e critérios de avaliação</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/jobs/${params.id}/edit`}>Editar Vaga</Link>
        </Button>
        <Badge variant={job.status === "active" ? "default" : "secondary"}>
          {job.status === "active" ? "Ativa" : "Inativa"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currículos Recebidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total de currículos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critérios</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criteria?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Critérios de avaliação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data de Criação</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date(job.created_at).toLocaleDateString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Criada em</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Descrição da Vaga</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{job.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requisitos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{job.requirements}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Critérios de Avaliação</CardTitle>
          <CardDescription>Critérios que serão usados pela IA para avaliar os candidatos desta vaga</CardDescription>
        </CardHeader>
        <CardContent>
          {criteria && criteria.length > 0 ? (
            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                    {criterion.weight}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{criterion.criterion_name}</h4>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {criterion.criterion_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum critério definido</p>
          )}
        </CardContent>
      </Card>

      {recentResumes && recentResumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Currículos Recentes</CardTitle>
            <CardDescription>Últimos currículos enviados para esta vaga</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentResumes.map((resume) => (
                <Link key={resume.id} href={`/dashboard/resumes/${resume.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{resume.candidate?.[0]?.name || resume.file_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(resume.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {resume.analysis?.[0]?.overall_score && (
                        <Badge variant="secondary">Score: {resume.analysis?.[0]?.overall_score}</Badge>
                      )}
                      <Badge variant={resume.status === "completed" ? "default" : "secondary"}>
                        {resume.status === "pending" && "Pendente"}
                        {resume.status === "processing" && "Processando"}
                        {resume.status === "completed" && "Concluído"}
                        {resume.status === "error" && "Erro"}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Button variant="outline" asChild className="w-full mt-4 bg-transparent">
              <Link href={`/dashboard/resumes?job=${params.id}`}>Ver Todos os Currículos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
          <CardDescription>Comece a receber e analisar currículos para esta vaga</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild className="w-full">
            <Link href={`/dashboard/upload?job=${params.id}`}>
              <Upload className="mr-2 h-4 w-4" />
              Fazer Upload de Currículos
            </Link>
          </Button>
          {analysesCount && analysesCount > 0 && (
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href={`/dashboard/jobs/${params.id}/compare`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Comparar Candidatos ({analysesCount})
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
