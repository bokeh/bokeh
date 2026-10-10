import {jupyterServerBaseUrl, resolveJupyterApplicationArtifact} from "./host"
import {BokehNotebookError, DisplayPayload, ResourceRecord} from "./protocol"
import {KernelProxy, LiveConnection, currentDocumentSnapshot, renderDiagnostic, renderDisplay, renderLoading} from "./runtime"
import {dataViews, LiveRevisionTransport, withTimeout} from "./transport"

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

type Snapshot = {artifactJson: string, resourceId: string, revision: number}
type ResourceWaiter = {
  resolve(record: ResourceRecord): void
  reject(error: unknown): void
}

type Deferred<T> = {
  promise: Promise<T>
  resolve(value: T): void
  reject(error: unknown): void
}

function deferred<T>(): Deferred<T> {
  const handlers: Omit<Deferred<T>, "promise"> = {
    resolve: () => undefined,
    reject: () => undefined,
  }
  const promise = new Promise<T>((resolve, reject) => {
    handlers.resolve = resolve
    handlers.reject = reject
  })
  return {promise, ...handlers}
}

export default function anywidgetFactory() {
  const initialize = (_context: AnyWidgetContext) => undefined

  const render = async ({model, el, signal}: AnyWidgetRenderContext) => {
    const frontendId = crypto.randomUUID()
    const send = (data: Record<string, unknown>) => model.send({...data, frontend_id: frontendId})
    const payload = model.get("payload") as DisplayPayload
    const html = String(model.get("html") ?? "")
    let snapshot: Snapshot | undefined
    const snapshotReady = deferred<Snapshot>()
    let applicationArtifact: string | undefined
    const applicationOpened = deferred<string>()
    let liveClosed = false
    const liveCloseListeners = new Set<() => void>()
    let applicationClosed = false
    const applicationCloseListeners = new Set<() => void>()
    const resourceWaiters = new Map<string, ResourceWaiter>()
    let resourceSequence = 0
    let deactivated = false
    let disposedSent = false
    let deactivate: (kind?: "inactive" | "disposed") => void = () => undefined
    const revisions = new LiveRevisionTransport(
      () => send({kind: "resync"}),
      () => {
        liveClosed = true
        for (const listener of liveCloseListeners) listener()
        deactivate()
      },
    )

    const receive = async (data: any, buffers: ArrayBufferView[] = []) => {
      if (data?.frontend_id !== frontendId) return
      if (data?.kind === "patch" && Number.isSafeInteger(data.revision)) {
        revisions.receive(data, dataViews(buffers))
      } else if (data?.kind === "snapshot" && typeof data.artifact === "string" &&
          typeof data.resource_id === "string" && Number.isSafeInteger(data.revision)) {
        const initial = snapshot == null
        snapshot = {artifactJson: data.artifact, resourceId: data.resource_id, revision: data.revision}
        liveClosed = false
        snapshotReady.resolve(snapshot)
        if (initial) revisions.reset(data.revision)
        else revisions.receive(data)
      } else if (data?.kind === "configure" && typeof data.artifact === "string") {
        try {
          const artifact = JSON.parse(await resolveJupyterApplicationArtifact(data.artifact, jupyterServerBaseUrl()))
          const applicationUrl = artifact?.source?.url
          if (typeof applicationUrl !== "string" || applicationUrl.length === 0) {
            throw new Error("the application artifact does not contain a server URL")
          }
          send({kind: "application_url", application_url: applicationUrl})
        } catch (error) {
          applicationOpened.reject(new BokehNotebookError(
            "APPLICATION_ARTIFACT_INVALID",
            "Python returned an invalid application configuration artifact.",
            "Restart the kernel and re-run the cells that call serve(...) and show(app).",
            error,
          ))
        }
      } else if (data?.kind === "ready" && typeof data.artifact === "string") {
        // Python has validated the URL selected from the configure artifact.
        // Resolving it again can nest a Jupyter proxy on remapped local ports.
        const artifactJson = data.artifact
        applicationArtifact = artifactJson
        applicationClosed = false
        applicationOpened.resolve(artifactJson)
      } else if (data?.kind === "ready") {
        applicationOpened.reject(new BokehNotebookError(
          "APPLICATION_ARTIFACT_INVALID",
          "Python opened the AnyWidget application-view channel without returning its artifact.",
          "Restart the kernel and re-run the cells that call serve(...) and show(app).",
        ))
      } else if (data?.kind === "close") {
        if (!liveClosed) {
          liveClosed = true
          for (const listener of liveCloseListeners) listener()
        }
        if (!applicationClosed) {
          applicationClosed = true
          for (const listener of applicationCloseListeners) listener()
        }
        deactivate()
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
        snapshotReady.reject(error)
        applicationOpened.reject(error)
        for (const waiter of resourceWaiters.values()) waiter.reject(error)
        resourceWaiters.clear()
      }
    }
    model.on("msg:custom", receive)
    const heartbeat = window.setInterval(() => {
      if (deactivated) return
      try {
        send({kind: "heartbeat"})
      } catch {
        deactivate()
      }
    }, 15_000)
    const aborted = () => deactivate("disposed")
    signal.addEventListener("abort", aborted, {once: true})
    deactivate = (kind = "inactive") => {
      if (!deactivated) {
        deactivated = true
        window.clearInterval(heartbeat)
        model.off("msg:custom", receive)
        const error = signal.reason ?? new DOMException("Rendering was cancelled", "AbortError")
        for (const waiter of resourceWaiters.values()) waiter.reject(error)
        resourceWaiters.clear()
        revisions.clear()
        liveCloseListeners.clear()
        applicationCloseListeners.clear()
        if (kind === "inactive") {
          try {
            send({kind})
          } catch {
            // The host may close its comm before releasing the mounted widget.
          }
        }
      }
      if (kind === "disposed" && !disposedSent) {
        disposedSent = true
        signal.removeEventListener("abort", aborted)
        try {
          send({kind})
        } catch {
          // The host may destroy its comm before disposing the mounted widget.
        }
      }
    }
    try {
      send({kind: "active"})
    } catch (error) {
      deactivate("disposed")
      throw error
    }

    const kernel: KernelProxy = {
      async requestResource(resourceId) {
        const requestId = `${resourceId}:${++resourceSequence}`
        const response = new Promise<ResourceRecord>((resolve, reject) => {
          resourceWaiters.set(requestId, {resolve, reject})
        })
        try {
          send({kind: "request_resource", request_id: requestId, resource_id: resourceId})
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
          return await withTimeout(response, 5000, new BokehNotebookError(
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
        const current = snapshot ?? await withTimeout(snapshotReady.promise, 5000, new BokehNotebookError(
          "ANYWIDGET_LIVE_CONNECTION_TIMEOUT",
          "Python did not open the AnyWidget live document channel within 5000 ms.",
          "Check that the kernel is still running, then re-run show(plot).",
        ), signal)
        const subscriptions = new Set<() => void>()
        el.dataset.bokehAnywidgetLive = "connected"
        return {
          artifactJson: current.artifactJson,
          resourceId: current.resourceId,
          revision: current.revision,

          onMessage(callback) {
            const listener = async (message: any, buffers: DataView[]) => {
              const count = Number(el.dataset.bokehAnywidgetMessages ?? "0") + 1
              el.dataset.bokehAnywidgetMessages = String(count)
              await callback(message, buffers)
            }
            revisions.subscribe(listener)
            subscriptions.add(() => revisions.unsubscribe(listener))
          },

          onClose(callback) {
            liveCloseListeners.add(callback)
            subscriptions.add(() => liveCloseListeners.delete(callback))
            if (liveClosed) queueMicrotask(callback)
          },

          requestResync() {
            revisions.requestResync()
          },

          close() {
            for (const unsubscribe of subscriptions) unsubscribe()
            subscriptions.clear()
            deactivate()
          },
        }
      },

      async openApplicationView(_viewId) {
        const artifactJson = applicationArtifact ?? await withTimeout(applicationOpened.promise, payload.connect_timeout, new BokehNotebookError(
          "ANYWIDGET_APPLICATION_CONNECTION_TIMEOUT",
          "Python did not open the AnyWidget application-view channel in time.",
          "Check that the kernel and ASGI application are still running, then re-run show(app).",
        ), signal)
        const subscriptions = new Set<() => void>()
        return {
          artifactJson,

          onClose(callback: () => void) {
            applicationCloseListeners.add(callback)
            subscriptions.add(() => applicationCloseListeners.delete(callback))
            if (applicationClosed) queueMicrotask(callback)
          },

          close() {
            for (const unsubscribe of subscriptions) unsubscribe()
            subscriptions.clear()
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
        deactivate()
      }
    } catch (error) {
      removeLoading()
      deactivate("disposed")
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        renderDiagnostic(el, error, {payload, renderer: "anywidget"})
      }
    }
  }

  return {initialize, render}
}
