import type {HasProps} from "./has_props"
import {Property} from "./properties"
import {Signal0, Signal, Slot, ISignalable} from "./signaling"
import {isArray} from "./util/types"
import {BBox} from "./util/bbox"

export type ViewOf<T extends HasProps> = T["__view_type__"]

export type SerializableState = {
  type: string
  bbox?: BBox
  children?: SerializableState[]
}

export namespace View {
  export type Options = {
    model: HasProps
    parent: View | null
    owner?: ViewManager
  }
}

export type IterViews<T extends View = View> = Generator<T, void, undefined>

export class View implements ISignalable {
  readonly removed = new Signal0<this>(this, "removed")

  readonly model: HasProps

  readonly parent: View | null
  readonly root: View

  readonly owner: ViewManager

  protected _ready: Promise<void> = Promise.resolve(undefined)
  get ready(): Promise<void> {
    return this._ready
  }

  public *children(): IterViews {}

  protected _has_finished: boolean

  /** @internal */
  protected _slots = new WeakMap<Slot<any, any>, Slot<any, any>>()

  connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
    let new_slot = this._slots.get(slot)
    if (new_slot == null) {
      new_slot = (args: Args, sender: Sender): void => {
        const promise = Promise.resolve(slot.call(this, args, sender))
        this._ready = this._ready.then(() => promise)
        if (this.root != this) {
          this.root._ready = this.root._ready.then(() => this._ready)
        }
      }
      this._slots.set(slot, new_slot)
    }

    return signal.connect(new_slot, this)
  }

  disconnect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
    return signal.disconnect(slot, this)
  }

  constructor(options: View.Options) {
    const {model, parent, owner} = options

    this.model = model
    this.parent = parent

    if (parent == null) {
      this.root = this
      this.owner = owner ?? new ViewManager([this])
    } else {
      this.root = parent.root
      this.owner = this.root.owner
    }
  }

  initialize(): void {
    this._has_finished = false
  }

  async lazy_initialize(): Promise<void> {}

  protected _removed: boolean = false
  remove(): void {
    this.disconnect_signals()
    this.removed.emit()
    this._removed = true
  }

  toString(): string {
    return `${this.model.type}View(${this.model.id})`
  }

  serializable_state(): SerializableState {
    return {type: this.model.type}
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

  connect_signals(): void {}

  disconnect_signals(): void {
    Signal.disconnect_receiver(this)
  }

  on_change(properties: Property<unknown> | Property<unknown>[], fn: () => void): void {
    for (const property of isArray(properties) ? properties : [properties]) {
      this.connect(property.change, fn)
    }
  }

  cursor(_sx: number, _sy: number): string | null {
    return null
  }

  on_hit?(sx: number, sy: number): boolean

  private _idle_notified: boolean = false
  notify_finished(): void {
    if (!this.is_root)
      this.root.notify_finished()
    else {
      if (!this._idle_notified && this.has_finished()) {
        if (this.model.document != null) {
          this._idle_notified = true
          this.model.document.notify_idle(this.model)
        }
      }
    }
  }
}

export class ViewManager {
  readonly roots: Set<View>

  constructor(roots: View[] = []) {
    this.roots = new Set(roots)
  }

  get<T extends HasProps>(model: T): ViewOf<T> | null {
    for (const view of this.roots) {
      if (view.model == model)
        return view
    }
    return null
  }

  add(view: View): void {
    this.roots.add(view)
  }

  delete(view: View): void {
    this.roots.delete(view)
  }

  *[Symbol.iterator](): IterViews {
    yield* this.roots
  }

  *query(fn: (view: View) => boolean): IterViews {
    function* descend(view: View): IterViews {
      if (fn(view)) {
        yield view
      } else {
        for (const child of view.children()) {
          yield* descend(child)
        }
      }
    }

    for (const root of this.roots) {
      yield* descend(root)
    }
  }

  *find<T extends HasProps>(model: T): IterViews<ViewOf<T>> {
    yield* this.query((view) => view.model == model)
  }

  get_one<T extends HasProps>(model: T): ViewOf<T> {
    const view = this.find_one(model)
    if (view != null)
      return view
    else
      throw new Error(`cannot find a view for ${model}`)
  }

  find_one<T extends HasProps>(model: T): ViewOf<T> | null {
    for (const view of this.find(model)) {
      return view
    }
    return null
  }

  find_all<T extends HasProps>(model: T): ViewOf<T>[] {
    return [...this.find(model)]
  }
}
