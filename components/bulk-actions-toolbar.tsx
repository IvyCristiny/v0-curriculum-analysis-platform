"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link2, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface BulkActionsToolbarProps {
  selectedResumes: string[]
  onClearSelection: () => void
  jobs: Array<{ id: string; title: string }>
}

export function BulkActionsToolbar({ selectedResumes, onClearSelection, jobs }: BulkActionsToolbarProps) {
  const [isAssociating, setIsAssociating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedJob, setSelectedJob] = useState<string>("")
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const router = useRouter()

  const handleAssociate = async () => {
    if (!selectedJob) {
      alert("Selecione uma vaga primeiro")
      return
    }

    setIsAssociating(true)
    try {
      const response = await fetch("/api/associate-resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeIds: selectedResumes,
          jobId: selectedJob,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`${data.count} currículos associados à vaga "${data.job}" com sucesso!`)
        onClearSelection()
        router.refresh()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error("Error associating resumes:", error)
      alert("Erro ao associar currículos")
    } finally {
      setIsAssociating(false)
    }
  }

  const handleBatchAnalyze = async () => {
    if (
      !confirm(
        `Analisar ${selectedResumes.length} currículos?\n\nTempo estimado: ${Math.ceil((selectedResumes.length * 2) / 60)} minutos\n\nAs análises serão processadas com intervalos de 2 segundos para respeitar os limites da API.`,
      )
    ) {
      return
    }

    setIsAnalyzing(true)
    setProgress({ current: 0, total: selectedResumes.length })

    try {
      const response = await fetch("/api/batch-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeIds: selectedResumes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(
          `Análise em massa concluída!\n\n✓ Sucesso: ${data.succeeded}\n✗ Falhas: ${data.failed}\n⏱ Tempo: ${data.estimatedTime}`,
        )
        onClearSelection()
        router.refresh()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error("Error batch analyzing:", error)
      alert("Erro ao analisar currículos em massa")
    } finally {
      setIsAnalyzing(false)
      setProgress(null)
    }
  }

  if (selectedResumes.length === 0) return null

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {selectedResumes.length}{" "}
            {selectedResumes.length === 1 ? "currículo selecionado" : "currículos selecionados"}
          </Badge>

          <div className="flex items-center gap-2 flex-1">
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione uma vaga..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleAssociate} disabled={isAssociating || !selectedJob} variant="outline">
              {isAssociating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Associando...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Associar à Vaga
                </>
              )}
            </Button>

            <Button onClick={handleBatchAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {progress ? `Analisando ${progress.current}/${progress.total}...` : "Analisando..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analisar em Massa
                </>
              )}
            </Button>
          </div>

          <Button onClick={onClearSelection} variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isAnalyzing && progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso da análise</span>
              <span className="font-medium">
                {progress.current}/{progress.total}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Aguardando 2 segundos entre cada análise para respeitar limites da API...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
