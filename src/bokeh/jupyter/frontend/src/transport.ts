import {RevisionConsumer, RevisionQueue} from "./revision_queue"

export function dataViews(buffers: readonly (ArrayBuffer | ArrayBufferView)[] | undefined): DataView[] {
  return (buffers ?? []).map((buffer) => {
    if (buffer instanceof DataView) return buffer
    if (ArrayBuffer.isView(buffer)) return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    return new DataView(buffer)
  })
}

export function withTimeout<T>(promise: Promise<T>, milliseconds: number, error: unknown,
    signal?: AbortSignal): Promise<T> {
  if (signal?.aborted == true) return Promise.reject(signal.reason ?? new DOMException("Rendering was cancelled", "AbortError"))
  return new Promise((resolve, reject) => {
    let settled = false

    const finish = (callback: (value: any) => void, value: any) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      signal?.removeEventListener("abort", aborted)
      callback(value)
    }

    const aborted = () => finish(reject, signal?.reason ?? new DOMException("Rendering was cancelled", "AbortError"))
    const timer = window.setTimeout(() => finish(reject, error), milliseconds)
    signal?.addEventListener("abort", aborted, {once: true})
    promise.then((value) => finish(resolve, value), (cause) => finish(reject, cause))
  })
}

/** Shared bounded revision transport used by Jupyter comms and AnyWidget. */
export class LiveRevisionTransport {
  constructor(private readonly sendResync: () => void) {}

  private readonly queue = new RevisionQueue()
  private readonly consumers = new Set<RevisionConsumer>()
  private readonly dispatch: RevisionConsumer = async (message, buffers) => {
    await Promise.all([...this.consumers].map(async (consumer) => consumer(message, buffers)))
  }

  receive(message: any, buffers: DataView[] = []): boolean {
    if (message?.kind === "patch" && Number.isSafeInteger(message.revision)) {
      if (this.queue.pushPatch(message, buffers) === "overflow") this.sendResync()
      return true
    }
    if (message?.kind === "snapshot" && typeof message.artifact === "string" &&
        typeof message.resource_id === "string" && Number.isSafeInteger(message.revision)) {
      this.queue.replaceWithSnapshot(message, buffers)
      return true
    }
    return false
  }

  subscribe(callback: RevisionConsumer): void {
    const wasEmpty = this.consumers.size === 0
    this.consumers.add(callback)
    if (wasEmpty) this.queue.subscribe(this.dispatch)
  }

  unsubscribe(callback: RevisionConsumer): void {
    this.consumers.delete(callback)
    if (this.consumers.size === 0) this.queue.unsubscribe(this.dispatch)
  }

  requestResync(): void {
    if (this.queue.requestResync()) this.sendResync()
  }

  reset(revision: number): void {
    this.queue.reset(revision)
  }

  clear(): void {
    this.consumers.clear()
    this.queue.clear()
  }
}
