import {expect, expect_instanceof} from "#framework/assertions"

import {ClientSession} from "@bokehjs/client/session"
import {default_resolver} from "@bokehjs/base"
import {ModelResolver} from "@bokehjs/core/resolvers"
import type {ClientConnection} from "@bokehjs/client/connection"
import {Document} from "@bokehjs/document"
import {ColumnDataChangedEvent, ColumnsPatchedEvent, ColumnsStreamedEvent} from "@bokehjs/document/events"
import type {Decoded, DocumentChangedEvent} from "@bokehjs/document/events"
import type {Patch} from "@bokehjs/document"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Selection} from "@bokehjs/models/selections/selection"
import {GeometryDataSource} from "@bokehjs/models/sources/geometry_data_source"
import {line_string} from "@bokehjs/geometry"
import {RecordDataSource} from "@bokehjs/models/sources/record_data_source"
import {Slice} from "@bokehjs/core/util/slice"
import type {Model, CallbackPolicy} from "@bokehjs/model"
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

// Protocol-only receiver for testing future row updates without adding public APIs.
class TestRecordSource extends RecordDataSource {
  private _publish(records: RecordDataSource["records"], event: DocumentChangedEvent): void {
    this._clear_watchers()
    this._with_selection_sync(false, () => {
      this.properties.records.set_value(records)
      this.properties.records.change.emit()
    })
    event.sync = false
    this.document!._trigger_on_change(event)
  }

  override _apply_column_data_changed({attr, data}: Decoded.ColumnDataChanged): void {
    this._publish(data as RecordDataSource["records"], new ColumnDataChangedEvent(this.document!, this, attr, data))
  }

  override _apply_columns_streamed({attr, data, rollover}: Decoded.ColumnsStreamed): void {
    const records = [...this.records, ...data as RecordDataSource["records"]]
    const start = Math.max(0, records.length - (rollover ?? records.length))
    const retained = records.slice(start)
    this._publish(retained, new ColumnsStreamedEvent(this.document!, this, attr, data, rollover))
  }

