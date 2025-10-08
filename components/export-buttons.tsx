"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import { useState } from "react"

export function ExportButtons({ jobId }: { jobId: string }) {
  const [exporting, setExporting] = useState(false)

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const response = await fetch(`/api/export-csv?jobId=${jobId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `candidatos-${jobId}-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Erro ao exportar dados")
      }
    } catch (error) {
      alert("Erro ao exportar dados")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleExportCSV} disabled={exporting} variant="outline">
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        {exporting ? "Exportando..." : "Exportar CSV"}
      </Button>
    </div>
  )
}
