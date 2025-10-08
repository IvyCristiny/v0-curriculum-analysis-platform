"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"

interface Job {
  id: string
  title: string
}

interface UploadedFile {
  file: File
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
  id?: string
}

export function ResumeUploader({ jobs, defaultJobId }: { jobs: Job[]; defaultJobId?: string }) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [selectedJobId, setSelectedJobId] = useState(defaultJobId || "")
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter((file) => {
      const isValidType = file.type === "application/pdf" || file.type.startsWith("image/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (!selectedJobId) {
      alert("Por favor, selecione uma vaga")
      return
    }

    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue

      try {
        setFiles((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: "uploading", progress: 30 }
          return updated
        })

        const file = files[i].file
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `resumes/${selectedJobId}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file)

        if (uploadError) throw uploadError

        setFiles((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], progress: 60 }
          return updated
        })

        const {
          data: { publicUrl },
        } = supabase.storage.from("resumes").getPublicUrl(filePath)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        const { data: resume, error: dbError } = await supabase
          .from("resumes")
          .insert({
            job_id: selectedJobId,
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
            status: "pending",
            uploaded_by: user?.id,
          })
          .select()
          .single()

        if (dbError) throw dbError

        setFiles((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: "success", progress: 100, id: resume.id }
          return updated
        })
      } catch (error: any) {
        setFiles((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: "error", progress: 0, error: error.message }
          return updated
        })
      }
    }

    setUploading(false)

    const successCount = files.filter((f) => f.status === "success").length
    if (successCount > 0) {
      setTimeout(() => {
        router.push("/dashboard/resumes")
        router.refresh()
      }, 1500)
    }
  }

  const allSuccess = files.length > 0 && files.every((f) => f.status === "success")
  const hasErrors = files.some((f) => f.status === "error")

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="job">Vaga</Label>
        <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={uploading}>
          <SelectTrigger id="job">
            <SelectValue placeholder="Selecione uma vaga" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept=".pdf,image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Clique para selecionar arquivos</p>
            <p className="text-xs text-muted-foreground">PDF ou imagens (máx. 10MB cada)</p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Arquivos Selecionados ({files.length})</Label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((uploadedFile, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadedFile.status === "uploading" && (
                      <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                    )}
                    {uploadedFile.status === "error" && (
                      <p className="text-xs text-destructive mt-1">{uploadedFile.error}</p>
                    )}
                  </div>
                  {uploadedFile.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                  {uploadedFile.status === "error" && <AlertCircle className="h-5 w-5 text-destructive shrink-0" />}
                  {uploadedFile.status === "pending" && !uploading && (
                    <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {allSuccess && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
            Todos os currículos foram enviados com sucesso! Redirecionando...
          </p>
        </div>
      )}

      {hasErrors && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium">
            Alguns arquivos falharam no upload. Remova-os e tente novamente.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={uploadFiles} disabled={files.length === 0 || !selectedJobId || uploading} className="flex-1">
          {uploading ? "Enviando..." : `Enviar ${files.length} Currículo${files.length !== 1 ? "s" : ""}`}
        </Button>
        {files.length > 0 && !uploading && (
          <Button variant="outline" onClick={() => setFiles([])}>
            Limpar Todos
          </Button>
        )}
      </div>
    </div>
  )
}
