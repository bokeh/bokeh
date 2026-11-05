import {server_document} from "@bokeh/bokehjs"

import "../live.css"

const target = document.querySelector<HTMLElement>("#plot")!
const toggle = document.querySelector<HTMLButtonElement>("#toggle-session")!
const status = document.querySelector<HTMLElement>("#status")!
let mounted: ReturnType<typeof server_document> | null = null

async function connect(): Promise<void> {
  toggle.disabled = true
  status.textContent = "Connecting…"
  mounted = server_document("/bkapp", target)
  try {
    await mounted.ready
    toggle.textContent = "Disconnect"
    status.textContent = "Connected. The plot and controls are synchronized with Python."
  } catch (error) {
    mounted = null
    toggle.textContent = "Connect a new session"
    status.textContent = `Connection failed: ${error instanceof Error ? error.message : String(error)}`
  } finally {
    toggle.disabled = false
  }
}

toggle.addEventListener("click", async () => {
  if (mounted == null) {
    await connect()
  } else {
    toggle.disabled = true
    await mounted.dispose()
    mounted = null
    toggle.textContent = "Connect a new session"
    status.textContent = "Disconnected. The views, connection, and client document have been released."
    toggle.disabled = false
  }
})

void connect()
