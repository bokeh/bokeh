import {HasProps} from "./has_props"
import type {Property} from "./properties"
import type {Slot, ISignalable} from "./signaling"
import {Signal0, Signal} from "./signaling"
import {isArray, isString, isNumber, isFunction} from "./util/types"
import type {BBox, XY} from "./util/bbox"
import type {Coordinate} from "../models/coordinates/coordinate"
import type {NodeTarget} from "../models/coordinates/node"
import {Node} from "../models/coordinates/node"
import {XY as XY_} from "../models/coordinates/xy"
import {Indexed} from "../models/coordinates/indexed"
import {ViewManager, ViewQuery} from "./view_manager"
import type {Equatable, Comparator} from "./util/eq"
import {equals} from "./util/eq"
import {logger} from "./logging"

import type {Signal as PreactSignal} from "@preact/signals"

export type ViewOf<T extends HasProps> = T["__view_type__"]

export type ChildView = View | null | undefined

export type SerializableState = {
  type: string
  bbox?: BBox
  children: SerializableState[]
}

export namespace View {
  export type Options = {
    model: HasProps
    parent: View | null | ((obj: HasProps) => View | null)
    owner?: ViewManager
  }
}

export type IterViews<T extends View = View> = Generator<T, void, undefined>

/** A slot whose result, if it is a promise, is awaited by `View.ready`. */
export type ViewSlot<Args, Sender extends object> = (args: Args, sender: Sender) => unknown

class ViewRemoved extends DOMException {
  constructor() {
    super("view removed", "AbortError")
  }
}

/**
 * Shared abort reason. Aborting without one makes the browser construct a
 * `DOMException` with a stack trace, which is an order of magnitude more
 * expensive and is paid by every view being removed.
 */
const view_removed = new ViewRemoved()

/**
 * A pending asynchronous task tracked by `View.ready`. The same object is
 * registered with every view on its `path`, so it can be removed from all of
 * them once it settles or its subtree is removed.
 */
type ReadyTask = {
  /** The view that owns the task, followed by its ancestors. */
  readonly path: View[]
}

/**
 * A tracked task (a signal handler or a scheduled function), whose synchronous
 * part is currently running.
 */
type RunningTask = {
  readonly view: View
  /** Whether the task requested `ready` of its view or of an ancestor. */
  waits_for_ready: boolean
}

/** Tasks whose synchronous part is currently running, innermost last. */
const running_tasks: RunningTask[] = []

/** A pending `View.ready` promise, settled once its view has no pending tasks. */
type ReadyWaiter = {
  resolve: () => void
  reject: (error: unknown) => void
}

type TransitiveOpts = {
  recursive?: boolean
  signal?: (obj: HasProps) => Signal<unknown, HasProps>
}

export abstract class View implements ISignalable, Equatable {
  readonly removed = new Signal0<this>(this, "removed")
  readonly finished = new Signal0<this>(this, "finished")

  private readonly _abort_controller = new AbortController()

  readonly model: HasProps

  readonly parent: View | null
  readonly root: View

  readonly owner: ViewManager

  readonly views: ViewQuery = new ViewQuery(this)

  readonly signals: {readonly [key: string]: PreactSignal<unknown>} = {}
  readonly values: {readonly [key: string]: unknown} = {}

  /** Pending tasks of this view and of all its descendants. */
  private readonly _pending_tasks: Set<ReadyTask> = new Set()
  /**
   * Failures of tasks in this subtree not yet reported through `ready`. Only
   * failures that happen while `ready` is awaited are collected, so that this
   * doesn't grow without bounds and `ready` doesn't report stale failures.
   */
  private _task_errors: unknown[] = []
  private _ready_waiters: ReadyWaiter[] = []

