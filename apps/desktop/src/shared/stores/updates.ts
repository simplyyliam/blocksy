// The auto-updater as seen by the UI: its state and the "restart to update" action.
import { create } from "zustand"
import { commands, events, type UpdateState } from "../bindings"
import { call } from "../api"

interface UpdatesState {
  state: UpdateState
  version: string | null
  message: string | null
  install(): Promise<void>
  checkNow(): Promise<string | null>
}

export const useUpdates = create<UpdatesState>(() => ({
  state: "disabled",
  version: null,
  message: null,
  install: async () => void (await call(commands.installUpdate())),
  checkNow: () => call(commands.checkForUpdates()),
}))

export async function listenToUpdates() {
  const now = await commands.updateStatus()
  useUpdates.setState({ state: now.state, version: now.version, message: now.message })
  await events.updateStatus.listen(({ payload }) =>
    useUpdates.setState({ state: payload.state, version: payload.version, message: payload.message }),
  )
}
