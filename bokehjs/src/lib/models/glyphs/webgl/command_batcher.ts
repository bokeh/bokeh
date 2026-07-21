export type BatchDraw<Props> = (props: Props | Props[]) => void

type PendingBatch<Props = unknown> = {
  readonly key: symbol
  readonly label?: string
  readonly draw: BatchDraw<Props>
  readonly props: Props[]
  readonly resources: Set<object>
}

/** Batches only adjacent compatible draws, preserving blending and z-order. */
export class ReglCommandBatcher {
  private _pending: PendingBatch | null = null
  private _submitted = 0
  private _draw_calls = 0

  submit<Props>(
    key: symbol, draw: BatchDraw<Props>, props: Props, label?: string, resources: Iterable<object> = [],
  ): void {
    const pending = this._pending
    if (pending != null && pending.key == key) {
      ;(pending.props as Props[]).push(props)
      for (const resource of resources) {
        pending.resources.add(resource)
      }
    } else {
      this.flush()
      this._pending = {key, label, draw: draw as BatchDraw<unknown>, props: [props], resources: new Set(resources)}
    }
    this._submitted++
  }

  references(resource: object): boolean {
    return this._pending?.resources.has(resource) ?? false
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

  get pending(): {commands: number, label?: string} {
    return {commands: this._pending?.props.length ?? 0, label: this._pending?.label}
  }

  reset_stats(): void {
    this._submitted = 0
    this._draw_calls = 0
  }
}
