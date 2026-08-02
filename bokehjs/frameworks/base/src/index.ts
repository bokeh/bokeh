import {mount} from "@bokeh/bokehjs"
import type {BokehMount, MountOptions} from "@bokeh/bokehjs"

/** A Bokeh root, an array of roots, or a caller-owned Document. */
export type BokehModel = Parameters<typeof mount>[0]
export type BokehTarget = HTMLElement | DocumentFragment

export type MountCallbacks = {
  onMounted?(mounted: BokehMount): void
  onDisposed?(mounted: BokehMount): void
  onError?(error: unknown): void
}

export type MountRequest = MountCallbacks & {
  mountOptions?: MountOptions
}

/** Coordinates asynchronous Bokeh mounts with a framework's synchronous lifecycle. */
export class MountController {
  private _generation = 0
  private _abort: AbortController | null = null
  private _mounted: BokehMount | null = null
  private _unlink_signal: (() => void) | null = null

  get mounted(): BokehMount | null {
    return this._mounted
  }

  /** Mounts all supplied roots into one Bokeh document and one DOM target. */
  async start(model: BokehModel, target: BokehTarget, request: MountRequest = {}): Promise<BokehMount | null> {
    this.dispose()

    const generation = this._generation
    const abort = new AbortController()
    this._abort = abort
    abort.signal.addEventListener("abort", () => {
      if (generation != this._generation) {
        return
      }
      const mounted = this._mounted
      mounted?.dispose()
      this._mounted = null
      this._unlink_signal?.()
      this._unlink_signal = null
      this._abort = null
      if (mounted != null) {
        request.onDisposed?.(mounted)
      }
    }, {once: true})

    const external_signal = request.mountOptions?.signal
    if (external_signal != null) {
      const on_abort = () => abort.abort(external_signal.reason)
      if (external_signal.aborted) {
        on_abort()
      } else {
        external_signal.addEventListener("abort", on_abort, {once: true})
        this._unlink_signal = () => external_signal.removeEventListener("abort", on_abort)
      }
    }

    try {
      const mounted = await mount(model, target, {...request.mountOptions, signal: abort.signal})
      if (generation != this._generation || abort.signal.aborted) {
        mounted.dispose()
        return null
      }

      this._mounted = mounted
      request.onMounted?.(mounted)
      return mounted
    } catch (error) {
      if (generation == this._generation && !abort.signal.aborted) {
        this._unlink_signal?.()
        this._unlink_signal = null
        this._abort = null
        request.onError?.(error)
      }
      return null
    }
  }

  dispose(): void {
    this._generation += 1
    this._unlink_signal?.()
    this._unlink_signal = null
    this._abort?.abort()
    this._abort = null
    this._mounted?.dispose()
    this._mounted = null
  }
}
