import {expect, expect_condition, expect_instanceof, expect_not_null} from "#framework/assertions"
import * as sinon from "sinon"

import {server_document} from "@bokehjs/api/server"
import * as session_api from "@bokehjs/api/session"
import {default_resolver} from "@bokehjs/base"
import {ClientConnection} from "@bokehjs/client/connection"
import {ClientSession} from "@bokehjs/client/session"
import {defer, poll} from "@bokehjs/core/util/defer"
import {Document, documents} from "@bokehjs/document"
import {BokehMount, MountError} from "@bokehjs/embed/mount"
import {resource_loader} from "@bokehjs/embed/resources"
import {Plot} from "@bokehjs/models/plots/plot"
import {Div, DivView} from "@bokehjs/models/widgets/div"
import {version as js_version} from "@bokehjs/version"

const token = btoa(JSON.stringify({session_id: "server-document-test"}))

function bootstrap(): Response {
  return Response.json({
    schema: "bokeh.embed-server/v1",
    bokeh_version: js_version,
    token,
    requires: {components: [], extensions: []},
    resources: {mode: "resolved", assets: []},
  })
}

function create_target(): HTMLElement {
  const target = document.createElement("div")
  document.body.append(target)
  return target
}

describe("server_document()", () => {
  it("mounts an application URL into a selector and owns dynamic roots and teardown", async () => {
    const target = create_target()
    target.id = "server-document-target"
    const initial = Div.create({text: "initial root"})
    const doc = new Document({roots: [initial]})
    const sandbox = sinon.createSandbox()
    const fetch = sandbox.stub(globalThis, "fetch").callsFake(async () => bootstrap())
    let connection: ClientConnection | undefined
    sandbox.stub(ClientConnection.prototype, "connect").callsFake(async function(this: ClientConnection) {
      connection = this
      return this.session = new ClientSession(this, doc)
    })
    sandbox.stub(ClientConnection.prototype, "send").returns(true)
    let mounted: BokehMount | undefined
    try {
      mounted = server_document("https://example.test/app/", "#server-document-target")
      expect_instanceof(mounted, BokehMount)
      expect(mounted.state).to.be.equal("pending")
      await mounted.ready
      expect_not_null(connection)

      expect(`${fetch.firstCall.args[0]}`).to.be.equal("https://example.test/app/embed.json")
      expect(connection.url).to.be.equal("wss://example.test/app/ws")
      expect(connection.token).to.be.equal(token)
      expect(mounted.session).to.be.equal(connection.session)
      expect(mounted.document).to.be.equal(doc)
      expect(mounted.ownership).to.be.equal({
        document: "mount", views: "mount", targets: "caller", session: "mount", resources: "shared",
      })
      expect(target.bokehMount).to.be.equal(mounted)
      const initial_view = mounted.view("root")
      expect_instanceof(initial_view, DivView)
      expect(target.contains(initial_view.el)).to.be.true

      const added = Div.create({text: "added root"})
      doc.add_root(added)
      await poll(() => mounted!.views.length == 2)
      expect(mounted.view("root")).to.be.equal(initial_view)
      expect(mounted.target(added.id)).to.be.equal(target)
      const added_view = mounted.view(added.id)
      expect_instanceof(added_view, DivView)
      expect(target.contains(added_view.el)).to.be.true
      doc.remove_root(initial)
      expect(initial_view.is_destroyed).to.be.true
      expect(mounted.root_keys).to.be.equal([added.id])
      expect(mounted.view(added.id)).to.be.equal(added_view)

      const disposing = mounted.dispose()
      expect(mounted.dispose()).to.be.equal(disposing)
      await disposing
      expect(connection.closed_permanently).to.be.true
      expect(doc.is_destroyed).to.be.true
      expect(documents.includes(doc)).to.be.false
      expect(added_view.is_destroyed).to.be.true
      expect(target.childElementCount).to.be.equal(0)
      expect(target.bokehMount).to.be.undefined
      expect(target.isConnected).to.be.true
    } finally {
      await mounted?.dispose()
      if (!doc.is_destroyed) {
        connection?.close()
        doc.destroy()
      }
      sandbox.restore()
      target.remove()
    }
  })

  it("forwards application arguments and authentication choices while using the bootstrap token", async () => {
    const target = create_target()
    try {
      for (const identity of [{session_id: "existing-session"}, {token: "host-issued-token"}]) {
        const sandbox = sinon.createSandbox()
        const fetch = sandbox.stub(globalThis, "fetch").callsFake(async () => bootstrap())
        let connection!: ClientConnection
        sandbox.stub(ClientConnection.prototype, "connect").callsFake(async function(this: ClientConnection) {
          connection = this
          return this.session = new ClientSession(this, new Document())
        })
        let mounted: BokehMount | undefined
        try {
          mounted = server_document("https://example.test/prefix/app", target, {
            ...identity,
            arguments: {account: "one & two"},
            headers: {Authorization: "Bearer application-auth"},
            credentials: "include",
            relative_urls: true,
            register_builtin_models: false,
          })
          await mounted.ready
          const endpoint = new URL(`${fetch.firstCall.args[0]}`)
          const request = fetch.firstCall.args[1]
          const headers = new Headers(request?.headers)
          expect(endpoint.origin).to.be.equal(new URL(document.baseURI).origin)
          expect(endpoint.pathname).to.be.equal("/prefix/app/embed.json")
          expect(endpoint.searchParams.get("account")).to.be.equal("one & two")
          expect(endpoint.searchParams.has("bokeh-token")).to.be.false
          expect(headers.get("Authorization")).to.be.equal("Bearer application-auth")
          expect(headers.get("Bokeh-Session-Id")).to.be.equal(identity.session_id ?? null)
          expect(headers.get("Bokeh-Token")).to.be.equal(identity.token ?? null)
          expect(headers.get("Bokeh-Resource-Mode")).to.be.equal("none")
          expect(request?.credentials).to.be.equal("include")
          const websocket = new URL(connection.url)
          expect(websocket.host).to.be.equal(endpoint.host)
          expect(websocket.pathname).to.be.equal("/prefix/app/ws")
          expect_not_null(connection.args_string)
          expect(new URLSearchParams(connection.args_string).get("account")).to.be.equal("one & two")
          expect(connection.token).to.be.equal(token)
        } finally {
          await mounted?.dispose()
          sandbox.restore()
        }
      }
    } finally {
      target.remove()
    }
  })

  it("makes built-in models available before connecting without replacing application registrations", async () => {
    const target = create_target()
    const original_plot = default_resolver.get("Plot")
    expect_not_null(original_plot)
    class ApplicationPlot extends Plot {}
    ApplicationPlot.__qualified__ = "Plot"
    default_resolver.register(ApplicationPlot, true)
    const sandbox = sinon.createSandbox()
    sandbox.stub(globalThis, "fetch").callsFake(async () => bootstrap())
    const connect = sandbox.stub(ClientConnection.prototype, "connect").callsFake(async function(this: ClientConnection) {
      for (const name of ["Plot", "Slider", "DataTable"]) {
        expect_not_null(default_resolver.get(name))
      }
      expect(default_resolver.get("Plot")).to.be.equal(ApplicationPlot)
      return this.session = new ClientSession(this, new Document())
    })
    let mounted: BokehMount | undefined
    try {
      mounted = server_document("/app", target)
      await mounted.ready
      expect(connect.calledOnce).to.be.true
      expect(default_resolver.get("Plot")).to.be.equal(ApplicationPlot)
    } finally {
      await mounted?.dispose()
      sandbox.restore()
      default_resolver.register(original_plot, true)
      target.remove()
    }
  })

  it("closes and destroys the acquired session when the target is invalid", async () => {
    const sandbox = sinon.createSandbox()
    sandbox.stub(globalThis, "fetch").callsFake(async () => bootstrap())
    let connection!: ClientConnection
    let doc!: Document
    sandbox.stub(ClientConnection.prototype, "connect").callsFake(async function(this: ClientConnection) {
      connection = this
      doc = new Document({roots: [Div.create({text: "unrendered"})]})
      return this.session = new ClientSession(this, doc)
    })
    let mounted: BokehMount | undefined
    try {
      mounted = server_document("/app", "#missing-server-document-target")
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("target")
      await mounted.when_disposed
      expect(connection.closed_permanently).to.be.true
      expect(doc.is_destroyed).to.be.true
      expect(documents.includes(doc)).to.be.false
    } finally {
      await mounted?.dispose()
      sandbox.restore()
    }
  })

  it("performs no network work for an already aborted call", async () => {
    const target = create_target()
    const sandbox = sinon.createSandbox()
    const fetch = sandbox.stub(globalThis, "fetch").rejects(new Error("must not fetch"))
    const connect = sandbox.stub(ClientConnection.prototype, "connect").rejects(new Error("must not connect"))
    const controller = new AbortController()
    const reason = new Error("host removed before mounting")
    controller.abort(reason)
    let mounted: BokehMount | undefined
    try {
      mounted = server_document("/app", target, {signal: controller.signal})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("abort")
      expect(error.cause).to.be.equal(reason)
      await mounted.when_disposed
      expect(fetch.called).to.be.false
      expect(connect.called).to.be.false
    } finally {
      await mounted?.dispose()
      sandbox.restore()
      target.remove()
    }
  })

  it("cancels a pending bootstrap and settles disposal without opening a connection", async () => {
    const target = create_target()
    const sandbox = sinon.createSandbox()
    let requested!: (signal: AbortSignal) => void
    const request_started = new Promise<AbortSignal>((resolve) => requested = resolve)
    sandbox.stub(globalThis, "fetch").callsFake(async (_input, init) => {
      const signal = init?.signal
      expect_not_null(signal)
      requested(signal)
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), {once: true})
      })
    })
    const connect = sandbox.stub(ClientConnection.prototype, "connect").rejects(new Error("must not connect"))
    const controller = new AbortController()
    const reason = new Error("host removed during bootstrap")
    let mounted: BokehMount | undefined
    try {
      mounted = server_document("/app", target, {signal: controller.signal})
      const request_signal = await request_started
      controller.abort(reason)
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("abort")
      expect(error.cause).to.be.equal(reason)
      await mounted.when_disposed
      expect(request_signal.aborted).to.be.true
      expect(connect.called).to.be.false
      expect(target.bokehMount).to.be.undefined
    } finally {
      await mounted?.dispose()
      sandbox.restore()
      target.remove()
    }
  })

  it("settles cancellation while model preparation is pending and ignores its later completion", async () => {
    const target = create_target()
    const sandbox = sinon.createSandbox()
    let finish_preparation!: (prepared: boolean) => void
    const preparing = new Promise<boolean>((resolve) => finish_preparation = resolve)
    let started!: () => void
    const preparation_started = new Promise<void>((resolve) => started = resolve)
    sandbox.stub(session_api, "prepare_builtin_models").callsFake(() => {
      started()
      return preparing
    })
    const fetch = sandbox.stub(globalThis, "fetch").rejects(new Error("must not fetch"))
    const connect = sandbox.stub(ClientConnection.prototype, "connect").rejects(new Error("must not connect"))
    let mounted: BokehMount | undefined
    try {
      mounted = server_document("/app", target)
      await preparation_started
      let disposed = false
      void mounted.dispose().then(() => disposed = true)
      await poll(() => disposed, 10, 100)
      expect(disposed).to.be.true
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("disposed")

      finish_preparation(true)
      await defer()
      expect(fetch.called).to.be.false
      expect(connect.called).to.be.false
      expect(target.bokehMount).to.be.undefined
    } finally {
      finish_preparation(true)
      await mounted?.dispose()
      sandbox.restore()
      target.remove()
    }
  })

  it("cleans up a connection and undelivered document when acquisition fails", async () => {
    const target = create_target()
    const sandbox = sinon.createSandbox()
    sandbox.stub(globalThis, "fetch").callsFake(async () => bootstrap())
    const failure = new Error("initial document patch failed")
    let connection!: ClientConnection
    let doc!: Document
    sandbox.stub(ClientConnection.prototype, "connect").callsFake(async function(this: ClientConnection) {
      connection = this
      doc = new Document()
      this.session = new ClientSession(this, doc)
      throw failure
    })
    let mounted: BokehMount | undefined
    try {
      mounted = server_document("/app", target)
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("websocket")
      expect(error.message.includes(failure.message)).to.be.true
      await mounted.when_disposed
      expect(connection.closed_permanently).to.be.true
      expect(doc.is_destroyed).to.be.true
      expect(documents.includes(doc)).to.be.false
      expect(target.bokehMountError).to.be.equal(error)
    } finally {
      await mounted?.dispose()
      sandbox.restore()
      target.remove()
    }
  })

  for (const [name, prepared] of [["npm models", true], ["script bundles", false], ["host models", null]] as const) {
    it(`preserves the server resource policy with ${name}`, async () => {
      const target = create_target()
      const sandbox = sinon.createSandbox()
      const fetch = sandbox.stub(globalThis, "fetch").callsFake(async () => bootstrap())
      const ensure = sandbox.stub(resource_loader, "ensure").resolves()
      sandbox.stub(session_api, "prepare_builtin_models").resolves(prepared ?? false)
      sandbox.stub(ClientConnection.prototype, "connect").callsFake(async function(this: ClientConnection) {
        return this.session = new ClientSession(this, new Document())
      })
      let mounted: BokehMount | undefined
      try {
        mounted = server_document("/app", target, {
          register_builtin_models: prepared != null,
          resources: {mode: "server", root_url: "https://assets.example.test/runtime", minified: false},
        })
        await mounted.ready
        const headers = new Headers(fetch.firstCall.args[1]?.headers)
        expect(headers.get("Bokeh-Resource-Mode")).to.be.equal("server")
        expect(headers.get("Bokeh-Resource-Minified")).to.be.equal("false")
        const component_policy = ensure.firstCall.args[1]
        expect_condition(typeof component_policy == "object", "expected a structured component resource policy")
        expect(component_policy.mode).to.be.equal(prepared === true ? "none" : "server")
        if (prepared !== true) {
          expect(component_policy.root_url).to.be.equal("https://assets.example.test/runtime")
          expect(component_policy.minified).to.be.false
        }
        expect(ensure.args.every(([, , version]) => version == js_version)).to.be.true
      } finally {
        await mounted?.dispose()
        sandbox.restore()
        target.remove()
      }
    })
  }
})
