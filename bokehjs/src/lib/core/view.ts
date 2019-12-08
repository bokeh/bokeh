import {HasProps} from "./has_props"
import {Property} from "./properties"
import {Signal0, Signal, Slot, ISignalable} from "./signaling"
import {isArray} from "./util/types"
import {uniqueId} from "./util/string"

export namespace View {
  export type Options = {
    id?: string
    model: HasProps
    parent: View | null
  }
}

export class View implements ISignalable {

  readonly removed = new Signal0<this>(this, "removed")

  readonly id: string

  readonly model: HasProps

  private _parent: View | null | undefined

  protected _ready: Promise<void> = Promise.resolve(undefined)
  get ready(): Promise<void> {
    return this._ready
  }

  connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
    const new_slot = (args: Args, sender: Sender): void => {
      const promise = Promise.resolve(slot.call(this, args, sender))
      this._ready = this._ready.then(() => promise)
    }

    return signal.connect(new_slot, this)
  }

  disconnect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
    return signal.disconnect(slot, this)
  }

  constructor(options: View.Options) {
    if (options.model != null)
      this.model = options.model
    else
      throw new Error("model of a view wasn't configured")

    this._parent = options.parent
    this.id = options.id || uniqueId()
  }

  initialize(): void {}

  async lazy_initialize(): Promise<void> {}

  remove(): void {
    this._parent = undefined
    this.disconnect_signals()
    this.removed.emit()
  }

  toString(): string {
    return `${this.model.type}View(${this.id})`
  }

  serializable_state(): {[key: string]: unknown} {
    return {type: this.model.type}
  }

  get parent(): View | null {
    if (this._parent !== undefined)
      return this._parent
    else
      throw new Error("parent of a view wasn't configured")
  }

  get is_root(): boolean {
    return this.parent === null
  }

  get root(): View {
    return this.is_root ? this : this.parent!.root
  }

  assert_root(): void {
    if (!this.is_root)
      throw new Error(`${this.toString()} is not a root layout`)
  }

  connect_signals(): void {}

  disconnect_signals(): void {
    Signal.disconnectReceiver(this)
  }

  on_change(property: Property<unknown>, fn: () => void): void
  on_change(properties: Property<unknown>[], fn: () => void): void

  on_change(properties: Property<unknown> | Property<unknown>[], fn: () => void): void {
    for (const property of isArray(properties) ? properties : [properties])
      this.connect(property.change, fn)
  }
}
