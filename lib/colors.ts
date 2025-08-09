export interface ColorData {
  hex: string
  rgb: string
  count?: number
}

export const rgbToHex = (r: number, g: number, b: number): string => {
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

export const kMeansClustering = (
  pixels: [number, number, number][],
  k: number,
) => {
  if (pixels.length === 0) return [] as {
    points: [number, number, number][]
    center: [number, number, number]
  }[]

  const centroids: [number, number, number][] = []
  for (let i = 0; i < k; i++) {
    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)]
    centroids.push([...randomPixel])
  }

  let iterations = 0
  const maxIterations = 20

  let clusters: { points: [number, number, number][]; center: [number, number, number] }[] = []

  while (iterations < maxIterations) {
    clusters = centroids.map(() => ({
      points: [] as [number, number, number][],
      center: [0, 0, 0] as [number, number, number],
    }))

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

export const getImageColors = (imageData: ImageData): ColorData[] => {
  const data = imageData.data
  const pixels: [number, number, number][] = []

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

  const clusters = kMeansClustering(pixels, 5)

  return clusters
    .map((cluster) => {
      const avgR = Math.round(cluster.center[0])
      const avgG = Math.round(cluster.center[1])
      const avgB = Math.round(cluster.center[2])
      const hex = rgbToHex(avgR, avgG, avgB)

      return {
        hex,
        rgb: `rgb(${avgR}, ${avgG}, ${avgB})`,
        count: cluster.points.length,
      } as ColorData
    })
    .sort((a, b) => (b.count || 0) - (a.count || 0))
}

// getDominantColor removed as the app now supports only images


