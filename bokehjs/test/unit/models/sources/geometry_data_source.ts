import {expect} from "#framework/assertions"
import {async_trap} from "#framework/util"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {Document} from "@bokehjs/document/document"
import {ColumnDataChangedEvent, ColumnsPatchedEvent, ColumnsStreamedEvent, ModelChangedEvent} from "@bokehjs/document/events"
import {GeometryDataSource} from "@bokehjs/models/sources/geometry_data_source"

describe("GeometryDataSource", () => {
  for (const signal of ["streaming", "data_changed"] as const) {
    it(`publishes a stream before a patch from its ${signal} callback`, () => {
      const source = GeometryDataSource.create({geometries: [null], data: {label: ["A"]}})
      const doc = new Document()
      doc.add_root(source)
      const peer = Document.from_json(doc.to_json())
      const events: string[] = []
      doc.on_change((event) => {
        if (event instanceof ColumnsStreamedEvent || event instanceof ColumnsPatchedEvent) {
          events.push(event instanceof ColumnsStreamedEvent ? "stream" : "patch")
          peer.apply_json_patch(doc.create_json_patch([event]))
        }
      })

      let patched = false
      source[signal].connect(() => {
        if (!patched) {
          patched = true
          expect(source.get_field("label")).to.be.equal(["A", "B"])
          source.patch({label: [[1, "edited"]]})
        }
      })
      source.stream({geometries: [null], data: {label: ["B"]}})

      expect(events).to.be.equal(["stream", "patch"])
      expect(source.get_field("label")).to.be.equal(["A", "edited"])
      expect((peer.roots()[0] as GeometryDataSource).get_field("label")).to.be.equal(["A", "edited"])
    })
  }

  it("reports misaligned updates and accepts an aligned document patch", async () => {
    const source = GeometryDataSource.create({geometries: [null], data: {name: ["first"], ["__proto__"]: ["p"]}})
    const doc = new Document()
    doc.add_root(source)
    const misaligned = await async_trap(async () => {
      source.geometries = [null, null]
    })
    expect(misaligned.warn.includes("geometry attributes must have the same length as geometries: name, __proto__")).to.be.true

    const aligned = await async_trap(async () => {
      doc.apply_json_patch(doc.create_json_patch([
        new ModelChangedEvent(doc, source, "geometries", [null, null, null]),
        new ColumnDataChangedEvent(doc, source, "data", {name: ["first", "second", "third"], ["__proto__"]: ["p", "q", "r"]}),
      ]))
    })
    expect(aligned.warn).to.be.equal("")
    expect(source.get_field("name")).to.be.equal(["first", "second", "third"])
    doc.apply_json_patch(doc.create_json_patch([
      new ColumnDataChangedEvent(doc, source, "data", {extra: [1, 2, 3]}, ["extra"]),
    ]))
    expect(source.get_field("__proto__")).to.be.equal(["p", "q", "r"])
    expect(source.get_field("extra")).to.be.equal([1, 2, 3])
  })

  it("rejects invalid coordinate rows and values in from_xy()", () => {
    expect(() => GeometryDataSource.from_xy([[0], 1], [[0], 2])).to.throw(Error, "matching nesting")
    expect(() => GeometryDataSource.from_xy([null], [0])).to.throw(Error, "numbers or categorical factors")
    expect(() => GeometryDataSource.from_xy([NaN], [0])).to.throw(Error, "must be finite")
    expect(() => GeometryDataSource.from_xy([1], [2])).to.throw(Error, "at least three vertices")
    expect(() => GeometryDataSource.from_xy([0, "a", 2], [0, 1, 0])).to.throw(Error, "cannot mix")
  })

  it("closes rings and supports empty coordinate arrays and subclasses", () => {
    class CustomSource extends GeometryDataSource {}
    expect(CustomSource.from_xy([], [], {name: []})).to.be.instanceof(CustomSource)
    const empty = ndarray([], {shape: [0, 3]})
    expect(GeometryDataSource.from_xy(empty, empty).get_length()).to.be.equal(0)
    const source = GeometryDataSource.from_xy([new Date(0), new Date(1), new Date(2)], [0, 1, 0])
    expect(source.geometries).to.be.equal([{type: "Polygon", coordinates: [[[0, 0], [1, 1], [2, 0], [0, 0]]]}])
  })

  it("normalizes explicit geometries and preserves attributes in clones", () => {
    const point = {type: "Point", coordinates: [0, 1]} as const
    const geometry = {type: point.type, coordinates: [...point.coordinates]}
    const feature = {type: "Feature" as const, geometry, properties: {}}
    const source = GeometryDataSource.create({geometries: [feature], data: {["__proto__"]: ["p"]}})
    expect(source.geometries).to.be.equal([geometry])
    source.setv({geometries: [feature], crs: "EPSG:4326", tags: ["test"]})
    expect(() => source.setv({geometries: [5]})).to.throw(Error, "GeoJSON mappings")
    const copy = source.clone()
    expect(copy.geometries).to.be.equal([geometry])
    expect(copy.get_field("__proto__")).to.be.equal(["p"])
    expect(copy.crs).to.be.equal("EPSG:4326")
    expect(copy.tags).to.be.equal(["test"])
    const columns = GeometryDataSource.create({data: {geometry: [geometry], name: ["point"]}})
    expect(columns.geometries).to.be.equal([geometry])
    expect(columns.get_field("name")).to.be.equal(["point"])

    const record = GeometryDataSource.create({geometry, type: "GeometryCollection"})
    expect(record.geometries).to.be.equal([geometry])
    expect(record.get_field("type")).to.be.equal(["GeometryCollection"])
  })

  it("preserves prototype-named attributes and fills missing values with null", () => {
    const source = GeometryDataSource.create([
      {type: "Feature", geometry: null, properties: {["__proto__"]: "first", constructor: "second"}},
      {type: "Feature", geometry: null, properties: {}},
    ])
    expect(source.get_field("__proto__")).to.be.equal(["first", null])
    expect(source.get_field("constructor")).to.be.equal(["second", null])
    expect(Object.entries(source.get_record(0))).to.be.equal([
      ["geometry", null], ["__proto__", "first"], ["constructor", "second"],
    ])
    expect(Object.entries(source.get_record(1))).to.be.equal([
      ["geometry", null], ["__proto__", null], ["constructor", null],
    ])
  })

  it("exposes geometry, derived coordinates, and attributes through indexed fields", () => {
    const point = {type: "Point", coordinates: [2, 3]} as const
    const source = GeometryDataSource.create({
      geometries: [{type: point.type, coordinates: [...point.coordinates]}, null],
      data: {name: ["first", null]},
    })
    expect(source.get_length()).to.be.equal(2)
    expect(source.get_field("geometry")).to.be.equal([point, null])
    expect(source.get_field("x")).to.be.equal([2, NaN])
    expect(source.get_record(0)).to.be.equal({geometry: point, name: "first"})

    source.geometries = [{type: "Point", coordinates: [4, 3]}, null]
    expect(source.get_field("x")).to.be.equal([4, NaN])
  })
})
