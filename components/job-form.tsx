"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Criterion {
  name: string
  type: string
  weight: number
  description: string
}

interface JobFormProps {
  action?: (formData: FormData) => Promise<void>
  initialData?: {
    title?: string
    description?: string
    requirements?: string
    location?: string
    salary_range?: string
    employment_type?: string
    criteria?: Array<{
      criterion_name: string
      criterion_type: string
      weight: number
      description: string
    }>
  }
}

export function JobForm({ action, initialData }: JobFormProps) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [requirements, setRequirements] = useState(initialData?.requirements || "")
  const [location, setLocation] = useState(initialData?.location || "")
  const [salaryRange, setSalaryRange] = useState(initialData?.salary_range || "")
  const [employmentType, setEmploymentType] = useState(initialData?.employment_type || "full_time")

  const [criteria, setCriteria] = useState<Criterion[]>(
    initialData?.criteria?.map((c) => ({
      name: c.criterion_name,
      type: c.criterion_type,
      weight: c.weight,
      description: c.description,
    })) || [
      { name: "Experiência", type: "experience", weight: 3, description: "Anos de experiência na área" },
      { name: "Formação", type: "education", weight: 2, description: "Nível de escolaridade e cursos" },
      { name: "Habilidades Técnicas", type: "skills", weight: 3, description: "Competências técnicas específicas" },
    ],
  )

  const addCriterion = () => {
    setCriteria([...criteria, { name: "", type: "custom", weight: 1, description: "" }])
  }

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  const updateCriterion = (index: number, field: keyof Criterion, value: string | number) => {
    const updated = [...criteria]
    updated[index] = { ...updated[index], [field]: value }
    setCriteria(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (action) {
        const formData = new FormData()
        formData.append("title", title)
        formData.append("description", description)
        formData.append("requirements", requirements)
        formData.append("location", location)
        formData.append("salary_range", salaryRange)
        formData.append("employment_type", employmentType)

        criteria.forEach((c, index) => {
          formData.append(`criteria[${index}][name]`, c.name)
          formData.append(`criteria[${index}][description]`, c.description)
          formData.append(`criteria[${index}][weight]`, c.weight.toString())
          formData.append(`criteria[${index}][type]`, c.type)
        })

        await action(formData)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data: existingUser } = await supabase.from("users").select("id").eq("id", user.id).single()

      if (!existingUser) {
        const { error: userError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split("@")[0],
          role: "recruiter",
        })

        if (userError) {
          console.error("[v0] Error creating user:", userError)
          throw new Error("Erro ao criar registro de usuário")
        }
      }

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          title,
          description,
          requirements,
          location,
          salary_range: salaryRange,
          employment_type: employmentType,
          created_by: user.id,
          status: "active",
        })
        .select()
        .single()

      if (jobError) throw jobError

      const criteriaData = criteria.map((c) => ({
        job_id: job.id,
        criterion_name: c.name,
        criterion_type: c.type,
        weight: c.weight,
        description: c.description,
      }))

      const { error: criteriaError } = await supabase.from("job_criteria").insert(criteriaData)

      if (criteriaError) throw criteriaError

      router.push(`/dashboard/jobs/${job.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar vaga")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título da Vaga</Label>
          <Input
            id="title"
            placeholder="Ex: Desenvolvedor Full Stack"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Descreva a vaga, responsabilidades e o perfil desejado..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="requirements">Requisitos</Label>
          <Textarea
            id="requirements"
            placeholder="Liste os requisitos necessários para a vaga..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            required
            disabled={loading}
            rows={4}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              placeholder="Ex: São Paulo - SP (Remoto)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary_range">Faixa Salarial</Label>
            <Input
              id="salary_range"
              placeholder="Ex: R$ 5.000 - R$ 8.000"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employment_type">Tipo de Contratação</Label>
          <Select value={employmentType} onValueChange={setEmploymentType} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Tempo Integral</SelectItem>
              <SelectItem value="part_time">Meio Período</SelectItem>
              <SelectItem value="contract">Contrato</SelectItem>
              <SelectItem value="internship">Estágio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Critérios de Avaliação</CardTitle>
          <CardDescription>
            Defina os critérios que serão usados pela IA para avaliar os candidatos. O peso determina a importância de
            cada critério (1-5).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {criteria.map((criterion, index) => (
            <div key={index} className="flex gap-4 p-4 border rounded-lg">
              <div className="flex-1 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome do Critério</Label>
                    <Input
                      placeholder="Ex: Experiência"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(index, "name", e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={criterion.type}
                      onValueChange={(value) => updateCriterion(index, "type", value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="experience">Experiência</SelectItem>
                        <SelectItem value="education">Formação</SelectItem>
                        <SelectItem value="skills">Habilidades</SelectItem>
                        <SelectItem value="languages">Idiomas</SelectItem>
                        <SelectItem value="soft_skills">Soft Skills</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descreva o que será avaliado neste critério"
                    value={criterion.description}
                    onChange={(e) => updateCriterion(index, "description", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(index, "weight", Number.parseInt(e.target.value))}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCriterion(index)}
                disabled={loading || criteria.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addCriterion}
            disabled={loading}
            className="w-full bg-transparent"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Critério
          </Button>
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (action ? "Salvando..." : "Criando...") : action ? "Salvar Alterações" : "Criar Vaga"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
