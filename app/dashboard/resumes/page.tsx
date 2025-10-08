import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResumesListClient } from "@/components/resumes-list-client"

export default async function ResumesPage({ searchParams }: { searchParams: { job?: string } }) {
  const supabase = await getSupabaseServerClient()

  let query = supabase.from("resumes").select(
    `
      *,
      job:jobs(id, title),
      candidate:candidates(id, name, email),
      analysis:analyses(id, overall_score, recommendation)
    `,
  )

  if (searchParams.job && searchParams.job !== "all") {
    query = query.eq("job_id", searchParams.job)
  }

  const { data: resumes } = await query.order("created_at", { ascending: false })

  const { data: jobs } = await supabase.from("jobs").select("id, title").order("title")

  const statusMap = {
    pending: {
      label: "Aguardando Análise",
      variant: "secondary" as const,
      icon: Clock,
      description: "Currículo enviado, aguardando processamento",
    },
    processing: {
      label: "Analisando",
      variant: "default" as const,
      icon: Clock,
      description: "IA está processando o currículo",
    },
    completed: {
      label: "Análise Concluída",
      variant: "default" as const,
      icon: CheckCircle2,
      description: "Análise finalizada com sucesso",
    },
    error: {
      label: "Erro na Análise",
      variant: "destructive" as const,
      icon: AlertCircle,
      description: "Ocorreu um erro durante a análise",
    },
  }

  const pendingCount = resumes?.filter((r) => r.status === "pending").length || 0
  const processingCount = resumes?.filter((r) => r.status === "processing").length || 0
  const completedCount = resumes?.filter((r) => r.status === "completed").length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Currículos</h2>
          <p className="text-muted-foreground">Gerencie os currículos recebidos e suas análises</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/upload">
            <Upload className="mr-2 h-4 w-4" />
            Novo Upload
          </Link>
        </Button>
      </div>

      {jobs && jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filtrar por Vaga</CardTitle>
            <CardDescription>Visualize currículos de uma vaga específica</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/dashboard/resumes" method="get">
              <div className="flex gap-2">
                <Select name="job" defaultValue={searchParams.job || "all"}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Todas as vagas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as vagas</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit">Filtrar</Button>
                {searchParams.job && searchParams.job !== "all" && (
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/resumes">Limpar</Link>
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {resumes && resumes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando Análise</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                {pendingCount === 1 ? "currículo pendente" : "currículos pendentes"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processingCount}</div>
              <p className="text-xs text-muted-foreground">
                {processingCount === 1 ? "análise em andamento" : "análises em andamento"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">
                {completedCount === 1 ? "análise completa" : "análises completas"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!resumes || resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum currículo encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchParams.job ? "Nenhum currículo para esta vaga" : "Comece fazendo upload de currículos"}
            </p>
            <Button asChild>
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-4 w-4" />
                Fazer Upload
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ResumesListClient resumes={resumes} jobs={jobs || []} statusMap={statusMap} />
      )}
    </div>
  )
}
