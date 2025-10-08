"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function AnalyzeResumeButton({ resumeId }: { resumeId: string }) {
  const [analyzing, setAnalyzing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAnalyze = async () => {
    setAnalyzing(true)

    console.log("[v0] Starting analysis for resume:", resumeId)

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      })

      const data = await response.json()
      console.log("[v0] Analysis response:", data)

      if (response.ok) {
        toast({
          title: "Análise iniciada!",
          description: "O currículo está sendo processado pela IA. Isso pode levar alguns segundos.",
        })
        router.refresh()
      } else {
        console.error("[v0] Analysis error:", data.error)
        toast({
          title: "Erro na análise",
          description: data.error || "Não foi possível analisar o currículo. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Network error:", error)
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Verifique sua conexão.",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Button onClick={handleAnalyze} disabled={analyzing} size="sm">
      {analyzing ? (
        <>
          <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
          Analisando...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Analisar com IA
        </>
      )}
    </Button>
  )
}
