import {
  BokehNotebookError,
  DisplayPayload,
  ResourcePayload,
  assertProtocol,
} from "./protocol"
import {withTimeout} from "./transport"

declare global {
  interface Window {
    Bokeh?: NotebookBokehRuntime
  }
}

interface NotebookBokehMount {
  readonly ready: Promise<void>
  readonly document: any
  readonly root_keys: readonly string[]
  readonly view_lookup: unknown
  root(key: string): any
  dispose(): Promise<void>
}

interface NotebookBokehRuntime {
  readonly version: string
  mount(source: any, targetOrOptions: any, options?: any): NotebookBokehMount
  when_mounted(target: HTMLElement, options?: {signal?: AbortSignal}): Promise<NotebookBokehMount>
  publish_mount_error?(target: HTMLElement, error: unknown): void
  MountError?: new(kind: string, message: string, cause?: unknown, rootKey?: string, phase?: string) => Error
  embed?: {create_notebook_patch_receiver?: (document: any, revision: number) => (message: any, buffers?: DataView[]) => void}
}

export interface ResourceRecord {payload: ResourcePayload, javascript: string}

export interface FrontendDocumentSnapshot {
  view_id: string
  artifact_json?: string
  width?: number
  error?: string
}

export interface LiveConnection {
  artifactJson: string
  resourceId: string
  revision: number
  onMessage(callback: (message: any, buffers: DataView[]) => void | Promise<void>): void
  onClose(callback: () => void): void
  requestResync(): void
  close(): void
}

export interface ApplicationViewConnection {
  onClose(callback: () => void): void
  close(): void
}

export interface KernelProxy {
  readonly scope?: object
  requestResource?(resourceId: string): Promise<ResourceRecord>
  openLive?(liveId: string): Promise<LiveConnection>
  openApplicationView?(viewId: string): Promise<ApplicationViewConnection>
  releaseView?(viewId: string): Promise<void>
}

export const STATIC_FALLBACK_ATTRIBUTE = "data-bokeh-notebook-static-fallback"

type ResourceState = {payload: ResourcePayload, ready: Promise<void>}
type ResourceWaiter = {scope?: object, resolve: (state: ResourceState) => void, reject: (error: unknown) => void}
type RenderedArtifactState = {artifact: any, mount: NotebookBokehMount}

const resources = new Map<string, ResourceState>()
const MAX_RESOURCE_RECORDS = 64
const resourceWaiters = new Map<string, Set<ResourceWaiter>>()
const renderedArtifacts = new WeakMap<HTMLElement, RenderedArtifactState>()

/** Serialize the models currently driving a mounted notebook output.
 *
 * This deliberately returns transient data without touching the MIME model.
 * The server-side exporter renders the document in a real browser and takes
 * one screenshot around every root, preserving canvas, WebGL, toolbar and DOM
 * output while keeping PNG bytes out of the live and saved notebook.
 */
export function currentDocumentSnapshot(node: HTMLElement, payload: DisplayPayload): FrontendDocumentSnapshot | undefined {
  const state = renderedArtifacts.get(node)
  if (state == null) return undefined
  try {
    const document = state.mount.document
    const roots = state.mount.root_keys.map((key: string) => {
      const root = state.mount.root(key)
      const index = document.roots().indexOf(root)
      if (index < 0) throw new Error(`mounted root ${key} is not a document root`)
      return {key, document: 0, root: index}
    })
    const artifact = {
      ...state.artifact,
      source: {kind: "standalone", documents: [document.to_json()]},
      roots,
      metadata: {...state.artifact.metadata, notebook_export: {view_id: payload.view_id}},
    }
    delete artifact.fingerprint
    const width = Math.ceil(node.getBoundingClientRect().width)
    return {
      view_id: payload.view_id,
      artifact_json: JSON.stringify(artifact),
      ...(width > 0 ? {width} : {}),
    }
  } catch (error) {
    return {
      view_id: payload.view_id,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    }
  }
}

