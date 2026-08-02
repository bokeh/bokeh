import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {MountController} from "@bokeh/framework"
import type {BokehModel} from "@bokeh/framework"

export type BokehActionOptions = {
  /** The Bokeh root, roots array, or document to render in one mount. */
  model: BokehModel
  mountOptions?: MountOptions
  onMounted?(mounted: BokehMount): void
  onError?(error: unknown): void
}

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
