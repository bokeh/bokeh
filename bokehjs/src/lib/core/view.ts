import type {HasProps} from "./has_props"
import {Property} from "./properties"
import {Signal0, Signal, Slot, ISignalable} from "./signaling"
import {isArray} from "./util/types"
import {Box} from "./types"

export type ViewOf<T extends HasProps> = T["__view_type__"]

export type SerializableState = {
  type: string
  bbox?: Box
  children?: SerializableState[]
}

export namespace View {
  export type Options = {
    model: HasProps
    parent: View | null
  }
}

export class View implements ISignalable {
  readonly removed = new Signal0<this>(this, "removed")

  readonly model: HasProps

  readonly parent: View | null
  readonly root: View

  protected _ready: Promise<void> = Promise.resolve(undefined)
  get ready(): Promise<void> {
    return this._ready
  }

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
    const {model, parent} = options
    this.model = model
    this.parent = parent
    this.root = parent == null ? this : parent.root
    this.removed.emit()
  }

  initialize(): void {
    this._has_finished = false
  }

  async lazy_initialize(): Promise<void> {}

  remove(): void {
    this.disconnect_signals()
    this.removed.emit()
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