function validateVersion(expected: string, pythonVersion?: string): void {
  const actual = window.Bokeh?.version
  if (actual !== expected) {
    throw new BokehNotebookError(
      "BOKEH_VERSION_MISMATCH",
      `Python produced this output with Bokeh ${pythonVersion ?? expected}, which expects BokehJS ${expected}, but the frontend loaded BokehJS ${actual ?? "unknown"}.`,
      "Restart the kernel and reload the notebook. If CDN resources are selected, verify that this Bokeh version is published.",
    )
  }
}

function safeUrl(value: string): string {
  try {
    const url = new URL(value, window.location.href)
    url.username = ""
    url.password = ""
    url.search = ""
    url.hash = ""
    url.pathname = url.pathname.replace(/\/bokeh-notebook\/[^/]+/, "/bokeh-notebook/[redacted]")
    return url.toString()
  } catch {
    return "[invalid URL omitted]"
  }
}

function safeMessage(value: string): string {
  return value.replace(/(?:https?|wss?):\/\/[^\s)]+/g, (url) => safeUrl(url))
}

function safeDetails(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[omitted]"
  if (value == null || typeof value === "boolean" || typeof value === "number") return value
  if (typeof value === "string") return value.length <= 300 ? safeMessage(value) : `[string omitted; ${value.length} characters]`
  if (Array.isArray(value)) return value.length <= 20
    ? value.map((item) => safeDetails(item, depth + 1))
    : `[array omitted; ${value.length} items]`
  if (typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      result[key] = key === "artifact_json" || key === "artifact" || key === "javascript" || key === "value"
        ? typeof item === "string" ? `[omitted; ${item.length} characters]` : "[omitted]"
        : key === "url" && typeof item === "string"
          ? safeUrl(item)
          : safeDetails(item, depth + 1)
    }
    return result
  }
  return safeMessage(String(value))
}

async function copyReport(report: string, pre: HTMLElement, status: HTMLElement): Promise<void> {
  try {
    if (navigator.clipboard == null) throw new Error("Clipboard API unavailable")
    await navigator.clipboard.writeText(report)
    status.textContent = "Report copied to the clipboard."
    return
  } catch {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(pre)
    selection?.removeAllRanges()
    selection?.addRange(range)
    try {
      if (document.execCommand("copy")) {
        status.textContent = "Report copied to the clipboard."
        return
      }
    } catch {
      // Keep the report selected for a manual copy.
    }
    status.textContent = "Clipboard access is unavailable. The report is selected; press Ctrl+C or Command+C to copy it."
  }
}

export function renderLoading(node: HTMLElement, message: string): () => void {
  const status = document.createElement("div")
  status.className = "bk-notebook-loading"
  status.setAttribute("role", "status")
  status.setAttribute("aria-live", "polite")
  status.style.cssText = "padding:8px;color:#555;font:13px/1.4 system-ui,sans-serif"
  status.textContent = message
  node.append(status)
  return () => status.remove()
}

export function renderDiagnostic(node: HTMLElement, error: unknown, context: Record<string, unknown> = {}): void {
  const diagnostic = error instanceof BokehNotebookError ? error : new BokehNotebookError(
    "UNEXPECTED_RENDER_ERROR",
    error instanceof Error ? error.message : String(error),
    "Open the details below, then check the browser console and kernel output.",
    error,
  )
  node.replaceChildren()
  const panel = document.createElement("div")
  panel.className = "bk-notebook-diagnostic"
  panel.setAttribute("role", "alert")
  panel.style.cssText = "border:1px solid #c33;border-left-width:5px;padding:12px;background:#fff5f5;color:#222;font:13px/1.4 system-ui,sans-serif"
  const title = document.createElement("strong")
  title.textContent = `Bokeh notebook error: ${diagnostic.code}`
  const message = document.createElement("p")
  message.textContent = diagnostic.message
  const action = document.createElement("p")
  action.textContent = `Suggested action: ${diagnostic.action}`
  const details = document.createElement("details")
  const summary = document.createElement("summary")
  summary.textContent = "Technical details"
  const pre = document.createElement("pre")
  pre.style.whiteSpace = "pre-wrap"
  const report = JSON.stringify({
    code: diagnostic.code,
    message: safeMessage(diagnostic.message),
    context: safeDetails(context),
    cause: diagnostic.cause instanceof Error ? safeMessage(diagnostic.cause.stack ?? diagnostic.cause.message) : safeDetails(diagnostic.cause),
    user_agent: safeMessage(navigator.userAgent),
  }, null, 2)
  pre.textContent = report
  const copy = document.createElement("button")
  copy.type = "button"
  copy.textContent = "Copy report"
  const copyStatus = document.createElement("span")
  copyStatus.className = "bk-notebook-copy-status"
  copyStatus.setAttribute("role", "status")
  copyStatus.setAttribute("aria-live", "polite")
  copyStatus.style.marginLeft = "8px"
  copy.addEventListener("click", () => void copyReport(report, pre, copyStatus))
  details.append(summary, pre, copy, copyStatus)
  panel.append(title, message, action, details)
  node.append(panel)
}

