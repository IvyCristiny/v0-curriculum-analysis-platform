"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Briefcase, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { AnalyzeResumeButton } from "@/components/analyze-resume-button"
import { BulkActionsToolbar } from "@/components/bulk-actions-toolbar"

interface Resume {
  id: string
  file_name: string
  file_url: string
  status: string
  created_at: string
  job: Array<{ id: string; title: string }> | null
  candidate: Array<{ id: string; name: string; email: string }> | null
  analysis: Array<{ id: string; overall_score: number; recommendation: string }> | null
}

interface Job {
  id: string
  title: string
}

interface StatusInfo {
  label: string
  variant: "default" | "secondary" | "destructive"
  icon: any
  description: string
}

interface ResumesListClientProps {
  resumes: Resume[]
  jobs: Job[]
  statusMap: Record<string, StatusInfo>
}

export function ResumesListClient({ resumes, jobs, statusMap }: ResumesListClientProps) {
  const [selectedResumes, setSelectedResumes] = useState<string[]>([])

  const toggleResume = (resumeId: string) => {
    setSelectedResumes((prev) => (prev.includes(resumeId) ? prev.filter((id) => id !== resumeId) : [...prev, resumeId]))
  }

  const toggleAll = () => {
    if (selectedResumes.length === resumes.length) {
      setSelectedResumes([])
    } else {
      setSelectedResumes(resumes.map((r) => r.id))
    }
  }

  return (
    <div className="space-y-4">
      <BulkActionsToolbar
        selectedResumes={selectedResumes}
        onClearSelection={() => setSelectedResumes([])}
        jobs={jobs}
      />

      <div className="flex items-center gap-2 px-1">
        <Checkbox
          checked={selectedResumes.length === resumes.length && resumes.length > 0}
          onCheckedChange={toggleAll}
          id="select-all"
        />
        <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
          Selecionar todos
        </label>
      </div>

      <div className="space-y-4">
        {resumes.map((resume) => {
          const status = statusMap[resume.status as keyof typeof statusMap] || statusMap.pending
          const StatusIcon = status.icon
          const isSelected = selectedResumes.includes(resume.id)

          const jobTitle = resume.job && resume.job.length > 0 ? resume.job[0].title : "Vaga não associada"
          const candidateName =
            resume.candidate && resume.candidate.length > 0 ? resume.candidate[0].name : resume.file_name
          const candidateEmail = resume.candidate && resume.candidate.length > 0 ? resume.candidate[0].email : null
          const analysisScore = resume.analysis && resume.analysis.length > 0 ? resume.analysis[0].overall_score : null
          const analysisId = resume.analysis && resume.analysis.length > 0 ? resume.analysis[0].id : null

          return (
            <Card
              key={resume.id}
              className={`transition-all hover:shadow-md ${isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}`}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleResume(resume.id)}
                    className="mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Link href={`/dashboard/resumes/${resume.id}`} className="flex-1">
                    <div className="flex items-start justify-between cursor-pointer">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{candidateName}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Briefcase className="h-3 w-3" />
                          {jobTitle}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 ml-10">{status.description}</p>

                <div className="flex items-center justify-between ml-10">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(resume.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {candidateEmail && (
                      <div className="flex items-center gap-2">
                        <span>{candidateEmail}</span>
                      </div>
                    )}
                    {analysisScore && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Score: {analysisScore}/100</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={resume.file_url} target="_blank">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Arquivo
                      </Link>
                    </Button>

                    {resume.status === "pending" && <AnalyzeResumeButton resumeId={resume.id} />}

                    {resume.status === "processing" && (
                      <Button size="sm" disabled>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </Button>
                    )}

                    {resume.status === "completed" && analysisId && (
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/resumes/${resume.id}`}>Ver Análise</Link>
                      </Button>
                    )}

                    {resume.status === "error" && <AnalyzeResumeButton resumeId={resume.id} />}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
