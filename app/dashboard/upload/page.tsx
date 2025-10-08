import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResumeUploader } from "@/components/resume-uploader"

export default async function UploadPage({ searchParams }: { searchParams: { job?: string } }) {
  const supabase = await getSupabaseServerClient()

  const { data: jobs } = await supabase.from("jobs").select("id, title, status").eq("status", "active")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload de Currículos</h2>
        <p className="text-muted-foreground">Faça upload de currículos em PDF ou imagem para análise automática</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enviar Currículos</CardTitle>
          <CardDescription>
            Selecione a vaga e faça upload dos currículos. A IA irá extrair os dados e analisar automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUploader jobs={jobs || []} defaultJobId={searchParams.job} />
        </CardContent>
      </Card>
    </div>
  )
}