function resolveResourceWaiters(resourceId: string, state: ResourceState): void {
  const waiters = resourceWaiters.get(resourceId)
  if (waiters == null) return
  resourceWaiters.delete(resourceId)
  for (const waiter of waiters) waiter.resolve(state)
}

function markResourceNode(payload: ResourcePayload, node: HTMLElement): void {
  node.dataset.bokehResources = payload.resource_id
  if (payload.warnings.length === 0 || node.querySelector(".bk-notebook-resource-warning") != null) return
  node.dataset.bokehResourceWarnings = String(payload.warnings.length)
  const warning = document.createElement("details")
  warning.className = "bk-notebook-resource-warning"
  warning.setAttribute("role", "status")
  const summary = document.createElement("summary")
  summary.textContent = `Bokeh resource warning${payload.warnings.length === 1 ? "" : "s"}`
  const list = document.createElement("ul")
  for (const text of payload.warnings) {
    const item = document.createElement("li")
    item.textContent = text
    list.append(item)
  }
  warning.append(summary, list)
  node.append(warning)
}

function waitForResourceRegistration(resourceId: string, milliseconds: number, scope?: object): Promise<ResourceState> {
  const existing = resources.get(resourceId)
  if (existing != null) return Promise.resolve(existing)
  return new Promise((resolve, reject) => {
    let timer = 0
    const waiter: ResourceWaiter = {
      scope,
      resolve: (state) => {
        window.clearTimeout(timer)
        resolve(state)
      },
      reject: (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    }
    const waiters = resourceWaiters.get(resourceId) ?? new Set<ResourceWaiter>()
    waiters.add(waiter)
    resourceWaiters.set(resourceId, waiters)
    timer = window.setTimeout(() => {
      if (!waiters.delete(waiter)) return
      if (waiters.size === 0) resourceWaiters.delete(resourceId)
      reject(new Error(`Resource ${resourceId} was not registered within ${milliseconds} ms`))
    }, milliseconds)
  })
}

function resourceExecution(payload: ResourcePayload, javascript: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    type Detail = {resource_id?: string, error?: unknown}
    let complete: (event: Event) => void
    let failed: (event: Event) => void
    const cleanup = () => {
      window.removeEventListener("bokeh:resources-complete", complete)
      window.removeEventListener("bokeh:resources-error", failed)
      signal.removeEventListener("abort", aborted)
    }
    complete = (event) => {
      if ((event as CustomEvent<Detail>).detail.resource_id !== payload.resource_id) return
      cleanup()
      resolve()
    }
    failed = (event) => {
      const detail = (event as CustomEvent<Detail>).detail
      if (detail.resource_id !== payload.resource_id) return
      cleanup()
      reject(detail.error ?? new Error("resource loader failed"))
    }
    const aborted = () => {
      cleanup()
      reject(signal.reason ?? new DOMException("Resource loading was cancelled", "AbortError"))
    }
    window.addEventListener("bokeh:resources-complete", complete)
    window.addEventListener("bokeh:resources-error", failed)
    signal.addEventListener("abort", aborted, {once: true})
    const script = document.createElement("script")
    script.dataset.bokehResourceId = payload.resource_id
    const nonce = payload.policy.nonce
    if (typeof nonce === "string" && nonce.length != 0) script.nonce = nonce
    script.textContent = javascript
    document.head.append(script)
    script.remove()
  })
}

