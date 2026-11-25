import { createAgent } from "@ui-sdk/react/agent"

export const uiAgent = createAgent()

if (typeof window !== "undefined") {
  ;(window as Window & { uiAgent?: typeof uiAgent }).uiAgent = uiAgent
}
