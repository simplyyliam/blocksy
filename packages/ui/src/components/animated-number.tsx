// AnimatedNumber: a number whose digits roll when it changes (e.g. the project count).
// A thin Blocksy adapter over NumberFlow (plan rule 6), like ElapsedTime.
import NumberFlow from "@number-flow/react"

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return <NumberFlow value={value} className={className} style={{ fontVariantNumeric: "tabular-nums" }} />
}
