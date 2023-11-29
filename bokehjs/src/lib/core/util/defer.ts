const channel = new MessageChannel()
const tasks: Map<number, () => void> = new Map()

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

let counter = 1

export function defer(): Promise<void> {
  return new Promise((resolve) => {
    const handle = counter++
    tasks.set(handle, resolve)
    channel.port2.postMessage(handle)
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
