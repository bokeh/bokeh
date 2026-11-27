import {expect, expect_instanceof} from "#framework/assertions"
import {Document} from "@bokehjs/document"
import {assert} from "@bokehjs/core/util/assert"
import {ColumnDataChangedEvent, ColumnsPatchedEvent, ColumnsStreamedEvent, ModelChangedEvent} from "@bokehjs/document/events"
import type {DocumentChangedEvent} from "@bokehjs/document/events"
import {GeometryDataSource} from "@bokehjs/models/sources/geometry_data_source"
import {line_string, point, polygon} from "@bokehjs/geometry"
import {Slice} from "@bokehjs/core/util/slice"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {RecordDataSource} from "@bokehjs/models/sources/record_data_source"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {dict} from "@bokehjs/core/util/object"
import type {Geometry} from "geojson"

function source() {
  return GeometryDataSource.create({geometries: [polygon([[[0, 0], [1, 0], [0, 1]]])]})
}

function ring(data: GeometryDataSource) {
  const geometry = data.geometries[0]
  assert(geometry?.type == "Polygon", "expected a polygon")
  return geometry.coordinates[0]
}

function patch_and_replay_owned_geometry(data: GeometryDataSource) {
  const doc = new Document()
  doc.add_root(data)
  const receiver = Document.from_json(doc.to_json())
  const events: DocumentChangedEvent[] = []
  doc.on_change(event => events.push(event))
  const other = GeometryDataSource.create({geometries: data.geometries})
  data.patch({geometry: [[[0, 0], [9, 9, 3]]]})
  receiver.apply_json_patch(doc.create_json_patch(events))
  return {receiver, other}
}

function expect_owned_geometry(data: GeometryDataSource, geometry: Geometry, result: ReturnType<typeof patch_and_replay_owned_geometry>): void {
  expect(result.receiver.get_model_by_id(data.id)!.attributes.geometries).to.be.equal(data.geometries)
  expect(data.geometries[1]).to.be.equal(geometry)
  expect(result.other.geometries[0]).to.be.equal(geometry)
  expect(geometry).to.be.equal({type: "LineString", coordinates: [[0, 0, 1], [1, 1, 2]]})
}

