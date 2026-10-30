// Joins class names and lets later Tailwind classes override earlier ones:
// cn("px-2", isWide && "px-4") -> "px-4".
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
