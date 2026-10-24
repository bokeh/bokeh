import {ClientConnection} from "../client/connection"
import type {ClientSession} from "../client/session"

let builtin_models: Promise<boolean> | null = null

/** Whether all npm built-ins are available without loading script bundles. */
export function prepare_builtin_models(): Promise<boolean> {
  return builtin_models ??= import("./session_models").then(({register_builtin_models}) => register_builtin_models()).catch((error) => {
    builtin_models = null
    throw error
  })
}

/** Connection details supplied by the application that issues session tokens. */
export type SessionConnectionOptions = {
  /** Full application WebSocket URL, including its `/ws` suffix. */
  url: string
  token: string
  /** URL-encoded application arguments, without a leading `?`. */
  args_string?: string
  /** Cancels acquisition or closes the connection after readiness. */
  signal?: AbortSignal
  /** Prepare built-in models automatically in the npm runtime. Default: true. */
  register_builtin_models?: boolean
}

/**
 * Owns one fresh connection, independently of the views borrowing its document.
 * Dispose mounts separately when their UI is removed. Closing a connection leaves
 * the decoded document intact. It does not destroy models or server sessions.
 */
export class BokehSessionConnection {
  private _connection: ClientConnection | null = null
  private _disposed = false
  private _reject_cancelled!: (reason: unknown) => void
  private readonly _on_abort = () => this.dispose()

  /** Resolves after the initial document is pulled. It does not imply rendered views. */
  readonly ready: Promise<ClientSession>

  constructor(private readonly _options: SessionConnectionOptions) {
    const cancelled = new Promise<never>((_, reject) => this._reject_cancelled = reject)
    void cancelled.catch(() => {})
    // An already-aborted signal must not open a socket.
    const {signal} = _options
    if (signal?.aborted == true) {
      this.dispose()
      this.ready = cancelled
    } else {
      signal?.addEventListener("abort", this._on_abort, {once: true})
      this.ready = this._connect(cancelled)
    }
    void this.ready.catch(() => {})
  }

  private async _connect(cancelled: Promise<never>): Promise<ClientSession> {
    try {
      const {url, token, args_string, register_builtin_models = true} = this._options
      if (register_builtin_models) {
        await Promise.race([prepare_builtin_models(), cancelled])
        if (this._disposed) {
          return await cancelled
        }
      }
      const connection = new ClientConnection(url, token, args_string)
      this._connection = connection
      const session = await Promise.race([connection.connect(), cancelled])
      // A fulfilled connect() can win the race just before disposal in the same turn.
      if (this._disposed) {
        return await cancelled
      }
      return session
    } catch (error) {
      this.dispose()
      // A document which never reached the caller has no external owner.
      this._connection?.session?.document.destroy()
      throw error
    }
  }

  get disposed(): boolean {
    return this._disposed
  }

  /** Idempotently cancel acquisition and permanently close this owner's connection. */
  dispose(): void {
    if (this._disposed) {
      return
    }
    this._disposed = true
    const {signal} = this._options
    signal?.removeEventListener("abort", this._on_abort)
    this._reject_cancelled(signal?.reason ?? new DOMException("Bokeh session connection was disposed", "AbortError"))
    this._connection?.close()
  }
}

/**
 * Acquire a live session through the existing Bokeh protocol. No connection is
 * cached or implicitly shared. Use `mount(session.document, ...)` to borrow the
 * result, or pass its decoded roots to a framework document adapter.
 */
export function connect_session(options: SessionConnectionOptions): BokehSessionConnection {
  return new BokehSessionConnection(options)
}
