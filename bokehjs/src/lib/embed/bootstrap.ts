type BokehAPI = {
  mount_embed_declaration(script: HTMLScriptElement | null): Promise<unknown>
}

const script = document.currentScript instanceof HTMLScriptElement ? document.currentScript : null

void (async () => {
  const deadline = Date.now() + 30_000
  const runtime = globalThis as typeof globalThis & {Bokeh?: BokehAPI}
  while (runtime.Bokeh == null) {
    if (Date.now() >= deadline) {
      throw new Error("BokehJS did not load before the embed bootstrap timeout")
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  await runtime.Bokeh.mount_embed_declaration(script)
})().catch((error: unknown) => {
  console.error("Failed to mount Bokeh embed", error)
})

export {}
