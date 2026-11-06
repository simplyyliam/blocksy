// @blocksy/ui: design system: tokens, themes (Modern, Minecraft) and shadcn/ui components.
// Public API of this package. Other packages may import only from here
// (plus `@blocksy/ui/styles.css`, which the app imports once).
// UI components are shadcn/ui (src/components/ui, added with the shadcn CLI);
// write a custom component only when shadcn has nothing that fits.
export { cn } from "./lib/utils.ts"
export { applyTheme } from "./theme/apply.ts"
export { modernTheme } from "./theme/modern.ts"
export { minecraftTheme } from "./theme/minecraft.ts"
export { useThemeToken } from "./theme/use-token.ts"

export { Badge, badgeVariants } from "./components/ui/badge.tsx"
export { Button, buttonVariants } from "./components/ui/button.tsx"
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible.tsx"
export {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "./components/ui/dialog.tsx"
export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./components/ui/field.tsx"
export { Input } from "./components/ui/input.tsx"
export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./components/ui/input-group.tsx"
export { Label } from "./components/ui/label.tsx"
export { Progress } from "./components/ui/progress.tsx"
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select.tsx"
export { Separator } from "./components/ui/separator.tsx"
export { Toaster } from "./components/ui/sonner.tsx"
export { Spinner } from "./components/ui/spinner.tsx"
export { Toggle } from "./components/ui/toggle.tsx"
export { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group.tsx"
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip.tsx"
export { toast } from "sonner"
export {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "./components/ui/sidebar.tsx"
export {
  ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtSearchResult, ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./components/ai-elements/chain-of-thought.tsx"
export { Shimmer } from "./components/ai-elements/shimmer.tsx"
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./components/ui/breadcrumb.tsx"
export {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./components/ui/dropdown-menu.tsx"
export { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "./components/ui/item.tsx"
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card.tsx"
export { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "./components/ui/context-menu.tsx"
export { Switch } from "./components/ui/switch.tsx"
export { Slider } from "./components/ui/slider.tsx"
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs.tsx"
export { Kbd, KbdGroup } from "./components/ui/kbd.tsx"
// Small "make it alive" pieces from shadcn registries (assistant-ui, Magic UI), stock files:
export { DotMatrix, dotMatrixStates, type DotMatrixState } from "./components/ui/dot-matrix.tsx"
export { DotPattern } from "./components/ui/dot-pattern.tsx"
export { Confetti, ConfettiButton, type ConfettiRef } from "./components/ui/confetti.tsx"
export { BlurFade } from "./components/ui/blur-fade.tsx" // v0.3: History entries fade in
// Blocksy-only pieces (shadcn has nothing like them):
export { CodeView, languageOf, type CodeLanguage } from "./components/code-view.tsx"
export { InspectorField, InspectorSection, InspectorTabs, NumberInput, type InspectorTab } from "./components/inspector.tsx"
export { AnimatedNumber } from "./components/animated-number.tsx"
export { ElapsedTime } from "./components/elapsed-time.tsx"
export { ProjectCover } from "./components/project-cover.tsx"
export { PixelBurst } from "./components/pixel-burst.tsx"
export { PixelLoader } from "./components/pixel-loader.tsx"
export { CanvasLoader } from "./components/canvas-loader.tsx"
export { CanvasBackdrop } from "./components/canvas-backdrop.tsx" // v0.3: cheap dot grid behind canvases
export { GridPattern } from "./components/ui/grid-pattern.tsx"
// v0.3: pickers for items and tags (recipes, tags editor) and multi-line text (tooltips).
export {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxList, ComboboxSeparator,
  ComboboxTrigger, ComboboxValue, ComboboxCollection,
} from "./components/ui/combobox.tsx"
export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./components/ui/popover.tsx"
export { Textarea } from "./components/ui/textarea.tsx"
// v0.4 editor shell: menu bar, command palette, resizable panels.
export {
  Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu, MenubarSeparator, MenubarShortcut,
  MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger,
} from "./components/ui/menubar.tsx"
export {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "./components/ui/command.tsx"
export { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable.tsx"
export { usePanelRef } from "react-resizable-panels" // handle to collapse/expand a panel from a command
export { Checkbox } from "./components/ui/checkbox.tsx"
export * from "./components/pixel-icons.tsx"
// v0.4 Minecraft renderer (ADR 0011): canvas drawing in the game's own look, assets from the app.
export { McMissing, McScreen, type McGraphics, type McSlotRect } from "./minecraft/screen.tsx"
export { MinecraftProvider, useMinecraft } from "./minecraft/provider.tsx"
export { drawCube, drawGuiSprite, drawModel, drawRegion, drawSprite, drawText, frameIndexAt, isAnimated, measureText, poseProject, projectModel, TICK_MS } from "./minecraft/graphics.ts"
export { drawMcItem } from "./minecraft/item.ts"
export { McItemIcon } from "./minecraft/item-icon.tsx"
export type { ItemRender, McAssets, McFont, McGlyph, McItem, McNeeds, McSprite, McStatus, ModelFace, NineSliceBorder, SpriteScaling, Vec3 } from "./minecraft/types.ts"
export { McStage } from "./minecraft/stage.tsx"
