type BokehAPI = {
  mount_embed_declaration(script: HTMLScriptElement | null): Promise<unknown>
}

const Bokeh = (globalThis as typeof globalThis & {Bokeh?: BokehAPI}).Bokeh
const script = document.currentScript instanceof HTMLScriptElement ? document.currentScript : null

if (Bokeh == null) {
  console.error("Failed to mount Bokeh embed: BokehJS is not loaded")
} else {
  void Bokeh.mount_embed_declaration(script).catch((error: unknown) => {
    console.error("Failed to mount Bokeh embed", error)
  })
}

export {}