describe("GeometryDataSource updates", () => {
  it("preserves existing prototype-named attributes during updates and replay", () => {
    const data = GeometryDataSource.create({geometries: [null], data: {constructor: ["a"], ["__proto__"]: [1]}})
    const doc = new Document()
    doc.add_root(data)
    const receiver = Document.from_json(doc.to_json())
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    data.stream({geometries: [null], data: new Map([["constructor", ["b"]], ["__proto__", [2]]])}, 2)
    const streamed = Array.from(data.get_field("__proto__")!)
    data.patch({["__proto__"]: [[0, 4]]})
    receiver.apply_json_patch(doc.create_json_patch(events))

    const copy = receiver.get_model_by_id(data.id)!
    expect_instanceof(copy, GeometryDataSource)
    expect(streamed).to.be.equal([1, 2])
    expect(copy.geometries).to.be.equal(data.geometries)
    expect(copy.data).to.be.equal(data.data)
    expect(copy.get_field("__proto__")).to.be.equal([4, 2])
    expect(copy.get_field("constructor")).to.be.equal(["a", "b"])
  })

  it("preserves new prototype-named attributes during updates and replay", () => {
    const data = GeometryDataSource.create({geometries: [null], data: {constructor: ["a"]}})
    const doc = new Document()
    doc.add_root(data)
    const receiver = Document.from_json(doc.to_json())
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    data.stream({geometries: [null], data: new Map([["constructor", ["b"]], ["__proto__", [2]]])}, 2)
    const streamed = Array.from(data.get_field("__proto__")!)
    data.patch({["__proto__"]: [[0, 4]]})
    receiver.apply_json_patch(doc.create_json_patch(events))

    const copy = receiver.get_model_by_id(data.id)!
    expect_instanceof(copy, GeometryDataSource)
    expect(streamed).to.be.equal([null, 2])
    expect(copy.geometries).to.be.equal(data.geometries)
    expect(copy.data).to.be.equal(data.data)
    expect(copy.get_field("__proto__")).to.be.equal([4, 2])
    expect(copy.get_field("constructor")).to.be.equal(["a", "b"])
  })

  it("rejects columnar incremental events aimed at geometry records", () => {
    const data = GeometryDataSource.create({geometries: [null], data: {v: [0]}})
    const doc = new Document()
    doc.add_root(data)
    for (const event of [
      new ColumnsStreamedEvent(doc, data, "data", {v: [1]}),
      new ColumnsPatchedEvent(doc, data, "data", {v: [[0, 1]]}),
    ]) {
      expect(() => doc.apply_json_patch(doc.create_json_patch([event]))).to.throw(Error, "records attribute")
      expect(data.geometries).to.be.equal([null])
      expect(data.data).to.be.equal({v: [0]})
    }
  })

  it("owns geometry containers from construction", () => {
    const geometry: Geometry = line_string([[0, 0, 1], [1, 1, 2]])
    const records = {geometries: [geometry, geometry], data: {}}

    const data = GeometryDataSource.create(records)
    const result = patch_and_replay_owned_geometry(data)

    expect_owned_geometry(data, geometry, result)
  })

  it("owns geometry containers from assignment", () => {
    const geometry: Geometry = line_string([[0, 0, 1], [1, 1, 2]])
    const records = {geometries: [geometry, geometry], data: {}}
    const data = GeometryDataSource.create()

    data.geometries = records.geometries
    const result = patch_and_replay_owned_geometry(data)

    expect_owned_geometry(data, geometry, result)
  })

  it("owns geometry containers from replacement", () => {
    const geometry: Geometry = line_string([[0, 0, 1], [1, 1, 2]])
    const records = {geometries: [geometry, geometry], data: {}}
    const data = GeometryDataSource.create()

    data.replace(records)
    const result = patch_and_replay_owned_geometry(data)

    expect_owned_geometry(data, geometry, result)
  })

  it("owns geometry containers from streaming", () => {
    const geometry: Geometry = line_string([[0, 0, 1], [1, 1, 2]])
    const records = {geometries: [geometry, geometry], data: {}}
    const data = GeometryDataSource.create()

    data.stream(records)
    const result = patch_and_replay_owned_geometry(data)

    expect_owned_geometry(data, geometry, result)
  })

  it("isolates geometry objects reused across streams", () => {
    const data = GeometryDataSource.create()
    const geometry: Geometry = line_string([[0, 0], [1, 1]])
    data.stream(geometry)
    data.stream(geometry)
    data.patch({geometry: [[[0, 0], [2, 3]]]})
    expect(data.geometries[1]).to.be.equal(geometry)
    expect(geometry.coordinates).to.be.equal([[0, 0], [1, 1]])
  })

  it("accepts attribute values without cloning them and preserves column storage", () => {
    const model = Range1d.create()
    const vector = new Float64Array([1, 2])
    const date = new Date(0)
    const columns = [[null], new Float64Array([0]), ndarray(new Float64Array([0]))]
    const data = GeometryDataSource.create({geometries: [null], data: {objects: [null], a: columns[0], b: columns[1], c: columns[2]}})
    for (const value of [vector, date, model]) {
      data.patch({objects: [[0, value]]})
      expect(dict(data.data).get("objects")![0]).to.be.identical(value)
    }
    data.patch({a: [[0, 4]], b: [[0, 5]], c: [[0, 6]]})
    for (const [i, field] of ["a", "b", "c"].entries()) {
      expect(dict(data.data).get(field)).to.be.identical(columns[i])
      expect(dict(data.data).get(field)![0]).to.be.equal(i + 4)
    }
    expect(() => data.patch({b: [[0, 8]], geometry: [[[0, 0], [2, 3]]]})).to.throw(Error)
    expect(dict(data.data).get("b")![0]).to.be.equal(5)
  })

  it("publishes fresh fields to property and selection callbacks", () => {
    const data = GeometryDataSource.create({geometries: [
      point([1, 2]), point([3, 4]),
    ]})
    expect(data.get_field("x")).to.be.equal([1, 3])
    data.selected.indices = [1]
    const seen: unknown[] = []
    data.properties.geometries.change.connect(() => seen.push(data.get_field("x")))
    data.selected.change.connect(() => seen.push(data.get_field("x")))
    data.geometries = [point([5, 6])]
    expect(seen).to.be.equal([[5], [5]])
    data.geometries[0] = point([7, 8])
    data.data_changed.emit({structural: false})
    expect(data.get_field("x")).to.be.equal([7])
  })

  for (const [description, update] of [
    ["misaligned replacements", (data) => data.replace({geometries: [null, null], data: {v: [2]}})],
    ["replacement string columns", (data) => data.replace({geometries: [point([2, 3])], data: {v: "x"}} as any)],
    ["replacement array-like objects", (data) => data.replace({geometries: [point([2, 3])], data: {v: {length: 1}}} as any)],
    ["misaligned streams", (data) => data.stream({geometries: [null, null], data: {v: [2]}})],
    ["streamed string columns", (data) => data.stream({geometries: [point([2, 3])], data: {v: "x"}} as any)],
    ["streamed array-like objects", (data) => data.stream({geometries: [point([2, 3])], data: {v: {length: 1}}} as any)],
    ["out-of-bounds attribute patches", (data) => data.patch({v: [[0, 2], [3, 4]]})],
    ["invalid geometry patches", (data) => data.patch({v: [[0, 2]], geometry: [[0, {coordinates: [1, 2]}]]})],
    ["fractional rollover", (data) => data.stream({geometries: [null], data: {v: [2]}}, 1.5)],
  ] as [string, (data: GeometryDataSource) => void][]) {
    it(`rejects ${description} atomically`, () => {
      const data = GeometryDataSource.create({geometries: [null], data: {v: [1]}})
      const geometries = data.geometries
      const attributes = data.data
      const derived = data.get_field("x")
      const doc = new Document()
      doc.add_root(data)
      let events = 0
      doc.on_change(() => events++)
      let changes = 0
      data.data_changed.connect(() => changes++)

      expect(() => update(data)).to.throw(Error)

      expect(data.geometries).to.be.equal([null])
      expect(data.data).to.be.equal({v: [1]})
      expect(data.geometries).to.be.identical(geometries)
      expect(data.data).to.be.identical(attributes)
      expect(data.get_field("x")).to.be.identical(derived)
      expect(changes).to.be.equal(0)
      expect(events).to.be.equal(0)
    })
  }

  it("rejects geometry record protocol events aimed at a columnar source", () => {
    const data = ColumnDataSource.create({data: {v: [1]}})
    const doc = new Document()
    doc.add_root(data)
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    for (const event of [
      new ColumnDataChangedEvent(doc, data, "records", {v: [2]}),
      new ColumnsStreamedEvent(doc, data, "records", {v: [2]}),
      new ColumnsPatchedEvent(doc, data, "records", {v: [[0, 2]]}),
    ]) {
      expect(() => doc.apply_json_patch(doc.create_json_patch([event]))).to.throw(Error, "records")
    }

    expect(data.get_field("v")).to.be.equal([1])
    expect(events).to.be.equal([])
  })

  it("rejects geometry record protocol events aimed at a record source", () => {
    const data = RecordDataSource.create({records: [{v: 1}]})
    const doc = new Document()
    doc.add_root(data)
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    for (const event of [
      new ColumnDataChangedEvent(doc, data, "records", {v: [2]}),
      new ColumnsStreamedEvent(doc, data, "records", {v: [2]}),
      new ColumnsPatchedEvent(doc, data, "records", {v: [[0, 2]]}),
    ]) {
      expect(() => doc.apply_json_patch(doc.create_json_patch([event]))).to.throw(Error, "records")
    }

    expect(data.get_field("v")).to.be.equal([1])
    expect(events).to.be.equal([])
  })

  it("keeps RecordDataSource.records assignments on the ordinary property protocol", () => {
    const source = RecordDataSource.create({records: [{v: 1}]})
    const doc = new Document({roots: [source]})
    const receiver = Document.from_json(doc.to_json())
    const copy = receiver.get_model_by_id(source.id)!
    expect_instanceof(copy, RecordDataSource)
    expect(copy.get_field("v")).to.be.equal([1])
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    source.records = [{v: 2}, {v: 3}]
    expect(events.length).to.be.equal(1)
    const [event] = events
    expect_instanceof(event, ModelChangedEvent)
    expect(event.attr).to.be.equal("records")
    receiver.apply_json_patch(doc.create_json_patch([event]))
    expect(copy.records).to.be.equal([{v: 2}, {v: 3}])
    expect(copy.get_field("v")).to.be.equal([2, 3])
  })

  it("uses the feature axis for shaped empty attributes and rollover", () => {
    const source = GeometryDataSource.create({geometries: [
      point([0, 0]), point([1, 1]),
    ], data: {empty: ndarray(new Float64Array(), {shape: [2, 0, 3]})}})
    source.replace({geometries: source.geometries, data: source.data})
    source.stream({
      geometries: [point([2, 2])],
      data: {empty: ndarray(new Float64Array(), {shape: [1, 0, 3]})},
    }, 2)
    expect(source.length).to.be.equal(2)
    expect(source.get("empty")).to.be.equal([[], []])
    source.stream({geometries: [], data: {empty: []}}, 0)
    expect(source.length).to.be.equal(0)
    expect(source.get("empty")).to.be.equal([])
  })

  it("applies binary shaped attribute columns from geometry record document patches", () => {
    const source = GeometryDataSource.create()
    const document = new Document()
    document.add_root(source)
    const records = {
      geometries: [point([0, 0]), point([1, 1])],
      data: {vectors: ndarray(new Float64Array([1, 2, 3, 4]), {shape: [2, 2]})},
    }
    const replacement = new ColumnDataChangedEvent(document, source, "records", records)
    document.apply_json_patch(document.create_json_patch([replacement]))
    expect(source.get_record(1).vectors).to.be.equal([3, 4])
    const streamed = new ColumnsStreamedEvent(document, source, "records", {
      geometries: [point([2, 2])],
      data: {vectors: ndarray(new Float64Array([5, 6]), {shape: [1, 2]})},
    }, 2)
    document.apply_json_patch(document.create_json_patch([streamed]))
    expect(source.get("vectors")).to.be.equal([[3, 4], [5, 6]])
  })

  it("backfills attributes first introduced by streamed records", () => {
    const source = GeometryDataSource.create([
      {geometry: point([0, 0]), name: "old"},
    ])

    source.stream([
      {geometry: point([1, 1]), name: "new", color: "red"},
    ])

    expect(source.data).to.be.equal({name: ["old", "new"], color: [null, "red"]})
  })

  it("prunes selection when replacement or rollover shortens the source", () => {
    const source = GeometryDataSource.create([
      point([0, 0]),
      point([1, 1]),
    ])
    source.selected.indices = [0, 1]

    source.replace(point([2, 2]))
    expect(source.selected.indices).to.be.equal([0])

    source.selected.indices = [0, 1]
    source.stream(point([3, 3]), 1)
    expect(source.selected.indices).to.be.equal([0])
  })

  it("uses one composite document event for replacements, streams, and patches", () => {
    const source = GeometryDataSource.create(point([0, 0]))
    const document = new Document()
    document.add_root(source)
    const events: DocumentChangedEvent[] = []
    document.on_change((event) => events.push(event))

    source.replace(point([1, 1]))
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ColumnDataChangedEvent)

    source.replace({geometries: [], data: {name: []}})
    expect(source.geometries).to.be.equal([])
    expect(source.data).to.be.equal({name: []})

    events.length = 0
    source.stream({geometry: point([2, 2]), name: null})
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ColumnsStreamedEvent)

    events.length = 0
    source.patch({geometry: [[0, point([3, 3])]]})
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ColumnsPatchedEvent)
  })

  it("applies composite geometry record events from document patches", () => {
    const source = GeometryDataSource.create(point([0, 0]))
    const document = new Document()
    document.add_root(source)

    const replacement = new ColumnDataChangedEvent(document, source, "records", [
      {geometry: point([1, 1]), name: "A"},
    ])
    document.apply_json_patch(document.create_json_patch([replacement]))
    expect(source.geometries).to.be.equal([{type: "Point", coordinates: [1, 1]}])
    expect(source.data).to.be.equal({name: ["A"]})

    const streamed = new ColumnsStreamedEvent(document, source, "records", [
      {geometry: point([2, 2]), name: "B", kind: "city"},
    ])
    document.apply_json_patch(document.create_json_patch([streamed]))
    expect(source.data).to.be.equal({name: ["A", "B"], kind: [null, "city"]})

    const patched = new ColumnsPatchedEvent(document, source, "records", {
      geometry: [[0, point([3, 3])]],
      name: [[1, "C"]],
    })
    document.apply_json_patch(document.create_json_patch([patched]))
    expect(source.geometries[0]).to.be.equal({type: "Point", coordinates: [3, 3]})
    expect(source.get("name")).to.be.equal(["A", "C"])
  })

  it("doesn't echo selection pruning for incoming replacement", () => {
    const source = GeometryDataSource.create({geometries: [null, null]})
    source.selected.indices = [1]
    const doc = new Document()
    doc.add_root(source)
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    source.replace({geometries: [null], data: {}}, {sync: false})

    expect(source.selected.indices).to.be.equal([])
    expect(events.every(event => !event.sync)).to.be.true
  })

  it("doesn't echo selection pruning for incoming rollover", () => {
    const source = GeometryDataSource.create({geometries: [null, null]})
    source.selected.indices = [1]
    const doc = new Document()
    doc.add_root(source)
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    source.stream({geometries: [], data: {}}, 1, {sync: false})

    expect(source.selected.indices).to.be.equal([])
    expect(events.every(event => !event.sync)).to.be.true
  })

  it("publishes replacement properties atomically to callbacks", () => {
    const source = GeometryDataSource.create({geometries: [null], data: {name: ["old"]}})
    const snapshots: unknown[] = []
    source.properties.geometries.change.connect(() => snapshots.push(source.get_record(0)))
    source.replace({geometries: [null], data: {name: ["new"]}})
    expect(snapshots).to.be.equal([{geometry: null, name: "new"}])
  })

  it("keeps replay payloads independent for sequential vertex batches", () => {
    const data = source()
    const doc = new Document()
    doc.add_root(data)
    const receiver = Document.from_json(doc.to_json())
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    data.patch({geometry: [
      [[0, 0, new Slice({start: 3, stop: 3})], [[2, 3]]],
      [[0, 0, 3], [4, 5]],
    ]})
    receiver.apply_json_patch(doc.create_json_patch(events))

    expect(events.length).to.be.equal(1)
    expect_instanceof(events[0], ColumnsPatchedEvent)
    const target = receiver.get_model_by_id(data.id)!
    expect_instanceof(target, GeometryDataSource)
    expect(target.geometries).to.be.equal(data.geometries)
    expect(ring(target).length).to.be.equal(4)
  })

  it("keeps replay payloads independent for geometry replacement followed by sequential vertex edits", () => {
    const data = source()
    const doc = new Document()
    doc.add_root(data)
    const receiver = Document.from_json(doc.to_json())
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))

    data.patch({geometry: [
      [0, polygon([[[0, 0], [1, 0], [0, 1]]])],
      [[0, 0, new Slice({start: 3, stop: 3})], [[2, 3]]],
      [[0, 0, 3], [4, 5]],
    ]})
    receiver.apply_json_patch(doc.create_json_patch(events))

    expect(events.length).to.be.equal(1)
    expect_instanceof(events[0], ColumnsPatchedEvent)
    const target = receiver.get_model_by_id(data.id)!
    expect_instanceof(target, GeometryDataSource)
    expect(target.geometries).to.be.equal(data.geometries)
    expect(ring(target).length).to.be.equal(4)
  })

  it("rolls back a failed sequential slice batch without notifications", () => {
    const data = source()
    const original_ring = ring(data)
    let changed = 0
    data.data_changed.connect(() => changed++)
    expect(() => data.patch({geometry: [
      [[0, 0, new Slice({start: 0, stop: 1})], []],
      [[0, 0, 2], [4, 5]],
    ]})).to.throw(Error)
    expect(original_ring).to.be.equal([[0, 0], [1, 0], [0, 1]])
    expect(changed).to.be.equal(0)
  })

  it("restores shaped storage when a later edit fails", () => {
    const coordinates = ndarray(new Float64Array([0, 0, 1, 0, 0, 1]), {shape: [1, 3, 2]})
    const data = GeometryDataSource.create({geometries: [{type: "Polygon", coordinates: coordinates as any}]})
    expect(() => data.patch({geometry: [[[0, 0, 0], [4, 5]], [[0, 0, 99], [6, 7]]]})).to.throw(Error)
    expect((data.geometries[0] as any).coordinates).to.be.identical(coordinates)
    expect(Array.from(coordinates)).to.be.equal([0, 0, 1, 0, 0, 1])
  })

  it("appends large vertex batches without an argument-limit failure", () => {
    const data = source()
    const original_ring = ring(data)
    data.patch({geometry: [[[0, 0, new Slice({start: 3, stop: 3})], Array.from({length: 150000}, () => [2, 3])]]})
    expect(ring(data)).to.be.identical(original_ring)
    expect(original_ring.length).to.be.equal(150003)
  })

  it("accepts Map-backed records and rejects reserved geometry attributes", () => {
    const data = source()
    data.replace({geometries: [null], data: new Map([["name", ["first"]]])})
    expect(data.get_record(0)).to.be.equal({geometry: null, name: "first"})
    expect(() => GeometryDataSource.create({geometries: [null], data: {geometry: [1]}})).to.throw(Error, "reserved")
    expect(() => GeometryDataSource.create({geometries: [null], data: {name: []}})).to.throw(Error, "same length")
  })

  it("keeps field additions from empty streams during replay", () => {
    const data = source()
    const doc = new Document()
    doc.add_root(data)
    const receiver = Document.from_json(doc.to_json())
    const events: DocumentChangedEvent[] = []
    doc.on_change(event => events.push(event))
    data.stream({geometries: [], data: {w: []}})
    receiver.apply_json_patch(doc.create_json_patch(events))
    const copy = receiver.get_model_by_id(data.id)!
    expect(copy.attributes.data).to.be.equal({w: [null]})
  })
})
