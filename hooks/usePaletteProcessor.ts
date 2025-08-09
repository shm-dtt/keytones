"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ColorData, getImageColors } from "@/lib/colors"

export function usePaletteProcessor() {
  const [file, setFile] = useState<File | null>(null)
  const [colors, setColors] = useState<ColorData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileType, setFileType] = useState<"image" | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paletteCanvasRef = useRef<HTMLCanvasElement>(null)

  const processImage = useCallback(
    async (inputFile: File) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"

      return new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = Math.min(img.width, 800)
          canvas.height = Math.min(img.height, 600)

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const extractedColors = getImageColors(imageData)
          setColors(extractedColors)
          resolve()
        }
        img.src = URL.createObjectURL(inputFile)
      })
    },
    [],
  )

  // processVideo removed as the app now supports only images

  const generatePaletteImage = useCallback((palette: ColorData[]) => {
    const canvas = paletteCanvasRef.current
    if (!canvas || palette.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 500
    canvas.height = 100

    palette.slice(0, 5).forEach((color, index) => {
      ctx.fillStyle = color.hex
      ctx.fillRect(index * 100, 0, 100, 100)
    })
  }, [])

  const handleFileSelect = useCallback(
    async (selected: File) => {
      if (!selected) return

      setFile(selected)
      setColors([])
      setIsProcessing(true)

      const type = selected.type.startsWith("image/") ? "image" : null
      setFileType(type)

      try {
        if (type === "image") {
          await processImage(selected)
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [processImage],
  )

  // frameRate effect removed

  useEffect(() => {
    if (fileType === "image" && colors.length > 0) {
      generatePaletteImage(colors)
    }
  }, [colors, fileType, generatePaletteImage])

  return {
    state: { file, colors, isProcessing, fileType },
    refs: { canvasRef, paletteCanvasRef },
    actions: { handleFileSelect },
  }
}


