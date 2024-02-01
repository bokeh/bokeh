import {HasProps} from "./has_props"
import type {Property} from "./properties"
import type {Slot, ISignalable} from "./signaling"
import {Signal0, Signal} from "./signaling"
import {isArray, isString, isNumber} from "./util/types"
import type {BBox, XY} from "./util/bbox"
import type {Coordinate} from "../models/coordinates/coordinate"
import type {NodeTarget} from "../models/coordinates/node"
import {Node} from "../models/coordinates/node"
import {XY as XY_} from "../models/coordinates/xy"
import {Indexed} from "../models/coordinates/indexed"
import {ViewManager} from "./view_manager"

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

  mark_finished(): void {
    this._has_finished = true
  }

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
    this.owner.remove(this)
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

  on_transitive_change<T>(property: Property<T>, fn: () => void): void {
    const collect = () => {
      const value = property.is_unset ? [] : property.get_value()
      return HasProps.references(value, {recursive: false})
    }

    const connect = (models: Iterable<HasProps>) => {
      for (const model of models) {
        this.connect(model.change, fn)
      }
    }

    const disconnect = (models: Iterable<HasProps>) => {
      for (const model of models) {
        this.disconnect(model.change, fn)
      }
    }

    let models = collect()
    connect(models)

    this.on_change(property, () => {
      disconnect(models)
      models = collect()
      connect(models)
      fn()
    })
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
          queue.push(...child.children())
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
