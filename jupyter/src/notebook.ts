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

const VIEW_RELEASE_GRACE_MS = 30_000

export class NotebookExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  constructor(private readonly contents: Contents.IManager) {}

  private readonly managers = new Set<ContextManager>()
  private readonly viewOwners = new Map<string, number>()

  snapshots(path: string): FrontendDocumentSnapshot[] {
    const snapshots = new Map<string, FrontendDocumentSnapshot>()
    for (const manager of this.managers) {
      if (manager.isDisposed || manager.path !== path) continue
      for (const snapshot of manager.snapshots()) {
        const existing = snapshots.get(snapshot.view_id)
        if (existing == null || (existing.error != null && snapshot.error == null)) {
          snapshots.set(snapshot.view_id, snapshot)
        }
      }
    }
    return [...snapshots.values()]
  }

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    const manager = new ContextManager(context, this.contents)
    const proxy = kernelProxy(manager)
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
    const ownedViews = new Set<string>()
    const cellViews = new Map<ICodeCellModel, Set<string>>()
    const localViewOwners = new Map<string, number>()
    const pendingReleases = new Map<string, number>()

    const publishOwnedViews = () => manager.setOwnedViews(new Set(ownedViews))

    const retainView = (viewId: string) => {
      const pending = pendingReleases.get(viewId)
      if (pending != null) {
        window.clearTimeout(pending)
        pendingReleases.delete(viewId)
      }
      this.viewOwners.set(viewId, (this.viewOwners.get(viewId) ?? 0) + 1)
      localViewOwners.set(viewId, (localViewOwners.get(viewId) ?? 0) + 1)
      ownedViews.add(viewId)
    }

    const releaseView = (viewId: string, defer = true) => {
      const owners = (this.viewOwners.get(viewId) ?? 1) - 1
      if (owners === 0) {
        this.viewOwners.delete(viewId)
        if (defer) {
          const timer = window.setTimeout(() => {
            pendingReleases.delete(viewId)
            if (!this.viewOwners.has(viewId)) void proxy.releaseView?.(viewId)
          }, VIEW_RELEASE_GRACE_MS)
          pendingReleases.set(viewId, timer)
        } else {
          void proxy.releaseView?.(viewId)
        }
      } else {
        this.viewOwners.set(viewId, owners)
      }
      const localOwners = (localViewOwners.get(viewId) ?? 1) - 1
      if (localOwners === 0) {
        localViewOwners.delete(viewId)
        ownedViews.delete(viewId)
      } else {
        localViewOwners.set(viewId, localOwners)
      }
    }

    const viewsIn = (cell: ICodeCellModel): Set<string> => {
      const current = new Set<string>()
      if (!cell.trusted || !cell.outputs.trusted) return current
      for (let index = 0; index < cell.outputs.length; index++) {
        const output = cell.outputs.get(index)
        if (output.trusted === false) continue
        const payload = (output.data[DISPLAY_MIME_TYPE] ?? output.metadata[DISPLAY_MIME_TYPE]) as unknown as DisplayPayload | undefined
        if (payload?.kind === "artifact" && typeof payload.view_id === "string" &&
            (typeof payload.live_id === "string" || typeof payload.application_id === "string")) {
          current.add(payload.view_id)
        }
      }
      return current
    }

    const updateOwnership = (cell: ICodeCellModel) => {
      const previous = cellViews.get(cell) ?? new Set<string>()
      const current = viewsIn(cell)
      for (const viewId of current) {
        if (!previous.has(viewId)) retainView(viewId)
      }
      for (const viewId of previous) {
        if (current.has(viewId)) continue
        releaseView(viewId)
      }
      cellViews.set(cell, current)
      publishOwnedViews()
    }
    const watched = new Map<ICodeCellModel, {outputs: () => void, trust: (_sender: ICellModel, args: {name: string, newValue: unknown}) => void}>()

    const scanCell = (cell: ICodeCellModel) => {
      if (manager.isDisposed || !cell.trusted || !cell.outputs.trusted) return
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
            proxy,
          ).catch(() => undefined)
        }
      }
    }

    const watch = (cell: ICellModel | null | undefined) => {
      if (cell == null || cell.type !== "code" || watched.has(cell as ICodeCellModel)) return
      const code = cell as ICodeCellModel

      const outputs = () => {
        scanCell(code)
        updateOwnership(code)
      }

      const trust = (_sender: ICellModel, args: {name: string, newValue: unknown}) => {
        if (args.name !== "trusted") return
        if (args.newValue === true) scanCell(code)
        updateOwnership(code)
      }
      code.outputs.changed.connect(outputs)
      code.stateChanged.connect(trust)
      watched.set(code, {outputs, trust})
      scanCell(code)
      updateOwnership(code)
    }

    const unwatch = (cell: ICellModel | null | undefined) => {
      if (cell == null || cell.type !== "code") return
      const code = cell as ICodeCellModel
      const callbacks = watched.get(code)
      if (callbacks == null) return
      code.outputs.changed.disconnect(callbacks.outputs)
      code.stateChanged.disconnect(callbacks.trust)
      watched.delete(code)
      const previous = cellViews.get(code) ?? new Set<string>()
      cellViews.delete(code)
      for (const viewId of previous) releaseView(viewId)
      publishOwnedViews()
    }

    const cellsChanged = (_sender: unknown, args: {newValues?: ICellModel[], oldValues?: ICellModel[]}) => {
      for (const cell of args.oldValues ?? []) unwatch(cell)
      for (const cell of args.newValues ?? []) watch(cell)
    }
    context.model.cells.changed.connect(cellsChanged)
    for (const cell of context.model.cells) watch(cell)

    const kernelChanged = () => resetResourceRegistry(manager)
    context.sessionContext.kernelChanged.connect(kernelChanged)
    return new DisposableDelegate(() => {
      const closingViews = new Set(localViewOwners.keys())
      context.sessionContext.kernelChanged.disconnect(kernelChanged)
      context.model.cells.changed.disconnect(cellsChanged)
      for (const cell of [...watched.keys()]) unwatch(cell)
      for (const viewId of pendingReleases.keys()) closingViews.add(viewId)
      panel.content.rendermime.removeMimeType(FILE_MIME_TYPE)
      panel.content.rendermime.removeMimeType(RESOURCES_MIME_TYPE)
      panel.content.rendermime.removeMimeType(DISPLAY_MIME_TYPE)
      manager.setOwnedViews(new Set())
      for (const timer of pendingReleases.values()) window.clearTimeout(timer)
      pendingReleases.clear()
      for (const viewId of closingViews) {
        if (!this.viewOwners.has(viewId)) void proxy.releaseView?.(viewId)
      }
      this.managers.delete(manager)
      manager.dispose()
    })
  }
}
