import {expect} from "#framework/assertions"

import {CommConnection, pull_comm_session} from "@bokehjs/client/comm"
import type {SessionChannel, SessionError} from "@bokehjs/client/comm"
import {Document} from "@bokehjs/document"
import type {Patch} from "@bokehjs/document"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {DocumentEvent} from "@bokehjs/document"
import {Serializer} from "@bokehjs/core/serialization"
import {MessageSentEvent} from "@bokehjs/document/events"
import {FileInput} from "@bokehjs/models/widgets/file_input"
import {ClearInput} from "@bokehjs/models/widgets/input_widget"
import type {CallbackPolicy} from "@bokehjs/model"
import {delay} from "@bokehjs/core/util/defer"
import {Message} from "@bokehjs/protocol/message"
import type {MessageType} from "@bokehjs/protocol/message"
import {Receiver} from "@bokehjs/protocol/receiver"
import {unique_id} from "@bokehjs/core/util/string"

/** The kernel side of a session channel, answering like a CommSessionEndpoint. */
class FakeKernel implements SessionChannel {
  on_message: SessionChannel["on_message"] = null
  on_close: SessionChannel["on_close"] = null

  readonly received: Message<unknown>[] = []
  opened = false
  closed = false
  patch_error: {text: string, traceback: string | null} | null = null
  binary_pull: boolean = false

  protected readonly _receiver = new Receiver()

  constructor(readonly document: Document) {}

  open(): void {
    this.opened = true
    this.reply("ACK", {})
  }

  send(envelope_json: string, buffers: ArrayBuffer[]): void {
    this._receiver.consume(envelope_json)
    for (const buffer of buffers) {
      this._receiver.consume(buffer)
    }
    const message = this._receiver.message!
    this.received.push(message)
    const msgtype = message.msgtype()
    if (msgtype == "PULL-DOC-REQ") {
      this.reply("PULL-DOC-REPLY", {doc: this.document.to_json()}, message.msgid())
    } else if (msgtype == "PATCH-DOC") {
      if (this.patch_error != null) {
        this.reply("ERROR", this.patch_error, message.msgid())
      } else {
        this.reply("OK", {}, message.msgid())
      }
    }
  }

  close(): void {
    this.closed = true
  }

  /** Like Python, encode arrays as binary buffers when requested. */
  doc_json(): unknown {
    const doc = this.document.to_json()
    if (!this.binary_pull) {
      return doc
    }
    const serializer = new Serializer({binary: true, include_defaults: true})
    return {...doc, roots: serializer.encode(this.document.roots())}
  }

  /** The PATCH-DOC message the kernel sends for changes to its document. */
  patch_for(change: () => void): Patch {
    const events: DocumentEvent[] = []
    const listener = (event: DocumentEvent) => events.push(event)
    this.document.on_change(listener)
    change()
    this.document.remove_on_change(listener)
    return this.document.create_json_patch(events as any)
  }

  reply(msgtype: MessageType, content: unknown, reqid?: string): void {
    const header = reqid == null ? {msgid: unique_id(), msgtype} : {msgid: unique_id(), msgtype, reqid}
    const [envelope_json, buffers] = new Message(header, content).encode()
    // Jupyter delivers comm buffers as DataViews, possibly into a larger buffer.
    this.on_message?.(envelope_json, buffers.map((buffer) => {
      const padded = new Uint8Array(buffer.byteLength + 16)
      padded.set(new Uint8Array(buffer), 8)
      return new DataView(padded.buffer, 8, buffer.byteLength)
    }))
  }

  close_from_kernel(): void {
    this.closed = true
    this.on_close?.()
  }

  patches(): Message<Patch>[] {
    return this.received.filter((message) => message.msgtype() == "PATCH-DOC") as Message<Patch>[]
  }
}

function kernel_with_range(): {kernel: FakeKernel, range: Range1d} {
  const range = Range1d.create({start: 0, end: 10})
  return {kernel: new FakeKernel(new Document({roots: [range]})), range}
}

