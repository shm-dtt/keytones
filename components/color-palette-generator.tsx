"use client";

import type React from "react";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Upload, Download, FileText, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { usePaletteProcessor } from "@/hooks/usePaletteProcessor";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ColorItem } from "@/components/ColorItem";
import type { ColorData } from "@/lib/colors";
import Image from "next/image";

export default function ColorPaletteGenerator() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    state: { file, colors, isProcessing, fileType },
    refs: { canvasRef, paletteCanvasRef },
    actions: { handleFileSelect },
  } = usePaletteProcessor();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  const exportColorsText = () => {
    if (colors.length === 0) return;

    const content = colors
      .map((color, index) => `Color ${index + 1}: ${color.hex} (${color.rgb})`)
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `color-palette-${file?.name || "export"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPaletteImage = () => {
    const canvas = paletteCanvasRef.current;
    if (!canvas || fileType !== "image") return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `color-palette-${file?.name || "export"}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    toast(`Copied ${text}`);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center justify-center gap-2">
            <Image src="/favicon.ico" alt="Keytones Logo" width={32} height={32} />
            Keytones
          </h1>
          <p className="text-muted-foreground">
            Extract color palettes from images
          </p>
        </div>

        <Card>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <UploadDropzone
                onPick={() => fileInputRef.current?.click()}
                onDropFile={(file) => handleFileSelect(file)}
              />

              {file && (
                <div className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg flex-col sm:flex-row">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium break-all">
                      {file.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isProcessing && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-input border-t-primary"></div>
                <span>
                  Processing image...
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {colors.length > 0 && fileType === "image" && (
          <Card>
            <CardHeader>
              <CardTitle>Image Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <img
                  src={file ? URL.createObjectURL(file) : ""}
                  alt="Uploaded image"
                  className="max-w-full h-auto rounded-lg border"
                  style={{ maxHeight: "400px" }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {colors.length > 0 && fileType === "image" && (
          <Card>
            <CardHeader>
              <CardTitle>Color Palette Preview</CardTitle>
              <CardAction>
                <div className="flex gap-2">
                  <Button
                    onClick={exportPaletteImage}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Image
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <canvas
                  ref={paletteCanvasRef}
                  className="border rounded-lg"
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
                Color Details
                <span className="text-sm font-normal ml-2">({colors.length} colors)</span>
              </CardTitle>
              <CardAction>
                <div className="flex gap-2">
                  <Button
                    onClick={exportColorsText}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Hex Codes
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {colors.map((color, index) => (
                  <ColorItem
                    key={index}
                    color={color as ColorData}
                    totalCount={
                      fileType === "image"
                        ? colors.reduce((sum, c) => sum + (c.count || 0), 0)
                        : undefined
                    }
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
