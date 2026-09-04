import {mount} from "@bokeh/bokehjs"
import type {BokehMount, MountOptions, ShowableRoot} from "@bokeh/bokehjs"

/** A Bokeh root, an array of roots, or a caller-owned Document. */
export type BokehModel = Parameters<typeof mount>[0]
export type BokehRootModel = ShowableRoot
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
  private _on_disposed: ((mounted: BokehMount) => void) | null = null

  get mounted(): BokehMount | null {
    return this._mounted
  }

  /** Mounts all supplied roots into one Bokeh document and one DOM target. */
  async start(model: BokehModel, target?: BokehTarget, request: MountRequest = {}): Promise<BokehMount | null> {
    this.dispose()

    const generation = this._generation
    const abort = new AbortController()
    this._abort = abort
    abort.signal.addEventListener("abort", () => {
      if (generation != this._generation) {
        return
      }
      const mounted = this._mounted
      void mounted?.dispose()
      this._mounted = null
      this._unlink_signal?.()
      this._unlink_signal = null
      this._abort = null
      if (mounted != null) {
        this._notify_disposed(mounted)
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

    let reported_error: unknown = null
    try {
      const mounted = mount(model, target, {
        ...request.mountOptions,
        signal: abort.signal,
        on_error: (error) => {
          reported_error = error
          try {
            request.mountOptions?.on_error?.(error)
          } finally {
            request.onError?.(error)
          }
        },
      })
      this._mounted = mounted
      await mounted.ready
      if (generation != this._generation || abort.signal.aborted) {
        await mounted.dispose()
        return null
      }

      this._on_disposed = request.onDisposed ?? null
      request.onMounted?.(mounted)
      return mounted
    } catch (error) {
      if (generation == this._generation && !abort.signal.aborted) {
        const mounted = this._mounted
        this._mounted = null
        this._unlink_signal?.()
        this._unlink_signal = null
        this._abort = null
        if (mounted != null && !mounted.disposed) {
          void mounted.dispose()
          this._notify_disposed(mounted)
        } else {
          this._on_disposed = null
        }
        if (error != reported_error) {
          request.onError?.(error)
        }
      }
      return null
    }
  }

  dispose(): void {
    const mounted = this._mounted
    this._generation += 1
    this._unlink_signal?.()
    this._unlink_signal = null
    this._abort?.abort()
    this._abort = null
    void mounted?.dispose()
    this._mounted = null
    if (mounted != null) {
      this._notify_disposed(mounted)
    } else {
      this._on_disposed = null
    }
  }

  private _notify_disposed(mounted: BokehMount): void {
    const on_disposed = this._on_disposed
    this._on_disposed = null
    on_disposed?.(mounted)
  }
}

function same_items<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length == right.length && left.every((item, index) => item == right[index])
}

/** Coordinates one Bokeh document whose roots render into independent framework targets. */
export class DocumentMountController {
  private readonly _controller = new MountController()
  private _models: readonly BokehRootModel[] = []
  private readonly _targets = new Map<BokehRootModel, BokehTarget>()
  private _request: MountRequest = {}
  private _active_models: readonly BokehRootModel[] = []
  private _active_targets = new Map<BokehRootModel, BokehTarget>()
  private _active_signal: AbortSignal | undefined
  private _scheduled = false

  get mounted(): BokehMount | null {
    return this._controller.mounted
  }

  update(models: readonly BokehRootModel[], request: MountRequest = {}): void {
    if (new Set(models).size != models.length) {
      throw new Error("a BokehDocument can't contain the same root more than once")
    }

    this._models = [...models]
    this._request = request
    for (const model of this._targets.keys()) {
      if (!models.includes(model)) {
        this._targets.delete(model)
      }
    }
    this._schedule()
  }

  attach(model: BokehRootModel, target: BokehTarget): () => void {
    const current = this._targets.get(model)
    if (current != null && current != target) {
      throw new Error("a BokehDocument root can't be attached to more than one target")
    }

    this._targets.set(model, target)
    this._schedule()
    let attached = true
    return () => {
      if (attached && this._targets.get(model) == target) {
        attached = false
        this._targets.delete(model)
        this._schedule()
      }
    }
  }

  dispose(): void {
    this._models = []
    this._targets.clear()
    this._active_models = []
    this._active_targets.clear()
    this._active_signal = undefined
    this._controller.dispose()
  }

  private _schedule(): void {
    if (this._scheduled) {
      return
    }
    this._scheduled = true
    queueMicrotask(() => {
      this._scheduled = false
      this._refresh()
    })
  }

  private _refresh(): void {
    if (this._models.length == 0) {
      this._active_models = []
      this._active_targets.clear()
      this._active_signal = undefined
      this._controller.dispose()
      return
    }

    // Framework providers render before their descendant root slots in some
    // schedulers (notably Vue's post-flush watchers). Wait for the first slot
    // so the initial mounted callback observes the roots from that render.
    // Once a mount exists, removing every slot keeps its shared document alive.
    if (this._targets.size == 0 && this._controller.mounted == null) {
      return
    }

    const signal = this._request.mountOptions?.signal
    const same_models = same_items(this._models, this._active_models)
    if (same_models && signal == this._active_signal) {
      const mounted = this._controller.mounted
      if (mounted != null) {
        for (const model of this._models) {
          const previous = this._active_targets.get(model)
          const current = this._targets.get(model)
          if (current == null && previous != null) {
            mounted.detach(model.id)
          } else if (current != null && current != previous) {
            void mounted.replace_target(model.id, current).catch(() => {})
          }
        }
      }
      this._active_targets = new Map(this._targets)
      return
    }

    this._active_models = [...this._models]
    this._active_targets = new Map(this._targets)
    this._active_signal = signal
    const models = new Map(this._models.map((model) => [model.id, model]))
    const targets = new Map([...this._targets].map(([model, target]) => [model.id, target]))
    void this._controller.start(models, undefined, {
      mountOptions: {...this._request.mountOptions, targets},
      onMounted: (mounted) => this._request.onMounted?.(mounted),
      onDisposed: (mounted) => this._request.onDisposed?.(mounted),
      onError: (error) => {
        this._active_models = []
        this._active_targets.clear()
        this._active_signal = undefined
        this._request.onError?.(error)
      },
    })
  }
}
