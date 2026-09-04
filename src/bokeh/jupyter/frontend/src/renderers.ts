import {IRenderMime} from "@jupyterlab/rendermime-interfaces"
import {Widget} from "@lumino/widgets"

import {ContextManager} from "./context"
import {kernelProxy} from "./kernel"
import {
  assertProtocol,
  BokehNotebookError,
  DISPLAY_MIME_TYPE,
  DisplayPayload,
  FILE_MIME_TYPE,
  FilePayload,
  RESOURCES_MIME_TYPE,
  ResourcePayload,
} from "./protocol"
import {
  FrontendDocumentSnapshot,
  currentDocumentSnapshot,
  loadResources,
  renderDiagnostic,
  renderDisplay,
  renderLoading,
} from "./runtime"

export class ResourceRenderer extends Widget implements IRenderMime.IRenderer {
  constructor(_options: IRenderMime.IRendererOptions, private manager: ContextManager) {super()}
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const payload = model.data[RESOURCES_MIME_TYPE] as unknown as ResourcePayload
    const javascript = (model.data["application/javascript"] as string | undefined) ?? ""
    const stopLoading = renderLoading(this.node, "Loading shared BokehJS resources…")
    try {
      await loadResources(payload, javascript, this.node, kernelProxy(this.manager))
      stopLoading()
    } catch (error) {
      stopLoading()
      renderDiagnostic(this.node, error, {payload})
    }
  }
}

export class FileRenderer extends Widget implements IRenderMime.IRenderer {
  constructor(private manager: ContextManager) {super()}
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const payload = model.data[FILE_MIME_TYPE] as unknown as FilePayload
    try {
      assertProtocol(payload)
      const anchor = document.createElement("a")
      anchor.href = await this.manager.fileUrl(payload.path)
      anchor.target = "_blank"
      anchor.rel = "noopener noreferrer"
      anchor.textContent = `Open ${payload.path}`
      this.node.replaceChildren(anchor)
    } catch (error) {
      const diagnostic = error instanceof BokehNotebookError ? error : new BokehNotebookError(
        "FILE_LINK_FAILED",
        "Jupyter could not create a browser URL for the saved Bokeh file.",
        "Save the file under the notebook directory, then evaluate save(...) again.",
        error,
      )
      renderDiagnostic(this.node, diagnostic, {payload})
    }
  }
}

export class DisplayRenderer extends Widget implements IRenderMime.IRenderer {
  private cleanup?: () => void
  private controller?: AbortController
  private generation = 0
  private payload?: DisplayPayload
  constructor(_options: IRenderMime.IRendererOptions, private manager: ContextManager) {
    super()
    manager.add(this)
  }
  snapshot(): FrontendDocumentSnapshot | undefined {
    return this.payload == null ? undefined : currentDocumentSnapshot(this.node, this.payload)
  }
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const generation = ++this.generation
    this.controller?.abort()
    this.controller = new AbortController()
    this.cleanup?.()
    this.cleanup = undefined
    const payload = model.data[DISPLAY_MIME_TYPE] as unknown as DisplayPayload
    this.payload = payload
    const html = (model.data["text/html"] as string | undefined) ?? ""
    renderLoading(this.node, payload.source_kind === "server" ? "Connecting to Bokeh ASGI application…" : "Rendering Bokeh artifact…")
    try {
      const cleanup = await renderDisplay(this.node, payload, html, kernelProxy(this.manager), this.controller.signal)
      if (generation === this.generation && !this.isDisposed) this.cleanup = cleanup
      else cleanup()
    } catch (error) {
      if (generation === this.generation && !this.isDisposed && !(error instanceof DOMException && error.name === "AbortError")) {
        renderDiagnostic(this.node, error, {payload})
      }
    }
  }
  dispose(): void {
    if (this.isDisposed) return
    this.generation++
    this.controller?.abort()
    this.controller = undefined
    this.cleanup?.()
    this.cleanup = undefined
    this.payload = undefined
    this.manager.remove(this)
    super.dispose()
  }
}
