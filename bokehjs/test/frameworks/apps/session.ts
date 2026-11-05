import {Document, Model, Plotting, connect_session, index} from "@bokeh/bokehjs"
import type {BokehMount, ClientSession} from "@bokeh/bokehjs"
import {SessionMountController} from "@bokeh/framework"
import type {BokehSessionSource} from "@bokeh/framework"

export type SessionRenderRequest = {
  source: BokehSessionSource
  onSession(session: ClientSession): void
  onMounted(mounted: BokehMount): void
  onError(error: unknown): void
}

export type SessionRender = (request: SessionRenderRequest) => {
  target(name: string): HTMLElement | null
  showFirst(visible: boolean): void | Promise<void>
  unmount(): void | Promise<void>
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function wait_until(predicate: () => boolean, message: string): Promise<void> {
  const deadline = Date.now() + 5000
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error(message)
    }
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

function create_document(): Document {
  const first = Plotting.figure({name: "first", width: 180, height: 120, tools: [], toolbar_location: null})
  first.line([0, 1], [0, 1])
  const second = Plotting.figure({name: "second", width: 180, height: 120, tools: [], toolbar_location: null})
  second.line([0, 1], [1, 0])
  return new Document({roots: [first, second]})
}

// Keep the real connection, protocol receiver, and ClientSession. Only the
// browser transport is replaced so every framework can test ownership offline.
async function with_transport(run: (transport: {
  sockets: {closed: boolean}[]
  mode(value: "ready" | "pending" | "failed"): void
}) => Promise<void>): Promise<void> {
  const NativeWebSocket = globalThis.WebSocket
  const document = create_document()
  const doc = document.to_json()
  const sockets: TestWebSocket[] = []
  let mode: "ready" | "pending" | "failed" = "ready"
  class TestWebSocket {
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSING = 2
    static readonly CLOSED = 3
    readyState = TestWebSocket.CONNECTING
    binaryType = "arraybuffer"
    onopen: (() => void) | null = null
    onclose: ((event: CloseEvent) => void) | null = null
    onerror: (() => void) | null = null
    onmessage: ((event: MessageEvent<string>) => void) | null = null
    private next_id = 0
    get closed(): boolean { return this.readyState == TestWebSocket.CLOSED }
    constructor() {
      sockets.push(this)
      queueMicrotask(() => {
        if (this.closed || mode == "pending") {
          return
        }
        if (mode == "failed") {
          this.onerror?.()
        } else {
          this.readyState = TestWebSocket.OPEN
          this.onopen?.()
          this.reply("ACK", {})
        }
      })
    }
    send(envelope: string): void {
      const {header, buffers} = JSON.parse(envelope) as {header: {msgid: string, msgtype: string}, buffers: string[]}
      assert(buffers.length == 0, "framework test transport received unexpected binary buffers")
      if (header.msgtype == "PULL-DOC-REQ") {
        this.reply("PULL-DOC-REPLY", {doc}, header.msgid)
      } else if (header.msgtype == "SYNC") {
        this.reply("OK", {}, header.msgid)
      }
    }
    private reply(msgtype: string, content: unknown, reqid?: string): void {
      queueMicrotask(() => {
        if (!this.closed) {
          const header = {msgid: String(this.next_id++), msgtype, reqid}
          this.onmessage?.(new MessageEvent("message", {data: JSON.stringify({header, content, buffers: []})}))
        }
      })
    }
    close(): void {
      if (!this.closed) {
        this.readyState = TestWebSocket.CLOSED
        queueMicrotask(() => this.onclose?.(new CloseEvent("close", {code: 1000, wasClean: true})))
      }
    }
  }
  globalThis.WebSocket = TestWebSocket as unknown as typeof WebSocket
  try {
    await run({sockets, mode: (value) => mode = value})
  } finally {
    for (const socket of sockets) {
      socket.close()
    }
    await new Promise((resolve) => setTimeout(resolve, 0))
    globalThis.WebSocket = NativeWebSocket
    document.destroy()
  }
}

const connection = {
  url: "ws://framework.test/app/ws",
  token: btoa(JSON.stringify({session_id: "framework-session", session_expiry: 4_000_000_000})),
}

async function validate_controller(): Promise<void> {
  await with_transport(async ({sockets, mode}) => {
    const controller = new SessionMountController()
    const target = document.createElement("div")
    document.body.append(target)
    const detach = controller.attach("first", target)
    const observed: {session: ClientSession | null, failed_document: Document | null} = {session: null, failed_document: null}
    const mounted = await new Promise<BokehMount>((resolve, reject) => {
      controller.update({connection}, {onSession: (session) => observed.session = session, onMounted: resolve, onError: reject})
    })
    assert(observed.session != null && mounted.document == observed.session.document, "owned provider didn't expose its acquired session")
    const owned_document = mounted.document
    controller.update(null)
    await wait_until(() => mounted.disposed && sockets[0].closed, "null source didn't close the owning connection")
    assert(owned_document.is_destroyed, "owned provider disposal didn't destroy its decoded document")

    mode("pending")
    let stale = false
    controller.update({connection}, {onSession: () => stale = true, onMounted: () => stale = true})
    await wait_until(() => sockets.length == 2, "pending acquisition didn't start")
    controller.update(null)
    await wait_until(() => sockets[1].closed, "cancelled acquisition retained its socket")
    assert(!stale, "cancelled acquisition published a stale session or mount")

    mode("failed")
    let failure: unknown = null
    controller.update({connection}, {onError: (error) => failure = error})
    await wait_until(() => failure != null, "failed acquisition wasn't reported")
    assert(sockets[2].closed && controller.mounted == null, "failed acquisition retained its connection or mount")

    mode("ready")
    detach()
    controller.attach("first", document.createElement("div"))
    failure = null
    controller.update({connection}, {
      onSession: (session) => observed.failed_document = session.document,
      onError: (error) => failure = error,
    })
    await wait_until(() => failure != null, "failed owned target attachment wasn't reported")
    assert(observed.failed_document != null && observed.failed_document.is_destroyed && sockets[3].closed,
      "failed owned target attachment retained its document or connection")
    controller.dispose()
    target.remove()
  })
}

async function validate_interrupted_root(): Promise<void> {
  await with_transport(async () => {
    const owner = connect_session(connection)
    const session = await owner.ready
    const controller = new SessionMountController()
    const first_target = document.createElement("div")
    const late_target = document.createElement("div")
    document.body.append(first_target, late_target)
    controller.attach("first", first_target)
    let failure: unknown = null
    const mounted = await new Promise<BokehMount>((resolve, reject) => {
      controller.update({session}, {onMounted: resolve, onError: (error) => { failure = error; reject(error) }})
    })
    const first = session.document.get_model_by_name("first")!
    const sibling_view = mounted.view(first.id)
    try {
      for (const interruption of ["root", "slot"]) {
        let started = false
        let removed = false
        let resume!: () => void
        const gate = new Promise<void>((resolve) => resume = resolve)
        const late = Plotting.figure({name: "late", width: 180, height: 120, tools: [], toolbar_location: null})
        const DefaultView = late.default_view
        assert(DefaultView != null, "plot doesn't define its view")
        class DelayedView extends DefaultView {
          override async lazy_initialize(): Promise<void> {
            await super.lazy_initialize()
            started = true
            await gate
          }
          override remove(): void {
            super.remove()
            removed = true
          }
        }
        Object.defineProperty(late, "default_view", {value: DelayedView})
        const detach = controller.attach("late", late_target)
        session.document.add_root(late)
        try {
          await wait_until(() => started, "delayed session root didn't start rendering")
          if (interruption == "root") {
            session.document.remove_root(late)
          } else {
            detach()
          }
          resume()
          await wait_until(() => removed, `${interruption} invalidation didn't remove its pending view`)
          assert(failure == null && controller.mounted == mounted && mounted.view(first.id) == sibling_view,
            `${interruption} invalidation failed or recreated its sibling mount`)
          assert(late_target.childElementCount == 0 && index.get(late) == null,
            `${interruption} invalidation published a stale root view`)
        } finally {
          resume()
          detach()
          session.document.remove_root(late)
        }
      }
    } finally {
      controller.dispose()
      owner.dispose()
      session.document.destroy()
      first_target.remove()
      late_target.remove()
    }
  })
}

async function validate_reentrant_source_update(): Promise<void> {
  await with_transport(async ({sockets}) => {
    const owners = [connect_session(connection), connect_session(connection), connect_session(connection)]
    const [first, superseded, latest] = await Promise.all(owners.map((owner) => owner.ready))
    const controller = new SessionMountController()
    const target = document.createElement("div")
    document.body.append(target)
    controller.attach("first", target)
    const callbacks: string[] = []
    let failure: unknown = null
    let final_mount: BokehMount | null = null
    const disposed_first: {mount: BokehMount | null} = {mount: null}
    try {
      const first_mount = await new Promise<BokehMount>((resolve, reject) => {
        controller.update({session: first}, {
          onMounted: resolve,
          onError: reject,
          onDisposed: (mounted) => {
            callbacks.push("first disposed")
            disposed_first.mount = mounted
            controller.update({session: latest}, {
              onSession: () => callbacks.push("latest session"),
              onMounted: (mounted) => { callbacks.push("latest mounted"); final_mount = mounted },
              onError: (error) => failure = error,
            })
          },
        })
      })
      controller.update({session: superseded}, {
        onSession: () => callbacks.push("superseded session"),
        onMounted: () => callbacks.push("superseded mounted"),
        onDisposed: () => callbacks.push("superseded disposed"),
        onError: (error) => failure = error,
      })
      await wait_until(() => final_mount != null || failure != null, "reentrant source replacement didn't finish")
      assert(failure == null && controller.session == latest && controller.mounted == final_mount,
        "an older source update replaced the reentrant latest request")
      assert(disposed_first.mount == first_mount, "source replacement attributed disposal to the wrong mount")
      assert(callbacks.join(",") == "first disposed,latest session,latest mounted",
        `source replacement delivered callbacks for the wrong request: ${callbacks}`)
      assert([first, superseded, latest].every((session) => !session.document.is_destroyed) && sockets.every((socket) => !socket.closed),
        "reentrant source replacement destroyed or closed a borrowed session")
    } finally {
      controller.dispose()
      for (const owner of owners) {
        owner.dispose()
      }
      for (const session of [first, superseded, latest]) {
        session.document.destroy()
      }
      target.remove()
    }
  })
}

export async function run_session_test(render: SessionRender): Promise<void> {
  await validate_controller()
  await validate_interrupted_root()
  await validate_reentrant_source_update()
  await with_transport(async ({sockets}) => {
    const owner = connect_session(connection)
    const session = await owner.ready
    const first = session.document.get_model_by_name("first")!
    const second = session.document.get_model_by_name("second")!
    assert(first instanceof Model, "session's first root isn't a named model")
    const published: {session: ClientSession | null} = {session: null}
    let failure: unknown = null
    let ready!: (mounted: BokehMount) => void
    let reject!: (error: unknown) => void
    const mounting = new Promise<BokehMount>((resolve, fail) => { ready = resolve; reject = fail })
    const rendered = render({
      source: {session},
      onSession: (value) => published.session = value,
      onMounted: ready,
      onError: (error) => { failure = error; reject(error) },
    })
    try {
      const mounted = await mounting
      assert(failure == null && published.session == session, "adapter didn't expose its borrowed session")
      await wait_until(() => mounted.views.length == 2, "session adapter didn't attach independently named roots")
      const second_target = rendered.target("second")!
      const second_dom = second_target.firstElementChild
      const second_view = mounted.view(second.id)
      assert(second_dom != null && second_view != null, "session adapter didn't render the second root")
      assert(rendered.target("first") != second_target, "session roots shared one target")
      assert(rendered.target("late")?.childElementCount == 0, "an absent named root rendered content")

      const late = Plotting.figure({name: "late", width: 180, height: 120, tools: [], toolbar_location: null})
      session.document.add_root(late)
      await wait_until(() => mounted.view(late.id) != null, "session adapter ignored a newly added named root")
      session.document.remove_root(late)
      await wait_until(() => mounted.view(late.id) == null && rendered.target("late")?.childElementCount == 0,
        "session adapter retained a removed root")
      assert(mounted.view(second.id) == second_view && second_target.firstElementChild == second_dom,
        "dynamic root events recreated a sibling view")

      session.document.remove_root(first)
      session.document.add_root(first)
      await wait_until(() => mounted.view(first.id) != null && (rendered.target("first")?.childElementCount ?? 0) > 0,
        "removing and readding the same root in one turn left its registered slot empty")
      assert(mounted.view(second.id) == second_view && second_target.firstElementChild == second_dom,
        "same-turn root replacement disturbed its sibling view")

      await rendered.showFirst(false)
      await wait_until(() => mounted.view(first.id) == null, "framework slot removal didn't detach its root")
      assert(mounted.view(second.id) == second_view, "framework slot removal recreated its sibling")
      await rendered.showFirst(true)
      await wait_until(() => mounted.view(first.id) != null, "framework slot reattachment failed")
      assert(mounted.view(second.id) == second_view, "framework slot reattachment recreated its sibling")

      await rendered.unmount()
      await mounted.when_disposed
      assert(!session.document.is_destroyed && !owner.disposed && !sockets[0].closed,
        "borrowed provider teardown closed the session or destroyed its document")
      assert(index.get(first) == null && index.get(second) == null, "borrowed provider teardown retained root views")
      first.name = "still-live"
      await session.force_roundtrip()
      assert(failure == null, `session adapter reported an error: ${failure}`)
    } finally {
      await rendered.unmount()
      owner.dispose()
      session.document.destroy()
    }
  })
}
