import {expect} from "#framework/assertions"

import {CommConnection, pull_comm_session} from "@bokehjs/client/comm"
import type {SessionChannel, SessionError} from "@bokehjs/client/comm"
import {Document} from "@bokehjs/document"
import type {Patch} from "@bokehjs/document"
import {Range1d} from "@bokehjs/models/ranges/range1d"
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

  reply(msgtype: MessageType, content: unknown, reqid?: string): void {
    const header = reqid == null ? {msgid: unique_id(), msgtype} : {msgid: unique_id(), msgtype, reqid}
    const [envelope_json, buffers] = new Message(header, content).encode()
    // Jupyter delivers comm buffers as DataViews.
    this.on_message?.(envelope_json, buffers.map((buffer) => new DataView(buffer)))
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
})
