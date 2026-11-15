import {assert} from "./util/assert"

export type DragState<Target, Snapshot> = {
  /** The dragged part of a component, e.g. an edge or the area of a box. */
  readonly target: Target
  /** The state of the component (and of the drag) when the drag started. */
  readonly snapshot: Snapshot
}

/**
 * Keeps track of an interactive drag (e.g. moving or resizing an annotation or
 * a dialog) of a part (target) of a component, from its start until it ends or
 * is cancelled. Cancelling reverts the component to the state captured when
 * the drag started.
 */
export class DragSession<Target, Snapshot> {
  protected _state: DragState<Target, Snapshot> | null = null

  /**
   * @param restore reverts the effects of a drag, given its snapshot
   */
  constructor(protected readonly restore: (snapshot: Snapshot) => void) {}

  get is_active(): boolean {
    return this._state != null
  }

  /** The target being dragged, or `null` if not dragging. */
  get target(): Target | null {
    return this._state?.target ?? null
  }

  /** The state of the drag in progress. */
  get state(): DragState<Target, Snapshot> {
    assert(this._state != null, "not dragging")
    return this._state
  }

  start(target: Target, snapshot: Snapshot): void {
    assert(this._state == null, "already dragging")
    this._state = {target, snapshot}
  }

  /** Finishes the drag, keeping its effects. */
  end(): void {
    this._state = null
  }

  /** Finishes the drag, reverting its effects. */
  cancel(): void {
    const {_state} = this
    if (_state != null) {
      this._state = null
      this.restore(_state.snapshot)
    }
  }
}

/** Phases of panning reported by models' `pan` signals. */
export type PanPhase = "pan:start" | "pan" | "pan:end" | "pan:cancel"
