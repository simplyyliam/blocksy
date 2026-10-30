// ElapsedTime: "3m 38s" where the digits roll smoothly as they change.
// A thin Blocksy adapter over NumberFlow (plan rule 6), so the app never imports it directly.
import NumberFlow, { NumberFlowGroup } from "@number-flow/react"

export function ElapsedTime({ seconds, className }: { seconds: number; className?: string }) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return (
    <NumberFlowGroup>
      <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
        {m > 0 && (
          <>
            <NumberFlow value={m} />m{" "}
          </>
        )}
        <NumberFlow value={s} />s
      </span>
    </NumberFlowGroup>
  )
}
