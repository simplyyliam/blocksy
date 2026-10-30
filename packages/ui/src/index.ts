// @blocksy/ui: design system: tokens, themes (Modern, Minecraft) and shadcn/ui components.
// Public API of this package. Other packages may import only from here
// (plus `@blocksy/ui/styles.css`, which the app imports once).
// UI components are shadcn/ui (src/components/ui, added with the shadcn CLI);
// write a custom component only when shadcn has nothing that fits.
export { cn } from "./lib/utils.ts"
export { applyTheme } from "./theme/apply.ts"
export { modernTheme } from "./theme/modern.ts"

export { Badge, badgeVariants } from "./components/ui/badge.tsx"
export { Button, buttonVariants } from "./components/ui/button.tsx"
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible.tsx"
export {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "./components/ui/dialog.tsx"
export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./components/ui/field.tsx"
export { Input } from "./components/ui/input.tsx"
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
// Small "make it alive" pieces from shadcn registries (assistant-ui, Magic UI), stock files:
export { DotMatrix, dotMatrixStates, type DotMatrixState } from "./components/ui/dot-matrix.tsx"
export { DotPattern } from "./components/ui/dot-pattern.tsx"
export { Confetti, ConfettiButton, type ConfettiRef } from "./components/ui/confetti.tsx"
// Blocksy-only pieces (shadcn has nothing like them):
export { AnimatedNumber } from "./components/animated-number.tsx"
export { ElapsedTime } from "./components/elapsed-time.tsx"
export { ProjectCover } from "./components/project-cover.tsx"
export { PixelBurst } from "./components/pixel-burst.tsx"
export { PixelLoader } from "./components/pixel-loader.tsx"
