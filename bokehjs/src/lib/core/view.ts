import type {HasProps} from "./has_props"
import {Property} from "./properties"
import {Signal0, Signal, Slot, ISignalable} from "./signaling"
import {StyleSheet, stylesheet} from "./dom"
import {isArray} from "./util/types"
import {Box} from "./types"

import root_css from "styles/root.css"

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

  private _slots = new WeakMap<Slot<any, any>, Slot<any, any>>()
  connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
    let new_slot = this._slots.get(slot)
    if (new_slot == null) {
      new_slot = (args: Args, sender: Sender): void => {
        const promise = Promise.resolve(slot.call(this, args, sender))
        this._ready = this._ready.then(() => promise)
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
    if (this.is_root) {
      this._stylesheet = stylesheet
    }
    for (const style of this.styles()) {
      this.stylesheet.append(style)
    }
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

  assert_root(): void {
    if (!this.is_root)
      throw new Error(`${this.toString()} is not a root layout`)
  }

  has_finished(): boolean {
    return this._has_finished
  }

  get is_idle(): boolean {
    return this.has_finished()
  }

  connect_signals(): void {}

  disconnect_signals(): void {
    Signal.disconnectReceiver(this)
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

  private _stylesheet: StyleSheet

  get stylesheet(): StyleSheet {
    if (this.is_root)
      return this._stylesheet
    else
      return this.root.stylesheet
  }

  styles(): string[] {
    return [root_css]
  }
}
