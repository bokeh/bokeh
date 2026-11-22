import {expect} from "#framework/assertions"

import {connect_session} from "@bokehjs/api/session"
import {mount} from "@bokehjs/embed/mount"
import {default_resolver} from "@bokehjs/base"
import {ClientConnection} from "@bokehjs/client/connection"
import {ClientSession} from "@bokehjs/client/session"
import {Document, documents} from "@bokehjs/document"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"

const default_options = {url: "ws://127.0.0.1:5877/ws", token: btoa(JSON.stringify({session_id: "mount-test"}))}
// The transport lifecycle tests below keep registration outside their timing seam.
const options = {...default_options, register_builtin_models: false}

async function with_connection(connect: (connection: ClientConnection) => Promise<ClientSession>, test: () => Promise<void>) {
  const original = ClientConnection.prototype.connect
  ClientConnection.prototype.connect = function() { return connect(this) }
  try {
    await test()
  } finally {
    ClientConnection.prototype.connect = original
  }
}

describe("connect_session()", () => {
  it("prepares builtins for concurrent clients without replacing registrations or opening cancelled connections", async () => {
    const original_plot = default_resolver.get("Plot")
    if (original_plot == null) {
      throw new Error("the unit test registry is missing Plot")
    }
    class ApplicationPlot extends Plot {}
    ApplicationPlot.__qualified__ = "Plot"
    default_resolver.register(ApplicationPlot, true)
    const original_warn = console.warn
    const warnings: unknown[][] = []
    console.warn = (...args: unknown[]) => warnings.push(args)
    const connections: ClientConnection[] = []
    const owners: ReturnType<typeof connect_session>[] = []
    try {
      await with_connection(async (connection) => {
        connections.push(connection)
        for (const name of ["Plot", "Slider", "DataTable"]) {
          expect(default_resolver.get(name) != null).to.be.true
        }
        return connection.session = new ClientSession(connection, new Document())
      }, async () => {
        const cancelled = connect_session(default_options)
        owners.push(cancelled)
        cancelled.dispose()
        const first = connect_session(default_options)
        const second = connect_session(default_options)
        owners.push(first, second)
        await Promise.all([first.ready, second.ready])
        expect((await cancelled.ready.catch((error) => error)).name).to.be.equal("AbortError")
        expect(connections.length).to.be.equal(2)
        expect(default_resolver.get("Plot")).to.be.equal(ApplicationPlot)

        const repeated = connect_session(default_options)
        owners.push(repeated)
        await repeated.ready
        expect(connections.length).to.be.equal(3)
        expect(warnings.length).to.be.equal(0)
      })
    } finally {
      for (const owner of owners) {
        owner.dispose()
      }
      for (const connection of connections) {
        connection.session?.document.destroy()
      }
      console.warn = original_warn
      default_resolver.register(original_plot, true)
    }
  })

  it("doesn't open a connection for an already aborted signal", async () => {
    const abort = new AbortController()
    const reason = new Error("cancelled before acquisition")
    abort.abort(reason)
    await with_connection(async () => { throw new Error("must not connect") }, async () => {
      const owner = connect_session({...options, signal: abort.signal})
      expect(await owner.ready.catch((error) => error)).to.be.equal(reason)
      expect(owner.disposed).to.be.true
      owner.dispose()
    })
  })

  it("cancels a pending connection without waiting for a socket close event", async () => {
    let connection!: ClientConnection
    await with_connection((created) => {
      connection = created
      return new Promise(() => {})
    }, async () => {
      const abort = new AbortController()
      const owner = connect_session({...options, signal: abort.signal})
      abort.abort()
      const error = await owner.ready.catch((error) => error)
      expect(error.name).to.be.equal("AbortError")
      expect(owner.disposed).to.be.true
      expect(connection.closed_permanently).to.be.true
      expect(connection.session).to.be.null
      owner.dispose()
    })
  })

  it("closes failed acquisitions and preserves the original error", async () => {
    let connection!: ClientConnection
    const failure = new Error("connection refused")
    await with_connection(async (created) => {
      connection = created
      throw failure
    }, async () => {
      const owner = connect_session(options)
      expect(await owner.ready.catch((error) => error)).to.be.equal(failure)
      expect(connection.closed_permanently).to.be.true
      expect(owner.disposed).to.be.true
    })
  })

  it("rejects cancellation after connection completion but before delivering readiness", async () => {
    let doc!: Document
    let connection!: ClientConnection
    await with_connection(async (created) => {
      connection = created
      doc = new Document()
      return created.session = new ClientSession(created, doc)
    }, async () => {
      const owner = connect_session(options)
      owner.dispose()
      const error = await owner.ready.catch((error) => error)
      expect(error.name).to.be.equal("AbortError")
      expect(connection.closed_permanently).to.be.true
      expect(documents.includes(doc)).to.be.false
    })
  })

  it("releases an undelivered document when acquisition fails after decoding", async () => {
    let doc!: Document
    const failure = new Error("initialization patch failed")
    await with_connection(async (connection) => {
      doc = new Document()
      connection.session = new ClientSession(connection, doc)
      throw failure
    }, async () => {
      const owner = connect_session(options)
      expect(await owner.ready.catch((error) => error)).to.be.equal(failure)
      expect(owner.disposed).to.be.true
      expect(documents.includes(doc)).to.be.false
    })
  })

  it("reports invalid tokens and invalid WebSocket URLs through readiness", async () => {
    for (const bad of [{...options, token: "!"}, {...options, url: "ftp://invalid.example"}]) {
      const owner = connect_session(bad)
      expect(await owner.ready.catch((error) => error)).to.be.instanceof(Error)
      expect(owner.disposed).to.be.true
    }
  })

  it("owns fresh connections and forwards encoded application arguments", async () => {
    const connections: ClientConnection[] = []
    await with_connection(async (connection) => {
      connections.push(connection)
      return connection.session = new ClientSession(connection, new Document())
    }, async () => {
      const first = connect_session({...options, args_string: "foo=one%20two"})
      const second = connect_session(options)
      const sessions = await Promise.all([first.ready, second.ready])
      expect(connections.length).to.be.equal(2)
      expect(sessions[0] == sessions[1]).to.be.false
      expect(connections[0].args_string).to.be.equal("foo=one%20two")
      first.dispose()
      expect(connections[0].closed_permanently).to.be.true
      expect(connections[1].closed_permanently).to.be.false
      second.dispose()
      for (const session of sessions) {
        session.document.destroy()
      }
    })
  })

  it("lets a borrowed mount detach, fail, abort, and remount without closing the session", async () => {
    const first = Plot.create({width: 100, height: 100})
    const second = Plot.create({width: 100, height: 100})
    const doc = new Document({roots: [first, second]})
    let connection!: ClientConnection
    await with_connection(async (created) => {
      connection = created
      return created.session = new ClientSession(created, doc)
    }, async () => {
      const owner = connect_session(options)
      const session = await owner.ready
      const left = document.createElement("div")
      const right = document.createElement("div")
      document.body.append(left, right)
      try {
        const borrowed = mount(session.document, {[first.id]: left, [second.id]: right})
        await borrowed.ready
        const sibling = borrowed.view(second.id)
        borrowed.detach(first.id)
        expect(first.document).to.be.equal(doc)
        await borrowed.attach(first.id, left)
        expect(borrowed.view(second.id)).to.be.equal(sibling)
        await borrowed.dispose()
        expect(connection.closed_permanently).to.be.false
        expect(doc.views_manager).to.be.undefined

        const failed = mount(doc, {missing: left})
        await failed.ready.catch(() => {})
        expect(failed.state).to.be.equal("failed")
        expect(connection.closed_permanently).to.be.false

        const abort = new AbortController()
        const remounted = mount(doc, {[first.id]: left}, {signal: abort.signal})
        await remounted.ready
        abort.abort()
        await remounted.when_disposed
        expect(connection.closed_permanently).to.be.false
        expect(first.document).to.be.equal(doc)
      } finally {
        owner.dispose()
        left.remove()
        right.remove()
        doc.destroy()
      }
      expect(connection.closed_permanently).to.be.true
    })
  })

  it("keeps rendering failure separate from connection ownership", async () => {
    class FailingView extends PlotView {
      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        throw new Error("render failed")
      }
    }
    class FailingPlot extends Plot {
      static { this.prototype.default_view = FailingView }
    }
    const doc = new Document({roots: [FailingPlot.create()]})
    let connection!: ClientConnection
    await with_connection(async (created) => {
      connection = created
      return created.session = new ClientSession(created, doc)
    }, async () => {
      const owner = connect_session(options)
      const session = await owner.ready
      const target = document.createElement("div")
      document.body.append(target)
      const borrowed = mount(session.document, target)
      const error = await borrowed.ready.catch((error) => error)
      expect(borrowed.state).to.be.equal("failed")
      expect(error.kind).to.be.equal("render")
      expect(error.message).to.be.equal("render failed")
      expect(doc.views_manager).to.be.undefined
      expect(connection.closed_permanently).to.be.false
      owner.dispose()
      expect(connection.closed_permanently).to.be.true
      doc.destroy()
      target.remove()
    })
  })

  it("closes after readiness on abort without destroying the decoded document", async () => {
    const plot = Plot.create()
    const doc = new Document({roots: [plot]})
    let connection!: ClientConnection
    let sent = 0
    await with_connection(async (created) => {
      connection = created
      connection.send = () => { sent++; return true }
      return created.session = new ClientSession(created, doc)
    }, async () => {
      const abort = new AbortController()
      const owner = connect_session({...options, signal: abort.signal})
      await owner.ready
      plot.name = "connected"
      expect(sent).to.be.equal(1)
      abort.abort()
      owner.dispose()
      expect(connection.closed_permanently).to.be.true
      plot.name = "disconnected"
      expect(sent).to.be.equal(1)
      expect(plot.document).to.be.equal(doc)
      doc.destroy()
    })
  })
})
