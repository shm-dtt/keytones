"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ColorData, getDominantColor, getImageColors } from "@/lib/colors"

export function usePaletteProcessor() {
  const [file, setFile] = useState<File | null>(null)
  const [colors, setColors] = useState<ColorData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileType, setFileType] = useState<"image" | "video" | null>(null)
  const [frameRate, setFrameRate] = useState<1 | 2 | 5>(2)

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

  const processVideo = useCallback(
    async (inputFile: File) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const video = document.createElement("video")
      video.crossOrigin = "anonymous"

      return new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          canvas.width = Math.min(video.videoWidth, 400)
          canvas.height = Math.min(video.videoHeight, 300)

          const duration = video.duration
          const frameCount = Math.floor(duration * frameRate)
          const frameColors: ColorData[] = []
          let currentFrame = 0

          const captureFrame = () => {
            if (currentFrame >= frameCount) {
              setColors(frameColors)
              resolve()
              return
            }

            const time = (currentFrame / frameCount) * duration
            video.currentTime = time

            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const dominantColor = getDominantColor(imageData)

              frameColors.push({
                ...dominantColor,
                frame: currentFrame + 1,
              })

              currentFrame++
              captureFrame()
            }
          }

          captureFrame()
        }

        video.src = URL.createObjectURL(inputFile)
        video.load()
      })
    },
    [frameRate],
  )

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

      const type = selected.type.startsWith("image/") ? "image" : "video"
      setFileType(type)

      try {
        if (type === "image") {
          await processImage(selected)
        } else {
          await processVideo(selected)
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [processImage, processVideo],
  )

  useEffect(() => {
    if (file && fileType === "video" && !isProcessing) {
      handleFileSelect(file)
    }
  }, [frameRate])

  useEffect(() => {
    if (fileType === "image" && colors.length > 0) {
      generatePaletteImage(colors)
    }
  }, [colors, fileType, generatePaletteImage])

  return {
    state: { file, colors, isProcessing, fileType, frameRate },
    refs: { canvasRef, paletteCanvasRef },
    actions: { setFrameRate, handleFileSelect, setColors },
  }
}


