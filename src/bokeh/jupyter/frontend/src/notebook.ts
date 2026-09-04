import type {ICellModel, ICodeCellModel} from "@jupyterlab/cells"
import {DocumentRegistry} from "@jupyterlab/docregistry"
import {INotebookModel, NotebookPanel} from "@jupyterlab/notebook"
import {Contents} from "@jupyterlab/services"
import {DisposableDelegate, IDisposable} from "@lumino/disposable"

import {ContextManager} from "./context"
import {kernelProxy} from "./kernel"
import {DISPLAY_MIME_TYPE, DisplayPayload, FILE_MIME_TYPE, RESOURCES_MIME_TYPE, ResourcePayload} from "./protocol"
import {DisplayRenderer, FileRenderer, ResourceRenderer} from "./renderers"
import {FrontendDocumentSnapshot, loadResources, resetResourceRegistry} from "./runtime"

export class NotebookExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  constructor(private readonly contents: Contents.IManager) {}
  private readonly managers = new Set<ContextManager>()
  snapshots(path: string): FrontendDocumentSnapshot[] {
    for (const manager of this.managers) {
      if (!manager.isDisposed && manager.path === path) return manager.snapshots()
    }
    return []
  }
  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    const manager = new ContextManager(context, this.contents)
    this.managers.add(manager)
    panel.content.rendermime.addFactory({
      safe: true,
      mimeTypes: [FILE_MIME_TYPE],
      createRenderer: () => new FileRenderer(manager),
    }, -20)
    panel.content.rendermime.addFactory({
      safe: false,
      mimeTypes: [RESOURCES_MIME_TYPE],
      createRenderer: (options) => new ResourceRenderer(options, manager),
    }, -20)
    panel.content.rendermime.addFactory({
      safe: false,
      mimeTypes: [DISPLAY_MIME_TYPE],
      createRenderer: (options) => new DisplayRenderer(options, manager),
    }, -20)
    let ownedViews = new Set<string>()
    const scanOwnership = () => {
      const current = new Set<string>()
      for (const cell of context.model.cells) {
        if (cell.type !== "code" || !cell.trusted) continue
        const code = cell as ICodeCellModel
        if (!code.outputs.trusted) continue
        for (let index = 0; index < code.outputs.length; index++) {
          const output = code.outputs.get(index)
          if (output.trusted === false) continue
          const payload = (output.data[DISPLAY_MIME_TYPE] ?? output.metadata[DISPLAY_MIME_TYPE]) as unknown as DisplayPayload | undefined
          if (payload?.kind === "artifact" && typeof payload.view_id === "string") current.add(payload.view_id)
        }
      }
      const proxy = kernelProxy(manager)
      for (const viewId of ownedViews) {
        if (!current.has(viewId)) void proxy.releaseView?.(viewId)
      }
      ownedViews = current
      manager.setOwnedViews(current)
    }
    const watched = new Map<ICodeCellModel, {outputs: () => void, trust: (_sender: ICellModel, args: {name: string, newValue: unknown}) => void}>()
    const scanCell = (cell: ICodeCellModel) => {
      if (manager.isDisposed || !cell.trusted || !cell.outputs.trusted) return
      const kernel = kernelProxy(manager)
      for (let index = 0; index < cell.outputs.length; index++) {
        const output = cell.outputs.get(index)
        if (output.trusted === false) continue
        const payload = output.data[RESOURCES_MIME_TYPE] as unknown as ResourcePayload | undefined
        const fallback = output.data["application/javascript"]
        if (payload != null) {
          void loadResources(
            payload,
            typeof fallback === "string" ? fallback : "",
            document.createElement("div"),
            kernel,
          ).catch(() => undefined)
        }
      }
    }
    const watch = (cell: ICellModel | null | undefined) => {
      if (cell == null || cell.type !== "code" || watched.has(cell as ICodeCellModel)) return
      const code = cell as ICodeCellModel
      const outputs = () => {
        scanCell(code)
        scanOwnership()
      }
      const trust = (_sender: ICellModel, args: {name: string, newValue: unknown}) => {
        if (args.name !== "trusted") return
        if (args.newValue === true) scanCell(code)
        scanOwnership()
      }
      code.outputs.changed.connect(outputs)
      code.stateChanged.connect(trust)
      watched.set(code, {outputs, trust})
      scanCell(code)
    }
    const unwatch = (cell: ICellModel | null | undefined) => {
      if (cell == null || cell.type !== "code") return
      const code = cell as ICodeCellModel
      const callbacks = watched.get(code)
      if (callbacks == null) return
      code.outputs.changed.disconnect(callbacks.outputs)
      code.stateChanged.disconnect(callbacks.trust)
      watched.delete(code)
    }
    const cellsChanged = (_sender: unknown, args: {newValues?: ICellModel[], oldValues?: ICellModel[]}) => {
      for (const cell of args.oldValues ?? []) unwatch(cell)
      for (const cell of args.newValues ?? []) watch(cell)
      scanOwnership()
    }
    context.model.cells.changed.connect(cellsChanged)
    for (const cell of context.model.cells) watch(cell)
    scanOwnership()
    const kernelChanged = () => resetResourceRegistry()
    context.sessionContext.kernelChanged.connect(kernelChanged)
    return new DisposableDelegate(() => {
      context.sessionContext.kernelChanged.disconnect(kernelChanged)
      context.model.cells.changed.disconnect(cellsChanged)
      for (const cell of [...watched.keys()]) unwatch(cell)
      panel.content.rendermime.removeMimeType(FILE_MIME_TYPE)
      panel.content.rendermime.removeMimeType(RESOURCES_MIME_TYPE)
      panel.content.rendermime.removeMimeType(DISPLAY_MIME_TYPE)
      const proxy = kernelProxy(manager)
      for (const viewId of ownedViews) void proxy.releaseView?.(viewId)
      ownedViews.clear()
      this.managers.delete(manager)
      manager.dispose()
    })
  }
}
