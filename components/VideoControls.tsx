"use client"

import { Button } from "@/components/ui/button"

interface VideoControlsProps {
  frameRate: 1 | 2 | 5
  setFrameRate: (fps: 1 | 2 | 5) => void
}

export function VideoControls({ frameRate, setFrameRate }: VideoControlsProps) {
  return (
    <div className="flex items-center flex-wrap gap-3 sm:gap-4 p-3 bg-muted rounded-lg">
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
      <span className="text-xs text-muted-foreground">(~{Math.floor(16 * frameRate)} frames for 16s video)</span>
    </div>
  )
}


