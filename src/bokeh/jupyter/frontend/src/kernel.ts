import {Kernel} from "@jupyterlab/services"
import {ReadonlyJSONObject} from "@lumino/coreutils"

import {ContextManager} from "./context"
import {BokehNotebookError} from "./protocol"
import {ApplicationViewConnection, KernelProxy, LiveConnection, ResourceRecord} from "./runtime"

const RESOURCE_COMM_TARGET = "bokeh.resources.v1"
const NOTEBOOK_COMM_TARGET = "bokeh.notebook.v1"

export function safelyCloseComm(comm: Kernel.IComm): void {
  try {
    const future = comm.close()
    void Promise.resolve(future.done).catch(() => undefined)
  } catch {
    // Jupyter may already have torn down the comm during a reload or restart.
  }
}

function views(buffers: readonly (ArrayBuffer | ArrayBufferView)[] | undefined): DataView[] {
  return (buffers ?? []).map((buffer) => {
    if (buffer instanceof DataView) return buffer
    if (ArrayBuffer.isView(buffer)) return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    return new DataView(buffer)
  })
}

export function kernelProxy(manager: ContextManager): KernelProxy {
  const current = () => manager.context.sessionContext.session?.kernel
  return {
    requestResource: async (resourceId) => {
      await manager.context.sessionContext.ready
      const kernel = current()
      if (kernel == null) throw new Error("The notebook kernel is not connected")
      return new Promise<ResourceRecord>((resolve, reject) => {
        const comm = kernel.createComm(RESOURCE_COMM_TARGET)
        let settled = false
        const timer = window.setTimeout(() => {
          if (settled) return
          settled = true
          reject(new Error(`The kernel did not return resource ${resourceId}`))
          safelyCloseComm(comm)
        }, 5000)
        comm.onMsg = (message) => {
          if (settled) return
          settled = true
          window.clearTimeout(timer)
          const data = message.content.data as ReadonlyJSONObject
          if (data.error != null) reject(new Error(String(data.message ?? data.error)))
          else resolve(data as unknown as ResourceRecord)
          safelyCloseComm(comm)
        }
        comm.onClose = () => {
          if (settled) return
          settled = true
          window.clearTimeout(timer)
          reject(new Error(`The kernel closed before returning resource ${resourceId}`))
        }
        try {comm.open({resource_id: resourceId})}
        catch (error) {
          if (!settled) {
            settled = true
            window.clearTimeout(timer)
            reject(error)
          }
          safelyCloseComm(comm)
        }
      })
    },
    openLive: async (liveId) => {
      await manager.context.sessionContext.ready
      const kernel = current()
      if (kernel == null) throw new Error("The notebook kernel is not connected")
      return new Promise<LiveConnection>((resolve, reject) => {
        const comm = kernel.createComm(NOTEBOOK_COMM_TARGET)
        const queued: Array<{message: any, buffers: DataView[]}> = []
        let receive: ((message: any, buffers: DataView[]) => void) | undefined
        let receiveClose: (() => void) | undefined
        let settled = false
        let closed = false
        let closedByOwner = false
        const timer = window.setTimeout(() => {
          if (settled) return
          settled = true
          closed = true
          reject(new BokehNotebookError(
            "LIVE_DOCUMENT_CONNECTION_TIMEOUT",
            `The kernel did not open live document ${liveId}.`,
            "Check that the notebook kernel is connected, then re-run the cell that called show(...).",
          ))
          safelyCloseComm(comm)
        }, 5000)
        const connection = (artifactJson: string, revision: number): LiveConnection => ({
          artifactJson,
          revision,
          onMessage(callback) {
            receive = callback
            for (const item of queued.splice(0)) callback(item.message, item.buffers)
          },
          onClose(callback) {
            receiveClose = callback
            if (closed && !closedByOwner) queueMicrotask(callback)
          },
          requestResync() {
            try {comm.send({kind: "resync"})}
            catch { /* A closed connection recovers on the next renderer mount. */ }
          },
          close() {
            if (closed) return
            closedByOwner = true
            closed = true
            safelyCloseComm(comm)
          },
        })
        comm.onMsg = (message) => {
          const data = message.content.data
          const buffers = views(message.buffers)
          if (!settled) {
            const initial = data as ReadonlyJSONObject
            if (initial.kind === "error") {
              settled = true
              window.clearTimeout(timer)
              reject(new BokehNotebookError(
                String(initial.code ?? "LIVE_DOCUMENT_UNAVAILABLE"),
                String(initial.message ?? "The kernel could not open this live notebook document."),
                "Re-run the cell that called show(...).",
              ))
              safelyCloseComm(comm)
            } else if (initial.kind === "snapshot" && typeof initial.artifact === "string" && Number.isSafeInteger(initial.revision)) {
              settled = true
              window.clearTimeout(timer)
              resolve(connection(initial.artifact, initial.revision as number))
            }
            return
          }
          const kind = (data as ReadonlyJSONObject)?.kind
          if (kind === "patch" || kind === "snapshot") {
            if (receive == null) queued.push({message: data, buffers})
            else receive(data, buffers)
          }
        }
        comm.onClose = () => {
          const wasClosed = closed
          closed = true
          if (!settled) {
            settled = true
            window.clearTimeout(timer)
            reject(new BokehNotebookError(
              "LIVE_DOCUMENT_UNAVAILABLE",
              `The live document ${liveId} closed before sending its snapshot.`,
              "Re-run the cell that called show(...).",
            ))
          } else if (!wasClosed) {
            receiveClose?.()
          }
        }
        try {comm.open({live_id: liveId})}
        catch (error) {
          if (!settled) {
            settled = true
            closed = true
            window.clearTimeout(timer)
            reject(error)
          }
          safelyCloseComm(comm)
        }
      })
    },
    releaseView: async (viewId) => {
      await manager.context.sessionContext.ready
      const kernel = current()
      if (kernel == null) return
      const comm = kernel.createComm(NOTEBOOK_COMM_TARGET)
      try {comm.open({kind: "release", view_id: viewId})}
      finally {window.setTimeout(() => safelyCloseComm(comm), 250)}
    },
    openApplicationView: async (viewId) => {
      await manager.context.sessionContext.ready
      const kernel = current()
      if (kernel == null) throw new Error("The notebook kernel is not connected")
      return new Promise<ApplicationViewConnection>((resolve, reject) => {
        const comm = kernel.createComm(NOTEBOOK_COMM_TARGET)
        let receiveClose: (() => void) | undefined
        let settled = false
        let closed = false
        const notifyClosed = () => {
          if (closed) return
          closed = true
          receiveClose?.()
        }
        const timer = window.setTimeout(() => {
          if (settled) return
          settled = true
          reject(new BokehNotebookError(
            "APPLICATION_VIEW_CONNECTION_TIMEOUT",
            `The kernel did not open application view ${viewId}.`,
            "Check that the kernel and application are connected, then re-run show(app).",
          ))
          safelyCloseComm(comm)
        }, 5000)
        const connection: ApplicationViewConnection = {
          onClose(callback) {
            receiveClose = callback
            if (closed) queueMicrotask(callback)
          },
          close() {
            if (closed) return
            closed = true
            safelyCloseComm(comm)
          },
        }
        comm.onMsg = (message) => {
          const data = message.content.data as ReadonlyJSONObject
          if (!settled) {
            if (data.kind === "error") {
              settled = true
              window.clearTimeout(timer)
              reject(new BokehNotebookError(
                String(data.code ?? "APPLICATION_VIEW_UNAVAILABLE"),
                String(data.message ?? "The kernel could not open this application view."),
                "Re-run show(app) to create a new application view.",
              ))
              safelyCloseComm(comm)
            } else if (data.kind === "ready") {
              settled = true
              window.clearTimeout(timer)
              resolve(connection)
            }
            return
          }
          if (data.kind === "close") {
            notifyClosed()
            safelyCloseComm(comm)
          }
        }
        comm.onClose = () => {
          if (!settled) {
            settled = true
            window.clearTimeout(timer)
            reject(new BokehNotebookError(
              "APPLICATION_VIEW_UNAVAILABLE",
              `Application view ${viewId} closed before it was ready.`,
              "Re-run show(app) to create a new application view.",
            ))
          } else {
            notifyClosed()
          }
        }
        try {comm.open({view_id: viewId})}
        catch (error) {
          if (!settled) {
            settled = true
            closed = true
            window.clearTimeout(timer)
            reject(error)
          }
          safelyCloseComm(comm)
        }
      })
    },
  }
}
