import {Signal0} from "core/signaling"
import type {PlotView} from "./plot_canvas"
import type {RangeInfo} from "./range_manager"
import {Selection} from "../selections/selection"
import type {DataRenderer} from "../renderers/data_renderer"

export type StateInfo = {
  range?: RangeInfo
  selection: Map<DataRenderer, Selection>
  dimensions: {
    width: number
    height: number
  }
}

export class StateManager {
  constructor(readonly parent: PlotView, readonly initial_state: StateInfo) {}

  readonly changed: Signal0<this["parent"]> = new Signal0(this.parent, "state_changed")

  protected history: {type: string, state: StateInfo}[] = []
  protected index: number = -1

  protected _do_state_change(index: number): void {
    const state = this.history[index] != null ? this.history[index].state : this.initial_state

    if (state.range != null)
      this.parent.update_range(state.range)

    if (state.selection != null)
      this.parent.update_selection(state.selection)
  }

  push(type: string, new_state: Partial<StateInfo>): void {
    const {history, index} = this

    const prev_state = history[index] != null ? history[index].state : {}
    const state = {...this.initial_state, ...prev_state, ...new_state}

    this.history = this.history.slice(0, this.index + 1)
    this.history.push({type, state})
    this.index = this.history.length - 1

    this.changed.emit()
  }

  clear(): void {
    this.history = []
    this.index = -1
    this.changed.emit()
  }

  undo(): void {
    if (this.can_undo) {
      this.index -= 1
      this._do_state_change(this.index)
      this.changed.emit()
    }
  }

  redo(): void {
    if (this.can_redo) {
      this.index += 1
      this._do_state_change(this.index)
      this.changed.emit()
    }
  }

  get can_undo(): boolean {
    return this.index >= 0
  }

  get can_redo(): boolean {
    return this.index < this.history.length - 1
  }
}
