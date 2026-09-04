const tasks: Map<number, () => void> = new Map()
// Avoid allocating a long-lived channel merely by importing this module.
let channel: MessageChannel | null = null

function get_channel(): MessageChannel {
  if (channel == null) {
    channel = new MessageChannel()
    channel.port1.onmessage = (event) => {
      const handle = event.data
      const fn = tasks.get(handle)
      if (fn != null) {
        try {
          fn()
        } finally {
          tasks.delete(handle)
        }
      }
    }
  }
  return channel
}

let counter = 1

export function defer(): Promise<void> {
  return new Promise((resolve) => {
    const handle = counter++
    tasks.set(handle, resolve)
    get_channel().port2.postMessage(handle)
  })
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function poll(fn: () => boolean, interval: number = 50, timeout: number = 500): Promise<void> {
  while (!fn() && timeout >= 0) {
    await delay(interval)
    timeout -= interval
  }
}

export function paint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

export function idle(): Promise<void> {
  return new Promise((resolve) => {
    requestIdleCallback(() => resolve())
  })
}
