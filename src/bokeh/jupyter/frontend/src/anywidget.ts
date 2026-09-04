import {BokehNotebookError, DisplayPayload} from "./protocol"
import {KernelProxy, LiveConnection, ResourceRecord, currentDocumentSnapshot, renderDiagnostic, renderDisplay, renderLoading} from "./runtime"

// AnyWidget is a transport adapter, not a rendering implementation. It owns
// the comm queues and maps them onto renderDisplay(), which in turn owns the
// common artifact/resource/BokehMount lifecycle used by every notebook host.

type AnyModel = {
  get(name: string): any
  on(name: string, callback: (...args: any[]) => void): void
  off(name: string, callback: (...args: any[]) => void): void
  send(data: any, callbacks?: any, buffers?: ArrayBufferView[]): void
}

type AnyWidgetContext = {model: AnyModel, signal: AbortSignal}
type AnyWidgetRenderContext = AnyWidgetContext & {el: HTMLElement}

type Patch = {message: any, buffers: DataView[], bytes: number}
type Snapshot = {artifactJson: string, revision: number}
type ResourceWaiter = {
  resolve(record: ResourceRecord): void
  reject(error: unknown): void
}

export const ANYWIDGET_MAX_PENDING_PATCHES = 64
export const ANYWIDGET_MAX_PENDING_BYTES = 8 * 1024 * 1024

function waitForTransport<T>(promise: Promise<T>, milliseconds: number, error: BokehNotebookError,
    signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (callback: (value: any) => void, value: any) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      signal.removeEventListener("abort", aborted)
      callback(value)
    }
    const aborted = () => finish(reject, new DOMException("Rendering was cancelled", "AbortError"))
    const timer = window.setTimeout(() => finish(reject, error), milliseconds)
    signal.addEventListener("abort", aborted, {once: true})
    promise.then((value) => finish(resolve, value), (cause) => finish(reject, cause))
  })
}

function dataViews(buffers: ArrayBufferView[] = []): DataView[] {
  return buffers.map((buffer) => buffer instanceof DataView
    ? buffer
    : new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength))
}