function dependencyCycle(path: readonly string[], resourceId: string): BokehNotebookError {
  const start = path.indexOf(resourceId)
  const cycle = [...path.slice(start), resourceId]
  return new BokehNotebookError(
    "RESOURCE_DEPENDENCY_CYCLE",
    `BokehJS resource records contain a dependency cycle: ${cycle.join(" -> ")}.`,
    "Re-run the cells that published these resources. If the problem persists, restart the kernel and reload the notebook.",
    {cycle},
  )
}

export async function loadResources(payload: ResourcePayload, javascript: string, node: HTMLElement, kernel?: KernelProxy,
    path: readonly string[] = []): Promise<void> {
  assertProtocol(payload)
  if (path.includes(payload.resource_id)) throw dependencyCycle(path, payload.resource_id)
  const existing = resources.get(payload.resource_id)
  if (existing != null) {
    await existing.ready
    markResourceNode(payload, node)
    return
  }

  let state!: ResourceState
  const ready = (async () => {
    for (const dependency of payload.dependencies) {
      await requireResources(
        dependency, payload.bokeh_version, payload.python_version, kernel, payload.load_timeout,
        [...path, payload.resource_id],
      )
    }
    if (javascript.length === 0) {
      if (window.Bokeh != null) {
        validateVersion(payload.bokeh_version, payload.python_version)
        return
      }
      throw new BokehNotebookError(
        "RESOURCE_SOURCE_MISSING",
        `The ${payload.mode} resource record does not contain its portable JavaScript fallback.`,
        "Re-run the display cell; the extension will request the shared resource from the kernel.",
      )
    }
    const controller = new AbortController()
    const timeoutMessage = `Timed out after ${payload.load_timeout} ms`
    try {
      await withTimeout(
        resourceExecution(payload, javascript, controller.signal),
        payload.load_timeout,
        new Error(timeoutMessage),
        controller.signal,
      )
    } catch (cause) {
      const timedOut = cause instanceof Error && cause.message === timeoutMessage
      throw new BokehNotebookError(
        "RESOURCE_LOAD_FAILED",
        timedOut
          ? `BokehJS did not finish loading ${payload.mode} resources within ${payload.load_timeout} ms.`
          : `BokehJS failed while loading ${payload.mode} resources.`,
        timedOut
          ? "Reload the notebook page before retrying or changing resource modes; a kernel restart alone is insufficient because the timed-out external script may still execute in this page."
          : payload.mode === "cdn"
            ? "Check network access or use show(plot, resources=INLINE)."
            : `Verify the resource URLs are reachable: ${payload.artifacts.map((item) => item.url).filter(Boolean).join(", ") || "inline resource output"}.`,
        cause,
      )
    } finally {
      controller.abort()
    }
    validateVersion(payload.bokeh_version, payload.python_version)
  })()

  state = {payload, ready}
  resources.set(payload.resource_id, state)
  while (resources.size > MAX_RESOURCE_RECORDS) {
    const oldest = resources.keys().next().value as string | undefined
    if (oldest == null || oldest === payload.resource_id) break
    resources.delete(oldest)
  }
  resolveResourceWaiters(payload.resource_id, state)
  try {
    await ready
    markResourceNode(payload, node)
    if (payload.warnings.length !== 0) {
      console.warn("Bokeh resource warnings:", ...payload.warnings)
    }
  } catch (error) {
    resources.delete(payload.resource_id)
    throw error
  }
}

