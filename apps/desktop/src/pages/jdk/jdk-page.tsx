// The JDK setup screen: shown from the status bar, or when Build/Run needs Java.
import { JdkSetup } from "../../features/jdk-setup/jdk-setup"
import { Page } from "../page"

export function JdkPage() {
  return (
    <Page title="Java">
      <JdkSetup />
    </Page>
  )
}