  /**
   * Resolves when this view and all its descendants have no outstanding
   * asynchronous work, including tasks scheduled while waiting.
   *
   * Rejects if any of these tasks failed while waiting, with the error, or an
   * `AggregateError` if there were more of them. Failures that happen while
   * nobody waits for `ready` are only logged, so `ready` reflects only work
   * that it waits for. A removed view's
   * `ready` resolves, and its tasks don't count towards its ancestors' `ready`.
   *
   * A task must not wait for `ready` of its view or of an ancestor, because
   * it counts towards it, so it would wait for itself and never resolve.
   */
  get ready(): Promise<void> {
    for (const task of running_tasks) {
      for (let view: View | null = task.view; view != null; view = view.parent) {
        if (view == this) {
          task.waits_for_ready = true
          break
        }
      }
    }
    return new Promise((resolve, reject) => {
      this._ready_waiters.push({resolve, reject})
      this._settle_ready()
    })
  }

  private _settle_ready(): void {
    if (this._pending_tasks.size != 0 || this._ready_waiters.length == 0) {
      return
    }
    const waiters = this._ready_waiters
    const errors = this._task_errors
    this._ready_waiters = []
    this._task_errors = []
    if (errors.length == 0) {
      for (const {resolve} of waiters) {
        resolve()
      }
    } else {
      const error = errors.length == 1 ? errors[0] : new AggregateError(errors, `${errors.length} tasks of ${this} failed`)
      for (const {reject} of waiters) {
        reject(error)
      }
    }
  }

  /**
   * Runs `task` immediately and makes `ready` of this view and its ancestors
   * wait for its completion. A task that throws synchronously is treated as a
   * rejected one. `task` receives a signal that is aborted when this view is
   * removed. Tasks of a removed view aren't run.
   */
  schedule(task: (signal: AbortSignal) => Promise<unknown> | unknown): void {
    if (this.abort_signal.aborted) {
      logger.debug(`${this}.schedule(): view was already removed, ignoring a task`)
      return
    }
    const {abort_signal} = this
    const promise = new Promise<unknown>((resolve) => resolve(this._run_task(() => task(abort_signal))))
    this._await_ready(promise)
  }

  /**
   * Runs the synchronous part of a tracked task and warns if it requested
   * `ready` that the task counts towards, because then the task's promise
   * would wait for itself. Waiting after the first `await` isn't detected.
   */
  private _run_task<T>(fn: () => T): T {
    const running: RunningTask = {view: this, waits_for_ready: false}
    running_tasks.push(running)
    let result: T
    try {
      result = fn()
    } finally {
      running_tasks.pop()
    }
    if (running.waits_for_ready && result instanceof Promise) {
      logger.warn(`${this}: a task waits for 'ready' that it counts towards, which will never resolve`)
    }
    return result
  }

  /**
   * Makes `ready` of this view and its ancestors wait for an already started
   * `promise`. Prefer `schedule()`, which also covers synchronous failures.
   */
  protected _await_ready(promise: Promise<unknown>): void {
    if (this.abort_signal.aborted) {
      promise.catch((error) => this._dropped_task_failed(error))
      return
    }
    const path: View[] = []
    for (let view: View | null = this; view != null; view = view.parent) {
      // skip stand-in parents that aren't views (see e.g. `BaseColorBarView`)
      if (view instanceof View) {
        path.push(view)
      }
    }
    const task: ReadyTask = {path}
    for (const view of path) {
      view._pending_tasks.add(task)
    }
    const finish = (failure: {error: unknown} | null) => {
      let dropped = true
      for (const view of path) {
        if (view._pending_tasks.delete(task)) {
          dropped = false
          if (failure != null && view._ready_waiters.length != 0) {
            view._task_errors.push(failure.error)
          }
          view._settle_ready()
        }
      }
      if (failure != null) {
        if (dropped) {
          this._dropped_task_failed(failure.error)
        } else {
          logger.error(`${this}: task failed`, failure.error)
        }
      }
    }
    promise.then(() => finish(null), (error) => finish({error}))
  }

  private _dropped_task_failed(error: unknown): void {
    if (!(error instanceof ViewRemoved)) {
      logger.debug(`${this}: task of a removed view failed`, error)
    }
  }

  /**
   * Stops tracking tasks of this subtree and settles `ready` of affected views.
   * Failures collected by views of this subtree are discarded, because `ready`
   * of a removed view resolves.
   */
  private _drop_pending_tasks(): void {
    const affected = new Set<View>()
    for (const task of this._pending_tasks) {
      // the path starts with the owner of the task, so views up to and
      // including this view belong to the removed subtree
      let removed = true
      for (const view of task.path) {
        view._pending_tasks.delete(task)
        if (removed) {
          view._task_errors = []
        }
        if (view == this) {
          removed = false
        }
        affected.add(view)
      }
    }
    this._task_errors = []
    affected.add(this)
    for (const view of affected) {
      view._settle_ready()
    }
  }

