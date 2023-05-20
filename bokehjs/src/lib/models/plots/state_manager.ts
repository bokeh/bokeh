import {Signal0} from "core/signaling"
import type {PlotView} from "./plot_canvas"
import type {RangeInfo} from "./range_manager"
import type {Selection} from "../selections/selection"
import type {DataRenderer} from "../renderers/data_renderer"

export type StateInfo = {
  range?: RangeInfo
  selection?: Map<DataRenderer, Selection>
}

type SelectionChange = "box_select" | "poly_select" | "lasso_select" | "tap"
type RangeChange = "pan" | "wheel_pan" | "box_zoom" | "zoom_in" | "zoom_out" | "wheel_zoom"

export type StateType = SelectionChange | RangeChange

type StateEntry = {type: StateType, state: StateInfo}

export class StateManager {
  readonly changed: Signal0<this["parent"]>

  constructor(readonly parent: PlotView, readonly initial_state: StateInfo) {
    this.changed = new Signal0(this.parent, "state_changed")
  }

  protected history: StateEntry[] = []
  protected index: number = -1

  protected _do_state_change(index: number): StateInfo {
    const state = index in this.history ? this.history[index].state : this.initial_state

    if (state.range != null) {
      this.parent.update_range(state.range)
    }

    if (state.selection != null) {
      this.parent.update_selection(state.selection)
    }

    return state
  }

  peek(): StateEntry | null {
    return this.can_undo ? this.history[this.index] : null
  }

  push(type: StateType, new_state: StateInfo): void {
    const {history, index} = this

    const prev_state = index in history ? history[index].state : {}
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

  undo(): StateInfo | null {
    if (this.can_undo) {
      this.index -= 1
      const state = this._do_state_change(this.index)
      this.changed.emit()
      return state
    }
    return null
  }

  redo(): StateInfo | null {
    if (this.can_redo) {
      this.index += 1
      const state = this._do_state_change(this.index)
      this.changed.emit()
      return state
    }
    return null
  }

  get can_undo(): boolean {
    return this.index >= 0
  }

  get can_redo(): boolean {
    return this.index < this.history.length - 1
  }
}