describe("client/comm module", () => {
  describe("pull_comm_session()", () => {
    it("should pull the session document over the channel", async () => {
      const {kernel, range} = kernel_with_range()
      const session = await pull_comm_session(kernel, {session_id: "session"})

      expect(kernel.opened).to.be.true
      expect(session.id).to.be.equal("session")
      const [root] = session.document.roots()
      expect(root.id).to.be.equal(range.id)
      expect((root as Range1d).end).to.be.equal(10)
      expect(session.document).to.not.be.equal(kernel.document)
      session.close()
      expect(kernel.closed).to.be.true
    })

    it("should send local changes to the kernel as patches", async () => {
      const {kernel} = kernel_with_range()
      const session = await pull_comm_session(kernel, {session_id: "session"})
      const [root] = session.document.roots() as Range1d[]

      root.start = 5

      const [patch] = kernel.patches()
      const [event] = patch.content.events
      expect(event).to.be.equal({kind: "ModelChanged", model: root.ref(), attr: "start", new: 5})
      session.close()
    })

    it("should apply kernel patches without echoing them", async () => {
      const {kernel, range} = kernel_with_range()
      const session = await pull_comm_session(kernel, {session_id: "session"})
      const [root] = session.document.roots() as Range1d[]

      kernel.reply("PATCH-DOC", {events: [{kind: "ModelChanged", model: range.ref(), attr: "end", new: 20}]})

      expect(root.end).to.be.equal(20)
      expect(kernel.patches()).to.be.empty
      session.close()
    })

    it("should keep two sessions of one application independent", async () => {
      const first = kernel_with_range()
      const second = kernel_with_range().kernel
      const first_session = await pull_comm_session(first.kernel, {session_id: "first"})
      const second_session = await pull_comm_session(second, {session_id: "second"})
      const [first_root] = first_session.document.roots() as Range1d[]
      const [second_root] = second_session.document.roots() as Range1d[]

      first_root.start = 3

      expect(first.kernel.patches().length).to.be.equal(1)
      expect(second.patches()).to.be.empty
      expect(second_root.start).to.be.equal(0)
      first_session.close()
      second_session.close()
    })

    it("should report kernel errors for patches", async () => {
      const {kernel} = kernel_with_range()
      const errors: SessionError[] = []
      const session = await pull_comm_session(kernel, {session_id: "session", on_error: (error) => errors.push(error)})
      const [root] = session.document.roots() as Range1d[]
      kernel.patch_error = {text: "ZeroDivisionError: bad value", traceback: "Traceback ..."}

      root.start = 1

      expect(errors).to.be.equal([{text: "ZeroDivisionError: bad value", traceback: "Traceback ..."}])
      session.close()
    })

    it("should stop sending changes after the kernel closes the channel", async () => {
      const {kernel} = kernel_with_range()
      const session = await pull_comm_session(kernel, {session_id: "session"})
      const [root] = session.document.roots() as Range1d[]

      kernel.close_from_kernel()
      root.start = 2

      expect(kernel.patches()).to.be.empty
      await expect(async () => session.force_roundtrip()).to.throw(Error, "the connection is not open")
    })

    it("should reject when the kernel closes the channel before the document arrives", async () => {
      const kernel = new FakeKernel(new Document())
      kernel.open = () => kernel.close_from_kernel()

      await expect(async () => pull_comm_session(kernel, {session_id: "session"})).to.throw(Error, "The kernel closed the notebook session connection")
    })

    it("should close the channel when a message lacks its buffers", async () => {
      const kernel = new FakeKernel(new Document())
      const connection = new CommConnection(kernel, "session")
      kernel.open = () => kernel.on_message?.(JSON.stringify({
        header: {msgid: "1", msgtype: "ACK"}, content: {}, buffers: ["0"],
      }), [])

      await expect(async () => connection.connect()).to.throw(Error, /without all of its buffers/)
      expect(kernel.closed).to.be.true
      expect(connection.closed_permanently).to.be.true
    })

    it("should not open a channel for an aborted signal", async () => {
      const {kernel} = kernel_with_range()
      const controller = new AbortController()
      controller.abort()

      await expect(async () => pull_comm_session(kernel, {session_id: "session", signal: controller.signal})).to.throw()
      expect(kernel.opened).to.be.false
    })
  })

  describe("binary buffers", () => {
    function kernel_with_source(): {kernel: FakeKernel, source: ColumnDataSource} {
      const source = ColumnDataSource.create({data: {x: new Float64Array([1, 2, 3])}})
      const kernel = new FakeKernel(new Document({roots: [source]}))
      kernel.binary_pull = true
      return {kernel, source}
    }

    function column(session: {document: Document}): unknown {
      const [root] = session.document.roots() as ColumnDataSource[]
      return root.get_column("x")
    }

    it("should decode a pulled document whose arrays arrive as comm buffers", async () => {
      const {kernel} = kernel_with_source()
      const session = await pull_comm_session(kernel, {session_id: "session"})

      expect(column(session)).to.be.equal(new Float64Array([1, 2, 3]))
      session.close()
    })

    it("should send browser arrays to the kernel as binary buffers", async () => {
      const {kernel} = kernel_with_source()
      const session = await pull_comm_session(kernel, {session_id: "session"})
      const [root] = session.document.roots() as ColumnDataSource[]

      root.data = {x: new Float64Array([4, 5])}
      root.stream({x: new Float64Array([6])})

      const patches = kernel.patches()
      expect(patches.length).to.be.equal(2)
      for (const patch of patches) {
        expect(patch.buffers.size).to.be.equal(1)
        kernel.document.apply_json_patch(patch.content, patch.buffers)
      }
      expect((kernel.document.roots()[0] as ColumnDataSource).get_column("x")).to.be.equal(new Float64Array([4, 5, 6]))
      session.close()
    })

    it("should apply kernel patches whose arrays arrive as comm buffers", async () => {
      const {kernel, source} = kernel_with_source()
      const session = await pull_comm_session(kernel, {session_id: "session"})

      kernel.reply("PATCH-DOC", kernel.patch_for(() => source.data = {x: new Float64Array([7, 8])}))
      kernel.reply("PATCH-DOC", kernel.patch_for(() => source.stream({x: new Float64Array([9])})))

      expect(column(session)).to.be.equal(new Float64Array([7, 8, 9]))
      expect(kernel.patches()).to.be.empty
      session.close()
    })
  })

  describe("callback policies and custom events", () => {
    it("should throttle synchronized changes as a server session does", async () => {
      const _subscribed_changes = new Map([["start", [["throttle", 40] as CallbackPolicy]]])
      const range = Range1d.create({start: 0, end: 10, _subscribed_changes})
      const kernel = new FakeKernel(new Document({roots: [range]}))
      const session = await pull_comm_session(kernel, {session_id: "session"})
      const [root] = session.document.roots() as Range1d[]

      root.start = 1
      root.start = 2
      root.start = 3

      const values = () => kernel.patches().map((patch) => {
        const [event] = patch.content.events
        return event.kind == "ModelChanged" ? event.new : null
      })
      expect(values()).to.be.equal([1])
      await delay(70)
      expect(values()).to.be.equal([1, 3])
      const [, last] = kernel.patches()
      const [event] = last.content.events
      expect(event.kind == "ModelChanged" ? event.callback_policy : null).to.be.equal(["throttle", 40])
      session.close()
    })

    it("should deliver custom events sent by the kernel to their model", async () => {
      const upload = FileInput.create()
      const kernel = new FakeKernel(new Document({roots: [upload]}))
      const session = await pull_comm_session(kernel, {session_id: "session"})
      const [root] = session.document.roots() as FileInput[]
      const received: unknown[] = []
      root.on_event(ClearInput, (event) => received.push(event))

      const event = new MessageSentEvent(kernel.document, "bokeh_event", new ClearInput(upload))
      kernel.reply("PATCH-DOC", kernel.document.create_json_patch([event]))

      expect(received.length).to.be.equal(1)
      expect((received[0] as ClearInput).origin).to.be.equal(root)
      expect(kernel.patches()).to.be.empty
      session.close()
    })
  })
})
