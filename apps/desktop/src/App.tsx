// Imported only to prove workspace linking works; harmless data attribute.
import { PACKAGE_NAME } from "@blocksy/core"

export default function App(){
  return (
    <div className="" data-core={PACKAGE_NAME}></div>
  )
}