async function requireResources(resourceId: string, version: string, pythonVersion: string | undefined,
    kernel: KernelProxy | undefined, waitTimeout: number, path: readonly string[] = []): Promise<void> {
  if (path.includes(resourceId)) throw dependencyCycle(path, resourceId)
  let state = resources.get(resourceId)
  if (state == null && kernel?.requestResource != null) {
    try {
      const record = await kernel.requestResource(resourceId)
      await loadResources(record.payload, record.javascript, document.createElement("div"), kernel, path)
      state = resources.get(resourceId)
    } catch (error) {
      if (error instanceof BokehNotebookError) throw error
      // An owner may be concurrently mounting from notebook model data.
    }
  }
  if (state == null) {
    try {
      state = await waitForResourceRegistration(resourceId, waitTimeout, kernel?.scope)
    } catch (cause) {
      throw new BokehNotebookError(
        "RESOURCE_RECORD_MISSING",
        `This output references shared BokehJS resources ${resourceId}, but that resource is unavailable in this notebook frontend and kernel.`,
        "Re-run this display cell. The Bokeh extension will republish a deleted resource owner automatically when the kernel still has it.",
        cause,
      )
    }
  }
  await state.ready
  validateVersion(version, pythonVersion)
}

function extractArtifact(payload: DisplayPayload, html: string): any {
  const template = document.createElement("template")
  template.innerHTML = html
  const source = template.content.querySelector<HTMLScriptElement>("script[data-bokeh-artifact-payload]")
  if (source == null) {
    throw new BokehNotebookError(
      "ARTIFACT_RECORD_MISSING",
      `The saved output does not contain artifact ${payload.artifact_fingerprint}.`,
      "Re-run the cell that displayed this output, then save the notebook again.",
    )
  }
  let artifact: any
  try {
    artifact = JSON.parse(source.textContent ?? "")
  } catch (cause) {
    throw new BokehNotebookError(
      "ARTIFACT_RECORD_INVALID",
      "The saved Bokeh artifact is not valid JSON.",
      "Re-run the cell that displayed this output, then save the notebook again.",
      cause,
    )
  }
  if (artifact?.schema !== "bokeh.embed/v1" || artifact.fingerprint !== payload.artifact_fingerprint ||
      artifact.source?.kind !== payload.source_kind) {
    throw new BokehNotebookError(
      "ARTIFACT_RECORD_INVALID",
      "The notebook display metadata does not match its versioned Bokeh artifact.",
      "Restart the kernel, re-run the cell, and save the notebook again.",
    )
  }
  return artifact
}

function artifactTargets(node: HTMLElement, artifact: any): {target?: HTMLElement, targets?: Map<string, HTMLElement>, roots: HTMLElement[]} {
  const roots: HTMLElement[] = []
  if (artifact.source.kind === "server" && artifact.roots.length === 0) {
    const target = document.createElement("div")
    target.className = "bk-embed-root"
    target.dataset.bokehRoot = "*"
    node.append(target)
    return {target, roots: [target]}
  }
  const targets = new Map<string, HTMLElement>()
  for (const descriptor of artifact.roots) {
    const target = document.createElement("div")
    target.className = "bk-embed-root"
    target.dataset.bokehRoot = descriptor.key
    node.append(target)
    targets.set(descriptor.key, target)
    roots.push(target)
  }
  return {targets, roots}
}

function renderDisconnected(node: HTMLElement, message: string, failure?: unknown): HTMLElement {
  const disconnected = document.createElement("div")
  disconnected.className = "bk-notebook-disconnected"
  disconnected.setAttribute("role", "status")
  disconnected.style.cssText = "margin:0 0 6px;padding:6px 9px;border-left:3px solid #b36b00;background:#fff8e6;color:#5c3b00;font:12px/1.4 system-ui,sans-serif"
  disconnected.textContent = message
  if (failure instanceof BokehNotebookError) disconnected.title = `${failure.code}: ${failure.message}`
  node.prepend(disconnected)
  return disconnected
}

