import * as child_process from "child_process"
import * as path from "path"
import * as net from "net"

// Promise works in a very annoying way, make it
// have resolve and reject methods instead
type PromiseWithMethods<T> = Promise<T> & {
  resolve(value?: T): void
  reject(reason?: unknown): void
}

function promise_with_methods<T>(): PromiseWithMethods<T> {
  let capture_resolve: (value?: any) => void
  let capture_reject: (reason?: any) => void

  const promise = new Promise((resolve, reject) => {
    capture_resolve = resolve
    capture_reject = reject
  }) as PromiseWithMethods<T>

  promise.resolve = (value) => capture_resolve(value)
  promise.reject = (value) => capture_reject(value)

  return promise
}

let _previous_port = 5007
function next_port(): number {
  _previous_port += 1
  return _previous_port
}

export const server_timeout_millis = 7500

// Launch server, wait for it to be alive, and then
// run a test function that returns a Promise
export function with_server<T>(f: (url: string) => T): Promise<T> {
  const promise = promise_with_methods<T>()

  let all_done = false
  const mark_done = () => all_done = true
  promise.then(mark_done, mark_done)

  const basedir = path.normalize(process.cwd() + "/..")
  const oldpath = process.env.PYTHONPATH
  const pypath = oldpath != null ? `${basedir}:${oldpath}` : basedir
  const port = next_port()
  const env = {...process.env, PYTHONPATH: pypath}
  const handle = child_process.spawn("python", ["-m", "bokeh", "serve", `--port=${port}`], {env, cwd: basedir})
  handle.on('close', () => {
    promise.reject(new Error("Server exited before test promise was resolved"))
  })

  const cleanup_process = () => handle.kill()
  promise.then(cleanup_process, cleanup_process)

  const runF = () => {
    if (all_done)
      return
    try {
      const url = `ws://localhost:${port}/ws`
      const v = f(url)
      // note that "v" can be another promise OR a final value
      promise.resolve(v)
    } catch (e) {
      promise.reject(e)
    }
  }

  let client: net.Socket | null = null
  let server_ready = false
  let num_server_attempts = 0
  const checkServer = () => {
    if (all_done || server_ready) {
      if (client != null) {
        client.destroy()
        client = null
      }
    } else if (num_server_attempts > (server_timeout_millis / 100)) {
      promise.reject(new Error("Failed to connect to the server"))
    } else if (client != null) {
      // still waiting on a client we already have...
      setTimeout(checkServer, 100)
    } else {
      num_server_attempts = num_server_attempts + 1
      client = net.connect(port, 'localhost')
      client.on('error', () => {
        client!.destroy()
        client = null
        if (!(all_done || server_ready))
          setTimeout(checkServer, 100)
      })
      client.on('connect', () => {
        client!.destroy()
        client = null
        server_ready = true
        setTimeout(runF, 0)
      })
    }
  }

  setTimeout(checkServer, 100)

  return promise
}
