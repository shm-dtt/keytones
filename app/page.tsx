import ColorPaletteGenerator from "@/components/color-palette-generator";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <>
      <ModeToggle />
      <ColorPaletteGenerator />
    </>
  );
}
