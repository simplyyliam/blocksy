// Pixel-art icons for the editor titlebar (the "Minecraft" feel without Mojang's art).
// The path data is from pixelarticons by Gerrit Halfmann (MIT, credited on the Docs Credits
// page). Eleven icons are inlined here instead of depending on an icon package: the package's
// ESM build does not load in plain Node (the generator tests import @blocksy/ui), and
// tree-shaking 480 icons for 11 is not worth it. One place to swap the set later.
import type { SVGProps } from "react"

function pixelIcon(name: string, paths: string[], even = false) {
  const Icon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden shapeRendering="crispEdges" {...props}>
      {paths.map((d, i) => (
        <path key={i} d={d} fillRule={even ? "evenodd" : undefined} />
      ))}
    </svg>
  )
  Icon.displayName = name
  return Icon
}

export const PixelNew = pixelIcon("PixelNew", ["M3 3h18v18H3V3zm16 16V5H5v14h14zm-6-8h4v2h-4v4h-2v-4H7v-2h4V7h2v4z"])
export const PixelExport = pixelIcon("PixelExport", ["M22 4H2v6h2v10h16V10h2V4zM6 10h12v8H6v-8zm14-4v2H4V6h16zm-5 6H9v2h6v-2z"])
export const PixelBack = pixelIcon("PixelBack", ["M20 11v2H8v2H6v-2H4v-2h2V9h2v2h12zM10 7H8v2h2V7zm0 0h2V5h-2v2zm0 10H8v-2h2v2zm0 0h2v2h-2v-2z"])
export const PixelCode = pixelIcon("PixelCode", [
  "M8 5h2v2H8V5zM6 7h2v2H6V7zM4 9h2v2H4V9zm-2 2h2v2H2v-2zm2 2h2v2H4v-2zm2 2h2v2H6v-2zm2 2h2v2H8v-2zm8-12h-2v2h2V5zm2 2h-2v2h2V7zm2 2h-2v2h2V9zm2 2h-2v2h2v-2zm-2 2h-2v2h2v-2zm-2 2h-2v2h2v-2zm-2 2h-2v2h2v-2z",
])
export const PixelBuild = pixelIcon("PixelBuild", [
  "M6 2h2v2H6V2Zm4 9h4v2h-4v-2Zm4 4h-4v2h4v-2Z",
  "M16 4h-2v2h-4V4H8v2H6v3H4V7H2v2h2v2h2v2H2v2h4v2H4v2H2v2h2v-2h2v3h12v-3h2v2h2v-2h-2v-2h-2v-2h4v-2h-4v-2h2V9h2V7h-2v2h-2V6h-2V4ZM8 20V8h8v12H8Zm8-16V2h2v2h-2Z",
])
export const PixelRun = pixelIcon("PixelRun", ["M2 5h20v14H2V5zm18 12V7H4v10h16zM8 9h2v2h2v2h-2v2H8v-2H6v-2h2V9zm6 0h2v2h-2V9zm4 4h-2v2h2v-2z"])
export const PixelRedo = pixelIcon("PixelRedo", ["M16 4h-2v2h2v2H6v2H4v8h2v2h6v-2H6v-8h10v2h-2v2h2v-2h2v-2h2V8h-2V6h-2V4z"])
export const PixelSave = pixelIcon("PixelSave", ["M4 2h14v2H4v16h2v-6h12v6h2V6h2v16H2V2h2zm4 18h8v-4H8v4zM20 6h-2V4h2v2zM6 6h9v4H6V6z"])
export const PixelSearch = pixelIcon("PixelSearch", [
  "M6 2h8v2H6V2zM4 6V4h2v2H4zm0 8H2V6h2v8zm2 2H4v-2h2v2zm8 0v2H6v-2h8zm2-2h-2v2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm0-8h2v8h-2V6zm0 0V4h-2v2h2z",
])
export const PixelStop = pixelIcon("PixelStop", [
  "M6 2h2v2H6V2Zm10 2h-2v2h-4V4H8v2H6v3H4V7H2v2h2v2h2v2H2v2h4v2H4v2H2v2h2v-2h2v3h8v-2H8V8h8v6h2v-3h2V9h2V7h-2v2h-2V6h-2V4Zm0 0V2h2v2h-2Zm-6 7h4v2h-4v-2Zm4 4h-4v2h4v-2Zm8 1h-6v6h6v-6Z",
])
export const PixelUndo = pixelIcon("PixelUndo", ["M8 4h2v2H8V4zm10 6V8H8V6H6v2H4v2h2v2h2v2h2v-2H8v-2h10zm0 8v-8h2v8h-2zm0 0v2h-6v-2h6z"])
