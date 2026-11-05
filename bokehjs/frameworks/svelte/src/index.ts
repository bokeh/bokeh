import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {DocumentMountController, MountController, SessionMountController} from "@bokeh/framework"
import type {BokehModel, BokehRootModel, BokehRootReference, BokehSessionSource, SessionMountRequest} from "@bokeh/framework"

/** Source, mount options, and callbacks for the `bokeh` action. */
export type BokehActionOptions = {
  /** The Bokeh root, roots array, or document to render in one mount. */
  model: BokehModel
  mountOptions?: MountOptions
  onMounted?(mounted: BokehMount): void
  onError?(error: unknown): void
}

/** Mount Bokeh content into an action node and dispose it when the action is destroyed. */
export function bokeh(node: HTMLElement, initial: BokehActionOptions): {
  update(value: BokehActionOptions): void
  destroy(): void
} {
  let controller = new MountController()
  let current = initial

  function start(options: BokehActionOptions): void {
    controller.dispose()
    controller = new MountController()
    void controller.start(options.model, node, {
      mountOptions: options.mountOptions,
      onMounted: (mounted) => {
        current.onMounted?.(mounted)
        node.dispatchEvent(new CustomEvent("bokeh-mount", {detail: mounted}))
      },
      onDisposed: (mounted) => {
        node.dispatchEvent(new CustomEvent("bokeh-unmount", {detail: mounted}))
      },
      onError: (error) => {
        current.onError?.(error)
        node.dispatchEvent(new CustomEvent("bokeh-mount-error", {detail: error}))
      },
    })
  }

  start(current)
  return {
    update: (value) => {
      const restart = value.model != current.model || value.mountOptions != current.mountOptions
      current = value
      if (restart) {
        start(current)
      }
    },
    destroy: () => controller.dispose(),
  }
}

/** Shared source and callbacks for a `bokehDocument` provider. */
export type BokehDocumentActionOptions = {
  models: readonly BokehRootModel[]
  mountOptions?: MountOptions
  onMounted?(mounted: BokehMount): void
  onError?(error: unknown): void
}

/** Source and callbacks for a `bokehSession` provider. */
export type BokehSessionActionOptions = Omit<SessionMountRequest, "onDisposed"> & {
  source: BokehSessionSource | null
}

/** One root supplied by the nearest document or session provider. */
export type BokehRootActionOptions = {
  /** A root model, or a unique model name when using a session provider. */
  model: BokehRootReference
}

type DocumentRequest = {
  controller: DocumentMountController | SessionMountController | null
}

const request_event = "bokeh-document-request"

/** Svelte action providing one shared Bokeh document to descendant bokehRoot actions. */
export function bokehDocument(node: HTMLElement, initial: BokehDocumentActionOptions): {
  update(value: BokehDocumentActionOptions): void
  destroy(): void
} {
  const controller = new DocumentMountController()
  let current = initial

  const on_request = (event: Event) => {
    const request = event as CustomEvent<DocumentRequest>
    request.stopPropagation()
    request.detail.controller = controller
  }
  node.addEventListener(request_event, on_request)

  function update(value: BokehDocumentActionOptions): void {
    current = value
    controller.update(value.models, {
      mountOptions: value.mountOptions,
      onMounted: (mounted) => {
        current.onMounted?.(mounted)
        node.dispatchEvent(new CustomEvent("bokeh-document-mount", {detail: mounted}))
      },
      onDisposed: (mounted) => node.dispatchEvent(new CustomEvent("bokeh-document-unmount", {detail: mounted})),
      onError: (error) => {
        current.onError?.(error)
        node.dispatchEvent(new CustomEvent("bokeh-document-mount-error", {detail: error}))
      },
    })
  }

  update(current)
  return {
    update,
    destroy: () => {
      node.removeEventListener(request_event, on_request)
      controller.dispose()
    },
  }
}

/** Svelte action providing a borrowed or acquired live session to descendant root actions. */
export function bokehSession(node: HTMLElement, initial: BokehSessionActionOptions): {
  update(value: BokehSessionActionOptions): void
  destroy(): void
} {
  const controller = new SessionMountController()
  let current = initial

  const on_request = (event: Event) => {
    const request = event as CustomEvent<DocumentRequest>
    request.stopPropagation()
    request.detail.controller = controller
  }
  node.addEventListener(request_event, on_request)

  function update(value: BokehSessionActionOptions): void {
    current = value
    controller.update(value.source, {
      mountOptions: value.mountOptions,
      onSession: (session) => {
        current.onSession?.(session)
        node.dispatchEvent(new CustomEvent("bokeh-session", {detail: session}))
      },
      onMounted: (mounted) => {
        current.onMounted?.(mounted)
        node.dispatchEvent(new CustomEvent("bokeh-mount", {detail: mounted}))
      },
      onDisposed: (mounted) => node.dispatchEvent(new CustomEvent("bokeh-unmount", {detail: mounted})),
      onError: (error) => {
        current.onError?.(error)
        node.dispatchEvent(new CustomEvent("bokeh-mount-error", {detail: error}))
      },
    })
  }

  update(current)
  return {
    update,
    destroy: () => {
      node.removeEventListener(request_event, on_request)
      controller.dispose()
    },
  }
}

/** Svelte action rendering one root through the nearest document or session provider. */
export function bokehRoot(node: HTMLElement, initial: BokehRootActionOptions): {
  update(value: BokehRootActionOptions): void
  destroy(): void
} {
  let current = initial
  let detach: (() => void) | null = null
  let generation = 0

  function connect(): void {
    const requested_generation = ++generation
    queueMicrotask(() => {
      if (requested_generation != generation) {
        return
      }
      detach?.()
      detach = null
      const detail: DocumentRequest = {controller: null}
      node.dispatchEvent(new CustomEvent<DocumentRequest>(request_event, {
        bubbles: true,
        composed: true,
        detail,
      }))
      if (detail.controller == null) {
        throw new Error("bokehRoot must be nested inside an element using bokehDocument or bokehSession")
      }
      detach = detail.controller.attach(current.model, node)
    })
  }

  connect()
  return {
    update: (value) => {
      current = value
      connect()
    },
    destroy: () => {
      generation += 1
      detach?.()
      detach = null
    },
  }
}