  override _apply_columns_patched({attr, patches}: Decoded.ColumnsPatched): void {
    const records = [...this.records]
    for (const [index, row] of patches as [number, RecordDataSource["records"][number]][]) {
      records[index] = row
    }
    this._publish(records, new ColumnsPatchedEvent(this.document!, this, attr, patches))
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

function session_for(model: Model): {session: ClientSession, connection: FakeConnection} {
  const document = new Document({roots: [model]})
  const connection = new FakeConnection()
  const session = new ClientSession(connection as unknown as ClientConnection, document)
  return {session, connection}
}

function replay_messages(connection: FakeConnection, receiver: Document): void {
  for (const message of connection.messages) {
    receiver.apply_json_patch(message.content, message.buffers)
  }
}

function receive_update(session: ClientSession, receiver: Document, event: DocumentChangedEvent): void {
  const incoming = event.document.create_json_patch([event])
  receiver.apply_json_patch(incoming)
  session.handle(Message.create("PATCH-DOC", incoming))
}

function arrange_row_assignments(policy: CallbackPolicy) {
  const model = TestRecordSource.create({records: [{v: 0}], _subscribed_changes: new Map([["records", [policy]]])})
  const {session, connection} = session_for(model)
  const resolver = new ModelResolver(default_resolver, [TestRecordSource])
  const receiver = Document.from_json(session.document.to_json(), {resolver})
  const copy = receiver.get_model_by_id(model.id)!
  expect_instanceof(copy, TestRecordSource)
  model.document!.begin_sync_deferral(model, "records")
  model.records = [{v: 1}, {v: 2}]
  model.records = [{v: 3}, {v: 4}]
  replay_messages(connection, receiver)
  connection.messages.length = 0
  return {model, session, connection, receiver, copy}
}

function expect_row_records(context: ReturnType<typeof arrange_row_assignments>, policy: CallbackPolicy, expected: number[]): void {
  const {model, connection, copy} = context
  for (const message of connection.messages) {
    expect(changed_attr(message)).to.be.equal("records")
    expect(callback_policy(message)).to.be.equal(policy)
  }
  expect(copy.records).to.be.equal(model.records)
  expect(copy.get_field("v")).to.be.equal(expected)
}

function arrange_geometry_assignments(policy: CallbackPolicy) {
  const model = GeometryDataSource.create({geometries: [null], data: {v: [0], b: [0]}, _subscribed_changes: new Map([["geometries", [policy]], ["data", [policy]]])})
  const {session, connection} = session_for(model)
  const receiver = Document.from_json(session.document.to_json())
  model.document!.begin_sync_deferral(model, "geometries")
  model.document!.begin_sync_deferral(model, "data")
  model.data = {v: [1], c: [1]}
  model.data = {v: [2], c: [2]}
  model.geometries = [line_string([[1, 1], [2, 2]])]
  model.geometries = [line_string([[3, 3], [4, 4]])]
  return {model, session, connection, receiver}
}

function expect_geometry_records(model: GeometryDataSource, receiver: Document): void {
  const copy = receiver.get_model_by_id(model.id)!
  expect_instanceof(copy, GeometryDataSource)
  expect(copy.geometries).to.be.equal(model.geometries)
  expect(copy.data).to.be.equal(model.data)
}

function expect_flushed_assignments(connection: FakeConnection, policy: CallbackPolicy): void {
  const assignments = connection.messages.slice(-3, -1)
  expect(assignments.map(changed_attr)).to.be.equal(["geometries", "data"])
  expect(assignments.map(callback_policy)).to.be.equal([policy, policy])
}

function arrange_pending_geometry_assignment(attr: "geometries" | "data", value: unknown) {
  const policy: CallbackPolicy = ["debounce", 1000]
  const model = GeometryDataSource.create({geometries: [line_string([[0, 0], [1, 1]])], data: {v: [0]}, _subscribed_changes: new Map([[attr, [policy]]])})
  const {session, connection} = session_for(model)
  const receiver = Document.from_json(session.document.to_json())
  model.setv({[attr]: value})
  return {model, session, connection, receiver}
}

describe("ClientSession property synchronization policies", () => {
  for (const policy of [["debounce", 1000], ["throttle", 1000], ["committed", null]] as CallbackPolicy[]) {
    it(`reconciles ${policy[0]} row assignments with incoming replace`, () => {
      const context = arrange_row_assignments(policy)
      const {session, connection, receiver, copy} = context
      const event = new ColumnDataChangedEvent(receiver, copy, "records", [{v: 5}])

      receive_update(session, receiver, event)
      const received = connection.messages.length
      session.close()
      replay_messages(connection, receiver)

      expect(received).to.be.equal(0)
      expect(connection.messages.length).to.be.equal(0)
      expect_row_records(context, policy, [5])
    })

    it(`reconciles ${policy[0]} row assignments with incoming stream`, () => {
      const context = arrange_row_assignments(policy)
      const {session, connection, receiver, copy} = context
      const event = new ColumnsStreamedEvent(receiver, copy, "records", [{v: 5}], 2)

      receive_update(session, receiver, event)
      const received = connection.messages.length
      session.close()
      replay_messages(connection, receiver)

      expect(received).to.be.equal(0)
      expect(connection.messages.length).to.be.equal(1)
      expect_row_records(context, policy, [4, 5])
    })

    it(`reconciles ${policy[0]} row assignments with incoming patch`, () => {
      const context = arrange_row_assignments(policy)
      const {session, connection, receiver, copy} = context
      const event = new ColumnsPatchedEvent(receiver, copy, "records", [[0, {v: 5}]])

      receive_update(session, receiver, event)
      const received = connection.messages.length
      session.close()
      replay_messages(connection, receiver)

      expect(received).to.be.equal(0)
      expect(connection.messages.length).to.be.equal(1)
      expect_row_records(context, policy, [5, 4])
    })

  }

  for (const [policy, expected_sent] of [
    [["debounce", 1000], 3], [["throttle", 1000], 5], [["committed", null], 3],
  ] as [CallbackPolicy, number][]) {
    it(`flushes ${policy[0]} geometry and attribute assignments before replace`, () => {
      const {model, session, connection, receiver} = arrange_geometry_assignments(policy)

      model.replace({geometries: [null], data: {v: [1], c: [1]}})
      const sent = connection.messages.length
      replay_messages(connection, receiver)
      session.close()

      expect(sent).to.be.equal(expected_sent)
      expect_flushed_assignments(connection, policy)
      expect_geometry_records(model, receiver)
      expect(connection.messages.length).to.be.equal(sent)
    })

    it(`flushes ${policy[0]} geometry and attribute assignments before stream`, () => {
      const {model, session, connection, receiver} = arrange_geometry_assignments(policy)

      model.stream({geometries: [null], data: {v: [1], c: [1]}})
      const sent = connection.messages.length
      replay_messages(connection, receiver)
      session.close()

      expect(sent).to.be.equal(expected_sent)
      expect_flushed_assignments(connection, policy)
      expect_geometry_records(model, receiver)
      expect(connection.messages.length).to.be.equal(sent)
    })

    it(`flushes ${policy[0]} geometry and attribute assignments before patch`, () => {
      const {model, session, connection, receiver} = arrange_geometry_assignments(policy)

      model.patch({geometry: [[[0, new Slice({start: 2, stop: 2})], [[5, 5]]]], c: [[0, 9]]})
      const sent = connection.messages.length
      replay_messages(connection, receiver)
      session.close()

      expect(sent).to.be.equal(expected_sent)
      expect_flushed_assignments(connection, policy)
      expect_geometry_records(model, receiver)
      expect(connection.messages.length).to.be.equal(sent)
    })

  }

  for (const [attr, value] of [
    ["geometries", [line_string([[3, 3], [4, 4]])]],
    ["data", {v: [3]}],
  ] as const) {
    it(`reconciles pending ${attr} assignments with incoming replace records`, () => {
      const {model, session, connection, receiver} = arrange_pending_geometry_assignment(attr, value)
      const event = new ColumnDataChangedEvent(session.document, model, "records", {geometries: [null], data: {v: [1]}})

      receive_update(session, receiver, event)
      const received = connection.messages.length
      session.close()
      replay_messages(connection, receiver)

      expect(received).to.be.equal(0)
      expect(connection.messages.length).to.be.equal(0)
      expect_geometry_records(model, receiver)
    })

    it(`reconciles pending ${attr} assignments with incoming stream records`, () => {
      const {model, session, connection, receiver} = arrange_pending_geometry_assignment(attr, value)
      const event = new ColumnsStreamedEvent(session.document, model, "records", {geometries: [null], data: {v: [1]}})

      receive_update(session, receiver, event)
      const received = connection.messages.length
      session.close()
      replay_messages(connection, receiver)

      expect(received).to.be.equal(0)
      expect(connection.messages.length).to.be.equal(1)
      expect_geometry_records(model, receiver)
    })

    it(`reconciles pending ${attr} assignments with incoming geometry records`, () => {
      const {model, session, connection, receiver} = arrange_pending_geometry_assignment(attr, value)
      const event = new ColumnsPatchedEvent(session.document, model, "records", {geometry: [[0, null]]})

      receive_update(session, receiver, event)
      const received = connection.messages.length
      session.close()
      replay_messages(connection, receiver)

      expect(received).to.be.equal(0)
      expect(connection.messages.length).to.be.equal(1)
      expect_geometry_records(model, receiver)
    })

    it(`reconciles pending ${attr} assignments with incoming vertices records`, () => {
      const {model, session, connection, receiver} = arrange_pending_geometry_assignment(attr, value)
      const event = new ColumnsPatchedEvent(session.document, model, "records", {geometry: [[[0, new Slice({start: 2, stop: 2})], [[5, 5]]]]})

      receive_update(session, receiver, event)
      const received = connection.messages.length
      session.close()
      replay_messages(connection, receiver)

      expect(received).to.be.equal(0)
      expect(connection.messages.length).to.be.equal(1)
      expect_geometry_records(model, receiver)
    })

    it(`reconciles pending ${attr} assignments with incoming attributes records`, () => {
      const {model, session, connection, receiver} = arrange_pending_geometry_assignment(attr, value)
      const event = new ColumnsPatchedEvent(session.document, model, "records", {v: [[0, 9]]})

      receive_update(session, receiver, event)
      const received = connection.messages.length
      session.close()
      replay_messages(connection, receiver)

      expect(received).to.be.equal(0)
      expect(connection.messages.length).to.be.equal(1)
      expect_geometry_records(model, receiver)
    })

  }

  for (const attr of ["indices", "line_indices", "multiline_indices"] as const) {
    for (const policy of [["immediate", null], ["debounce", 1000]] as CallbackPolicy[]) {
      const [kind] = policy
      it(`should preserve binary ${attr} transport with ${kind} delivery`, () => {
        const model = Selection.create({_subscribed_changes: new Map([[attr, [policy]]])})
        const {session, connection} = session_for(model)
        const indices = Array.from({length: 300}, (_, i) => i)
        model.document!.begin_sync_deferral(model, attr)
        model.setv({[attr]: attr == "multiline_indices" ? new Map([[7, indices]]) : indices})
        expect(connection.messages.length).to.be.equal(kind == "immediate" ? 1 : 0)
        model.document!.request_sync_flush(model, attr)
        expect(connection.messages.length).to.be.equal(1)
        const [message] = connection.messages
        expect(callback_policy(message)).to.be.equal(policy)
        const frames: (string | ArrayBuffer)[] = []
        message.send({send(frame: string | ArrayBuffer) { frames.push(frame) }})
        expect(frames.length).to.be.equal(2)
        expect((frames[1] as ArrayBuffer).byteLength).to.be.equal(38)
        const values = attr == "multiline_indices" ? model.multiline_indices.get(7) : model[attr]
        expect(values).to.be.equal(indices)
        expect(Array.isArray(values)).to.be.true
        session.close()
      })
    }
  }

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
