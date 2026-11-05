import {Model, connect_session} from "@bokeh/bokehjs"
import type {BokehMount, BokehSessionConnection, ClientSession, MountOptions, SessionConnectionOptions} from "@bokeh/bokehjs"
import type {DocumentChangedEvent} from "@bokeh/bokehjs/document"

import {MountController} from "./mount.js"
import type {BokehRootReference, BokehTarget, MountRequest} from "./mount.js"
import {same_mount_options} from "./options.js"

/** Explicitly borrow a session, or acquire a connection owned by the provider. */
export type BokehSessionSource = {session: ClientSession, connection?: never} | {connection: SessionConnectionOptions, session?: never}

export type SessionMountRequest = MountRequest & {
  /** Acquisition readiness, before rendering. Borrowed sessions are reported too. */
  onSession?(session: ClientSession): void
}

/**
 * Shared live-session lifecycle for framework providers and imperative hosts.
 * One BokehMount tracks the document. Named slots can precede server roots.
 */
export class SessionMountController {
  private readonly _controller = new MountController()
  private readonly _slots = new Map<BokehRootReference, {target: BokehTarget}>()
  private readonly _active = new Map<string, BokehTarget>()
  private _source: BokehSessionSource | null = null
  private _request: SessionMountRequest = {}
  private _options: MountOptions = {}
  private _owner: BokehSessionConnection | null = null
  private _session: ClientSession | null = null
  private _abort: AbortController | null = null
  private _unlinks: (() => void)[] = []
  private _listener: ((event: DocumentChangedEvent) => void) | null = null
  private _generation = 0
  private _revision = 0
  private _transition = Promise.resolve()

  get mounted(): BokehMount | null {
    return this._controller.mounted
  }

  get session(): ClientSession | null {
    return this._session
  }

  /** Replace the session source without discarding registered root slots. */
  update(source: BokehSessionSource | null, request: SessionMountRequest = {}): void {
    const revision = ++this._revision
    const options = {...request.mountOptions}
    const unchanged = source == this._source && same_mount_options(options, this._options)
    if (unchanged) {
      this._request = request
      this._schedule()
      return
    }
    this._stop()
    // Disposal observers can synchronously replace or clear the requested source.
    if (revision != this._revision) {
      return
    }
    this._request = request
    this._source = source
    this._options = options
    if (source == null) {
      return
    }

    const generation = this._generation
    const abort = new AbortController()
    this._abort = abort
    const signals = new Set([request.mountOptions?.signal, source.connection?.signal])
    for (const signal of signals) {
      if (signal == null) {
        continue
      }
      const cancel = () => {
        if (generation == this._generation) {
          this._stop()
        }
      }
      if (signal.aborted) {
        cancel()
        return
      }
      signal.addEventListener("abort", cancel, {once: true})
      this._unlinks.push(() => signal.removeEventListener("abort", cancel))
    }
    void this._start(source, abort.signal, generation)
  }

  /** Register a target, including for a named root that has not arrived yet. */
  attach(reference: BokehRootReference, target: BokehTarget): () => void {
    if (this._slots.has(reference)) {
      throw new Error("a Bokeh session root can't be attached to more than one slot")
    }
    const slot = {target}
    this._slots.set(reference, slot)
    this._schedule()
    return () => {
      if (this._slots.get(reference) != slot) {
        return
      }
      this._slots.delete(reference)
      // Invalidate a pending attach immediately, before a framework removes its host.
      const mounted = this.mounted
      if (mounted != null) {
        for (const [key] of mounted.roots) {
          if (mounted.target(key) == target) {
            mounted.detach(key)
            this._active.delete(key)
          }
        }
      }
      this._schedule()
    }
  }

  /** Dispose views and any acquired connection/document. Borrowed sessions survive. */
  dispose(): void {
    this._revision += 1
    this._slots.clear()
    this._stop()
  }

