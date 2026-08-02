import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {MountController} from "@bokeh/framework"
import type {BokehModel} from "@bokeh/framework"

export type BokehActionOptions = {
  model: BokehModel
  mountOptions?: MountOptions
  onMounted?(mounted: BokehMount): void
  onError?(error: unknown): void
}

export type BokehActionValue = BokehModel | BokehActionOptions

function normalize(value: BokehActionValue): BokehActionOptions {
  if (Object.hasOwn(value as object, "model")) {
    return value as BokehActionOptions
  } else {
    return {model: value as BokehModel}
  }
}

export function bokeh(node: HTMLElement, initial: BokehActionValue): {
  update(value: BokehActionValue): void
  destroy(): void
} {
  let controller = new MountController()

  function start(value: BokehActionValue): void {
    const options = normalize(value)
    controller.dispose()
    controller = new MountController()
    void controller.start(options.model, node, {
      mountOptions: options.mountOptions,
      onMounted: (mounted) => {
        options.onMounted?.(mounted)
        node.dispatchEvent(new CustomEvent("bokeh-mount", {detail: mounted}))
      },
      onError: (error) => {
        options.onError?.(error)
        node.dispatchEvent(new CustomEvent("bokeh-mount-error", {detail: error}))
      },
    })
  }

  start(initial)
  return {
    update: start,
    destroy: () => controller.dispose(),
  }
}
