"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ImageIcon, Video, Palette, Download, FileText } from "lucide-react"

interface ColorData {
  hex: string
  rgb: string
  count?: number
  frame?: number
}

export default function ColorPaletteGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [colors, setColors] = useState<ColorData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileType, setFileType] = useState<"image" | "video" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paletteCanvasRef = useRef<HTMLCanvasElement>(null)
  const [frameRate, setFrameRate] = useState<1 | 2 | 5>(2)

  const rgbToHex = (r: number, g: number, b: number): string => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16)
          return hex.length === 1 ? "0" + hex : hex
        })
        .join("")
    )
  }

  // Add k-means clustering function before getImageColors
  const kMeansClustering = (pixels: [number, number, number][], k: number) => {
    if (pixels.length === 0) return []

    // Initialize centroids randomly
    const centroids: [number, number, number][] = []
    for (let i = 0; i < k; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)]
      centroids.push([...randomPixel])
    }

    let iterations = 0
    const maxIterations = 20

    // Declare clusters outside the while loop
    let clusters: { points: [number, number, number][]; center: [number, number, number] }[] = []

    while (iterations < maxIterations) {
      // Reset clusters for each iteration
      clusters = centroids.map(() => ({
        points: [] as [number, number, number][],
        center: [0, 0, 0] as [number, number, number],
      }))

      // Assign pixels to nearest centroid
      pixels.forEach((pixel) => {
        let minDistance = Number.POSITIVE_INFINITY
        let closestCluster = 0

        centroids.forEach((centroid, index) => {
          const distance = Math.sqrt(
            Math.pow(pixel[0] - centroid[0], 2) +
              Math.pow(pixel[1] - centroid[1], 2) +
              Math.pow(pixel[2] - centroid[2], 2),
          )

          if (distance < minDistance) {
            minDistance = distance
            closestCluster = index
          }
        })

        clusters[closestCluster].points.push(pixel)
      })

      // Update centroids
      let converged = true
      clusters.forEach((cluster, index) => {
        if (cluster.points.length > 0) {
          const newCenter: [number, number, number] = [
            cluster.points.reduce((sum, p) => sum + p[0], 0) / cluster.points.length,
            cluster.points.reduce((sum, p) => sum + p[1], 0) / cluster.points.length,
            cluster.points.reduce((sum, p) => sum + p[2], 0) / cluster.points.length,
          ]

          const distance = Math.sqrt(
            Math.pow(newCenter[0] - centroids[index][0], 2) +
              Math.pow(newCenter[1] - centroids[index][1], 2) +
              Math.pow(newCenter[2] - centroids[index][2], 2),
          )

          if (distance > 1) converged = false
          centroids[index] = newCenter
          cluster.center = newCenter
        }
      })

      if (converged) break
      iterations++
    }

    return clusters.filter((cluster) => cluster.points.length > 0)
  }

  const getImageColors = useCallback((imageData: ImageData): ColorData[] => {
    const data = imageData.data
    const pixels: [number, number, number][] = []

    // Collect all non-transparent pixels, sampling every 8th pixel for performance
    for (let i = 0; i < data.length; i += 32) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const alpha = data[i + 3]

      if (alpha > 128) {
        pixels.push([r, g, b])
      }
    }

    if (pixels.length === 0) return []

    // K-means clustering to find average colors - always 5 colors for images
    const clusters = kMeansClustering(pixels, 5)

    return clusters
      .map((cluster, index) => {
        const avgR = Math.round(cluster.center[0])
        const avgG = Math.round(cluster.center[1])
        const avgB = Math.round(cluster.center[2])
        const hex = rgbToHex(avgR, avgG, avgB)

        return {
          hex,
          rgb: `rgb(${avgR}, ${avgG}, ${avgB})`,
          count: cluster.points.length,
        }
      })
      .sort((a, b) => (b.count || 0) - (a.count || 0))
  }, [])

  const getDominantColor = useCallback((imageData: ImageData): ColorData => {
    const data = imageData.data
    const colorMap = new Map<string, number>()

    // Sample every 8th pixel for performance
    for (let i = 0; i < data.length; i += 32) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const alpha = data[i + 3]

      if (alpha > 128) {
        const hex = rgbToHex(r, g, b)
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1)
      }
    }

    // Get the most frequent color
    const [hex] = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1])[0] || ["#000000", 0]

    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)

    return {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
    }
  }, [])

  const generatePaletteImage = useCallback((colors: ColorData[]) => {
    const canvas = paletteCanvasRef.current
    if (!canvas || colors.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size - 5 squares of 100x100 each
    canvas.width = 500
    canvas.height = 100

    // Draw each color as a square
    colors.slice(0, 5).forEach((color, index) => {
      ctx.fillStyle = color.hex
      ctx.fillRect(index * 100, 0, 100, 100)
    })
  }, [])

  const processImage = useCallback(
    async (file: File) => {
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
        img.src = URL.createObjectURL(file)
      })
    },
    [getImageColors],
  )

  const processVideo = useCallback(
    async (file: File) => {
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
              // Remove the 50ms delay - process immediately
              captureFrame()
            }
          }

          captureFrame()
        }

        video.src = URL.createObjectURL(file)
        video.load()
      })
    },
    [getDominantColor, frameRate],
  )

  // Reprocess video when frame rate changes
  useEffect(() => {
    if (file && fileType === "video" && !isProcessing) {
      handleFileSelect(file)
    }
  }, [frameRate])

  // Generate palette image when colors change for images
  useEffect(() => {
    if (fileType === "image" && colors.length > 0) {
      generatePaletteImage(colors)
    }
  }, [colors, fileType, generatePaletteImage])

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return

    setFile(selectedFile)
    setColors([])
    setIsProcessing(true)

    const type = selectedFile.type.startsWith("image/") ? "image" : "video"
    setFileType(type)

    try {
      if (type === "image") {
        await processImage(selectedFile)
      } else {
        await processVideo(selectedFile)
      }
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const exportColorsText = () => {
    if (colors.length === 0) return

    const content = colors
      .map((color, index) => {
        if (fileType === "video") {
          return `Frame ${color.frame}: ${color.hex} (${color.rgb})`
        } else {
          return `Color ${index + 1}: ${color.hex} (${color.rgb})`
        }
      })
      .join("\n")

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `color-palette-${file?.name || "export"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportPaletteImage = () => {
    const canvas = paletteCanvasRef.current
    if (!canvas || fileType !== "image") return

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `color-palette-${file?.name || "export"}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    })
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Palette className="w-8 h-8 text-purple-600" />
            Color Palette Generator
          </h1>
          <p className="text-gray-600">Extract color palettes from images or dominant colors from video frames</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-2">
                  <div className="flex justify-center gap-4">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Click to upload an image or video</p>
                  <p className="text-sm text-gray-400">Supports JPG, PNG, MP4, WebM, and more</p>
                </div>
              </div>

              {file && fileType === "video" && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Frame sampling rate:</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant={frameRate === 1 ? "default" : "outline"} onClick={() => setFrameRate(1)}>
                      1 FPS
                    </Button>
                    <Button size="sm" variant={frameRate === 2 ? "default" : "outline"} onClick={() => setFrameRate(2)}>
                      2 FPS
                    </Button>
                    <Button size="sm" variant={frameRate === 5 ? "default" : "outline"} onClick={() => setFrameRate(5)}>
                      5 FPS
                    </Button>
                  </div>
                  <span className="text-xs text-gray-500">(~{Math.floor(16 * frameRate)} frames for 16s video)</span>
                </div>
              )}

              {file && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {fileType === "image" ? (
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Video className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  {colors.length > 0 && (
                    <div className="flex gap-2">
                      {fileType === "image" && (
                        <Button onClick={exportPaletteImage} size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Image
                        </Button>
                      )}
                      <Button onClick={exportColorsText} size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" />
                        Text
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isProcessing && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span>
                  Processing {fileType}...
                  {fileType === "video" && colors.length > 0 && (
                    <span className="text-sm text-gray-500 ml-2">({colors.length} frames processed)</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {colors.length > 0 && fileType === "image" && (
          <Card>
            <CardHeader>
              <CardTitle>Color Palette Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <canvas
                  ref={paletteCanvasRef}
                  className="border-2 border-gray-200 rounded-lg"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {colors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {fileType === "image" ? "Color Details" : "Frame Colors"}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({colors.length} {fileType === "image" ? "colors" : "frames"})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-medium">{color.hex}</span>
                        <span className="font-mono text-sm text-gray-600">{color.rgb}</span>
                        {fileType === "video" && color.frame && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Frame {color.frame}
                          </span>
                        )}
                        {fileType === "image" && color.count && (
                          <span className="text-xs text-gray-500">
                            {((color.count / colors.reduce((sum, c) => sum + (c.count || 0), 0)) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