  private _stop(): void {
    this._generation += 1
    const session = this._session
    const owner = this._owner
    const abort = this._abort
    this._source = null
    this._session = null
    this._owner = null
    this._abort = null
    if (session != null && this._listener != null) {
      session.document.remove_on_change(this._listener)
    }
    this._listener = null
    for (const unlink of this._unlinks) {
      unlink()
    }
    this._unlinks = []
    this._active.clear()
    this._transition = Promise.resolve()
    try {
      this._controller.dispose()
    } finally {
      abort?.abort()
      owner?.dispose()
      // Only the provider which acquired this document may release it.
      if (owner != null) {
        session?.document.destroy()
      }
    }
  }

  private _fail(error: unknown, generation: number): void {
    if (generation != this._generation) {
      return
    }
    const report = this._request.onError
    this._stop()
    report?.(error)
  }

  private async _start(source: BokehSessionSource, signal: AbortSignal, generation: number): Promise<void> {
    try {
      let session: ClientSession
      if (source.session != null) {
        session = source.session
      } else {
        const owner = connect_session({...source.connection, signal})
        this._owner = owner
        session = await owner.ready
        if (generation != this._generation) {
          session.document.destroy()
          return
        }
      }
      this._session = session
      this._request.onSession?.(session)
      if (generation != this._generation) {
        return
      }
      let failure: unknown = null
      const mounted = await this._controller.start(session.document, {}, {
        mountOptions: {...this._options, signal},
        onError: (error) => failure = error,
        onDisposed: (mounted) => this._request.onDisposed?.(mounted),
      })
      if (generation != this._generation) {
        return
      }
      if (mounted == null) {
        throw failure ?? new Error("Bokeh session mount did not become ready")
      }
      this._listener = (event) => {
        if (event.kind == "RootAdded" || event.kind == "RootRemoved") {
          this._schedule()
        }
      }
      session.document.on_change(this._listener)
      // Queue with slot changes made during acquisition to avoid building the same root twice.
      this._transition = this._transition.then(() => this._refresh(generation))
      await this._transition
      if (generation == this._generation) {
        this._request.onMounted?.(mounted)
      }
    } catch (error) {
      this._fail(error, generation)
    }
  }

  private _schedule(): void {
    const generation = this._generation
    this._transition = this._transition.then(() => this._refresh(generation)).catch((error) => this._fail(error, generation))
  }

  private async _refresh(generation: number): Promise<void> {
    const mounted = this.mounted
    if (generation != this._generation || mounted == null || mounted.state != "ready") {
      return
    }
    const planned = new Map<string, {reference: BokehRootReference, slot: {target: BokehTarget}}>()
    for (const [reference, slot] of this._slots) {
      const roots = [...mounted.roots].filter(([, model]) => typeof reference == "string"
        ? model instanceof Model && model.name == reference
        : model == reference)
      if (roots.length > 1) {
        throw new Error(`Bokeh session root name '${reference}' is not unique`)
      }
      if (roots.length != 0) {
        const [key] = roots[0]
        if (planned.has(key)) {
          throw new Error("a Bokeh session root can't be attached to more than one slot")
        }
        planned.set(key, {reference, slot})
      }
    }
    for (const key of this._active.keys()) {
      if (!planned.has(key)) {
        if (mounted.root(key) != null) {
          mounted.detach(key)
        }
        this._active.delete(key)
      }
    }
    for (const [key, {reference, slot}] of planned) {
      if (mounted.root(key) == null || this._slots.get(reference) != slot) {
        continue
      }
      if (mounted.target(key) != slot.target) {
        try {
          await mounted.attach(key, slot.target)
        } catch (error) {
          // A removed root or framework slot may overtake asynchronous rendering.
          if (generation == this._generation && this._slots.get(reference) == slot && mounted.root(key) != null) {
            throw error
          }
          continue
        }
        if (generation != this._generation) {
          return
        }
        if (this._slots.get(reference) != slot) {
          if (mounted.root(key) != null) {
            mounted.detach(key)
          }
        } else if (mounted.root(key) != null) {
          this._active.set(key, slot.target)
        }
      }
    }
  }
}
