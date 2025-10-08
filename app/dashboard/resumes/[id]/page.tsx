import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, User, Mail, Phone, Briefcase, GraduationCap, Languages, Star } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { AnalyzeResumeButton } from "@/components/analyze-resume-button"

export default async function ResumeDetailPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()

  const { data: resume } = await supabase
    .from("resumes")
    .select(
      `
      *,
      job:jobs(*),
      candidate:candidates(*),
      analysis:analyses(*)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!resume) {
    notFound()
  }

  const candidate = resume.candidate && resume.candidate.length > 0 ? resume.candidate[0] : null
  const analysis = resume.analysis && resume.analysis.length > 0 ? resume.analysis[0] : null
  const job = resume.job && resume.job.length > 0 ? resume.job[0] : null

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/resumes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{candidate?.name || resume.file_name}</h2>
          <p className="text-muted-foreground">Análise detalhada do currículo</p>
        </div>
        {!analysis && resume.status === "pending" && <AnalyzeResumeButton resumeId={resume.id} />}
      </div>

      {analysis && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Geral</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}/100
              </div>
              <Progress value={analysis.overall_score} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recomendação</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={getRecommendationBadge(analysis.recommendation).variant} className="text-base">
                {getRecommendationBadge(analysis.recommendation).label}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioridade</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={analysis.is_priority ? "default" : "secondary"} className="text-base">
                {analysis.is_priority ? "Alta" : "Normal"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Candidato</CardTitle>
            <CardDescription>Dados extraídos do currículo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidate ? (
              <>
                {candidate.name && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Nome</p>
                      <p className="text-sm text-muted-foreground">{candidate.name}</p>
                    </div>
                  </div>
                )}
                {candidate.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    </div>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">{candidate.phone}</p>
                    </div>
                  </div>
                )}
                {candidate.education && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Formação</p>
                      <p className="text-sm text-muted-foreground">{candidate.education}</p>
                    </div>
                  </div>
                )}
                {candidate.experience && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Experiência</p>
                      <p className="text-sm text-muted-foreground">{candidate.experience}</p>
                    </div>
                  </div>
                )}
                {candidate.languages && (
                  <div className="flex items-start gap-3">
                    <Languages className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Idiomas</p>
                      <p className="text-sm text-muted-foreground">{candidate.languages}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Dados ainda não extraídos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vaga</CardTitle>
            <CardDescription>Informações da vaga relacionada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Título</p>
              <p className="text-sm text-muted-foreground">{job?.title || "Vaga não associada"}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Descrição</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{job?.description || "Sem descrição"}</p>
            </div>
            {resume.job_id && (
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href={`/dashboard/jobs/${resume.job_id}`}>Ver Detalhes da Vaga</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <>
          {analysis.criteria_scores && Object.keys(analysis.criteria_scores).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pontuação por Critério</CardTitle>
                <CardDescription>Avaliação detalhada de cada critério definido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analysis.criteria_scores).map(([criterion, score]) => (
                  <div key={criterion} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{criterion}</span>
                      <span className={`text-sm font-semibold ${getScoreColor(score as number)}`}>{score}/100</span>
                    </div>
                    <Progress value={score as number} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">Pontos Fortes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{analysis.strengths}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600 dark:text-yellow-400">Pontos de Atenção</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{analysis.weaknesses}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Observações Detalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{analysis.observations}</p>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Arquivo do Currículo</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={resume.file_url} target="_blank">
              <FileText className="mr-2 h-4 w-4" />
              Abrir Arquivo Original
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
