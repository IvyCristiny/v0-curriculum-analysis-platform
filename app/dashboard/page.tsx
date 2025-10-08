import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, FileText, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  const { count: jobsCount } = await supabase.from("jobs").select("*", { count: "exact", head: true })

  const { count: resumesCount } = await supabase.from("resumes").select("*", { count: "exact", head: true })

  const { count: candidatesCount } = await supabase.from("candidates").select("*", { count: "exact", head: true })

  const { count: analysesCount } = await supabase.from("analyses").select("*", { count: "exact", head: true })

  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("id, title, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get analysis counts for each job
  const jobsWithCounts = await Promise.all(
    (recentJobs || []).map(async (job) => {
      const { count } = await supabase.from("analyses").select("*", { count: "exact", head: true }).eq("job_id", job.id)

      return { ...job, analysisCount: count || 0 }
    }),
  )

  const stats = [
    {
      title: "Vagas Ativas",
      value: jobsCount || 0,
      icon: Briefcase,
      description: "Total de vagas cadastradas",
      href: "/dashboard/jobs",
    },
    {
      title: "Currículos",
      value: resumesCount || 0,
      icon: FileText,
      description: "Currículos recebidos",
      href: "/dashboard/resumes",
    },
    {
      title: "Candidatos",
      value: candidatesCount || 0,
      icon: Users,
      description: "Candidatos processados",
      href: "/dashboard/candidates",
    },
    {
      title: "Análises",
      value: analysesCount || 0,
      icon: TrendingUp,
      description: "Análises realizadas",
      href: "/dashboard/resumes",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral da plataforma de triagem de currículos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Começar</CardTitle>
            <CardDescription>Ações rápidas para começar a usar a plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start bg-transparent" variant="outline">
              <Link href="/dashboard/jobs/new">
                <Briefcase className="mr-2 h-4 w-4" />
                Criar Nova Vaga
              </Link>
            </Button>
            <Button asChild className="w-full justify-start bg-transparent" variant="outline">
              <Link href="/dashboard/upload">
                <FileText className="mr-2 h-4 w-4" />
                Fazer Upload de Currículos
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
            <CardDescription>Fluxo de trabalho da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  1
                </span>
                <span>Crie uma vaga e defina os critérios de avaliação</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  2
                </span>
                <span>Faça upload dos currículos em PDF ou imagem</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  3
                </span>
                <span>A IA extrai dados e analisa automaticamente</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  4
                </span>
                <span>Compare candidatos e exporte relatórios</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {jobsWithCounts && jobsWithCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vagas Recentes</CardTitle>
            <CardDescription>Suas vagas ativas mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobsWithCounts.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.analysisCount} análises realizadas</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default">Ativa</Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/jobs/${job.id}`}>Ver</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
