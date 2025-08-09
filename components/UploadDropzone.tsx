"use client"

import { useRef, useState } from "react"
import { ImageIcon } from "lucide-react"

interface UploadDropzoneProps {
  onPick(): void
  onDropFile(file: File): void
}

export function UploadDropzone({ onPick, onDropFile }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (!isDragging) setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = Math.max(0, dragCounter.current - 1)
    if (dragCounter.current === 0 && isDragging) setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    if (isDragging) setIsDragging(false)
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith("image/")) return
    onDropFile(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload image by clicking or dragging and dropping"
      className={`border-dashed border rounded-lg p-6 sm:p-8 text-center transition-colors cursor-pointer ${
        isDragging ? "border-primary bg-muted/30" : "hover:border-primary hover:bg-muted/30"
      }`}
      onClick={onPick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-2">
        <div className="flex justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          {isDragging ? "Drop the image to upload" : "Click or drag and drop to upload an image"}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">Supports all kind of image formats</p>
      </div>
    </div>
  )
}


