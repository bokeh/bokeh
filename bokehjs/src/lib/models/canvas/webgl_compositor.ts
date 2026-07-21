export type WebGLRenderCommand = {
  readonly execute: () => void
  readonly label?: string
}

/** Ordered renderer-wide command queue. Canvas painting acts as a barrier. */
export class WebGLCompositor {
  private _commands: WebGLRenderCommand[] = []
  private _flushing = false

  enqueue(command: WebGLRenderCommand): void {
    this._commands.push(command)
  }

  flush(): number {
    if (this._flushing || this._commands.length == 0) {
      return 0
    }
    const commands = this._commands
    this._commands = []
    this._flushing = true
    try {
      for (const command of commands) {
        command.execute()
      }
    } finally {
      this._flushing = false
    }
    return commands.length
  }

  reset(): void {
    this._commands = []
  }

  get pending(): number {
    return this._commands.length
  }
}
