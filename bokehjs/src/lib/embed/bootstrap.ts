type BokehAPI = {
  version?: string
  mount_embed_declaration?(script: HTMLScriptElement | null): Promise<unknown>
}

const declaration = document.currentScript instanceof HTMLScriptElement ? document.currentScript : null

async function publish_failure(cause: unknown): Promise<void> {
  if (document.readyState == "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, {once: true}))
  }
  const instance = declaration?.dataset.bokehEmbedInstance
  const error = Object.assign(new Error(cause instanceof Error ? cause.message : `${cause}`), {
    name: "BokehMountError" as const,
    kind: "resource" as const,
    phase: "bootstrap" as const,
    cause,
    source: {kind: "embed-declaration" as const, embed: instance, url: declaration?.dataset.bokehPayloadUrl},
  })
  for (const target of document.querySelectorAll<HTMLElement>(
    "[data-bokeh-embed-instance]:is([data-bokeh-root], [data-bokeh-document-target])",
  )) {
    if (target.dataset.bokehEmbedInstance == instance && target.bokehMount == null && target.bokehMountError == null) {
      target.bokehMountError = error
      target.removeAttribute("data-bokeh-mounted")
      target.dispatchEvent(new CustomEvent("bokeh:mount-error", {detail: error}))
    }
  }
}

void (async () => {
  const deadline = Date.now() + 30_000
  const runtime = globalThis as typeof globalThis & {Bokeh?: BokehAPI}
  while (runtime.Bokeh == null) {
    if (Date.now() >= deadline) {
      throw new Error("BokehJS did not load before the embed bootstrap timeout")
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  if (typeof runtime.Bokeh.mount_embed_declaration != "function") {
    throw new Error(`Loaded BokehJS ${runtime.Bokeh.version ?? "runtime"} does not support embed declarations. Load a runtime with mount_embed_declaration().`)
  }
  await runtime.Bokeh.mount_embed_declaration(declaration)
})().catch(async (error: unknown) => {
  console.error("Failed to mount Bokeh embed", error)
  await publish_failure(error)
})

export {}
