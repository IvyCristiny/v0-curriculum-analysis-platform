import { JobForm } from "@/components/job-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewJobPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nova Vaga</h2>
        <p className="text-muted-foreground">Crie uma nova vaga e defina os critérios de avaliação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Vaga</CardTitle>
          <CardDescription>Preencha os detalhes da vaga e configure os critérios de análise</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm />
        </CardContent>
      </Card>
    </div>
  )
}
