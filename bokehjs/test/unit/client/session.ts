import {expect} from "#framework/assertions"

import {ClientSession} from "@bokehjs/client/session"
import type {ClientConnection} from "@bokehjs/client/connection"
import {Document} from "@bokehjs/document"
import type {Patch} from "@bokehjs/document"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import type {CallbackPolicy} from "@bokehjs/model"
import {Message} from "@bokehjs/protocol/message"
import {delay} from "@bokehjs/core/util/defer"

class FakeConnection {
  readonly id = "test"
  readonly messages: Message<Patch>[] = []
  closed = false

  send(message: Message<Patch>): void {
    this.messages.push(message)
  }

  close(): void {
    this.closed = true
  }
}

function new_value(message: Message<Patch>): unknown {
  const [event] = message.content.events
  if (event.kind != "ModelChanged") {
    throw new Error(`expected a ModelChanged event, got ${event.kind}`)
  }
  return event.new
}

function callback_policy(message: Message<Patch>): CallbackPolicy | undefined {
  const [event] = message.content.events
  if (event.kind != "ModelChanged") {
    throw new Error(`expected a ModelChanged event, got ${event.kind}`)
  }
  return event.callback_policy
}

function changed_attr(message: Message<Patch>): string {
  const [event] = message.content.events
  if (event.kind != "ModelChanged") {
    throw new Error(`expected a ModelChanged event, got ${event.kind}`)
  }
  return event.attr
}

function server_patch(model: Range1d, attr: string, value: unknown): Message<Patch> {
  return Message.create("PATCH-DOC", {
    events: [{kind: "ModelChanged", model: model.ref(), attr, new: value}],
  })
}

function session_for(model: Range1d): {session: ClientSession, connection: FakeConnection} {
  const document = new Document({roots: [model]})
  const connection = new FakeConnection()
  const session = new ClientSession(connection as unknown as ClientConnection, document)
  return {session, connection}
}

