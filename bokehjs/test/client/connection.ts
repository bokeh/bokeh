import * as chai from "chai"
import * as chai_as_promised from "chai-as-promised"
chai.use(chai_as_promised)
const {expect} = chai

import * as child_process from "child_process"
import * as path from "path"
import * as net from "net"

// node.js compat shim for WebSocket
(global as any).WebSocket = require("websocket").w3cwebsocket

import {pull_session} from "@bokehjs/client/connection"
import {Range1d} from "@bokehjs/models/ranges/range1d"

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

const server_timeout_millis = 7500

// Launch server, wait for it to be alive, and then
// run a test function that returns a Promise
function with_server<T>(f: (x: {url: string}) => T): Promise<T> {
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
      // yay javascript, stick attributes on anything!
      const url = `ws://localhost:${port}/ws`
      const v = f({url})
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

describe("ClientSession", function() {

  // It takes time to spin up the server so without this things get
  // flaky on Travis. Lengthen if we keep getting Travis failures.
  // The default (at least when this comment was written) was
  // 2000ms.
  this.timeout(server_timeout_millis)

  it("should be able to connect", async () => {
    const promise = with_server((server_process) => {
      return pull_session(server_process.url).then(
        (session) => {
          session.close()
          return "OK"
        },
        (error) => {
          throw error
        },
      )
    })
    return expect(promise).eventually.to.equal("OK")
  })

  it("should pass request string to connection", async () => {
    const promise = with_server((server_process) => {
      return pull_session(server_process.url, undefined, "foo=10&bar=20").then(
        (session) => {
          expect((session as any)._connection.args_string).to.be.equal("foo=10&bar=20") // XXX
          return "OK"
        },
      )
    })
    return expect(promise).eventually.to.equal("OK")
  })

  it("should be able to connect", async () => {
    const promise = with_server((server_process) => {
      return pull_session(server_process.url).then(
        (session) => {
          session.close()
          return "OK"
        },
        (error) => {
          throw error
        },
      )
    })
    return expect(promise).eventually.to.equal("OK")
  })

  it("should get server info", async () => {
    const promise = with_server((server_process) => {
      return pull_session(server_process.url).then(
        (session) => {
          return session.request_server_info().then(
            (info) => {
              expect(info).to.have.property('version_info')
              return "OK"
            },
          )
        },
       )
    })
    return expect(promise).eventually.to.equal("OK")
  })

  it("should sync a document between two connections", async () => {
    const promise = with_server((server_process) => {
      const added_root = pull_session(server_process.url).then(
        (session) => {
          const root1 = new Range1d({start: 123, end: 456})
          session.document.add_root(root1)
          session.document.set_title("Hello Title")
          return session.force_roundtrip().then((_ignored) => session)
        },
        (error) => {
          throw error
        },
      ).catch((error) => {
        throw error
      })

      return added_root.then(
        (session1) => {
          return pull_session(server_process.url, session1.id).then(
            (session2) => {
              try {
                expect(session2.document.roots().length).to.equal(1)
                const root = session2.document.roots()[0]
                expect(root.start).to.equal(123)
                expect(root.end).to.equal(456)
                expect(session2.document.title()).to.equal("Hello Title")
              } catch (e) {
                throw e
              } finally {
                session1.close()
                session2.close()
              }
              return "OK"
            },
            (error) => {
              session1.close()
              throw error
            },
          ).catch((error) => {
            // es6 promises would swallow the test errors otherwise
            throw error
          })
        },
        (error) => {
          throw error
        },
      ).catch((error) => {
        throw error
      })
    })
    return expect(promise).eventually.to.equal("OK")
  })
})
