import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Phone, Briefcase } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CandidatesPage() {
  const supabase = await getSupabaseServerClient()

  const { data: candidates } = await supabase
    .from("candidates")
    .select(
      `
      *,
      resume:resumes(id, job_id, file_url),
      analysis:analyses(id, overall_score, recommendation)
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Candidatos</h2>
        <p className="text-muted-foreground">Visualize os dados extraídos dos currículos</p>
      </div>

      {!candidates || candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum candidato processado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Os candidatos aparecerão aqui após o processamento dos currículos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{candidate.name || "Nome não informado"}</CardTitle>
                    {candidate.analysis?.[0]?.overall_score && (
                      <Badge variant="default">Score: {candidate.analysis[0].overall_score}/100</Badge>
                    )}
                  </div>
                  {candidate.is_validated && <Badge variant="outline">Validado</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.experience && (
                  <div className="flex items-start gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="line-clamp-2">{candidate.experience}</span>
                  </div>
                )}
                {candidate.resume?.[0]?.id && (
                  <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                    <Link href={`/dashboard/resumes/${candidate.resume[0].id}`}>Ver Detalhes</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
