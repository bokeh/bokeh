import {HasProps} from "./has_props"
import {Signal0, Signal, Signalable} from "./signaling"
import {uniqueId} from "./util/string"

export interface ViewOptions {
  id?: string
  model?: HasProps                  // TODO: this isn't optional
  parent: View | null
  connect_signals?: boolean
}

export class View extends Signalable() {

  readonly removed = new Signal0<this>(this, "removed")

  readonly id: string

  readonly model: HasProps

  private _parent: View | null | undefined

  constructor(options: ViewOptions) {
    super()

    if (options.model != null)
      this.model = options.model
    else
      throw new Error("model of a view wasn't configured")

    this._parent = options.parent

    this.id = options.id || uniqueId()
    this.initialize(options)

    if (options.connect_signals !== false)
      this.connect_signals()
  }

  initialize(_options: ViewOptions): void {}

  remove(): void {
    this._parent = undefined
    this.disconnect_signals()
    this.removed.emit()
  }

  toString(): string {
    return  `${this.model.type}View(${this.id})`
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

  connect_signals(): void {}

  disconnect_signals(): void {
    Signal.disconnectReceiver(this)
  }

  notify_finished(): void {
    this.root.notify_finished()
  }
}
