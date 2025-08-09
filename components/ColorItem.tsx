"use client"

import { Button } from "@/components/ui/button"
import type { ColorData } from "@/lib/colors"
import { Copy } from "lucide-react"

interface ColorItemProps {
  color: ColorData
  totalCount?: number
  onCopy(hex: string): void
}

export function ColorItem({ color, totalCount = 0, onCopy }: ColorItemProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors select-none">
      <div
        className="w-12 h-12 rounded-lg border flex-shrink-0"
        style={{ backgroundColor: color.hex }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm font-medium">{color.hex}</span>
          <span className="font-mono text-sm text-muted-foreground">{color.rgb}</span>
          {typeof color.frame === "number" && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Frame {color.frame}
            </span>
          )}
          {typeof color.count === "number" && totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {((color.count / totalCount) * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <div className="ml-auto">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Copy ${color.hex}`}
          onClick={() => onCopy(color.hex)}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}