export default function anywidgetFactory() {
  // initialize() may run before render() and patches may arrive before a view
  // exists. Keep one bounded, revisioned queue until render() attaches the
  // listener; overflow requests a complete snapshot instead of retaining an
  // unbounded or partially ordered history.
  let snapshot: Snapshot | undefined
  let snapshotResolve: ((value: Snapshot) => void) | undefined
  let snapshotReject: ((error: unknown) => void) | undefined
  const snapshotReady = new Promise<Snapshot>((resolve, reject) => {
    snapshotResolve = resolve
    snapshotReject = reject
  })
  const patches: Patch[] = []
  let patchBytes = 0
  let awaitingSnapshot = false
  const patchListeners = new Set<(message: any, buffers: DataView[]) => void>()
  let applicationReady = false
  let applicationResolve: (() => void) | undefined
  let applicationReject: ((error: unknown) => void) | undefined
  const applicationOpened = new Promise<void>((resolve, reject) => {
    applicationResolve = resolve
    applicationReject = reject
  })
  let liveClosed = false
  const liveCloseListeners = new Set<() => void>()
  let applicationClosed = false
  const applicationCloseListeners = new Set<() => void>()
  const resourceWaiters = new Map<string, ResourceWaiter>()
  let resourceSequence = 0

  const initialize = ({model, signal}: AnyWidgetContext) => {
    const receive = (data: any, buffers: ArrayBufferView[] = []) => {
      if (data?.kind === "patch" && Number.isSafeInteger(data.revision)) {
        if (awaitingSnapshot) return
        const views = dataViews(buffers)
        const bytes = views.reduce((total, view) => total + view.byteLength, JSON.stringify(data).length)
        const patch = {message: data, buffers: views, bytes}
        if (patchListeners.size === 0) {
          patches.push(patch)
          patchBytes += bytes
          if (patches.length > ANYWIDGET_MAX_PENDING_PATCHES || patchBytes > ANYWIDGET_MAX_PENDING_BYTES) {
            patches.length = 0
            patchBytes = 0
            awaitingSnapshot = true
            model.send({kind: "resync"})
          }
        } else {
          for (const listener of patchListeners) listener(patch.message, patch.buffers)
        }
      } else if (data?.kind === "snapshot" && typeof data.artifact === "string" && Number.isSafeInteger(data.revision)) {
        awaitingSnapshot = false
        snapshot = {artifactJson: data.artifact, revision: data.revision}
        patches.splice(0, patches.length, ...patches.filter((patch) => patch.message.revision > data.revision))
        patchBytes = patches.reduce((total, patch) => total + patch.bytes, 0)
        snapshotResolve?.(snapshot)
        if (patchListeners.size !== 0) {
          for (const listener of patchListeners) listener(data, [])
        }
      } else if (data?.kind === "ready") {
        applicationReady = true
        applicationResolve?.()
      } else if (data?.kind === "close") {
        if (!liveClosed) {
          liveClosed = true
          for (const listener of liveCloseListeners) listener()
        }
        if (!applicationClosed) {
          applicationClosed = true
          for (const listener of applicationCloseListeners) listener()
        }
      } else if (data?.kind === "resource" && typeof data.request_id === "string") {
        const waiter = resourceWaiters.get(data.request_id)
        if (waiter != null) {
          resourceWaiters.delete(data.request_id)
          waiter.resolve(data.record as ResourceRecord)
        }
      } else if (data?.kind === "resource_error" && typeof data.request_id === "string") {
        const waiter = resourceWaiters.get(data.request_id)
        if (waiter != null) {
          resourceWaiters.delete(data.request_id)
          waiter.reject(new BokehNotebookError(
            String(data.code ?? "RESOURCE_RECORD_MISSING"),
            String(data.message ?? "The requested BokehJS resource is unavailable."),
            "Re-run the display cell so Bokeh can republish its resource record.",
          ))
        }
      } else if (data?.kind === "error") {
        const error = new BokehNotebookError(
          String(data.code ?? "ANYWIDGET_TRANSPORT_ERROR"),
          String(data.message ?? "The Bokeh AnyWidget transport failed."),
          "Re-run the cell that called show(...).",
        )
        snapshotReject?.(error)
        applicationReject?.(error)
        for (const waiter of resourceWaiters.values()) waiter.reject(error)
        resourceWaiters.clear()
      }
    }
    model.on("msg:custom", receive)
    model.send({kind: "ready"})
    signal.addEventListener("abort", () => {
      // The AnyWidget abort signal is the host's release boundary. Reject
      // outstanding work, unsubscribe from the comm, and tell Python to drop
      // this view; render() separately disposes its BokehMount.
      const error = new DOMException("Rendering was cancelled", "AbortError")
      for (const waiter of resourceWaiters.values()) waiter.reject(error)
      resourceWaiters.clear()
      patches.length = 0
      patchBytes = 0
      patchListeners.clear()
      liveCloseListeners.clear()
      applicationCloseListeners.clear()
      model.off("msg:custom", receive)
      try {
        model.send({kind: "disposed"})
      } catch {
        // The host may close its comm before aborting the mounted widget.
      }
    }, {once: true})
  }

  const render = async ({model, el, signal}: AnyWidgetRenderContext) => {
    const payload = model.get("payload") as DisplayPayload
    const html = String(model.get("html") ?? "")

    const kernel: KernelProxy = {
      async requestResource(resourceId) {
        const requestId = `${resourceId}:${++resourceSequence}`
        const response = new Promise<ResourceRecord>((resolve, reject) => {
          resourceWaiters.set(requestId, {resolve, reject})
        })
        try {
          model.send({kind: "request_resource", request_id: requestId, resource_id: resourceId})
        } catch (cause) {
          resourceWaiters.delete(requestId)
          throw new BokehNotebookError(
            "ANYWIDGET_RESOURCE_REQUEST_FAILED",
            `The BokehJS resource ${resourceId} could not be requested from Python.`,
            "Check that the kernel is still running, then re-run the display cell.",
            cause,
          )
        }
        try {
          return await waitForTransport(response, 5000, new BokehNotebookError(
            "ANYWIDGET_RESOURCE_REQUEST_TIMEOUT",
            `Python did not return the BokehJS resource ${resourceId} within 5000 ms.`,
            "Check that the kernel is still running, then re-run the display cell.",
          ), signal)
        } finally {
          resourceWaiters.delete(requestId)
        }
      },
      async openLive(_liveId): Promise<LiveConnection> {
        // A newly rendered or reconnected view starts from the latest complete
        // snapshot, then drains only later queued revisions. This keeps every
        // frontend independent and avoids a page-global live document owner.
        const current = snapshot ?? await waitForTransport(snapshotReady, 5000, new BokehNotebookError(
          "ANYWIDGET_LIVE_CONNECTION_TIMEOUT",
          "Python did not open the AnyWidget live document channel within 5000 ms.",
          "Check that the kernel is still running, then re-run show(plot).",
        ), signal)
        let listener: ((message: any, buffers: DataView[]) => void) | undefined
        let closeListener: (() => void) | undefined
        el.dataset.bokehAnywidgetLive = "connected"
        return {
          artifactJson: current.artifactJson,
          revision: current.revision,
          onMessage(callback) {
            listener = (message, buffers) => {
              const count = Number(el.dataset.bokehAnywidgetMessages ?? "0") + 1
              el.dataset.bokehAnywidgetMessages = String(count)
              callback(message, buffers)
            }
            patchListeners.add(listener)
            for (const patch of patches.splice(0)) listener(patch.message, patch.buffers)
            patchBytes = 0
          },
          onClose(callback) {
            closeListener = callback
            liveCloseListeners.add(callback)
            if (liveClosed) queueMicrotask(callback)
          },
          requestResync() {
            model.send({kind: "resync"})
          },
          close() {
            if (listener != null) patchListeners.delete(listener)
            if (closeListener != null) liveCloseListeners.delete(closeListener)
          },
        }
      },
      async openApplicationView(_viewId) {
        if (!applicationReady) await waitForTransport(applicationOpened, payload.connect_timeout, new BokehNotebookError(
          "ANYWIDGET_APPLICATION_CONNECTION_TIMEOUT",
          "Python did not open the AnyWidget application-view channel in time.",
          "Check that the kernel and ASGI application are still running, then re-run show(app).",
        ), signal)
        let listener: (() => void) | undefined
        return {
          onClose(callback: () => void) {
            listener = callback
            applicationCloseListeners.add(callback)
            if (applicationClosed) queueMicrotask(callback)
          },
          close() {
            if (listener != null) applicationCloseListeners.delete(listener)
          },
        }
      },
    }

    const removeLoading = renderLoading(el, payload.source_kind === "server"
      ? "Connecting to Bokeh ASGI application…"
      : "Rendering Bokeh document…")
    try {
      const cleanup = await renderDisplay(el, payload, html, kernel, signal)
      removeLoading()
      const collect = (event: Event) => {
        const detail = (event as CustomEvent<{snapshots?: unknown[]}>).detail
        const snapshot = currentDocumentSnapshot(el, payload)
        if (snapshot != null && Array.isArray(detail?.snapshots)) detail.snapshots.push(snapshot)
      }
      window.addEventListener("bokeh:notebook-export-snapshots", collect)
      return () => {
        window.removeEventListener("bokeh:notebook-export-snapshots", collect)
        cleanup()
      }
    } catch (error) {
      removeLoading()
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        renderDiagnostic(el, error, {payload, renderer: "anywidget"})
      }
    }
  }

  return {initialize, render}
}
