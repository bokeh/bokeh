export type SyncPolicyKind = "throttle" | "debounce" | "committed"
export type SyncPolicy = ["throttle", number] | ["debounce", number] | ["committed", null]

type Pending<T, K extends SyncPolicyQueueKey> = {
  key: K
  value: T | undefined
  timeout: ReturnType<typeof setTimeout> | null
}

export type SyncPolicyQueueKeyPart = string | number | null
export type SyncPolicyQueueKey = readonly SyncPolicyQueueKeyPart[]

function key_id(key: SyncPolicyQueueKey): string {
  // JSON gives primitive segment arrays value equality for exact Map lookups.
  // Prefix matching below compares the original segments instead.
  return JSON.stringify(key)
}

function has_prefix(key: SyncPolicyQueueKey, prefix: SyncPolicyQueueKey): boolean {
  return prefix.length <= key.length && prefix.every((part, i) => part === key[i])
}

/**
 * Applies a synchronization policy to values identified by a stable compound
 * key. Keys consist of primitive segments. `flush()` and `cancel()` match
 * whole leading segments, so e.g. `["value", 1]` doesn't also match
 * `["value", 10]`.
 *
 * The queue is deliberately independent of model signals and transport. This
 * allows JavaScript callbacks and server synchronization to observe the same
 * delivery semantics without delaying browser-side model state or rendering.
 */
export class SyncPolicyQueue<T, K extends SyncPolicyQueueKey = SyncPolicyQueueKey> {
  protected readonly _pending = new Map<string, Pending<T, K>>()
  constructor(protected readonly _deliver: (value: T) => void) {}

  *keys(): IterableIterator<K> {
    for (const pending of this._pending.values()) {
      yield pending.key
    }
  }

  submit(key: K, policy: SyncPolicy, value: T, deferred: boolean): T | null {
    const id = key_id(key)
    const [kind, wait] = policy
    if (kind == "throttle") {
      const pending = this._pending.get(id)
      if (pending == null) {
        const state: Pending<T, K> = {key, value: undefined, timeout: null}
        const tick = () => {
          if (state.value == undefined) {
            this._pending.delete(id)
          } else {
            const value = state.value
            state.value = undefined
            state.timeout = setTimeout(tick, wait)
            this._deliver(value)
          }
        }
        state.timeout = setTimeout(tick, wait)
        this._pending.set(id, state)
        return value
      }
      pending.value = value
    } else if (kind == "debounce") {
      this._cancel(key)
      const state: Pending<T, K> = {key, value, timeout: null}
      state.timeout = setTimeout(() => {
        this._pending.delete(id)
        if (state.value != undefined) {
          this._deliver(state.value)
        }
      }, wait)
      this._pending.set(id, state)
    } else if (!deferred) {
      this._cancel(key)
      return value
    } else {
      this._cancel(key)
      this._pending.set(id, {key, value, timeout: null})
    }
    return null
  }

  flush(prefix: SyncPolicyQueueKey = []): void {
    for (const [id, pending] of this._pending) {
      if (has_prefix(pending.key, prefix)) {
        this._clear_timeout(pending)
        this._pending.delete(id)
        if (pending.value != undefined) {
          this._deliver(pending.value)
        }
      }
    }
  }

  cancel(prefix: SyncPolicyQueueKey = []): void {
    for (const [id, pending] of this._pending) {
      if (has_prefix(pending.key, prefix)) {
        this._clear_timeout(pending)
        this._pending.delete(id)
      }
    }
  }

  drain(): T[] {
    const values: T[] = []
    for (const pending of this._pending.values()) {
      this._clear_timeout(pending)
      if (pending.value != undefined) {
        values.push(pending.value)
      }
    }
    this._pending.clear()
    return values
  }

  protected _clear_timeout(pending: Pending<T, K>): void {
    if (pending.timeout != null) {
      clearTimeout(pending.timeout)
    }
  }

  protected _cancel(key: K): void {
    const id = key_id(key)
    const pending = this._pending.get(id)
    if (pending != null) {
      this._clear_timeout(pending)
      this._pending.delete(id)
    }
  }
}
