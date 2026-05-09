"use client"

import { useState } from "react"
import { ordersApi } from "../api"
import type { CalculateStatsResponse, AnalyzeUploadedImagesResponse } from "../types"
import { useToast } from "@/src/hooks/use-toast"

export function useOrderAnalysis() {
  const { toast } = useToast()

  /* =========================
     STATE
  ========================= */

  const [statsLoading, setStatsLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const [statsResult, setStatsResult] = useState<CalculateStatsResponse | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeUploadedImagesResponse | null>(
    null
  )

  /* =========================
     CALCULATE FILE STATS
  ========================= */

  const calculateStats = async (files: File[]) => {
    try {
      setStatsLoading(true)

      const res = await ordersApi.calculateStats(files)

      setStatsResult(res)
      return res
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.detail || "Failed to calculate file stats",
        variant: "error",
      })
      throw e
    } finally {
      setStatsLoading(false)
    }
  }

  const resetStats = () => {
    setStatsResult(null)
  }


  /* =========================
     ANALYZE UPLOADED FILES (OCR)
     sends local uploaded files (FormData) to backend
  ========================= */

  const analyzeOrderFiles = async (files: File[], sourceLanguageId?: number) => {
    try {
      setAnalysisLoading(true)

      const res = await ordersApi.analyzeUploadedImages(files, sourceLanguageId)

      setAnalysisResult(res)
      return res
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.detail || "Failed to analyze images",
        variant: "error",
      })
      throw e
    } finally {
      setAnalysisLoading(false)
    }
  }

  /* =========================
     RETURN
  ========================= */

  return {
    // stats
    calculateStats,
    statsResult,
    statsLoading,

    // analysis
    analyzeOrderFiles,
    analysisResult,
    analysisLoading,
    resetStats
  }
}