// Turns a generated command result ({ status: "ok", data } | { status: "error", error })
// into a plain value, or throws a CommandError carrying the AppError code.
// Usage: const dir = await call(commands.defaultProjectsDir())
import type { AppError, ErrorCode } from "./bindings"

export class CommandError extends Error {
  readonly code: ErrorCode
  constructor(error: AppError) {
    super(error.message)
    this.code = error.code
  }
}

type CommandResult<T> = { status: "ok"; data: T } | { status: "error"; error: AppError }

export async function call<T>(result: Promise<CommandResult<T>>): Promise<T> {
  const r = await result
  if (r.status === "error") throw new CommandError(r.error)
  return r.data
}

/** A readable message for any error, for toasts and inline errors. */
export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))
