import {mount} from "@bokeh/bokehjs"
import type {BokehMount, MountOptions, ShowableRoot} from "@bokeh/bokehjs"

/** A Bokeh root, an array of roots, or a caller-owned Document. */
export type BokehModel = Parameters<typeof mount>[0]
/** One view-producing model accepted by a keyed document mount. */
export type BokehRootModel = ShowableRoot
/** Framework-owned destination whose contents Bokeh may manage. */
export type BokehTarget = HTMLElement | DocumentFragment

/** Observers for successful readiness, completed disposal, and mount failure. */
export type MountCallbacks = {
  onMounted?(mounted: BokehMount): void
  onDisposed?(mounted: BokehMount): void
  onError?(error: unknown): void
}

/** One framework request, including options forwarded to core `mount()`. */
export type MountRequest = MountCallbacks & {
  mountOptions?: MountOptions
}

function is_aborted(signal: AbortSignal): boolean {
  return signal.aborted
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

    if (abort.signal.aborted) {
      return null
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
      if (generation != this._generation || is_aborted(abort.signal)) {
        await mounted.dispose()
        return null
      }

      this._on_disposed = request.onDisposed ?? null
      request.onMounted?.(mounted)
      return mounted
    } catch (error) {
      if (generation == this._generation) {
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

  /** Cancel pending readiness and dispose the currently published handle. */
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

type ControlledMountOptions = Omit<MountOptions, "targets">

function controlled_mount_options(options: MountOptions | undefined): ControlledMountOptions {
  const controlled = {...options}
  delete controlled.targets
  return controlled
}

function same_mount_options(left: ControlledMountOptions, right: ControlledMountOptions): boolean {
  const left_keys = Object.keys(left) as (keyof ControlledMountOptions)[]
  const right_keys = Object.keys(right)
  return left_keys.length == right_keys.length && left_keys.every((key) => left[key] == right[key])
}

/** Coordinates one Bokeh document whose roots render into independent framework targets. */
export class DocumentMountController {
  private readonly _controller = new MountController()
  private _models: readonly BokehRootModel[] = []
  private readonly _targets = new Map<BokehRootModel, BokehTarget>()
  private _request: MountRequest = {}
  private _active_models: readonly BokehRootModel[] = []
  private _active_targets = new Map<BokehRootModel, BokehTarget>()
  private _active_mount_options: ControlledMountOptions = {}
  private _scheduled = false
  private _transition = Promise.resolve()

  get mounted(): BokehMount | null {
    return this._controller.mounted
  }

  /** Replace the provider's root list while preserving a compatible shared mount. */
  update(models: readonly BokehRootModel[], request: MountRequest = {}): void {
    if (new Set(models).size != models.length) {
      throw new Error("a BokehDocument can't contain the same root more than once")
    }
    if (new Set(models.map((model) => model.id)).size != models.length) {
      throw new Error("a BokehDocument can't contain roots with duplicate model IDs")
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

  /** Attach one declared root and return an idempotent selective-detach callback. */
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

  /** Dispose the shared mount and forget every root slot. */
  dispose(): void {
    this._models = []
    this._targets.clear()
    this._active_models = []
    this._active_targets.clear()
    this._active_mount_options = {}
    this._controller.dispose()
  }

  private _schedule(): void {
    if (this._scheduled) {
      return
    }
    this._scheduled = true
    queueMicrotask(() => {
      this._scheduled = false
      this._transition = this._transition.then(() => this._refresh()).catch((error) => {
        this._request.onError?.(error)
      })
    })
  }

  private async _refresh(): Promise<void> {
    if (this._models.length == 0) {
      this._active_models = []
      this._active_targets.clear()
      this._active_mount_options = {}
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

    const mount_options = controlled_mount_options(this._request.mountOptions)
    const same_models = same_items(this._models, this._active_models)
    if (same_models && same_mount_options(mount_options, this._active_mount_options)) {
      const mounted = this._controller.mounted
      if (mounted != null) {
        const active_targets = new Map(this._active_targets)
        for (const model of this._models) {
          const previous = active_targets.get(model)
          const current = this._targets.get(model)
          if (current == null && previous != null) {
            mounted.detach(model.id)
            active_targets.delete(model)
          } else if (current != null && current != previous) {
            try {
              await mounted.replace_target(model.id, current)
              active_targets.set(model, current)
            } catch {
              // The mount reports the error through its configured callback.
              // Retain the previous target so a later update can retry.
            }
          }
        }
        this._active_targets = active_targets
      }
      return
    }

    const active_models = [...this._models]
    const active_targets = new Map(this._targets)
    const models = new Map(active_models.map((model) => [model.id, model]))
    const targets = new Map([...active_targets].map(([model, target]) => [model.id, target]))
    const mounted = await this._controller.start(models, undefined, {
      mountOptions: {...this._request.mountOptions, targets},
      onMounted: (mounted) => this._request.onMounted?.(mounted),
      onDisposed: (mounted) => this._request.onDisposed?.(mounted),
      onError: (error) => this._request.onError?.(error),
    })
    if (mounted != null) {
      this._active_models = active_models
      this._active_targets = active_targets
      this._active_mount_options = mount_options
    }
  }
}
