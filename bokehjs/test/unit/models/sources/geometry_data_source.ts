import {expect} from "#framework/assertions"

import {Document} from "@bokehjs/document"
import {ColumnDataChangedEvent, ColumnsPatchedEvent, ColumnsStreamedEvent} from "@bokehjs/document/events"
import type {DocumentEvent} from "@bokehjs/document/events"
import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {DataView} from "@bokehjs/models/sources/data_view"
import {
  GeometryDataSource,
  geojson_to_geometry_records,
} from "@bokehjs/models/sources/geometry_data_source"

describe("GeometryDataSource", () => {
  it("uses the general indexed DataView contract", () => {
    const source = GeometryDataSource.create({
      geometries: [
        {type: "Point", coordinates: [0, 0]},
        {type: "Point", coordinates: [1, 1]},
        {type: "Point", coordinates: [2, 2]},
      ],
      data: {kind: ["city", "park", "city"]},
    })
    const view = DataView.create({filter: GroupFilter.create({field_name: "kind", group: "city"})})

    view.compute_indices(source)

    expect([...view.indices]).to.be.equal([0, 2])
  })

  it("exposes natural geometry and attribute fields", () => {
    const geometry = {
      type: "Point" as const,
      coordinates: [2, 3, 4],
    }
    const source = GeometryDataSource.create({
      geometries: [geometry],
      data: {name: ["A"]},
    })

    expect(source.get("geometry")).to.be.equal([geometry])
    expect(source.get("name")).to.be.equal(["A"])
    expect(source.get("x")).to.be.equal([2])
    expect(source.get("y")).to.be.equal([3])
    expect(source.get("z")).to.be.equal([4])
  })

  it("retains Polygon holes in virtual coordinate fields", () => {
    const source = GeometryDataSource.create({
      geometries: [{
        type: "Polygon",
        coordinates: [
          [[0, 0], [4, 0], [4, 4], [0, 0]],
          [[1, 1], [2, 1], [1, 2], [1, 1]],
        ],
      }],
    })

    expect(source.get("xs")).to.be.equal([[0, 4, 4, 0, NaN, 1, 2, 1, 1]])
    expect(source.get("ys")).to.be.equal([[0, 0, 4, 0, NaN, 1, 1, 2, 1]])
  })

  it("retains every ring of every MultiPolygon member", () => {
    const source = GeometryDataSource.create({
      geometries: [{
        type: "MultiPolygon",
        coordinates: [
          [[[0, 0], [1, 0], [0, 0]]],
          [
            [[3, 3], [5, 3], [3, 3]],
            [[3.5, 3.2], [4, 3.2], [3.5, 3.2]],
          ],
        ],
      }],
    })

    expect(source.get("xs")).to.be.equal([[0, 1, 0, NaN, 3, 5, 3, NaN, 3.5, 4, 3.5]])
    expect(source.get("ys")).to.be.equal([[0, 0, 0, NaN, 3, 3, 3, NaN, 3.2, 3.2, 3.2]])
  })

  it("turns GeometryCollection members into independently selectable records", () => {
    const {geometries, data} = geojson_to_geometry_records({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {group: "A"},
        geometry: {
          type: "GeometryCollection",
          geometries: [
            {type: "Point", coordinates: [1, 2]},
            {type: "LineString", coordinates: [[0, 0], [1, 1]]},
          ],
        },
      }],
    })

    expect(geometries.map((geometry) => geometry?.type)).to.be.equal(["Point", "LineString"])
    expect(data).to.be.equal({group: ["A", "A"]})
  })

  it("commits virtual coordinate edits back to natural geometry", () => {
    const source = GeometryDataSource.create({
      geometries: [{
        type: "MultiPolygon",
        coordinates: [
          [[[0, 0, 5], [2, 0, 6], [0, 0, 5]]],
          [
            [[4, 4], [6, 4], [4, 4]],
            [[4.5, 4.2], [5, 4.2], [4.5, 4.2]],
          ],
        ],
      }],
    })
    const xs = source.get_array<number[]>("xs")
    const ys = source.get_array<number[]>("ys")
    xs[0][1] = 3
    ys[0][1] = 1

    source.commit_coordinates()

    const geometry = source.geometries[0]
    expect(geometry?.type).to.be.equal("MultiPolygon")
    if (geometry?.type == "MultiPolygon") {
      expect(geometry.coordinates[0][0][1]).to.be.equal([3, 1, 6])
      expect(geometry.coordinates.map((polygon) => polygon.length)).to.be.equal([1, 2])
    }
  })

  it("appends and deletes aligned feature records", () => {
    const source = GeometryDataSource.create({
      geometries: [{type: "Point", coordinates: [0, 0]}],
      data: {name: ["old"]},
    })

    source.append_polygon([1, 2, 1], [1, 1, 1], {name: "new", color: "red"})
    expect(source.geometries.map((geometry) => geometry?.type)).to.be.equal(["Point", "Polygon"])
    expect(source.data).to.be.equal({name: ["old", "new"], color: [NaN, "red"]})

    source.delete([0])
    expect(source.geometries.map((geometry) => geometry?.type)).to.be.equal(["Polygon"])
    expect(source.data).to.be.equal({name: ["new"], color: ["red"]})
  })

  it("backfills attributes first introduced by streamed records", () => {
    const source = GeometryDataSource.create([
      {geometry: {type: "Point", coordinates: [0, 0]}, name: "old"},
    ])

    source.stream([
      {geometry: {type: "Point", coordinates: [1, 1]}, name: "new", color: "red"},
    ])

    expect(source.data).to.be.equal({name: ["old", "new"], color: [null, "red"]})
  })

  it("invalidates virtual coordinate caches on source-level data changes", () => {
    const source = GeometryDataSource.create({
      geometries: [{type: "Point", coordinates: [1, 2]}],
    })
    expect(source.get("x")).to.be.equal([1])

    source.geometries[0] = {type: "Point", coordinates: [3, 4]}
    source.data_changed.emit({fields: ["geometry"], structural: false})

    expect(source.get("x")).to.be.equal([3])
  })

  it("uses one composite document event for replacements, streams, and patches", () => {
    const source = GeometryDataSource.create({type: "Point", coordinates: [0, 0]})
    const document = new Document()
    document.add_root(source)
    const events: DocumentEvent[] = []
    document.on_change((event) => events.push(event))

    source.replace({type: "Point", coordinates: [1, 1]})
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ColumnDataChangedEvent)

    source.replace({geometries: [], data: {name: []}})
    expect(source.geometries).to.be.equal([])
    expect(source.data).to.be.equal({name: []})

    events.length = 0
    source.stream({type: "Point", coordinates: [2, 2]})
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ColumnsStreamedEvent)

    events.length = 0
    source.patch({geometry: [[0, {type: "Point", coordinates: [3, 3]}]]})
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.instanceof(ColumnsPatchedEvent)
  })

  it("applies composite geometry record events from document patches", () => {
    const source = GeometryDataSource.create({type: "Point", coordinates: [0, 0]})
    const document = new Document()
    document.add_root(source)

    const replacement = new ColumnDataChangedEvent(document, source, "records", [
      {geometry: {type: "Point", coordinates: [1, 1]}, name: "A"},
    ])
    document.apply_json_patch(document.create_json_patch([replacement]))
    expect(source.geometries).to.be.equal([{type: "Point", coordinates: [1, 1]}])
    expect(source.data).to.be.equal({name: ["A"]})

    const streamed = new ColumnsStreamedEvent(document, source, "records", [
      {geometry: {type: "Point", coordinates: [2, 2]}, name: "B", kind: "city"},
    ])
    document.apply_json_patch(document.create_json_patch([streamed]))
    expect(source.data).to.be.equal({name: ["A", "B"], kind: [null, "city"]})

    const patched = new ColumnsPatchedEvent(document, source, "records", {
      geometry: [[0, {type: "Point", coordinates: [3, 3]}]],
      name: [[1, "C"]],
    })
    document.apply_json_patch(document.create_json_patch([patched]))
    expect(source.geometries[0]).to.be.equal({type: "Point", coordinates: [3, 3]})
    expect(source.get("name")).to.be.equal(["A", "C"])
  })
})