async function renderArtifact(node: HTMLElement, payload: DisplayPayload, html: string,
    kernel?: KernelProxy, signal?: AbortSignal): Promise<() => void> {
  signal?.throwIfAborted()
  renderedArtifacts.delete(node)
  node.querySelectorAll(`.bk-notebook-loading, [${STATIC_FALLBACK_ATTRIBUTE}]`).forEach((element) => element.remove())
  let artifact = extractArtifact(payload, html)
  let live: LiveConnection | undefined
  let liveFailure: unknown
  if (payload.live_id != null) {
    try {
      if (kernel?.openLive == null) throw new BokehNotebookError(
        "LIVE_SYNC_UNAVAILABLE",
        "This notebook host cannot open Bokeh's live artifact channel.",
        "Use JupyterLab, Notebook, or AnyWidget with the bundled Bokeh integration.",
      )
      live = await kernel.openLive(payload.live_id)
      artifact = JSON.parse(live.artifactJson)
    } catch (error) {
      liveFailure = error
    }
  }

  const targets = artifactTargets(node, artifact)
  let mount: NotebookBokehMount | undefined
  let receivePatch: ((message: any, buffers?: DataView[]) => void) | undefined
  let viewConnection: ApplicationViewConnection | undefined
  let disconnected: HTMLElement | undefined
  let disposed = false
  const cleanupRoots = () => targets.roots.forEach((root) => root.remove())
  const publishPreHandleFailure = (cause: unknown) => {
    const runtime = window.Bokeh
    if (runtime?.publish_mount_error == null) return
    const error = runtime.MountError == null
      ? cause
      : new runtime.MountError(
        "source",
        "The notebook host failed before it could create a BokehMount.",
        cause,
        undefined,
        "bootstrap",
      )
    targets.roots.forEach((root) => runtime.publish_mount_error?.(root, error))
  }
  const mountArtifact = async (nextArtifact: any, resourceId: string, revision: number): Promise<void> => {
    await requireResources(
      resourceId,
      String(nextArtifact.bokeh_version ?? payload.bokeh_version),
      payload.python_version,
      kernel,
      5000,
    )
    signal?.throwIfAborted()
    const previous = mount
    const runtime = window.Bokeh
    if (runtime == null) throw new Error("BokehJS is unavailable after resource loading")
    let next: NotebookBokehMount
    try {
      next = targets.target != null
        ? runtime.mount(nextArtifact, targets.target, {resources: "none", signal})
        : runtime.mount(nextArtifact, {targets: targets.targets, resources: "none", signal})
    } catch (cause) {
      publishPreHandleFailure(cause)
      throw cause
    }
    try {
      await withTimeout(
        next.ready,
        payload.connect_timeout,
        new Error(`Timed out after ${payload.connect_timeout} ms`),
        signal,
      )
      const published = await Promise.all(targets.roots.map((root) => runtime.when_mounted(root, {signal})))
      if (published.some((handle) => handle !== next) || next.view_lookup == null) {
        throw new BokehNotebookError(
          "MOUNT_OWNERSHIP_FAILED",
          "The notebook output did not publish its BokehMount on every owned target.",
          "Reload the notebook page, then re-run the display cell.",
        )
      }
    } catch (error) {
      void next.dispose?.()
      throw error
    }
    mount = next
    void previous?.dispose?.()
    artifact = nextArtifact
    renderedArtifacts.set(node, {artifact, mount})
    receivePatch = live == null
      ? undefined
      : runtime.embed?.create_notebook_patch_receiver?.(mount.document, revision)
    if (live != null && receivePatch == null) {
      throw new BokehNotebookError(
        "LIVE_SYNC_SETUP_FAILED",
        "The mounted artifact could not attach its revisioned patch channel.",
        "Restart the kernel and reload the notebook, then re-run show(plot).",
      )
    }
  }
  try {
    if (payload.application_id != null) {
      if (kernel?.openApplicationView == null) {
        throw new BokehNotebookError(
          "APPLICATION_VIEW_UNAVAILABLE",
          "This notebook host cannot own a managed Bokeh application view.",
          "Use JupyterLab, Notebook, or AnyWidget with the bundled Bokeh integration.",
        )
      }
      viewConnection = await kernel.openApplicationView(payload.view_id)
    }
    await mountArtifact(artifact, live?.resourceId ?? payload.resource_id, live?.revision ?? 0)
    if (live != null) {
      live.onMessage(async (message, buffers) => {
        if (disposed) return
        try {
          if (message?.kind === "snapshot" && typeof message.artifact === "string" &&
              typeof message.resource_id === "string" && Number.isSafeInteger(message.revision)) {
            await mountArtifact(JSON.parse(message.artifact), message.resource_id, message.revision)
          } else {
            receivePatch?.(message, buffers)
          }
        } catch (error) {
          console.warn("Bokeh live artifact requires a fresh snapshot", error)
          live?.requestResync()
        }
      })
    } else if (payload.live_id != null) {
      disconnected = renderDisconnected(
        node,
        "Static artifact — not connected to Python. Re-run show(plot) to reconnect.",
        liveFailure,
      )
    }
  } catch (error) {
    live?.close()
    viewConnection?.close()
    void mount?.dispose?.()
    cleanupRoots()
    throw error
  }

  live?.onClose(() => {
    if (disposed || disconnected != null) return
    disconnected = renderDisconnected(
      node,
      "Static artifact — the Python connection closed. Re-run show(plot) to reconnect.",
    )
  })

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    disposed = true
    renderedArtifacts.delete(node)
    live?.close()
    viewConnection?.close()
    disconnected?.remove()
    void mount?.dispose?.()
    cleanupRoots()
  }
  viewConnection?.onClose(cleanup)
  if (signal?.aborted) {
    cleanup()
    signal.throwIfAborted()
  }
  return cleanup
}