describe("ClientSession property synchronization policies", () => {
  it("should preserve immediate synchronization by default", () => {
    const model = Range1d.create({start: 0, end: 10})
    const {session, connection} = session_for(model)

    model.start = 1
    model.start = 2

    expect(connection.messages.length).to.be.equal(2)
    expect(new_value(connection.messages[0])).to.be.equal(1)
    expect(new_value(connection.messages[1])).to.be.equal(2)
    session.close()
  })

  it("should throttle with leading and trailing updates", async () => {
    const _subscribed_changes = new Map([["start", [["throttle", 40] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.start = 1
    model.start = 2
    model.start = 3

    expect(connection.messages.length).to.be.equal(1)
    expect(new_value(connection.messages[0])).to.be.equal(1)

    await delay(70)

    expect(connection.messages.length).to.be.equal(2)
    expect(new_value(connection.messages[1])).to.be.equal(3)
    expect(callback_policy(connection.messages[1])).to.be.equal(["throttle", 40])
    session.close()
  })

  it("should debounce until changes settle", async () => {
    const _subscribed_changes = new Map([["start", [["debounce", 40] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)
    const local_values: number[] = []
    model.properties.start.change.connect(() => local_values.push(model.start))

    model.start = 1
    await delay(15)
    model.start = 2

    expect(connection.messages.length).to.be.equal(0)
    expect(local_values).to.be.equal([1, 2])

    await delay(70)

    expect(connection.messages.length).to.be.equal(1)
    expect(new_value(connection.messages[0])).to.be.equal(2)
    session.close()
  })

  it("should synchronize committed updates immediately outside an interaction", () => {
    const _subscribed_changes = new Map([["start", [["committed", null] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.start = 1

    expect(connection.messages.length).to.be.equal(1)
    expect(new_value(connection.messages[0])).to.be.equal(1)
    session.close()
  })

  it("should hold committed updates during an interaction", async () => {
    const _subscribed_changes = new Map([["start", [["committed", null] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.document!.begin_sync_deferral(model, "start")
    model.start = 1
    await delay(70)
    model.start = 2

    expect(connection.messages.length).to.be.equal(0)

    model.document!.request_sync_flush(model, "start")

    expect(connection.messages.length).to.be.equal(1)
    expect(new_value(connection.messages[0])).to.be.equal(2)
    session.close()
  })

  it("should deliver immediate and committed streams for the same property", () => {
    const _subscribed_changes = new Map([
      ["start", [
        ["immediate", null] as CallbackPolicy,
        ["committed", null] as CallbackPolicy,
      ]],
    ])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.document!.begin_sync_deferral(model, "start")
    model.start = 1
    model.start = 2

    expect(connection.messages.length).to.be.equal(2)
    expect(connection.messages.map(new_value)).to.be.equal([1, 2])
    expect(connection.messages.map(callback_policy)).to.be.equal([
      ["immediate", null], ["immediate", null],
    ])

    model.document!.request_sync_flush(model, "start")

    expect(connection.messages.length).to.be.equal(3)
    expect(new_value(connection.messages[2])).to.be.equal(2)
    expect(callback_policy(connection.messages[2])).to.be.equal(["committed", null])
    session.close()
  })

  it("should flush the latest pending value on request", () => {
    const _subscribed_changes = new Map([["start", [["debounce", 1000] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.start = 1
    model.start = 2
    model.document!.request_sync_flush(model, "start")

    expect(connection.messages.length).to.be.equal(1)
    expect(new_value(connection.messages[0])).to.be.equal(2)
    session.close()
  })

  it("should flush only the requested policy", async () => {
    const _subscribed_changes = new Map([
      ["start", [
        ["debounce", 40] as CallbackPolicy,
        ["committed", null] as CallbackPolicy,
      ]],
    ])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.document!.begin_sync_deferral(model, "start")
    model.start = 1
    model.document!.request_sync_flush(model, "start", "committed")

    expect(connection.messages.length).to.be.equal(1)
    expect(callback_policy(connection.messages[0])).to.be.equal(["committed", null])

    await delay(70)
    expect(connection.messages.length).to.be.equal(2)
    expect(callback_policy(connection.messages[1])).to.be.equal(["debounce", 40])
    session.close()
  })

  it("should flush a pending final value before closing", () => {
    const _subscribed_changes = new Map([["start", [["debounce", 1000] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.start = 1
    session.close()

    expect(connection.messages.length).to.be.equal(1)
    expect(new_value(connection.messages[0])).to.be.equal(1)
    expect(connection.closed).to.be.true
  })

  it("should flush a pending value when its policy is removed", () => {
    const _subscribed_changes = new Map([["start", [["throttle", 40] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.start = 1
    model.start = 2
    expect(connection.messages.length).to.be.equal(1)

    session.handle(server_patch(model, "_subscribed_changes", {type: "map"}))

    expect(connection.messages.length).to.be.equal(2)
    expect(new_value(connection.messages[0])).to.be.equal(1)
    expect(new_value(connection.messages[1])).to.be.equal(2)
    session.close()
    expect(connection.messages.length).to.be.equal(2)
  })

  it("should flush a pending value when its policy changes", () => {
    const _subscribed_changes = new Map([["start", [["throttle", 1000] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.start = 1
    model.start = 2
    expect(connection.messages.length).to.be.equal(1)

    const debounce = {type: "map", entries: [["start", [["debounce", 1000]]]]}
    session.handle(server_patch(model, "_subscribed_changes", debounce))

    expect(connection.messages.length).to.be.equal(2)
    expect(new_value(connection.messages[0])).to.be.equal(1)
    expect(new_value(connection.messages[1])).to.be.equal(2)
    session.close()
  })

  it("should flush only the removed interval of the same policy kind", () => {
    const _subscribed_changes = new Map([[
      "start",
      [
        ["throttle", 1000] as CallbackPolicy,
        ["throttle", 10000] as CallbackPolicy,
      ],
    ]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.start = 1
    model.start = 2
    expect(connection.messages.length).to.be.equal(1)

    const retained = {type: "map", entries: [["start", [["throttle", 10000]]]]}
    session.handle(server_patch(model, "_subscribed_changes", retained))

    expect(connection.messages.length).to.be.equal(2)
    expect(new_value(connection.messages[1])).to.be.equal(2)
    session.close()
  })

  it("should preserve pending values for properties whose policies don't change", () => {
    const _subscribed_changes = new Map([
      ["start", [["committed", null] as CallbackPolicy]],
      ["end", [["debounce", 1000] as CallbackPolicy]],
    ])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.document!.begin_sync_deferral(model, "start")
    model.start = 1
    model.end = 9
    expect(connection.messages.length).to.be.equal(0)

    const changed = {type: "map", entries: [
      ["start", [["committed", null]]],
      ["end", [["throttle", 1000]]],
    ]}
    session.handle(server_patch(model, "_subscribed_changes", changed))

    expect(connection.messages.length).to.be.equal(1)
    expect(changed_attr(connection.messages[0])).to.be.equal("end")
    expect(new_value(connection.messages[0])).to.be.equal(9)

    model.document!.request_sync_flush(model, "start")
    expect(connection.messages.length).to.be.equal(2)
    expect(changed_attr(connection.messages[1])).to.be.equal("start")
    expect(new_value(connection.messages[1])).to.be.equal(1)
    session.close()
  })

  it("should apply policies independently within a property batch", async () => {
    const _subscribed_changes = new Map([["end", [["debounce", 40] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.setv({start: 1, end: 9})

    expect(connection.messages.length).to.be.equal(1)
    expect(new_value(connection.messages[0])).to.be.equal(1)

    await delay(70)

    expect(connection.messages.length).to.be.equal(2)
    expect(new_value(connection.messages[1])).to.be.equal(9)
    session.close()
  })

  it("should discard a pending value superseded by a server patch", async () => {
    const _subscribed_changes = new Map([["start", [["throttle", 40] as CallbackPolicy]]])
    const model = Range1d.create({start: 0, end: 10, _subscribed_changes})
    const {session, connection} = session_for(model)

    model.start = 1
    model.start = 2
    expect(connection.messages.length).to.be.equal(1)

    session.handle(server_patch(model, "start", 8))
    await delay(70)

    expect(model.start).to.be.equal(8)
    expect(connection.messages.length).to.be.equal(1)
    expect(new_value(connection.messages[0])).to.be.equal(1)
    session.close()
    expect(connection.messages.length).to.be.equal(1)
  })
})
