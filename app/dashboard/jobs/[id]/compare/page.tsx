import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { ExportButtons } from "@/components/export-buttons"

export default async function CompareJobCandidatesPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()

  const { data: job } = await supabase.from("jobs").select("*").eq("id", params.id).single()

  if (!job) {
    notFound()
  }

  const { data: analyses } = await supabase
    .from("analyses")
    .select(
      `
      *,
      resume:resumes(id, file_name, file_url),
      candidate:candidates!inner(id, name, email, phone, experience, education)
    `,
    )
    .eq("job_id", params.id)
    .order("overall_score", { ascending: false })

  const { data: criteria } = await supabase.from("job_criteria").select("*").eq("job_id", params.id)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getRecommendationBadge = (recommendation: string) => {
    const variants = {
      hire: { label: "Contratar", variant: "default" as const },
      interview: { label: "Entrevistar", variant: "secondary" as const },
      reject: { label: "Rejeitar", variant: "destructive" as const },
    }
    return variants[recommendation as keyof typeof variants] || { label: recommendation, variant: "secondary" as const }
  }

  const avgScore = analyses?.length
    ? Math.round(analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length)
    : 0

  const topCandidates = analyses?.filter((a) => a.overall_score >= 80).length || 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/jobs/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Comparativo de Candidatos</h2>
          <p className="text-muted-foreground">{job.title}</p>
        </div>
        {analyses && analyses.length > 0 && <ExportButtons jobId={params.id} />}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Analisados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}/100</div>
            <Progress value={avgScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatos Top</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{topCandidates}</div>
            <p className="text-xs text-muted-foreground">Score ≥ 80</p>
          </CardContent>
        </Card>
      </div>

      {!analyses || analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma análise disponível</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Faça upload de currículos e analise-os para ver o comparativo
            </p>
            <Button asChild>
              <Link href={`/dashboard/upload?job=${params.id}`}>Fazer Upload</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Candidatos</CardTitle>
              <CardDescription>Candidatos ordenados por pontuação geral</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyses.map((analysis, index) => (
                  <div key={analysis.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">
                          {analysis.candidate?.[0]?.name || analysis.resume?.[0]?.file_name}
                        </h4>
                        <Badge variant={getRecommendationBadge(analysis.recommendation).variant}>
                          {getRecommendationBadge(analysis.recommendation).label}
                        </Badge>
                        {analysis.is_priority && <Badge variant="default">Prioridade</Badge>}
                      </div>
                      {analysis.candidate?.[0]?.email && (
                        <p className="text-sm text-muted-foreground truncate">{analysis.candidate?.[0]?.email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                        {analysis.overall_score}
                      </div>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/resumes/${analysis.resume_id}`}>Ver Detalhes</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {criteria && criteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparativo por Critério</CardTitle>
                <CardDescription>Pontuação média de cada candidato por critério de avaliação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Candidato</th>
                        <th className="text-center p-3 font-medium">Score Geral</th>
                        {criteria.map((criterion) => (
                          <th key={criterion.id} className="text-center p-3 font-medium">
                            {criterion.criterion_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analyses.map((analysis) => (
                        <tr key={analysis.id} className="border-b hover:bg-accent/50">
                          <td className="p-3">
                            <div className="font-medium truncate max-w-[200px]">
                              {analysis.candidate?.[0]?.name || analysis.resume?.[0]?.file_name}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-semibold ${getScoreColor(analysis.overall_score)}`}>
                              {analysis.overall_score}
                            </span>
                          </td>
                          {criteria.map((criterion) => {
                            const score = analysis.criteria_scores?.[criterion.criterion_name] || 0
                            return (
                              <td key={criterion.id} className="p-3 text-center">
                                <span className={`font-medium ${getScoreColor(score)}`}>{score}</span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">Recomendados para Contratação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyses
                    .filter((a) => a.recommendation === "hire")
                    .map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium truncate">
                          {analysis.candidate?.[0]?.name || analysis.resume?.[0]?.file_name}
                        </span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {analysis.overall_score}
                        </span>
                      </div>
                    ))}
                  {analyses.filter((a) => a.recommendation === "hire").length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum candidato recomendado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600 dark:text-yellow-400">Para Entrevista</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyses
                    .filter((a) => a.recommendation === "interview")
                    .map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium truncate">
                          {analysis.candidate?.[0]?.name || analysis.resume?.[0]?.file_name}
                        </span>
                        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                          {analysis.overall_score}
                        </span>
                      </div>
                    ))}
                  {analyses.filter((a) => a.recommendation === "interview").length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum candidato para entrevista</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Não Recomendados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyses
                    .filter((a) => a.recommendation === "reject")
                    .map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium truncate">
                          {analysis.candidate?.[0]?.name || analysis.resume?.[0]?.file_name}
                        </span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {analysis.overall_score}
                        </span>
                      </div>
                    ))}
                  {analyses.filter((a) => a.recommendation === "reject").length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum candidato rejeitado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
