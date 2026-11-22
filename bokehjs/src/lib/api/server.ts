import {BokehMount} from "../embed/mount"
import type {MountOptions, MountTarget} from "../embed/mount"
import {EmbedError, embed_schema, prepare_embed} from "../embed/payload"
import type {EmbedPayload, ServerEmbedSource} from "../embed/payload"
import {version} from "../version"
import {prepare_builtin_models} from "./session"

/** Server bootstrap and lifecycle options for an application URL mount. */
export type ServerDocumentOptions = Omit<ServerEmbedSource, "kind" | "url"> & Omit<MountOptions, "resolver"> & {
  /** Prepare built-in models automatically in the npm runtime. Default: true. */
  register_builtin_models?: boolean
}

/**
 * Embed an application using its HTTP(S) URL and a DOM target or selector.
 * The server issues a token through `/embed.json`. The returned mount owns its
 * connection, document, and views. Await `ready` to render or `dispose()` to stop.
 */
export function server_document(app_url: string, target: MountTarget, options: ServerDocumentOptions = {}): BokehMount {
  const script = document.currentScript
  const controller = new AbortController()
  const {
    signal, use_for_title, on_error, resources = "none", register_builtin_models = true, ...source_options
  } = options
  const payload: EmbedPayload = {
    schema: embed_schema,
    bokeh_version: version,
    source: {
      ...Object.fromEntries(Object.entries<unknown>(source_options).filter(([, value]) => value !== undefined)),
      kind: "server", url: app_url,
    },
    roots: [],
    requires: {components: [], extensions: []},
    metadata: {},
  }
  // Defer preparation until the mount has installed its cancellation hook.
  const prepared = Promise.resolve().then(async () => {
    controller.signal.throwIfAborted()
    let all_builtin_models = false
    if (register_builtin_models) {
      let on_abort!: () => void
      const aborted = new Promise<never>((_, reject) => {
        on_abort = () => reject(controller.signal.reason)
        controller.signal.addEventListener("abort", on_abort, {once: true})
      })
      try {
        // Cancelling this mount must not wait for, or cancel, a shared import.
        all_builtin_models = await Promise.race([prepare_builtin_models(), aborted])
      } catch (error) {
        controller.signal.throwIfAborted()
        throw new EmbedError("resource", "failed to prepare built-in models", error, "resource", {kind: "embed", url: app_url})
      } finally {
        controller.signal.removeEventListener("abort", on_abort)
      }
    }
    controller.signal.throwIfAborted()
    // npm already prepared all built-ins. Script bundles can still need optional
    // components, while both runtimes use the host's policy for server extensions.
    return prepare_embed(payload, all_builtin_models ? "none" : resources, undefined, controller.signal, resources)
  })
  return new BokehMount(prepared, target, {signal, use_for_title, on_error}, script, (reason) => controller.abort(reason))
}
