"use client"

import { ImageIcon } from "lucide-react"

interface UploadDropzoneProps {
  onPick(): void
}

export function UploadDropzone({ onPick }: UploadDropzoneProps) {
  return (
    <div
      className="border-dashed border rounded-lg p-6 sm:p-8 text-center hover:border-primary hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onPick}
    >
      <div className="space-y-2">
        <div className="flex justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Click to upload an image</p>
        <p className="text-xs sm:text-sm text-muted-foreground">Supports all kind of image formats</p>
      </div>
    </div>
  )
}