  /** @internal */
  protected _slots = new WeakMap<ViewSlot<any, any>, Slot<any, any>>()

  connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: ViewSlot<Args, Sender>): boolean {
    let new_slot = this._slots.get(slot)
    if (new_slot == null) {
      new_slot = (args: Args, sender: Sender): void => {
        this._await_ready(Promise.resolve(this._run_task(() => slot.call(this, args, sender))))
      }
      this._slots.set(slot, new_slot)
    }

    return signal.connect(new_slot, this)
  }

  disconnect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: ViewSlot<Args, Sender>): boolean {
    const new_slot = this._slots.get(slot)
    return new_slot != null ? signal.disconnect(new_slot, this) : false
  }

  constructor(options: View.Options) {
    const {model, parent, owner} = options

    this.model = model
    this.parent = isFunction(parent) ? parent(this.model) : parent

    if (this.parent == null) {
      this.root = this
      this.owner = owner ?? new ViewManager([this])
    } else {
      this.root = this.parent.root
      this.owner = this.root.owner
    }

    for (const prop of this.model) {
      Object.defineProperty(this.signals, prop.attr, {
        get() { return prop.signal },
        configurable: false,
        enumerable: true,
      })
      Object.defineProperty(this.values, prop.attr, {
        get() { return prop.signal.value },
        configurable: false,
        enumerable: true,
      })
    }
  }

  initialize(): void {}

  async lazy_initialize(): Promise<void> {}

  /**
   * An `AbortSignal` that is aborted when this view is removed.
   *
   * Pass it as `{signal: this.abort_signal}` to `addEventListener()` when
   * subscribing to an event target that outlives this view (e.g. `document`,
   * `window` or `visualViewport`). Such a target retains the listener, and
   * through its closure this view and its model, for the lifetime of the page.
   *
   * Don't use it for listeners on elements this view owns. Those are released
   * with the element itself, and registering an abort algorithm for them only
   * adds a reference from this view to DOM it would otherwise let go of.
   */
  protected get abort_signal(): AbortSignal {
    return this._abort_controller.signal
  }

  protected _destroyed: boolean = false
  remove(): void {
    if (this._destroyed) {
      logger.warn(`${this}.remove(): view was already destroyed`)
      return
    }
    if (this._signals_connected) {
      this.disconnect_signals()
    }
    this._abort_controller.abort(view_removed)
    this._drop_pending_tasks()
    for (const view of this.children_views()) {
      view.remove()
    }
    this.owner.remove(this)
    this.removed.emit()
    this._destroyed = true
  }

  get is_destroyed(): boolean {
    return this._destroyed
  }

  toString(): string {
    return `${this.model.type}View(${this.model.id})`
  }

  [equals](that: this, _cmp: Comparator): boolean {
    return Object.is(this, that)
  }

  children_views(): View[] {
    return this._children_views().filter((view) => view != null)
  }

  protected _children_views(): ChildView[] {
    return []
  }

  protected _has_finished: boolean = false

  mark_finished(): void {
    this._has_finished = true
  }

  /**
   * Mark as finished even if e.g. external resources were not loaded yet.
   */
  force_finished(): void {
    this.mark_finished()
  }

  finish(): void {
    this.mark_finished()
    this.notify_finished()
  }

  private _idle_notified: boolean = false
  notify_finished(): void {
    if (!this.is_root) {
      this.root.notify_finished()
    } else if (!this._idle_notified && this.has_finished()) {
      this._idle_notified = true
      const {document} = this.model
      if (document != null) {
        document.notify_idle(this.model)
      }
      this.finished.emit()
    }
  }

  serializable_children(): View[] {
    return this.children_views().filter((view) => view.model.is_syncable)
  }

  serializable_state(): SerializableState {
    const children = this.serializable_children()
      .map((view) => view.serializable_state())
      .filter((item) => item.bbox != null && item.bbox.is_valid && !item.bbox.is_empty) // TODO move this to a common base class for UI views

    return {
      type: this.model.type,
      children,
    }
  }

  get is_root(): boolean {
    return this.parent == null
  }

  has_finished(): boolean {
    return this._has_finished
  }

  get is_idle(): boolean {
    return this.has_finished()
  }

  protected _signals_connected: boolean = false

  connect_signals(): void {
    this._signals_connected = true
  }

  disconnect_signals(): void {
    this._signals_connected = false
    Signal.disconnect_receiver(this)
  }

  on_change(properties: Property<unknown> | Property<unknown>[], fn: () => unknown): void {
    for (const property of isArray(properties) ? properties : [properties]) {
      this.connect(property.change, fn)
    }
  }

  on_transitive_change<T>(property: Property<T>, fn: () => unknown, {recursive=false, signal=(obj) => obj.change}: TransitiveOpts = {}): void {
    const slot = () => fn()

    const collect = () => {
      const value = property.is_unset ? [] : property.get_value()
      return HasProps.references(value, {recursive})
    }

    const connect = (models: Iterable<HasProps>) => {
      for (const model of models) {
        this.connect(signal(model), slot)
      }
    }

    const disconnect = (models: Iterable<HasProps>) => {
      for (const model of models) {
        this.disconnect(signal(model), slot)
      }
    }

    let models = collect()
    connect(models)

    this.on_change(property, () => {
      disconnect(models)
      models = collect()
      connect(models)
      return fn()
    })
  }

  cursor(_sx: number, _sy: number): string | null {
    return null
  }

  on_hit?(sx: number, sy: number): boolean

  resolve_frame(): View | null {
    return null
  }

  resolve_canvas(): View | null {
    return null
  }

  resolve_plot(): View | null {
    return null
  }

  resolve_target(target: NodeTarget): View | null {
    if (isString(target)) {
      const ascend = (fn: (view: View) => View | null) => {
        let obj: View | null = this
        while (obj != null) {
          const view = fn(obj)
          if (view != null) {
            return view
          } else {
            obj = obj.parent
          }
        }
        return null
      }
      switch (target) {
        case "parent": return this.parent
        case "frame":  return ascend((view) => view.resolve_frame())
        case "canvas": return ascend((view) => view.resolve_canvas())
        case "plot":   return ascend((view) => view.resolve_plot())
      }
    } else {
      const queue: View[] = [this.root]
      while (true) {
        const child = queue.shift()
        if (child == null) {
          break
        } else if (child.model == target) {
          return child
        } else {
          queue.push(...child.children_views())
        }
      }
      return null
    }
  }

  resolve_symbol(_node: Node): XY | number {
    return {x: NaN, y: NaN}
  }

  resolve_node(node: Node): XY | number {
    const target = this.resolve_target(node.target)
    if (target != null) {
      return target.resolve_symbol(node)
    } else {
      return {x: NaN, y: NaN}
    }
  }

  resolve_xy?(coord: XY_): XY
  resolve_indexed?(coord: Indexed): XY

  resolve_coordinate(coord: Coordinate): XY | number {
    if (coord instanceof XY_) {
      let obj: View | null = this
      while (obj != null && obj.resolve_xy == null) {
        obj = obj.parent
      }
      return obj?.resolve_xy?.(coord) ?? {x: NaN, y: NaN}
    } else if (coord instanceof Indexed) {
      let obj: View | null = this
      while (obj != null && obj.resolve_indexed == null) {
        obj = obj.parent
      }
      return obj?.resolve_indexed?.(coord) ?? {x: NaN, y: NaN}
    } else if (coord instanceof Node) {
      return this.resolve_node(coord)
    } else {
      return {x: NaN, y: NaN}
    }
  }

  resolve_as_xy(coord: Coordinate): XY {
    const value = this.resolve_coordinate(coord)
    return isNumber(value) ? {x: NaN, y: NaN} : value
  }

  resolve_as_scalar(coord: Coordinate, dim: "x" | "y"): number {
    const value = this.resolve_coordinate(coord)
    return isNumber(value) ? value : value[dim]
  }
}
