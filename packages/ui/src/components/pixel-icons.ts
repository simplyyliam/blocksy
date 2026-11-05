// Pixel-art icons for the editor titlebar (the "Minecraft" feel without using Mojang's art).
// A thin adapter over @nsmr/pixelart-react (MIT, credited on the Docs Credits page), so the
// app never imports the library directly and the set can be swapped in one place.
export {
  AddBox as PixelNew,
  Archive as PixelExport,
  ArrowLeft as PixelBack,
  Code as PixelCode,
  Debug as PixelBuild,
  Gamepad as PixelRun,
  Redo as PixelRedo,
  Save as PixelSave,
  Search as PixelSearch,
  DebugStop as PixelStop,
  Undo as PixelUndo,
} from "@nsmr/pixelart-react"