function temporarilyAttachForRender(node: HTMLElement): () => void {
  if (node.isConnected) return () => undefined

  // Jupyter may ask a MIME renderer to render before attaching its Lumino
  // widget (and virtualized cells may remain detached). Give only genuinely
  // detached renderers a temporary light-DOM host. Reparenting a connected
  // shadow-DOM output breaks its host styling and lifecycle ownership.
  const parent = node.parentNode
  const next = node.nextSibling
  const host = document.createElement("div")
  host.setAttribute("aria-hidden", "true")
  host.style.cssText = "position:fixed;left:-200vw;top:0;width:100vw;visibility:hidden;pointer-events:none"
  document.body.append(host)
  host.append(node)
  return () => {
    if (host.contains(node)) {
      if (parent != null) {
        if (next != null && next.parentNode === parent) parent.insertBefore(node, next)
        else parent.appendChild(node)
      } else {
        node.remove()
      }
    }
    host.remove()
  }
}

export async function renderDisplay(node: HTMLElement, payload: DisplayPayload, html: string, kernel?: KernelProxy,
    signal?: AbortSignal): Promise<() => void> {
  assertProtocol(payload)
  signal?.throwIfAborted()
  const detachTemporaryHost = temporarilyAttachForRender(node)
  try {
    return await renderArtifact(node, payload, html, kernel, signal)
  } catch (cause) {
    if (cause instanceof BokehNotebookError) throw cause
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause
    throw new BokehNotebookError(
      payload.source_kind === "server" ? "APPLICATION_RENDER_FAILED" : "ARTIFACT_RENDER_FAILED",
      cause instanceof Error ? cause.message : String(cause),
      "Expand the technical details and check for a Python/BokehJS version mismatch or an unreachable application URL.",
      cause,
    )
  } finally {
    detachTemporaryHost()
  }
}

export function resetResourceRegistry(scope?: object): void {
  if (scope == null) resources.clear()
  for (const waiters of resourceWaiters.values()) {
    for (const waiter of [...waiters]) {
      if (scope != null && waiter.scope !== scope) continue
      waiters.delete(waiter)
      waiter.reject(new Error("Notebook kernel changed while waiting for resources"))
    }
  }
  for (const [resourceId, waiters] of resourceWaiters) {
    if (waiters.size === 0) resourceWaiters.delete(resourceId)
  }
}
