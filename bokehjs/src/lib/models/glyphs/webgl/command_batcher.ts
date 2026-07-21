export type BatchDraw<Props> = (props: Props | Props[]) => void

type PendingBatch<Props = unknown> = {
  readonly key: symbol
  readonly label?: string
  readonly draw: BatchDraw<Props>
  readonly props: Props[]
}

/** Batches only adjacent compatible draws, preserving blending and z-order. */
export class ReglCommandBatcher {
  private _pending: PendingBatch | null = null
  private _submitted = 0
  private _draw_calls = 0

  submit<Props>(key: symbol, draw: BatchDraw<Props>, props: Props, label?: string): void {
    const pending = this._pending
    if (pending != null && pending.key == key) {
      ;(pending.props as Props[]).push(props)
    } else {
      this.flush()
      this._pending = {key, label, draw: draw as BatchDraw<unknown>, props: [props]}
    }
    this._submitted++
  }

  flush(): void {
    const pending = this._pending
    if (pending == null) {
      return
    }
    this._pending = null
    // Preserve regl's direct-call receiver. Invoking `pending.draw(...)` would
    // accidentally bind the PendingBatch object as `this` and change command
    // state resolution.
    const {draw} = pending
    // Always use regl's batch entry point. Besides keeping one code path, this
    // preserves static attribute bindings for singleton deferred commands.
    try {
      draw(pending.props)
    } catch (error) {
      if (pending.label != null) {
        const message = error instanceof Error ? error.message : `${error}`
        throw new Error(`${pending.label} batch failed: ${message}`)
      }
      throw error
    }
    this._draw_calls++
  }

  get stats(): {submitted: number, draw_calls: number} {
    return {submitted: this._submitted, draw_calls: this._draw_calls}
  }

  reset_stats(): void {
    this._submitted = 0
    this._draw_calls = 0
  }
}
